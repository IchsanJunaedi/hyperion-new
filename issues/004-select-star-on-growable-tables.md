# `select("*")` masih dipakai di list view tabel yang tumbuh (B2-2 belum tuntas)

**Labels:** `performance`, `query-rules`
**Priority:** 🟠 Medium
**Status:** Belum dikerjakan

## Summary
`progress.md` menandai **B2-2 ("Ganti `select("*")` dengan kolom spesifik") ✅ Done**, tetapi audit menemukan `select("*")` masih dipakai luas di query list dari tabel yang bisa tumbuh. Ini melanggar CLAUDE.md Query Rule #2 ("Jangan `select("*")`") dan menambah transfer kolom yang tidak perlu (termasuk kolom berat seperti `body`, `description`, JSONB).

## Location (query list / feature queries — bukan detail page)
- `features/tournaments/queries.ts:37, 53, 61, 80`
- `features/announcements/queries.ts:22, 45`
- `features/scrim/queries.ts:51` (list scrims), `124, 131, 134, 306`
- `features/meta/queries.ts:15, 25, 32, 56, 65, 74`
- `features/content/queries.ts:14, 44`
- `features/teams/queries.ts:41, 98, 107, 115, 124, 131, 188`
- `features/polls/queries.ts:24, 34, 35`
- `features/trials/queries.ts:54, 101` (lihat juga issue 002)
- `features/calendar/permission-queries.ts:141, 208, 233, 318` (+ permission-*-actions.ts)
- `features/matchmaking/queries.ts:23, 41` (fitur archived — boleh di-skip)
- `features/scouting/queries.ts:15, 32, 46` (fitur archived — boleh di-skip)

> Pengecualian sah menurut CLAUDE.md: tabel kecil yang dipakai di **detail page** (bukan list). `features/admin/queries.ts` (gallery/partners/testimonials/divisions_public/site_settings) tabel kecil admin-managed → prioritas rendah, boleh ditunda.

## Impact
- Bandwidth & memori berlebih pada list view besar.
- Risiko membawa kolom besar yang tidak dirender.
- Inkonsistensi dengan klaim B2-2 di progress.md.

## Proposed Fix
- Audit tiap query list, ganti `select("*")` dengan daftar kolom eksplisit yang benar-benar dipakai komponen.
- Untuk yang butuh tipe penuh (mis. `body` di announcements/scrim) — pertahankan kolom itu tapi tetap eksplisit.
- Skip fitur archived (matchmaking, scouting) — atau hapus query mati sekalian (issue terpisah).
- Perbarui `progress.md` B2-2 agar mencerminkan status sebenarnya setelah selesai.

## Acceptance Criteria
- [ ] Semua query **list** di tabel non-archived pakai kolom eksplisit.
- [ ] Tidak ada regresi (kolom yang dipakai UI tetap ikut di-select).
- [ ] `npm run typecheck` lulus.
- [ ] `progress.md` B2-2 di-update sesuai kondisi nyata.
