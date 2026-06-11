"""Experiment: hero matching variants on the real scoreboard/draft crops.

Prints top-5 candidates per slot for several preprocessing variants so the best
config can be promoted into server.py.

Run: python scratch/mlbb-vision/tune_match.py
"""
import os

os.environ.setdefault("USE_TF", "0")

from pathlib import Path

import cv2
import numpy as np

import server

HERE = Path(__file__).resolve().parent


def shrink_box(box, f):
    x, y, w, h = box
    return (x + w * (1 - f) / 2, y + h * (1 - f) / 2, w * f, h * f)


def clip_top5(crop):
    st = server.get_state()
    e = st["clip"].encode([st["to_pil"](server.prep_tile(crop))],
                          normalize_embeddings=True, show_progress_bar=False)[0]
    sims = st["emb"] @ e
    order = np.argsort(-sims)[:5]
    return [(st["names"][i], round(float(sims[i]), 3)) for i in order]


def tmpl_top3(crop):
    st = server.get_state()
    p = server.prep_tile(crop)
    ph = cv2.calcHist([cv2.cvtColor(p, cv2.COLOR_BGR2HSV)], [0, 1], server.MASK, [24, 16], [0, 180, 0, 256])
    cv2.normalize(ph, ph)
    scores = []
    for name, t in st["templates"].items():
        tm = float(cv2.matchTemplate(p, t, cv2.TM_CCOEFF_NORMED)[0][0])
        hs = float(cv2.compareHist(ph, st["hists"][name], cv2.HISTCMP_CORREL))
        scores.append((0.7 * tm + 0.3 * hs, name))
    scores.sort(reverse=True)
    return [(n, round(s, 3)) for s, n in scores[:3]]


def main():
    server.get_state()
    score = server.load_canvas((HERE / "samples" / "scoreboard.png").read_bytes())
    draft = server.load_canvas((HERE / "samples" / "draft.png").read_bytes())

    print("=== SCOREBOARD HEROES ===")
    for side, i, hero_box, _ in server.scoreboard_boxes():
        for f, label in ((1.0, "full"), (0.82, "shrunk")):
            crop = server.crop_norm(score, shrink_box(hero_box, f))
            print(f"{side}_{i} [{label}] clip={clip_top5(crop)}")
        print(f"{side}_{i} tmpl={tmpl_top3(server.crop_norm(score, hero_box))}")
        print()

    print("=== DRAFT BANS ===")
    for grp in ("our_bans", "enemy_bans"):
        for i, b in enumerate(server.DRAFT_CFG[grp]):
            crop = server.crop_norm(draft, b)
            print(f"{grp}_{i} tmpl={tmpl_top3(crop)} clip={clip_top5(crop)[:3]}")


if __name__ == "__main__":
    main()
