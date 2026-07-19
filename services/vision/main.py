"""FastAPI Vision Service — MLBB Draft & Scoreboard Scanner.

Endpoints:
  POST /scan/draft       — Detect bans & picks from draft screenshot
  POST /scan/scoreboard  — Extract score, duration & KDA from scoreboard
"""

import numpy as np
import torch
from PIL import Image
from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel
from pathlib import Path
from typing import Optional
import io, logging, time

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("vision")

app = FastAPI(title="MLBB Vision Service", version="0.1.0")

# ──────────────────────────────────────────────
# Models (lazy-loaded)
# ──────────────────────────────────────────────

_ocr_reader = None
_clip_model = None
_clip_processor = None
_hero_names: list[str] = []
_hero_embeddings: Optional[torch.Tensor] = None

HERO_DATASET_DIR = Path("public/heroes")
EMBEDDING_CACHE = Path("cache/hero_embeddings.pt")
CONFIDENCE_THRESHOLD = 0.75


def get_ocr():
    global _ocr_reader
    if _ocr_reader is None:
        import easyocr
        logger.info("Loading EasyOCR...")
        _ocr_reader = easyocr.Reader(
            ["en"],
            gpu=torch.cuda.is_available(),
            model_storage_directory="./models/easyocr",
        )
        logger.info("EasyOCR ready.")
    return _ocr_reader


def get_clip():
    global _clip_model, _clip_processor
    if _clip_model is None:
        from transformers import CLIPProcessor, CLIPModel
        logger.info("Loading CLIP model...")
        model_name = "openai/clip-vit-base-patch32"
        _clip_model = CLIPModel.from_pretrained(model_name)
        _clip_processor = CLIPProcessor.from_pretrained(model_name)
        _clip_model.eval()
        if torch.cuda.is_available():
            _clip_model = _clip_model.to("cuda")
        logger.info("CLIP model ready.")
    return _clip_model, _clip_processor


def get_hero_index():
    global _hero_names, _hero_embeddings
    if _hero_embeddings is not None:
        return _hero_names, _hero_embeddings

    clip_model, clip_processor = get_clip()

    if EMBEDDING_CACHE.exists():
        data = torch.load(EMBEDDING_CACHE)
        _hero_names = data["names"]
        _hero_embeddings = data["embeddings"]
        logger.info(f"Loaded {len(_hero_names)} hero embeddings from cache.")
        return _hero_names, _hero_embeddings

    portraits = sorted(HERO_DATASET_DIR.glob("*.webp"))
    if not portraits:
        logger.warning("No hero portraits found — returning empty index.")
        return [], torch.zeros(0, 512)

    names = []
    embs = []
    for p in portraits:
        hero_id = p.stem
        img = Image.open(p).convert("RGB")
        inputs = clip_processor(images=img, return_tensors="pt")
        if torch.cuda.is_available():
            inputs = {k: v.to("cuda") for k, v in inputs.items()}
        with torch.no_grad():
            emb = clip_model.get_image_features(**inputs)
            emb = emb / emb.norm(dim=-1, keepdim=True)
        embs.append(emb.cpu())
        names.append(hero_id)

    _hero_names = names
    _hero_embeddings = torch.cat(embs, dim=0)

    EMBEDDING_CACHE.parent.mkdir(parents=True, exist_ok=True)
    torch.save({"names": names, "embeddings": _hero_embeddings}, EMBEDDING_CACHE)
    logger.info(f"Computed & cached {len(names)} hero embeddings.")
    return _hero_names, _hero_embeddings


# ──────────────────────────────────────────────
# Coordinate Regions (fractional)
# ──────────────────────────────────────────────

from dataclasses import dataclass


@dataclass
class CropRegion:
    label: str
    x1: float
    y1: float
    x2: float
    y2: float


def _abs(r: CropRegion, w: int, h: int):
    return int(r.x1 * w), int(r.y1 * h), int(r.x2 * w), int(r.y2 * h)


