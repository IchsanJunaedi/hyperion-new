"""Stage 2: run the production server pipeline on the real samples and score KDA/result
against ground truth read off the screenshot. Run after updating server.py configs.

Run: python scratch/mlbb-vision/calibrate2.py
"""
import os

os.environ.setdefault("USE_TF", "0")

import json
from pathlib import Path

import server

HERE = Path(__file__).resolve().parent

# Ground truth transcribed from samples/scoreboard.png
TRUTH_RESULT = "win"
TRUTH_OUR_KDA = [(3, 2, 19), (14, 3, 6), (2, 5, 16), (2, 2, 14), (8, 3, 11)]
TRUTH_ENEMY_KDA = [(2, 6, 3), (1, 5, 8), (3, 5, 5), (3, 5, 2), (6, 8, 1)]
# Heroes verified visually against crops/final/hero_*.png + public/heroes templates
TRUTH_OUR_HEROES = ["Belerick", "Lukas", "Zetian", "Alice", "Irithel"]
TRUTH_ENEMY_HEROES = ["Minsitthar", "Grock", "Fredrinn", "Karrie", "Gusion"]


def main():
    server.get_state()

    draft = server.load_canvas((HERE / "samples" / "draft.png").read_bytes())
    print("=== DRAFT (real) ===")
    print(json.dumps(server.app and {
        "bans": [server.match_hero_template(server.crop_norm(draft, b)) for b in server.DRAFT_CFG["our_bans"]],
        "enemyBans": [server.match_hero_template(server.crop_norm(draft, b)) for b in server.DRAFT_CFG["enemy_bans"]],
    }, indent=2))

    score = server.load_canvas((HERE / "samples" / "scoreboard.png").read_bytes())
    print("\n=== SCOREBOARD (real) ===")
    players = [None] * 5
    enemy = [None] * 5
    for side, i, hero_box, kda_box in server.scoreboard_boxes():
        hero = server.match_hero(server.crop_norm(score, hero_box))
        k, d, a = server.read_kda(server.crop_norm(score, kda_box), side)
        (players if side == "our" else enemy)[i] = {"hero": hero, "kills": k, "deaths": d, "assists": a}
    result = server.detect_result(score)
    print(json.dumps({"result": result, "players": players, "enemyPlayers": enemy}, indent=2))

    kda_ok = 0
    for p, t in zip(players, TRUTH_OUR_KDA):
        ok = (p["kills"], p["deaths"], p["assists"]) == t
        kda_ok += ok
        if not ok:
            print(f"  OUR KDA MISS: got {(p['kills'], p['deaths'], p['assists'])} want {t}")
    for p, t in zip(enemy, TRUTH_ENEMY_KDA):
        ok = (p["kills"], p["deaths"], p["assists"]) == t
        kda_ok += ok
        if not ok:
            print(f"  ENEMY KDA MISS: got {(p['kills'], p['deaths'], p['assists'])} want {t}")
    hero_ok = 0
    for p, t in zip(players, TRUTH_OUR_HEROES):
        hero_ok += p["hero"] == t
        if p["hero"] != t:
            print(f"  OUR HERO MISS: got {p['hero']} want {t}")
    for p, t in zip(enemy, TRUTH_ENEMY_HEROES):
        hero_ok += p["hero"] == t
        if p["hero"] != t:
            print(f"  ENEMY HERO MISS: got {p['hero']} want {t}")

    print(f"\nresult: {result} (want {TRUTH_RESULT}) -> {'OK' if result == TRUTH_RESULT else 'MISS'}")
    print(f"hero accuracy: {hero_ok}/10")
    print(f"KDA accuracy: {kda_ok}/10")


if __name__ == "__main__":
    main()
