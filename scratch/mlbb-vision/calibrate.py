"""Calibration tool: detect real avatar circle positions in samples/ and dump crops.

Run: python scratch/mlbb-vision/calibrate.py

- Loads samples/draft.png + samples/scoreboard.png.
- Detection runs on an aspect-preserving canvas (W=1920) so circles stay circular;
  output coordinates are NORMALIZED (x, y, w, h fractions), which apply identically
  to the stretched 1920x1080 server canvas.
- Dumps crops to crops/ and overlay images showing detected circles.
"""
import os

os.environ.setdefault("USE_TF", "0")

import json
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent
SAMPLES = HERE / "samples"
CROPS = HERE / "crops"
CROPS.mkdir(exist_ok=True)

W = 1920


def load_aspect(path):
    pil = Image.open(path).convert("RGB")
    bgr = cv2.cvtColor(np.array(pil), cv2.COLOR_RGB2BGR)
    h = round(bgr.shape[0] * W / bgr.shape[1])
    return cv2.resize(bgr, (W, h), interpolation=cv2.INTER_CUBIC)


def crop_norm(img, box):
    x, y, w, h = box
    H, Wd = img.shape[:2]
    x0, y0 = int(x * Wd), int(y * H)
    return img[y0:y0 + int(h * H), x0:x0 + int(w * Wd)]


def save(name, img):
    cv2.imwrite(str(CROPS / name), img)


def detect_circles(img, y_band, x_band, rmin, rmax, param2=28):
    """HoughCircles within normalized bands; returns list of (cx, cy, r) in pixels."""
    H = img.shape[0]
    y0, y1 = int(y_band[0] * H), int(y_band[1] * H)
    x0, x1 = int(x_band[0] * W), int(x_band[1] * W)
    roi = img[y0:y1, x0:x1]
    gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
    gray = cv2.medianBlur(gray, 5)
    circles = cv2.HoughCircles(gray, cv2.HOUGH_GRADIENT, dp=1.2, minDist=rmin * 2,
                               param1=120, param2=param2, minRadius=rmin, maxRadius=rmax)
    out = []
    if circles is not None:
        for cx, cy, r in circles[0]:
            out.append((float(cx) + x0, float(cy) + y0, float(r)))
    return out


def norm_box_from_circle(cx, cy, r, H, shrink=0.92):
    rr = r * shrink
    return (round((cx - rr) / W, 4), round((cy - rr) / H, 4),
            round(2 * rr / W, 4), round(2 * rr / H, 4))


def annotate(img, circles, name):
    vis = img.copy()
    for cx, cy, r in circles:
        cv2.circle(vis, (int(cx), int(cy)), int(r), (0, 255, 0), 2)
        cv2.circle(vis, (int(cx), int(cy)), 2, (0, 0, 255), 3)
    save(name, vis)


# ── DRAFT ────────────────────────────────────────────────────────────────────

def calibrate_draft():
    img = load_aspect(SAMPLES / "draft.png")
    H = img.shape[0]
    print(f"draft canvas: {W}x{H}")
    # ban icons live in the top strip; search generously
    circ = detect_circles(img, (0.0, 0.14), (0.0, 1.0), rmin=18, rmax=45, param2=24)
    circ = sorted(circ, key=lambda c: c[0])
    print(f"draft: {len(circ)} circles in top strip")
    for c in circ:
        print(f"  cx={c[0]:.0f} cy={c[1]:.0f} r={c[2]:.0f} -> norm {norm_box_from_circle(*c, H)}")
    annotate(img, circ, "draft_overlay.png")
    # dump individual crops
    for i, c in enumerate(circ):
        box = norm_box_from_circle(*c, H)
        save(f"draft_ban_{i:02d}.png", crop_norm(img, box))
    return img, H, circ


# ── SCOREBOARD ───────────────────────────────────────────────────────────────

def calibrate_scoreboard():
    img = load_aspect(SAMPLES / "scoreboard.png")
    H = img.shape[0]
    print(f"\nscoreboard canvas: {W}x{H}")
    # our hero avatars: left column; enemy: right column
    left = detect_circles(img, (0.15, 1.0), (0.08, 0.22), rmin=25, rmax=55, param2=26)
    right = detect_circles(img, (0.15, 1.0), (0.78, 0.95), rmin=25, rmax=55, param2=26)
    left = sorted(left, key=lambda c: c[1])
    right = sorted(right, key=lambda c: c[1])
    print(f"our avatars: {len(left)}, enemy avatars: {len(right)}")
    for label, group in (("our", left), ("enemy", right)):
        for c in group:
            print(f"  {label}: cx={c[0]:.0f} cy={c[1]:.0f} r={c[2]:.0f} -> norm {norm_box_from_circle(*c, H)}")
    annotate(img, left + right, "scoreboard_overlay.png")
    for i, c in enumerate(left):
        save(f"score_our_hero_{i}.png", crop_norm(img, norm_box_from_circle(*c, H)))
    for i, c in enumerate(right):
        save(f"score_enemy_hero_{i}.png", crop_norm(img, norm_box_from_circle(*c, H)))

    # banner crop with current server coords for reference
    save("score_banner.png", crop_norm(img, (0.330, 0.010, 0.340, 0.150)))

    # stat strips: dump wide strips per row for OCR coordinate search
    if len(left) == 5:
        for i, (cx, cy, r) in enumerate(left):
            y0 = (cy - r) / H
            hh = 2 * r / H
            save(f"score_our_stats_{i}.png", crop_norm(img, (0.27, y0, 0.20, hh)))
    if len(right) == 5:
        for i, (cx, cy, r) in enumerate(right):
            y0 = (cy - r) / H
            hh = 2 * r / H
            save(f"score_enemy_stats_{i}.png", crop_norm(img, (0.56, y0, 0.20, hh)))
    return img, H, left, right


# ── KDA OCR SEARCH ───────────────────────────────────────────────────────────

def kda_search(img, H, rows, x_candidates, label):
    """Try OCR windows around each row; report which (x, w) window reads 3+ ints."""
    import easyocr
    reader = easyocr.Reader(["en"], gpu=False, verbose=False)
    results = {}
    for xc, wc in x_candidates:
        ok_rows = 0
        sample = []
        for cx, cy, r in rows:
            y0 = max((cy - r * 1.1) / H, 0)
            hh = 2.2 * r / H
            crop = crop_norm(img, (xc, y0, wc, hh))
            big = cv2.resize(crop, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
            toks = reader.readtext(big, detail=1, allowlist="0123456789/. ")
            nums = []
            for box, txt, conf in sorted(toks, key=lambda t: t[0][0][0]):
                for piece in txt.replace("/", " ").split():
                    if piece.isdigit():
                        nums.append(int(piece))
            if len(nums) >= 3:
                ok_rows += 1
            sample.append(nums)
        results[(xc, wc)] = (ok_rows, sample)
        print(f"  {label} window x={xc} w={wc}: rows_ok={ok_rows} sample={sample}")
    return results


if __name__ == "__main__":
    dimg, dH, dcirc = calibrate_draft()
    simg, sH, left, right = calibrate_scoreboard()
    if len(left) == 5 and len(right) == 5:
        print("\nKDA OCR search (our side):")
        kda_search(simg, sH, left, [(0.29, 0.10), (0.30, 0.09), (0.295, 0.085), (0.30, 0.12)], "our")
        print("KDA OCR search (enemy side):")
        kda_search(simg, sH, right, [(0.60, 0.10), (0.61, 0.09), (0.615, 0.085), (0.59, 0.12)], "enemy")
    print("\ncrops written to", CROPS)
