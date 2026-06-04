# `.single()` dipakai luas alih-alih `.maybeSingle()` — risiko throw PGRST116 tak tertangani

**Labels:** `correctness`, `robustness`, `query-rules`
**Priority:** 🟠 Medium
**Status:** Belum dikerjakan

## Summary
CLAUDE.md Query Rule #4: *"jangan pernah pakai `.single()` kecuali yakin 100% row selalu ada. Kalau error bisa terjadi, pakai `.maybeSingle()` + cek error."* Audit menemukan **±80 pemakaian `.single()`** di codebase. `.single()` melempar error (PGRST116) saat 0 baris atau >1 baris — kalau tidak ditangani, bisa jadi exception tak terduga atau pesan error membingungkan.

## Location (ringkas — daftar penuh via grep `\.single\(\)`)
Konsentrasi terbesar:
- `features/calendar/permission-*.ts` & `lib/permissions/calendar-access.ts` — puluhan `.single()`
- `features/scrim/actions.ts:84, 424`, `features/scrim/actions/vodLinkAction.ts:22, 34`, `vodTimestampsAction.ts:67`
- `features/sponsors/actions.ts:71, 144, 196`
- `features/trials/actions.ts:161` (`updateApplicantStatusAction` — `.single()` setelah update)
- `features/dashboard/actions.ts:232, 738`
- `features/announcements/actions.ts:72`, `features/strategy/actions.ts:68, 171`
- `features/meta/actions.ts:49, 101`, `features/tournaments/actions.ts:68`
- `features/files/actions.ts:53`, `features/player-development/actions.ts:57`
- `features/calendar/actions.ts:98, 256`
- `app/onboarding/organization/actions.ts:116`
- dst.

## Impact
- Insert/update yang `.select().single()` setelahnya akan throw bila row tak terbentuk (mis. ke-blok RLS, race) → user dapat error mentah.
- Query baca pakai `.single()` untuk row yang mungkin tidak ada → exception alih-alih `null` yang bisa ditangani.

## Proposed Fix
- Untuk **baca** row yang mungkin tidak ada: ganti ke `.maybeSingle()` + cek `error`/`data`.
- Untuk **insert/update + return**: boleh tetap `.single()` **hanya jika** error sudah ditangani (`if (error) return { ok:false, ... }`) dan secara logika baris pasti ada. Kalau ragu → `.maybeSingle()`.
- Prioritaskan path yang berasal dari input user / RLS-sensitive (calendar permissions, public actions).

> Saran eksekusi: kerjakan **per-modul** (calendar permissions dulu karena terpadat), bukan sekali ganti semua, agar mudah di-review dan dites.

## Acceptance Criteria
- [ ] `.single()` pada query baca yang bisa 0-row diganti `.maybeSingle()` + handling.
- [ ] `.single()` yang tersisa dipastikan punya error handling dan baris dijamin ada.
- [ ] Tidak ada regresi test (`npm run test:unit`).
