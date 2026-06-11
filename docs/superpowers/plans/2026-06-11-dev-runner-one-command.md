# Dev Runner — Satu Command untuk Next.js + Vision Server

> **Untuk agent pelaksana:** plan kecil, 1 sesi selesai. Ikuti task berurutan.
> Platform: Windows 11, PowerShell. Repo: `E:\hyperion-new`.

**Goal:** Developer cape menjalankan dua terminal manual setiap dev session:
1. `npm run dev` (Next.js, port 3000)
2. `python scratch/mlbb-vision/server.py` (MLBB vision server FastAPI, port 8000)

Ganti dengan **satu command**: `npm run dev:all` — keduanya jalan, log ber-prefix
warna, Ctrl+C mematikan keduanya.

**Keputusan desain (sudah diputuskan — jangan ganti ke Docker):**
- Pakai package **`concurrently`** (devDependency). BUKAN Docker — Docker Desktop
  di Windows berat, image vision (torch + easyocr) 4-5GB, HMR Next.js lambat via
  bind mount. Docker baru relevan nanti saat vision server pindah VPS.
- `npm run dev` tetap ada dan tidak berubah (kadang mau Next.js saja tanpa
  vision — vision optional, fitur AI gracefully degrade kalau server mati).

---

## Konteks vision server

- File: `scratch/mlbb-vision/server.py` — FastAPI + uvicorn, bind `127.0.0.1:8000`.
- Dependencies: `scratch/mlbb-vision/requirements.txt` (opencv-python, easyocr,
  torch, sentence-transformers, fastapi, uvicorn, dll). Sudah terinstall di
  Python environment user — **JANGAN reinstall**, cukup deteksi interpreter mana
  yang punya package-nya (coba `python -c "import cv2, easyocr, fastapi"`;
  kalau gagal coba `py -3.10`). Catat hasilnya di script.
- Cold start lambat (load CLIP + EasyOCR saat boot via `get_state()`) — normal,
  jangan "diperbaiki".
- Next.js memanggilnya via `MLBB_VISION_URL` (default `http://127.0.0.1:8000`)
  di `features/scrim/actions/analyzeScreenshotAction.ts`.

---

## Task 1: Install concurrently

```powershell
npm install --save-dev concurrently
```

Expected: `package.json` devDependencies dapat `concurrently`.

## Task 2: Tambah scripts di package.json

Tambah ke `"scripts"` (JANGAN ubah script existing):

```json
"dev:vision": "python scratch/mlbb-vision/server.py",
"dev:all": "concurrently -n next,vision -c cyan,magenta --kill-others \"npm run dev\" \"npm run dev:vision\""
```

Catatan:
- Kalau Task 1 deteksi interpreter bukan `python` (mis. `py -3.10`), sesuaikan
  `dev:vision`.
- `--kill-others`: kalau salah satu mati/Ctrl+C, dua-duanya berhenti. Ini yang
  diinginkan untuk dev.
- `-n next,vision -c cyan,magenta`: prefix log berwarna biar kebedain.

## Task 3: Verifikasi

1. Jalankan `npm run dev:all`.
2. Tunggu sampai dua-duanya siap:
   - `[next]` print `Ready in ...`
   - `[vision]` print `[vision] ready — NNN hero templates` lalu uvicorn
     `Application startup complete`.
3. Cek health: `Invoke-RestMethod http://127.0.0.1:8000/` → harus
   `{ok: true, service: "mlbb-vision", ...}`.
4. Cek Next.js: buka `http://localhost:3000` → landing page load.
5. Ctrl+C sekali → DUA proses berhenti (cek `Get-Process | Where-Object {$_.ProcessName -match "node|python"}`
   tidak menyisakan proses dev yang orphan — proses python lain milik sistem boleh ada).

## Task 4: Dokumentasi

1. `progress.md` → bagian dev notes / how-to-run (kalau ada): catat
   `npm run dev:all` sebagai cara standar nyalakan dev lengkap.
2. `CLAUDE.md` JANGAN diubah kecuali ada section cara run dev.

## Task 5: Commit

Ikuti aturan repo (CLAUDE.md): pre-commit gate `npm run lint`,
`npm run typecheck`, `npm run test:unit:coverage` harus hijau (perubahan ini
hanya package.json scripts + devDependency — tidak menyentuh scope coverage,
harus tetap hijau). Commit pakai `rtk`:

```powershell
rtk git add package.json package-lock.json progress.md
rtk git commit -m "chore: add dev:all script to run next + vision server together"
rtk git push
```

---

## Out of scope (JANGAN dikerjakan di plan ini)

- Docker / docker-compose — ditolak, lihat keputusan desain di atas.
- Auto-restart vision server saat file berubah (uvicorn `--reload`) — server
  load model berat saat boot, reload tiap edit malah menyiksa. Restart manual OK.
- Hosting vision server publik / cloudflared tunnel — itu bagian dari fitur
  WA Vision Upload yang DEFERRED
  (`docs/superpowers/specs/2026-06-11-wa-vision-upload-deferred.md`).
- Windows service / startup otomatis saat boot OS.
