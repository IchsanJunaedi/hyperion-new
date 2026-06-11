"""MLBB Vision Server — local, offline screenshot analysis for Hyperion scrims.

Replaces Gemini Vision. Run from anywhere inside the repo:

    python scratch/mlbb-vision/server.py

Endpoints (JSON body: {"image": "<base64>"}):
    POST /analyze-draft      -> {"bans": string[5], "enemyBans": string[5]}
    POST /analyze-scoreboard -> {"result": "win"|"loss",
                                 "players": [{hero, kills, deaths, assists} x5],
                                 "enemyPlayers": [...x5]}

Detection strategy (resolution/aspect-ratio independent):
- Input is resized to a fixed WIDTH (1920) preserving aspect ratio — circles stay
  circular on any device (16:9, 19.5:9, 20:9, 21:9 ...).
- Hero avatars are FOUND per image with cv2.HoughCircles (radius bands relative to
  image height), not assumed at fixed coordinates:
    * draft: one top-strip row of 5 + 5 ban circles
    * scoreboard: two vertical columns of 5 evenly-spaced avatar circles
- KDA is OCR'd from the row strip and anchored on the GOLD number (the only token
  >= 1000): our side reads the 3 ints immediately LEFT of gold ("K D A Gold"),
  enemy side the 3 ints immediately RIGHT of gold ("Gold K D A").
- Hero identity: OpenCV template matching vs public/heroes/*.webp first (the
  scoreboard/ban portraits are default avatars — validated 10/10 on real
  screenshots), CLIP (clip-ViT-B-32) similarity as fallback for weak matches.
- Static calibrated coordinates (21:9 device) remain as a FALLBACK when dynamic
  detection fails.
- Debug: every request dumps the received image + detection overlay to debug/.

NOTE: restart this server after editing the file — Python does not hot-reload.
"""
import os

os.environ.setdefault("USE_TF", "0")  # sentence_transformers breaks on Keras 3 without this

import base64
import io
import re
from itertools import combinations
from pathlib import Path

import cv2
import numpy as np
from fastapi import FastAPI, HTTPException
from PIL import Image
from pydantic import BaseModel

# ── Paths & hero database ────────────────────────────────────────────────────

CANVAS_W = 1920  # fixed width; height follows the input aspect ratio


def find_root() -> Path:
    here = Path(__file__).resolve()
    for cand in here.parents:
        if (cand / "public" / "heroes").is_dir():
            return cand
    raise RuntimeError("public/heroes not found above server.py")


ROOT = find_root()
HEROES_DIR = ROOT / "public" / "heroes"
DEBUG_DIR = Path(__file__).resolve().parent / "debug"
DEBUG_DIR.mkdir(exist_ok=True)

# Mirrors MLBB_HEROES in features/scrim/data/mlbb-heroes.ts
MLBB_HEROES = sorted([
    "Aamon", "Akai", "Aldous", "Alpha", "Alucard", "Angela", "Atlas", "Aulus",
    "Aurora", "Badang", "Balmond", "Barats", "Baxia", "Beatrix", "Belerick",
    "Benedetta", "Brody", "Bruno", "Carmilla", "Cecilion", "Chang'e", "Chip",
    "Chou", "Cici", "Claude", "Clint", "Cyclops", "Diggie", "Dyrroth",
    "Esmeralda", "Estes", "Eudora", "Fanny", "Faramis", "Floryn", "Franco",
    "Freya", "Gatotkaca", "Gord", "Granger", "Grock", "Guinevere", "Gusion",
    "Hanabi", "Hanzo", "Harith", "Harley", "Hayabusa", "Helcurt", "Hilda",
    "Hylos", "Irithel", "Ixia", "Jawhead", "Johnson", "Joy", "Julian",
    "Kagura", "Karrie", "Khaleed", "Khufra", "Kimmy", "Lancelot", "Lapu-Lapu",
    "Layla", "Leomord", "Lesley", "Ling", "Lolita", "Lukas", "Lunox", "Lylia",
    "Mathilda", "Melissa", "Minsitthar", "Minotaur", "Miya", "Moskov",
    "Nana", "Natalia", "Natan", "Nolan", "Novaria", "Odette", "Paquito",
    "Pharsa", "Phoveus", "Popol and Kupa", "Rafaela", "Roger", "Ruby",
    "Saber", "Silvanna", "Sun", "Suyou", "Terizla", "Thamuz",
    "Tigreal", "Uranus", "Vale", "Valentina", "Valir", "Vexana", "Wanwan",
    "X.Borg", "Xavier", "Yi Sun-shin", "Yin", "Yu Zhong", "Yve", "Zhask",
    "Zhuxin", "Zilong",
    "Alice", "Bane", "Karina", "Argus", "Martis", "Kaja", "Selena", "Kadita",
    "Masha", "Luo Yi", "Edith", "Fredrinn", "Arlott", "Sora", "Marcel",
    "Gloo", "Kalea", "Zetian", "Obsidia",
])


