# `listApplicants()` tanpa `.limit()` — query unbounded di tabel yang tumbuh

**Labels:** `performance`, `query-rules`, `trials`
**Priority:** 🟠 Medium
**Status:** Belum dikerjakan

## Summary
`listApplicants()` mengambil seluruh baris `trial_applicants` untuk sebuah trial tanpa `.limit()`. Tabel ini diisi oleh **form publik** (`registerApplicantAction`) sehingga bisa tumbuh besar (open trial populer → ratusan/ribuan pendaftar). Ini melanggar CLAUDE.md Query Rule #1 ("Selalu `.limit()`").

## Location
- `features/trials/queries.ts:97-105`
  ```ts
  export async function listApplicants(trialId: string): Promise<ApplicantRow[]> {
    const admin = createAdminClient();
    const { data } = await admin
      .from("trial_applicants")
      .select("*")                       // ← juga select("*") (lihat issue 004)
      .eq("trial_id", trialId)
      .order("created_at", { ascending: false });
    return (data as ApplicantRow[]) ?? [];
  }
  ```

## Issues di fungsi ini
1. **Tidak ada `.limit()`** → unbounded.
2. **`select("*")`** → transfer semua kolom termasuk yang berat (hero_pool, competitive_exp, dll) walau tidak semuanya dipakai di list.
3. **Tidak ada error handling** → `{ data }` di-destructure tanpa `error`; kalau query gagal, balik `[]` diam-diam (langgar Query Rule #5).

## Impact
- Halaman manage trials bisa lambat / berat saat applicant banyak.
- Error query tertelan tanpa log.

## Proposed Fix
```ts
export async function listApplicants(trialId: string): Promise<ApplicantRow[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("trial_applicants")
    .select("id, trial_id, name, ign, phone, email, role_applied, rank, server, main_game, secondary_game, is_free_agent, age, social_media, city, game_id, game_nickname, win_rate, hero_pool, competitive_exp, screenshot_url, cv_url, status, notes, created_at")
    .eq("trial_id", trialId)
    .order("created_at", { ascending: false })
    .limit(200);                          // applicants per trial
  if (error) console.error("listApplicants:", error);
  return (data as ApplicantRow[]) ?? [];
}
```
> Jika perlu lihat >200 applicant, tambahkan paginasi (offset/range) daripada menaikkan limit tanpa batas.

## Acceptance Criteria
- [ ] `listApplicants` punya `.limit()` (default 200 atau paginasi).
- [ ] Kolom eksplisit, bukan `select("*")`.
- [ ] `error` dicek + `console.error`.
