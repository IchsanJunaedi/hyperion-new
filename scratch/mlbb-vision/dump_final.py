"""Dump crops using the FINAL server configs (production 1920x1080 stretched canvas).

Run: python scratch/mlbb-vision/dump_final.py
"""
import os

os.environ.setdefault("USE_TF", "0")

from pathlib import Path

import cv2

import server

HERE = Path(__file__).resolve().parent
OUT = HERE / "crops" / "final"
OUT.mkdir(parents=True, exist_ok=True)


def save(name, img):
    cv2.imwrite(str(OUT / name), cv2.resize(img, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC))


draft = server.load_canvas((HERE / "samples" / "draft.png").read_bytes())
for i, b in enumerate(server.DRAFT_CFG["our_bans"]):
    save(f"ban_our_{i}.png", server.crop_norm(draft, b))
for i, b in enumerate(server.DRAFT_CFG["enemy_bans"]):
    save(f"ban_enemy_{i}.png", server.crop_norm(draft, b))

score = server.load_canvas((HERE / "samples" / "scoreboard.png").read_bytes())
for side, i, hero_box, kda_box in server.scoreboard_boxes():
    save(f"hero_{side}_{i}.png", server.crop_norm(score, hero_box))
    save(f"kda_{side}_{i}.png", server.crop_norm(score, kda_box))
print("wrote", OUT)