def hero_to_slug(name: str) -> str:
    s = name.lower().replace("'", "").replace(".", "")
    s = re.sub(r"\s+", "-", s)
    return re.sub(r"[^a-z0-9-]", "", s)


# ── Static FALLBACK coordinates (normalized x, y, w, h) ──────────────────────
# Calibrated 2026-06-11 against a real 1024x472 (~21:9) device screenshot.
# Used only when dynamic circle detection fails.

DRAFT_CFG = {
    "our_bans":   [(0.0547 + i * 0.0470, 0.0079, 0.0313, 0.0678) for i in range(5)],
    "enemy_bans": [(0.7245 + i * 0.0471, 0.0079, 0.0313, 0.0678) for i in range(5)],
}

SCORE_CFG = {
    "banner": (0.250, 0.000, 0.500, 0.200),
    "rows": {
        "y0": 0.2294,
        "h": 0.1281,
        "hero_w": 0.0417,
        "hero_h": 0.0904,
        "our_hero_x": 0.1354,
        "enemy_hero_x": 0.8213,
        "our_kda": (0.303, 0.063),
        "enemy_kda": (0.632, 0.066),
    },
}

# ── Image helpers ────────────────────────────────────────────────────────────

TILE = 96
MASK = np.zeros((TILE, TILE), np.uint8)
cv2.circle(MASK, (TILE // 2, TILE // 2), TILE // 2 - 2, 255, -1)


def to_bgr(pil_img: Image.Image) -> np.ndarray:
    return cv2.cvtColor(np.array(pil_img.convert("RGB")), cv2.COLOR_RGB2BGR)


def prep_tile(bgr: np.ndarray) -> np.ndarray:
    a = cv2.resize(bgr, (TILE, TILE), interpolation=cv2.INTER_AREA)
    return cv2.bitwise_and(a, a, mask=MASK)


def crop_norm(img: np.ndarray, box) -> np.ndarray:
    x, y, w, h = box
    H, W = img.shape[:2]
    x0, y0 = max(int(x * W), 0), max(int(y * H), 0)
    return img[y0:y0 + int(h * H), x0:x0 + int(w * W)]


def load_canvas(raw: bytes) -> np.ndarray:
    """Resize to fixed width, PRESERVING aspect ratio (no stretch)."""
    pil = Image.open(io.BytesIO(raw))
    bgr = to_bgr(pil)
    h = max(round(bgr.shape[0] * CANVAS_W / bgr.shape[1]), 1)
    return cv2.resize(bgr, (CANVAS_W, h), interpolation=cv2.INTER_CUBIC)


def circle_to_box(circle, shape, shrink=0.92):
    """(cx, cy, r) in pixels -> normalized (x, y, w, h)."""
    cx, cy, r = circle
    H, W = shape[:2]
    rr = r * shrink
    return ((cx - rr) / W, (cy - rr) / H, 2 * rr / W, 2 * rr / H)


# ── Dynamic circle detection ─────────────────────────────────────────────────

def hough_circles(img, y_band, x_band, r_band, param2):
    """HoughCircles inside normalized bands; radius band relative to image HEIGHT.
    Returns [(cx, cy, r)] in full-image pixels."""
    H, W = img.shape[:2]
    y0, y1 = int(y_band[0] * H), int(y_band[1] * H)
    x0, x1 = int(x_band[0] * W), int(x_band[1] * W)
    roi = img[y0:y1, x0:x1]
    if roi.size == 0:
        return []
    gray = cv2.medianBlur(cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY), 5)
    rmin, rmax = max(int(r_band[0] * H), 4), max(int(r_band[1] * H), 6)
    found = cv2.HoughCircles(gray, cv2.HOUGH_GRADIENT, dp=1.2,
                             minDist=int(rmin * 1.8), param1=120, param2=param2,
                             minRadius=rmin, maxRadius=rmax)
    if found is None:
        return []
    return [(float(cx) + x0, float(cy) + y0, float(r)) for cx, cy, r in found[0]]


def pick_horizontal_run(circles, n=5, max_count=14):
    """Pick n circles forming one horizontal row with uniform x-spacing."""
    if len(circles) < n or len(circles) > max_count:
        circles = sorted(circles, key=lambda c: -c[2])[:max_count]
    if len(circles) < n:
        return None
    cs = sorted(circles, key=lambda c: c[0])
    best = None
    for combo in combinations(cs, n):
        xs = [c[0] for c in combo]
        ys = [c[1] for c in combo]
        rs = [c[2] for c in combo]
        dx = np.diff(xs)
        if np.min(dx) <= np.mean(rs):  # overlapping/duplicate detections
            continue
        x_uniform = float(np.std(dx) / (np.mean(dx) + 1e-6))
        y_flat = float((max(ys) - min(ys)) / (np.mean(rs) + 1e-6))
        if x_uniform > 0.22 or y_flat > 0.6:
            continue
        score = x_uniform + y_flat
        if best is None or score < best[0]:
            best = (score, combo)
    return list(best[1]) if best else None


def pick_vertical_run(circles, n=5):
    """Pick n circles forming one vertical column: tight cx cluster, uniform
    y-pitch, similar radii. Clusters by cx first — a global 'largest radius'
    trim would throw away the avatar column among bigger item-icon circles."""
    best = None
    seen_seeds = set()
    for seed in circles:
        key = round(seed[0] / 20)
        if key in seen_seeds:
            continue
        seen_seeds.add(key)
        tol = seed[2] * 0.8
        group = sorted((c for c in circles if abs(c[0] - seed[0]) <= tol),
                       key=lambda c: c[1])
        if len(group) < n:
            continue
        group = group[:10]
        for combo in combinations(group, n):
            xs = [c[0] for c in combo]
            ys = [c[1] for c in combo]
            rs = [c[2] for c in combo]
            dy = np.diff(ys)
            if np.min(dy) <= np.mean(rs):  # overlapping/duplicate detections
                continue
            y_uniform = float(np.std(dy) / (np.mean(dy) + 1e-6))
            x_flat = float((max(xs) - min(xs)) / (np.mean(rs) + 1e-6))
            r_spread = float(np.std(rs) / (np.mean(rs) + 1e-6))
            if y_uniform > 0.15 or x_flat > 0.5 or r_spread > 0.2:
                continue
            score = y_uniform + x_flat + r_spread
            if best is None or score < best[0]:
                best = (score, combo)
    return list(best[1]) if best else None


def detect_ban_rows(canvas):
    """Find the 5+5 ban circles in the top strip. Returns (our, enemy) circle
    lists sorted left-to-right, or None."""
    W = canvas.shape[1]
    circ = hough_circles(canvas, (0.0, 0.17), (0.0, 1.0), (0.024, 0.062), param2=24)
    left = pick_horizontal_run([c for c in circ if c[0] < W * 0.45])
    right = pick_horizontal_run([c for c in circ if c[0] > W * 0.55])
    if left and right:
        return sorted(left, key=lambda c: c[0]), sorted(right, key=lambda c: c[0])
    return None


def detect_hero_columns(canvas):
    """Find the two scoreboard avatar columns (5 circles each, evenly spaced).
    Returns (our, enemy) sorted top-to-bottom, or None."""
    W = canvas.shape[1]
    circ = hough_circles(canvas, (0.12, 1.0), (0.0, 1.0), (0.035, 0.075), param2=26)
    our = pick_vertical_run([c for c in circ if c[0] < W * 0.5])
    enemy = pick_vertical_run([c for c in circ if c[0] >= W * 0.5])
    if our and enemy:
        return sorted(our, key=lambda c: c[1]), sorted(enemy, key=lambda c: c[1])
    return None


# ── Models & template DB (loaded lazily on first request) ────────────────────

_state: dict = {}


def get_state() -> dict:
    if _state:
        return _state
    print("[vision] loading templates, CLIP and EasyOCR (first request only)...")
    templates = {}
    for name in MLBB_HEROES:
        p = HEROES_DIR / (hero_to_slug(name) + ".webp")
        if p.is_file():
            templates[name] = prep_tile(to_bgr(Image.open(p)))
    names = list(templates.keys())

    from sentence_transformers import SentenceTransformer
    clip = SentenceTransformer("clip-ViT-B-32")

    def to_pil(bgr):
        return Image.fromarray(cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB))

    emb = clip.encode([to_pil(templates[n]) for n in names],
                      normalize_embeddings=True, batch_size=32, show_progress_bar=False)

    import easyocr
    reader = easyocr.Reader(["en"], gpu=False, verbose=False)

    def hsv_hist(tile):
        h = cv2.calcHist([cv2.cvtColor(tile, cv2.COLOR_BGR2HSV)], [0, 1], MASK, [24, 16], [0, 180, 0, 256])
        cv2.normalize(h, h)
        return h

    _state.update({
        "templates": templates,
        "names": names,
        "hists": {n: hsv_hist(t) for n, t in templates.items()},
        "clip": clip,
        "emb": emb,
        "reader": reader,
        "to_pil": to_pil,
    })
    print(f"[vision] ready — {len(templates)} hero templates")
    return _state


