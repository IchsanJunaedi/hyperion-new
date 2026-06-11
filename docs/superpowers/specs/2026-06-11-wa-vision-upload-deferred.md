# WA Vision Upload — Finish Scrim via WhatsApp (DEFERRED)

> **Status: DEFERRED — jangan dibangun dulu.**
> Blocker utama: butuh biaya hosting (VPS) untuk vision server. Tanpa itu fitur
> hanya jalan di dev lokal. Dokumen ini menyimpan desain supaya tidak hilang.

## Ide

Saat scrim selesai, coach/manager dapat pesan WA otomatis: *"Scrim vs X selesai?
Kirim screenshot draft + result untuk Game 1."* Mereka balas dengan foto draft
dan foto scoreboard per game lewat WA. Sistem parse gambar pakai vision server
lokal (bukan Gemini), simpan hasilnya ke tabel scrim seperti flow Finish Scrim
di web, lalu balas ringkasan untuk konfirmasi.

## Building block yang SUDAH ada

| Komponen | Lokasi | Status |
|----------|--------|--------|
| Webhook Fonnte masuk (verifikasi secret, match nomor → profile → membership) | `app/api/wa/webhook/route.ts` | Live (dipakai RSVP scrim) |
| Vision server (OpenCV Hough + template match + CLIP fallback + EasyOCR) | `scratch/mlbb-vision/server.py` (FastAPI, port 8000) | Jalan lokal, validated 10/10 screenshot asli |
| Caller vision dari Next.js (`MLBB_VISION_URL`, base64 POST `/analyze-draft` / `/analyze-scoreboard`) | `features/scrim/actions/analyzeScreenshotAction.ts` | Live (Finish Scrim web) |
| Save path hasil parse → `scrim_draft_bans` / `scrim_draft_picks` / `scrim_game_results` / `scrim_results` | flow Finish Scrim existing | Live |
| Cron WA (edge function + pg_cron) | `supabase/functions/process-wa-queue` + `wa_queue_cron` | Live |
| Kirim WA keluar | `lib/utils/fonnte.ts` (`sendWaMessage`) | Live |

Fonnte webhook masuk menyertakan field `url` untuk pesan bergambar — tinggal
download bytes dari URL itu.

## Yang perlu DIBANGUN (kalau jadi)

1. **Trigger "scrim selesai".** Scrim tidak punya jam selesai — `scheduled_at`
   cuma jam mulai. Cron cek scrim status `scheduled` yang `scheduled_at` lewat
   ~2-3 jam → kirim WA prompt upload ke coach/manager.

2. **Tabel `wa_upload_sessions`** — state machine percakapan (webhook stateless):
   `phone`, `scrim_id`, `expected_step` (`draft_g1` → `scoreboard_g1` →
   `draft_g2` → ...), `expires_at`. Tanpa ini sistem tidak tahu gambar masuk itu
   draft game berapa.

3. **Handler gambar di webhook.** Branch baru: ada `url` + session aktif →
   download gambar → POST ke vision server → simpan → balas ringkasan:
   *"Game 1: WIN 18-9. Ban: ... Balas 1 kalau benar, 2 untuk ulang."*
   Konfirmasi WAJIB — pengganti step review/edit yang ada di web.
   Koreksi parsial (1 hero salah baca) susah via WA → fallback balas link ke
   halaman Finish Scrim untuk edit manual.

4. **Pola async di webhook.** EasyOCR di CPU bisa 10-30 detik per scoreboard;
   webhook Fonnte tidak boleh nunggu. Terima gambar → balas 200 langsung →
   proses background → kirim hasil via `sendWaMessage` kedua.

5. **Refactor kecil**: logic parse+save di `analyzeScreenshotAction` harus bisa
   dipanggil tanpa user session (webhook pakai admin client, identitas dari
   nomor WA).

## Blocker / Risiko

- **💰 Hosting vision server (alasan defer).** Produksi (hyperionteam.id) tidak
  bisa akses `127.0.0.1:8000`. Opsi:
  - VPS murah (CPU cukup, CLIP + EasyOCR tidak butuh GPU) — paling bersih, bayar.
  - Tunnel cloudflared/ngrok dari PC lokal — gratis tapi PC harus selalu nyala.
- **Kompresi WA.** WA recompress JPEG + downscale. Template matching
  (`tmpl_min=0.62`) dan HoughCircles bisa turun akurasi. `load_canvas` sudah
  resize ke 1920 preserve-aspect jadi kemungkinan masih oke, tapi WAJIB
  validasi ulang dengan gambar yang benar-benar lewat WA; threshold mungkin
  perlu diturunkan.
- **Cold start** vision server (load CLIP + EasyOCR) lambat — perlu warm-up
  (`get_state()` sudah dipanggil saat boot, aman selama server long-running).

## Estimasi (kalau jadi dibangun)

1 migration (`wa_upload_sessions`) + ekstensi webhook (handler gambar + state
machine + async) + 1 cron job trigger + refactor vision action tanpa session +
validasi ulang akurasi gambar WA. Plus setup VPS/tunnel.