def _crop(img: Image.Image, r: CropRegion) -> Image.Image:
    x1, y1, x2, y2 = _abs(r, *img.size)
    return img.crop((x1, y1, x2, y2))


OUR_BANS = [CropRegion(f"our_ban_{i+1}", 0.02 + i * 0.06, 0.04, 0.06 + i * 0.06, 0.12) for i in range(5)]
OUR_PICKS = [CropRegion(f"our_pick_{i+1}", 0.02 + i * 0.06, 0.28, 0.06 + i * 0.06, 0.38) for i in range(5)]
ENEMY_BANS = [CropRegion(f"enemy_ban_{i+1}", 0.68 + i * 0.06, 0.04, 0.72 + i * 0.06, 0.12) for i in range(5)]
ENEMY_PICKS = [CropRegion(f"enemy_pick_{i+1}", 0.68 + i * 0.06, 0.28, 0.72 + i * 0.06, 0.38) for i in range(5)]

SCOREBOARD_REGIONS = {
    "duration": CropRegion("duration", 0.65, 0.09, 0.85, 0.15),
    "our_score": CropRegion("our_score", 0.31, 0.02, 0.38, 0.11),
    "enemy_score": CropRegion("enemy_score", 0.61, 0.02, 0.68, 0.11),
}


def _get_y_coords(i: int):
    # Player list starts at y=76/472 (~0.161) and ends at y=412/472 (~0.872)
    # Row height is 68px. Padded height is 60px inside the 68px row.
    y1 = 76 + i * 68
    y2 = 136 + i * 68
    return y1 / 472.0, y2 / 472.0


PLAYER_KDA_ROWS = {
    "our": [
        CropRegion(
            f"our_kda_{i+1}",
            0.10,
            _get_y_coords(i)[0],
            0.47,
            _get_y_coords(i)[1],
        )
        for i in range(5)
    ],
    "enemy": [
        CropRegion(
            f"enemy_kda_{i+1}",
            0.53,
            _get_y_coords(i)[0],
            0.90,
            _get_y_coords(i)[1],
        )
        for i in range(5)
    ],
}


# ──────────────────────────────────────────────
# Schemas
# ──────────────────────────────────────────────


class HeroMatch(BaseModel):
    hero: str
    confidence: float
    warning: Optional[str] = None


class DraftResult(BaseModel):
    our_bans: list[HeroMatch]
    our_picks: list[HeroMatch]
    enemy_bans: list[HeroMatch]
    enemy_picks: list[HeroMatch]


class ScoreboardResult(BaseModel):
    duration: str
    our_score: str
    enemy_score: str
    our_kda: list[str]
    enemy_kda: list[str]


# ──────────────────────────────────────────────
# Inference helpers
# ──────────────────────────────────────────────


def _match_hero(crop: Image.Image, names: list[str], embeddings: torch.Tensor) -> tuple[str, float]:
    if not names:
        return "unknown", 0.0
    model, processor = get_clip()
    inputs = processor(images=crop, return_tensors="pt")
    if torch.cuda.is_available():
        inputs = {k: v.to("cuda") for k, v in inputs.items()}
    with torch.no_grad():
        emb = model.get_image_features(**inputs)
        emb = emb / emb.norm(dim=-1, keepdim=True)
        sim = (emb @ embeddings.T).squeeze(0)
        best = sim.argmax().item()
        conf = sim[best].item()
    return names[best], conf


def _scan_draft(img: Image.Image) -> DraftResult:
    names, embs = get_hero_index()
    result = {}
    for region_list, key in [
        (OUR_BANS, "our_bans"),
        (OUR_PICKS, "our_picks"),
        (ENEMY_BANS, "enemy_bans"),
        (ENEMY_PICKS, "enemy_picks"),
    ]:
        items = []
        for r in region_list:
            crop = _crop(img, r)
            hero, conf = _match_hero(crop, names, embs)
            entry = HeroMatch(hero=hero, confidence=round(conf, 3))
            if conf < CONFIDENCE_THRESHOLD:
                entry.warning = "low_confidence"
            items.append(entry)
        result[key] = items
    return DraftResult(**result)