# ── Hero matchers ────────────────────────────────────────────────────────────

def match_hero_template_scored(crop: np.ndarray):
    if crop is None or crop.size == 0:
        return "", 0.0
    st = get_state()
    p = prep_tile(crop)
    ph = cv2.calcHist([cv2.cvtColor(p, cv2.COLOR_BGR2HSV)], [0, 1], MASK, [24, 16], [0, 180, 0, 256])
    cv2.normalize(ph, ph)
    best_name, best_score = "", -1.0
    for name, t in st["templates"].items():
        tm = float(cv2.matchTemplate(p, t, cv2.TM_CCOEFF_NORMED)[0][0])
        hs = float(cv2.compareHist(ph, st["hists"][name], cv2.HISTCMP_CORREL))
        s = 0.7 * tm + 0.3 * hs
        if s > best_score:
            best_name, best_score = name, s
    return best_name, best_score


def match_hero_template(crop: np.ndarray, min_score=0.35) -> str:
    name, score = match_hero_template_scored(crop)
    return name if score >= min_score else ""


def match_hero_clip(crop: np.ndarray, min_score=0.55) -> str:
    if crop is None or crop.size == 0:
        return ""
    st = get_state()
    e = st["clip"].encode([st["to_pil"](prep_tile(crop))],
                          normalize_embeddings=True, show_progress_bar=False)[0]
    sims = st["emb"] @ e
    i = int(np.argmax(sims))
    return st["names"][i] if sims[i] >= min_score else ""


