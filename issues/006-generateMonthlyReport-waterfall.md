# `generateMonthlyReport` ~7 round-trip serial (waterfall) — M3 / B2-9

**Labels:** `performance`, `reports`, `backlog`
**Priority:** 🟢 Low (halaman reports belum publik)
**Status:** Belum dikerjakan (carry-over dari progress.md)

## Summary
`generateMonthlyReport` masih melakukan ~7 round-trip database secara serial (waterfall). Sebagian step trend sudah diparalelkan, sisanya belum. Tercatat di `progress.md` sebagai **M3** dan **B2-9**. Karena halaman reports belum dipublik (lihat "Dead Features"), prioritas rendah — tapi tetap dicatat agar tidak hilang.

## Location
- `features/reports/queries.ts` (fungsi `generateMonthlyReport`, sekitar baris query serial)

## Evidence (dari progress.md)
- `### B2-9: Waterfall di generateMonthlyReport` — "masih ~7 serial round-trips (step trend sudah parallel, sisanya belum)".
- `### Medium Priority — M3` — "`generateMonthlyReport` masih ~7 serial round-trips ... reports page not public yet, defer".

## Impact
- Generasi report lambat (latency menumpuk linear).
- Tidak berdampak ke user sekarang karena fitur belum aktif.

## Proposed Fix
- Gabungkan query independen ke dalam `Promise.all([...])`.
- Identifikasi mana yang benar-benar bergantung (mis. butuh `orgId`/`memberIds` dari step sebelumnya) dan hanya itu yang tetap serial.
- Pastikan tetap patuh Query Rules (`.limit()`, kolom eksplisit, error handling).

## Acceptance Criteria
- [ ] Query independen dijalankan paralel (`Promise.all`).
- [ ] Jumlah round-trip serial berkurang signifikan dari ~7.
- [ ] Output report tidak berubah (regression check manual).
- [ ] `progress.md` (B2-9 / M3) di-update setelah selesai.

> Rekomendasi: kerjakan **bersamaan** dengan aktivasi halaman reports (kalau memang mau dipublikkan), bukan sebagai pekerjaan terpisah.