def _scan_scoreboard(img: Image.Image) -> ScoreboardResult:
    reader = get_ocr()

    def ocr(r: CropRegion) -> str:
        crop = _crop(img, r)
        text = reader.readtext(np.array(crop), detail=0, paragraph=False)
        return " ".join(text).strip()

    duration = ocr(SCOREBOARD_REGIONS["duration"])
    our_score = ocr(SCOREBOARD_REGIONS["our_score"])
    enemy_score = ocr(SCOREBOARD_REGIONS["enemy_score"])
    our_kda = [ocr(r) for r in PLAYER_KDA_ROWS["our"]]
    enemy_kda = [ocr(r) for r in PLAYER_KDA_ROWS["enemy"]]

    return ScoreboardResult(
        duration=duration,
        our_score=our_score,
        enemy_score=enemy_score,
        our_kda=our_kda,
        enemy_kda=enemy_kda,
    )


# ──────────────────────────────────────────────
# Routes
# ──────────────────────────────────────────────


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/scan/draft", response_model=DraftResult)
async def scan_draft(file: UploadFile = File(...)):
    t0 = time.time()
    try:
        raw = await file.read()
        img = Image.open(io.BytesIO(raw)).convert("RGB")
        logger.info(f"Draft scan — file={file.filename}, size={img.size}")
        result = _scan_draft(img)
        elapsed = time.time() - t0
        logger.info(f"Draft scan done in {elapsed:.2f}s")
        return result
    except Exception as e:
        logger.error(f"Draft scan failed: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/scan/scoreboard", response_model=ScoreboardResult)
async def scan_scoreboard(file: UploadFile = File(...)):
    t0 = time.time()
    try:
        raw = await file.read()
        img = Image.open(io.BytesIO(raw)).convert("RGB")
        logger.info(f"Scoreboard scan — file={file.filename}, size={img.size}")
        result = _scan_scoreboard(img)
        elapsed = time.time() - t0
        logger.info(f"Scoreboard scan done in {elapsed:.2f}s")
        return result
    except Exception as e:
        logger.error(f"Scoreboard scan failed: {e}")
        raise HTTPException(status_code=400, detail=str(e))


# ──────────────────────────────────────────────
# Base64 Web / WhatsApp Webhook Compatibility Routes
# ──────────────────────────────────────────────
import re
import base64


class ImagePayload(BaseModel):
    image: str  # base64 encoded string


class DraftServerResponse(BaseModel):
    bans: list[str]
    enemyBans: list[str]


class ScoreboardServerPlayer(BaseModel):
    hero: str
    kills: int
    deaths: int
    assists: int


class ScoreboardServerResponse(BaseModel):
    result: str  # "win" | "loss"
    players: list[ScoreboardServerPlayer]
    enemyPlayers: list[ScoreboardServerPlayer]
    durationSeconds: int


def _parse_kda(text: str) -> tuple[int, int, int]:
    text_clean = re.sub(r"\.\d+", "", text)
    numbers = [int(n) for n in re.findall(r"\d+", text_clean)]
    stats = [n for n in numbers if n < 1000]
    if len(stats) >= 4:
        stats = stats[1:4]
    kills = stats[0] if len(stats) > 0 else 0
    deaths = stats[1] if len(stats) > 1 else 0
    assists = stats[2] if len(stats) > 2 else 0
    return kills, deaths, assists


def _parse_duration(text: str) -> int:
    match = re.search(r"(\d+)\s*[:.]\s*(\d+)", text)
    if match:
        return int(match.group(1)) * 60 + int(match.group(2))
    return 0