def match_hero(crop: np.ndarray, tmpl_min=0.62, clip_min=0.55) -> str:
    """Template match first (portraits are default avatars on draft/scoreboard
    screens — validated 10/10 on real screenshots); CLIP only as fallback."""
    name, score = match_hero_template_scored(crop)
    if score >= tmpl_min:
        return name
    return match_hero_clip(crop, min_score=clip_min)


# ── OCR ──────────────────────────────────────────────────────────────────────

KDA_RE = re.compile(r"(\d{1,2})\s*/\s*(\d{1,2})\s*/\s*(\d{1,2})")


def ocr_tokens(crop: np.ndarray, allowlist="0123456789 "):
    """OCR a strip; returns [(x_center_px_in_crop, int_value)] sorted by x."""
    if crop is None or crop.size == 0:
        return []
    big = cv2.resize(crop, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
    toks = get_state()["reader"].readtext(big, detail=1, allowlist=allowlist)
    out = []
    for box, txt, _conf in toks:
        xc = float(np.mean([p[0] for p in box]))
        for piece in txt.split():
            if piece.isdigit():
                out.append((xc, int(piece)))
                xc += 1e-3  # keep order stable for multi-number tokens
    out.sort(key=lambda t: t[0])
    return out


def detect_result(canvas: np.ndarray) -> str:
    banner = crop_norm(canvas, SCORE_CFG["banner"])
    txt = " ".join(get_state()["reader"].readtext(banner, detail=0)).upper()
    if "VICTOR" in txt:
        return "win"
    if "DEFEAT" in txt:
        return "loss"
    # color fallback: VICTORY banner is gold, DEFEAT is blue/grey
    hsv = cv2.cvtColor(banner, cv2.COLOR_BGR2HSV)
    h, s, v = hsv[..., 0], hsv[..., 1], hsv[..., 2]
    gold_ratio = float(((h > 15) & (h < 40) & (s > 80) & (v > 120)).mean())
    return "win" if gold_ratio > 0.05 else "loss"


def parse_kda_gold_anchor(tokens, side: str):
    """KDA from OCR tokens anchored on the gold value (>= 1000).
    Our side layout: [item-icon noise...] K D A GOLD [rating...]
    Enemy side layout: GOLD K D A [items/name noise...]
    Item icons OCR-hallucinate large numbers, so a gold candidate only counts
    when 3 small ints (<= 99) sit directly beside it; our side keeps the
    rightmost valid candidate, enemy side the leftmost."""
    candidates = [i for i, (_x, v) in enumerate(tokens) if v >= 1000]
    order = reversed(candidates) if side == "our" else candidates
    for gi in order:
        if side == "our":
            picked = [v for _x, v in tokens[max(gi - 3, 0):gi]]
        else:
            picked = [v for _x, v in tokens[gi + 1:gi + 4]]
        if len(picked) == 3 and all(v <= 99 for v in picked):
            return tuple(picked)
    return None


def read_kda_window(crop: np.ndarray):
    """Fallback: OCR a pre-positioned KDA window (static config path)."""
    if crop is None or crop.size == 0:
        return 0, 0, 0
    toks = ocr_tokens(crop, allowlist="0123456789/ ")
    joined = " ".join(str(v) for _x, v in toks)
    m = KDA_RE.search(joined)
    if m:
        return tuple(int(g) for g in m.groups())
    nums = [v for _x, v in toks]
    if len(nums) < 3:
        return 0, 0, 0
    return tuple(min(v, 99) for v in nums[-3:])


# ── Analysis cores ───────────────────────────────────────────────────────────

def scoreboard_boxes():
    """Static fallback boxes: yields (side, row, hero_box, kda_box)."""
    r = SCORE_CFG["rows"]
    for i in range(5):
        y = r["y0"] + i * r["h"]
        for side in ("our", "enemy"):
            hero_box = (r[f"{side}_hero_x"], y, r["hero_w"], r["hero_h"])
            kx, kw = r[f"{side}_kda"]
            # digits sit in the top half of the row; item icons below misread as digits
            yield side, i, hero_box, (kx, y, kw, r["hero_h"] * 0.5)


def analyze_draft_canvas(canvas: np.ndarray):
    detected = detect_ban_rows(canvas)
    if detected:
        our_boxes = [circle_to_box(c, canvas.shape) for c in detected[0]]
        enemy_boxes = [circle_to_box(c, canvas.shape) for c in detected[1]]
        mode = "dynamic"
    else:
        our_boxes, enemy_boxes = DRAFT_CFG["our_bans"], DRAFT_CFG["enemy_bans"]
        mode = "fallback-static"
    result = {
        "bans": [match_hero_template(crop_norm(canvas, b)) for b in our_boxes],
        "enemyBans": [match_hero_template(crop_norm(canvas, b)) for b in enemy_boxes],
    }
    _debug_dump("draft", canvas, our_boxes + enemy_boxes, mode)
    return result


def analyze_scoreboard_canvas(canvas: np.ndarray):
    H, W = canvas.shape[:2]
    players = [None] * 5
    enemy = [None] * 5
    debug_boxes = []
    columns = detect_hero_columns(canvas)

    if columns:
        mode = "dynamic"
        our_col, enemy_col = columns
        pitch = float(np.median(np.diff([c[1] for c in our_col + enemy_col][:5])))
        for side, col, arr in (("our", our_col, players), ("enemy", enemy_col, enemy)):
            for i, (cx, cy, r) in enumerate(col):
                hero_box = circle_to_box((cx, cy, r), canvas.shape)
                debug_boxes.append(hero_box)
                hero = match_hero(crop_norm(canvas, hero_box))
                # stat strip: between this column and mid-screen, digits band above row center
                y0 = max(cy - 0.42 * pitch, 0) / H
                hh = 0.50 * pitch / H
                if side == "our":
                    sx0, sx1 = (cx + 1.2 * r) / W, 0.5
                else:
                    sx0, sx1 = 0.5, (cx - 1.2 * r) / W
                strip_box = (sx0, y0, sx1 - sx0, hh)
                debug_boxes.append(strip_box)
                kda = parse_kda_gold_anchor(ocr_tokens(crop_norm(canvas, strip_box)), side)
                if kda is None:
                    kda = (0, 0, 0)
                arr[i] = {"hero": hero, "kills": kda[0], "deaths": kda[1], "assists": kda[2]}
    else:
        mode = "fallback-static"
        for side, i, hero_box, kda_box in scoreboard_boxes():
            debug_boxes += [hero_box, kda_box]
            hero = match_hero(crop_norm(canvas, hero_box))
            k, d, a = read_kda_window(crop_norm(canvas, kda_box))
            (players if side == "our" else enemy)[i] = {
                "hero": hero, "kills": k, "deaths": d, "assists": a,
            }

    result = {"result": detect_result(canvas), "players": players, "enemyPlayers": enemy}
    _debug_dump("scoreboard", canvas, debug_boxes, mode)
    return result


def _debug_dump(kind: str, canvas: np.ndarray, boxes, mode: str):
    try:
        vis = canvas.copy()
        H, W = vis.shape[:2]
        for x, y, w, h in boxes:
            p1 = (int(x * W), int(y * H))
            p2 = (int((x + w) * W), int((y + h) * H))
            cv2.rectangle(vis, p1, p2, (0, 255, 0), 2)
        cv2.putText(vis, mode, (12, 36), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 255, 255), 2)
        cv2.imwrite(str(DEBUG_DIR / f"last_{kind}.png"), vis)
        print(f"[vision] {kind}: {W}x{H} canvas, mode={mode}")
    except Exception as exc:  # noqa: BLE001
        print("[vision] debug dump failed:", exc)


# ── FastAPI ──────────────────────────────────────────────────────────────────

app = FastAPI(title="MLBB Vision Server")


class ImagePayload(BaseModel):
    image: str  # base64, optionally with a data: URL prefix


def decode_payload(payload: ImagePayload) -> np.ndarray:
    b64 = payload.image.split(",", 1)[-1] if payload.image.startswith("data:") else payload.image
    try:
        raw = base64.b64decode(b64, validate=True)
        return load_canvas(raw)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail=f"invalid image: {exc}") from exc


@app.get("/")
def health():
    return {"ok": True, "service": "mlbb-vision", "modelsLoaded": bool(_state)}


@app.post("/analyze-draft")
def analyze_draft(payload: ImagePayload):
    return analyze_draft_canvas(decode_payload(payload))


@app.post("/analyze-scoreboard")
def analyze_scoreboard(payload: ImagePayload):
    return analyze_scoreboard_canvas(decode_payload(payload))


if __name__ == "__main__":
    import uvicorn

    get_state()  # warm up models before accepting traffic
    uvicorn.run(app, host="127.0.0.1", port=8000)
