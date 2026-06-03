# `createAchievement` menyisipkan string kosong ke `organization_id` (UUID NOT NULL) → pembuatan achievement dari admin selalu gagal

**Labels:** `bug`, `correctness`, `admin`, `database`
**Priority:** 🔴 High (fitur rusak total)
**Status:** Belum dikerjakan

## Summary
Server action `createAchievement` melakukan fallback `organization_id: data.organization_id ?? ""`. Kolom `achievements.organization_id` adalah `UUID NOT NULL REFERENCES organizations(id)`. Karena form admin **tidak pernah mengirim** `organization_id`, nilai yang di-insert selalu `""`, yang membuat Postgres menolak dengan `invalid input syntax for type uuid: ""`. Akibatnya **menambah achievement lewat panel admin selalu error**.

## Location
- `features/admin/actions.ts:292-295` (`createAchievement`)
  ```ts
  const { error } = await admin.from("achievements").insert({
    ...data,
    organization_id: data.organization_id ?? "",   // ← "" untuk kolom uuid NOT NULL
  });
  ```
- Schema: `supabase/migrations/20260510000001_init_schema.sql:308-319`
  ```sql
  CREATE TABLE achievements (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    ...
  );
  ```
- Form/Client yang memanggil: `features/admin/components/AchievementForm.tsx`, `features/admin/components/AchievementsAdminClient.tsx` — **tidak ada** referensi `organization_id` / pemilihan organisasi sama sekali.

## Evidence
- Grep `organization_id|organizations|orgId|org_id` di `AchievementForm.tsx` dan `AchievementsAdminClient.tsx`: **0 match**. Jadi `data.organization_id` selalu `undefined`.
- `?? ""` mengubah `undefined` menjadi `""` → bukan UUID valid → insert gagal pada kolom NOT NULL.

## Impact
- Achievement baru tidak bisa dibuat dari admin panel sama sekali.
- Error muncul sebagai `{ ok: false, message: <postgres error> }` ke user (atau silent kalau UI tidak menampilkan message).

## Proposed Fix (pilih sesuai desain produk)
Pertanyaan desain: apakah achievement bersifat **global situs** atau **milik organisasi tertentu**?

1. **Jika global / site-wide:** ubah skema agar `organization_id` NULLABLE (migration `ALTER COLUMN organization_id DROP NOT NULL`), lalu kirim `null` bukan `""`:
   ```ts
   organization_id: data.organization_id ?? null,
   ```
2. **Jika harus milik org:** tambahkan pemilih organisasi di `AchievementForm`, kirim `organization_id` valid, dan hapus fallback `?? ""`. Validasi `organization_id` wajib ada di action.

> Catatan: query baca `getAchievements` saat ini menampilkan semua achievement lintas org via admin client — perlu diselaraskan dengan keputusan di atas.

## Acceptance Criteria
- [ ] Membuat achievement dari `/admin/achievements` berhasil (`{ ok: true }`) dan baris tersimpan.
- [ ] Tidak ada lagi insert `""` ke kolom UUID.
- [ ] Keputusan global vs per-org didokumentasikan; skema & action konsisten.
- [ ] (Jika nullable) migration baru di `supabase/migrations/` dengan timestamp prefix.
