"""Robustness test: feed the same real screenshots re-encoded at various
resolutions/aspect ratios (simulating different devices + upload re-encoding)
through the full production pipeline.

Run: python scratch/mlbb-vision/test_ratios.py
"""
import os

os.environ.setdefault("USE_TF", "0")

from pathlib import Path

import cv2
import numpy as np
from PIL import Image

import server
from calibrate2 import (TRUTH_ENEMY_HEROES, TRUTH_ENEMY_KDA, TRUTH_OUR_HEROES,
                        TRUTH_OUR_KDA, TRUTH_RESULT)

HERE = Path(__file__).resolve().parent

TRUTH_BANS = {
    "bans": ["Zhuxin", "Gord", "Marcel", "Gloo", "Paquito"],
    "enemyBans": ["Harley", "Sun", "Yi Sun-shin", "Guinevere", "Suyou"],
}

# (label, target size or None for original, jpeg quality or None for png)
VARIANTS = [
    ("original-1024x472-png", None, None),
    ("hd-2400x1107-jpg80", (2400, 1107), 80),   # native 21:9 phone res, jpeg
    ("small-800x369-jpg70", (800, 369), 70),    # heavy whatsapp-style compression
    ("stretched-1920x1080", (1920, 1080), 90),  # wrong-ratio stretch (old strategy)
]


def variant_bytes(path, size, q):
    img = cv2.imread(str(path))
    if size:
        img = cv2.resize(img, size, interpolation=cv2.INTER_CUBIC)
    if q:
        ok, enc = cv2.imencode(".jpg", img, [cv2.IMWRITE_JPEG_QUALITY, q])
    else:
        ok, enc = cv2.imencode(".png", img)
    assert ok
    return enc.tobytes()


def main():
    server.get_state()
    for label, size, q in VARIANTS:
        print(f"\n=== {label} ===")
        draft = server.load_canvas(variant_bytes(HERE / "samples" / "draft.png", size, q))
        d = server.analyze_draft_canvas(draft)
        ban_ok = sum(a == b for a, b in zip(d["bans"], TRUTH_BANS["bans"]))
        ban_ok += sum(a == b for a, b in zip(d["enemyBans"], TRUTH_BANS["enemyBans"]))

        score = server.load_canvas(variant_bytes(HERE / "samples" / "scoreboard.png", size, q))
        s = server.analyze_scoreboard_canvas(score)
        hero_ok = sum(p["hero"] == t for p, t in zip(s["players"], TRUTH_OUR_HEROES))
        hero_ok += sum(p["hero"] == t for p, t in zip(s["enemyPlayers"], TRUTH_ENEMY_HEROES))
        kda_ok = sum((p["kills"], p["deaths"], p["assists"]) == t
                     for p, t in zip(s["players"], TRUTH_OUR_KDA))
        kda_ok += sum((p["kills"], p["deaths"], p["assists"]) == t
                      for p, t in zip(s["enemyPlayers"], TRUTH_ENEMY_KDA))
        res_ok = s["result"] == TRUTH_RESULT
        print(f"bans {ban_ok}/10 | heroes {hero_ok}/10 | kda {kda_ok}/10 | result {'OK' if res_ok else 'MISS'}")
        if ban_ok < 10:
            print("  bans:", d)
        if hero_ok < 10 or kda_ok < 10:
            for p, t, k in zip(s["players"], TRUTH_OUR_HEROES, TRUTH_OUR_KDA):
                print(f"  our   {p} want {t} {k}")
            for p, t, k in zip(s["enemyPlayers"], TRUTH_ENEMY_HEROES, TRUTH_ENEMY_KDA):
                print(f"  enemy {p} want {t} {k}")


if __name__ == "__main__":
    main()
