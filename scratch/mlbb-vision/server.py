"""MLBB Vision Server — local, offline screenshot analysis for Hyperion scrims.

Replaces Gemini Vision. Run from anywhere inside the repo:

    python scratch/mlbb-vision/server.py

Endpoints (JSON body: {"image": "<base64>"}):
    POST /analyze-draft      -> {"bans": string[5], "enemyBans": string[5]}
    POST /analyze-scoreboard -> {"result": "win"|"loss",
                                 "players": [{hero, kills, deaths, assists} x5],
                                 "enemyPlayers": [...x5]}

Pipeline (see pipeline.ipynb for the research + calibration workflow):
- Input resized to a 1920x1080 canvas; all crop boxes are normalized (x, y, w, h).
- Draft bans: OpenCV template matching (TM_CCOEFF_NORMED + HSV hist) vs public/heroes/*.webp.
- Scoreboard heroes: CLIP (clip-ViT-B-32) embedding similarity — robust to skins.
- VICTORY/DEFEAT + KDA: EasyOCR (with gold-banner color fallback for the result).
"""
import os

os.environ.setdefault("USE_TF", "0")  # sentence_transformers breaks on Keras 3 without this

import base64
import io
import re
from pathlib import Path

import cv2
import numpy as np
from fastapi import FastAPI, HTTPException
from PIL import Image
from pydantic import BaseModel

# ── Paths & hero database ────────────────────────────────────────────────────

CANVAS_W, CANVAS_H = 1920, 1080


def find_root() -> Path:
    here = Path(__file__).resolve()
    for cand in here.parents:
        if (cand / "public" / "heroes").is_dir():
            return cand
    raise RuntimeError("public/heroes not found above server.py")


ROOT = find_root()
HEROES_DIR = ROOT / "public" / "heroes"

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


# ── Crop coordinate config (normalized x, y, w, h on 1920x1080) ──────────────
# Calibrate in pipeline.ipynb against real screenshots, then mirror values here.

DRAFT_CFG = {
    "our_bans":   [(0.118 + i * 0.0455, 0.030, 0.038, 0.067) for i in range(5)],
    "enemy_bans": [(1.0 - (0.118 + (4 - i) * 0.0455) - 0.038, 0.030, 0.038, 0.067) for i in range(5)],
}

SCORE_CFG = {
    "banner": (0.330, 0.010, 0.340, 0.150),
    "rows": {
        "y0": 0.250,
        "h": 0.122,
        "hero_w": 0.046,
        "hero_h": 0.082,
        "our_hero_x": 0.060,
        "enemy_hero_x": 0.530,
        "our_kda": (0.215, 0.115),
        "enemy_kda": (0.685, 0.115),
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
    x0, y0 = int(x * W), int(y * H)
    return img[y0:y0 + int(h * H), x0:x0 + int(w * W)]


def load_canvas(raw: bytes) -> np.ndarray:
    pil = Image.open(io.BytesIO(raw))
    return cv2.resize(to_bgr(pil), (CANVAS_W, CANVAS_H), interpolation=cv2.INTER_AREA)


def scoreboard_boxes():
    r = SCORE_CFG["rows"]
    for i in range(5):
        y = r["y0"] + i * r["h"]
        for side in ("our", "enemy"):
            hero_box = (r[f"{side}_hero_x"], y, r["hero_w"], r["hero_h"])
            kx, kw = r[f"{side}_kda"]
            yield side, i, hero_box, (kx, y, kw, r["hero_h"])


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


# ── Matchers ─────────────────────────────────────────────────────────────────

def match_hero_template(crop: np.ndarray, min_score=0.35) -> str:
    if crop is None or crop.size == 0:
        return ""
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
    return best_name if best_score >= min_score else ""


def match_hero_clip(crop: np.ndarray, min_score=0.55) -> str:
    if crop is None or crop.size == 0:
        return ""
    st = get_state()
    e = st["clip"].encode([st["to_pil"](prep_tile(crop))],
                          normalize_embeddings=True, show_progress_bar=False)[0]
    sims = st["emb"] @ e
    i = int(np.argmax(sims))
    return st["names"][i] if sims[i] >= min_score else ""


# ── OCR ──────────────────────────────────────────────────────────────────────

KDA_RE = re.compile(r"(\d{1,2})\s*/\s*(\d{1,2})\s*/\s*(\d{1,2})")


def ocr_text(crop: np.ndarray, allowlist=None) -> str:
    if crop is None or crop.size == 0:
        return ""
    return " ".join(get_state()["reader"].readtext(crop, detail=0, allowlist=allowlist))


def detect_result(canvas: np.ndarray) -> str:
    banner = crop_norm(canvas, SCORE_CFG["banner"])
    txt = ocr_text(banner).upper()
    if "VICTOR" in txt:
        return "win"
    if "DEFEAT" in txt:
        return "loss"
    hsv = cv2.cvtColor(banner, cv2.COLOR_BGR2HSV)
    h, s, v = hsv[..., 0], hsv[..., 1], hsv[..., 2]
    gold_ratio = float(((h > 15) & (h < 40) & (s > 80) & (v > 120)).mean())
    return "win" if gold_ratio > 0.05 else "loss"


def read_kda(crop: np.ndarray):
    if crop is None or crop.size == 0:
        return 0, 0, 0
    big = cv2.resize(crop, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
    m = KDA_RE.search(ocr_text(big, allowlist="0123456789/ "))
    return tuple(int(g) for g in m.groups()) if m else (0, 0, 0)


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
    canvas = decode_payload(payload)
    return {
        "bans": [match_hero_template(crop_norm(canvas, b)) for b in DRAFT_CFG["our_bans"]],
        "enemyBans": [match_hero_template(crop_norm(canvas, b)) for b in DRAFT_CFG["enemy_bans"]],
    }


@app.post("/analyze-scoreboard")
def analyze_scoreboard(payload: ImagePayload):
    canvas = decode_payload(payload)
    players = [None] * 5
    enemy = [None] * 5
    for side, i, hero_box, kda_box in scoreboard_boxes():
        hero = match_hero_clip(crop_norm(canvas, hero_box))
        k, d, a = read_kda(crop_norm(canvas, kda_box))
        entry = {"hero": hero, "kills": k, "deaths": d, "assists": a}
        (players if side == "our" else enemy)[i] = entry
    return {"result": detect_result(canvas), "players": players, "enemyPlayers": enemy}


if __name__ == "__main__":
    import uvicorn

    get_state()  # warm up models before accepting traffic
    uvicorn.run(app, host="127.0.0.1", port=8000)