# Calibrated hero portrait regions for each player row (width 6% of screenshot)
OUR_HERO_REGIONS = [
    CropRegion(f"our_hero_{i+1}", 0.12, _get_y_coords(i)[0], 0.18, _get_y_coords(i)[1])
    for i in range(5)
]
ENEMY_HERO_REGIONS = [
    CropRegion(f"enemy_hero_{i+1}", 0.82, _get_y_coords(i)[0], 0.88, _get_y_coords(i)[1])
    for i in range(5)
]


@app.post("/analyze-draft", response_model=DraftServerResponse)
async def analyze_draft(payload: ImagePayload):
    t0 = time.time()
    try:
        raw_data = base64.b64decode(payload.image)
        img = Image.open(io.BytesIO(raw_data)).convert("RGB")
        logger.info(f"Base64 Draft scan — size={img.size}")
        result = _scan_draft(img)
        elapsed = time.time() - t0
        logger.info(f"Base64 Draft scan done in {elapsed:.2f}s")
        return DraftServerResponse(
            bans=[item.hero for item in result.our_bans],
            enemyBans=[item.hero for item in result.enemy_bans]
        )
    except Exception as e:
        logger.error(f"Base64 Draft scan failed: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/analyze-scoreboard", response_model=ScoreboardServerResponse)
async def analyze_scoreboard(payload: ImagePayload):
    t0 = time.time()
    try:
        raw_data = base64.b64decode(payload.image)
        img = Image.open(io.BytesIO(raw_data)).convert("RGB")
        logger.info(f"Base64 Scoreboard scan — size={img.size}")

        reader = get_ocr()
        dur_text = " ".join(reader.readtext(np.array(_crop(img, SCOREBOARD_REGIONS["duration"])), detail=0)).strip()
        our_score_text = " ".join(reader.readtext(np.array(_crop(img, SCOREBOARD_REGIONS["our_score"])), detail=0)).strip()
        enemy_score_text = " ".join(reader.readtext(np.array(_crop(img, SCOREBOARD_REGIONS["enemy_score"])), detail=0)).strip()

        duration_secs = _parse_duration(dur_text)
        try:
            our_score_int = int(re.sub(r"\D", "", our_score_text))
        except ValueError:
            our_score_int = 0
        try:
            enemy_score_int = int(re.sub(r"\D", "", enemy_score_text))
        except ValueError:
            enemy_score_int = 0

        result_str = "win" if our_score_int >= enemy_score_int else "loss"

        names, embs = get_hero_index()

        players = []
        for i in range(5):
            ocr_text = " ".join(reader.readtext(np.array(_crop(img, PLAYER_KDA_ROWS["our"][i])), detail=0)).strip()
            k, d, a = _parse_kda(ocr_text)
            hero_crop = _crop(img, OUR_HERO_REGIONS[i])
            hero_name, conf = _match_hero(hero_crop, names, embs)
            players.append(ScoreboardServerPlayer(hero=hero_name, kills=k, deaths=d, assists=a))

        enemy_players = []
        for i in range(5):
            ocr_text = " ".join(reader.readtext(np.array(_crop(img, PLAYER_KDA_ROWS["enemy"][i])), detail=0)).strip()
            k, d, a = _parse_kda(ocr_text)
            hero_crop = _crop(img, ENEMY_HERO_REGIONS[i])
            hero_name, conf = _match_hero(hero_crop, names, embs)
            enemy_players.append(ScoreboardServerPlayer(hero=hero_name, kills=k, deaths=d, assists=a))

        elapsed = time.time() - t0
        logger.info(f"Base64 Scoreboard scan done in {elapsed:.2f}s")

        return ScoreboardServerResponse(
            result=result_str,
            durationSeconds=duration_secs,
            players=players,
            enemyPlayers=enemy_players
        )
    except Exception as e:
        logger.error(f"Base64 Scoreboard scan failed: {e}")
        raise HTTPException(status_code=400, detail=str(e))
