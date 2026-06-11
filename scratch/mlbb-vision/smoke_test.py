"""Smoke test for server.py endpoints using synthetic screenshots (no real server needed).

Run: python scratch/mlbb-vision/smoke_test.py
"""
import base64
import random

import cv2
import numpy as np
from fastapi.testclient import TestClient

import server

W, H = 1920, 885  # synthetic canvas matches the calibrated 21:9 layout


def b64(canvas) -> str:
    ok, enc = cv2.imencode(".png", canvas)
    assert ok
    return base64.b64encode(enc.tobytes()).decode()


def paste(canvas, tile, box):
    x, y, w, h = box
    x0, y0 = int(x * W), int(y * H)
    ww, hh = int(w * W), int(h * H)
    canvas[y0:y0 + hh, x0:x0 + ww] = cv2.resize(tile, (ww, hh))


def text(canvas, s, xf, yf, scale=0.7, color=(235, 235, 235)):
    cv2.putText(canvas, s, (int(xf * W), int(yf * H)),
                cv2.FONT_HERSHEY_SIMPLEX, scale, color, 2)


def main():
    random.seed(7)
    client = TestClient(server.app)
    st = server.get_state()
    names = st["names"]

    # health
    r = client.get("/")
    assert r.status_code == 200 and r.json()["ok"], r.text
    print("health: ok")

    # ── draft ────────────────────────────────────────────────────────────────
    canvas = np.full((H, W, 3), 24, np.uint8)
    chosen = random.sample(names, 10)
    for name, box in zip(chosen, server.DRAFT_CFG["our_bans"] + server.DRAFT_CFG["enemy_bans"]):
        paste(canvas, st["templates"][name], box)
    r = client.post("/analyze-draft", json={"image": b64(canvas)})
    assert r.status_code == 200, r.text
    got = r.json()
    hits = sum(1 for a, b in zip(got["bans"] + got["enemyBans"], chosen) if a == b)
    print(f"draft: {hits}/10 bans correct -> {got}")
    assert hits >= 9

    # ── scoreboard ───────────────────────────────────────────────────────────
    canvas = np.full((H, W, 3), 24, np.uint8)
    bx, by, bw, bh = server.SCORE_CFG["banner"]
    text(canvas, "VICTORY", bx + 0.14, by + bh * 0.55, scale=2.6, color=(0, 200, 255))
    chosen = random.sample(names, 10)
    truth = []
    rows = server.SCORE_CFG["rows"]
    idx = 0
    for side, i, hero_box, kda_box in server.scoreboard_boxes():
        name = chosen[idx]; idx += 1
        paste(canvas, st["templates"][name], hero_box)
        k, d, a = random.randint(0, 19), random.randint(0, 12), random.randint(0, 25)
        gold = random.randint(4000, 14000)
        kx, ky, kw, kh = kda_box
        # real layout: our side "K D A GOLD", enemy side "GOLD K D A"
        stats = f"{k}  {d}  {a}  {gold}" if side == "our" else f"{gold}  {k}  {d}  {a}"
        text(canvas, stats, kx + 0.003, ky + kh * 0.75)
        truth.append({"side": side, "hero": name, "kda": (k, d, a)})
    r = client.post("/analyze-scoreboard", json={"image": b64(canvas)})
    assert r.status_code == 200, r.text
    got = r.json()
    assert got["result"] == "win", got["result"]
    pred_ordered = []
    for side, i, _, _ in server.scoreboard_boxes():
        pred_ordered.append(got["players" if side == "our" else "enemyPlayers"][i])
    hero_hits = sum(1 for p, t in zip(pred_ordered, truth) if p["hero"] == t["hero"])
    kda_hits = sum(1 for p, t in zip(pred_ordered, truth)
                   if (p["kills"], p["deaths"], p["assists"]) == t["kda"])
    print(f"scoreboard: result=win ok, heroes {hero_hits}/10, kda {kda_hits}/10")
    assert hero_hits >= 9 and kda_hits >= 9

    # ── invalid payload ──────────────────────────────────────────────────────
    r = client.post("/analyze-draft", json={"image": "not-base64!!"})
    assert r.status_code == 400, r.status_code
    print("invalid payload: 400 ok")
    print("SMOKE TEST PASSED")


if __name__ == "__main__":
    main()
