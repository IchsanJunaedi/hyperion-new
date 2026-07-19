# Test Coverage 10% — Design Spec

**Date:** 2026-05-18  
**Goal:** Naik dari 0.38% → 10% code coverage (28 → ~726 baris tercovered dari 7264)  
**Strategi:** Quality-first — hanya tulis test untuk logika bisnis yang benar-benar penting

---

## Konteks

### State Coverage Sekarang
| Folder     | Tracked | Covered | Coverage |
|------------|---------|---------|----------|
| `features/`| 6,463   | 28      | 0.43%    |
| `lib/`     | 801     | 0       | 0.00%    |
| **Total**  | **7,264** | **28** | **0.38%** |

28 baris yang sudah covered semuanya berasal dari `features/finances/__tests__/queries.test.ts`.

### Setup yang Sudah Ada
- **Vitest** sudah dikonfigurasi di `vitest.config.ts` (jsdom + v8 coverage)
- **Global mocks** di `__tests__/setup.ts`: Next.js navigation, Supabase server/client/admin
- **Stub** `server-only` sudah ada di `__tests__/stubs/`
- **Satu test file** berjalan: `features/finances/__tests__/queries.test.ts`

Target 10% = **726 baris** tercovered → perlu tambah **698 baris**.

---

## Keputusan Desain

### Apa yang TIDAK di-test
- Komponen React (memerlukan heavy mocking, low ROI)
- Server actions yang hanya memanggil Supabase (logic-nya di DB layer)
- API routes (memerlukan full HTTP mock)
- Supabase client wrappers (third-party, bukan logika kita)
- `lib/supabase/`, `lib/actions/`, `lib/api/` — mostly wiring code

### Apa yang DI-test (prioritas)
Pure functions dan schema validations yang kalau bug langsung affect users:
1. **`lib/utils/`** — transformasi string & nomor WA (kirim WA salah = tidak terkirim)
2. **`lib/validations/`** — Zod boundary conditions (validasi input user)
3. **`lib/permissions/`** — calendar access rules (siapa bisa lihat apa)
4. **`features/finances/`** — expand existing test
5. **`features/scrim/`** — logika query scrim (terbesar di features)

---

## Rencana Wave-by-Wave

### Wave 1 — `lib/utils/` (estimasi: ~160 baris tercovered)

Semua file di lib/utils adalah pure functions, zero Supabase deps.

#### `lib/utils/__tests__/slug.test.ts`
- `slugify()`: normal string, string dengan diacritics, spasi, underscore, uppercase, karakter aneh, string kosong, string yang sudah slug
- `isValidSlug()`: valid slugs (3 char, 32 char), invalid (terlalu pendek, terlalu panjang, diawali dash, diakhiri dash, uppercase)

#### `lib/utils/__tests__/format.test.ts`  
- `normalizeWaNumber()`: format `08xx` → `628xx`, format `628xx` → tetap, format `8xx` → `628xx`, nomor internasional lain, ada non-digit characters
- `formatDateTime()`: input Date object, input ISO string — verifikasi format output `d MMM yyyy · HH.mm`
- `formatScrimSchedule()`: hari ini → "Hari ini · HH.mm", besok → "Besok · HH.mm", lusa → "d MMM · HH.mm"

#### `lib/utils/__tests__/wa-templates.test.ts`
- `buildScrimWaMessage()`: minimal data (tanpa optional fields), all fields terisi, verifikasi struktur message
- `buildTournamentWaMessage()`: minimal data, all fields, verifikasi optional fields tidak muncul kalau null

---

### Wave 2 — `lib/validations/` (estimasi: ~300 baris tercovered)

Zod schemas: test happy path + boundary conditions yang penting.

#### `lib/validations/__tests__/shared.test.ts`
- `waNumberSchema`: 
  - `+6281234567890` → `"6281234567890"` (strip +)
  - `081234567890` → `"6281234567890"` (0 → 62)
  - `81234567890` → `"6281234567890"` (8 → 62)
  - `6281234567890` → tetap
  - string terlalu pendek → error
  - karakter invalid (huruf) → error
- `passwordSchema`:
  - valid password dengan uppercase + angka + special char
  - tanpa uppercase → error
  - tanpa angka → error
  - tanpa special char → error
  - kurang dari 8 char → error
- `emailSchema`: valid email, tanpa @, diubah ke lowercase
- `slugSchema`: valid, terlalu pendek, diawali dash, uppercase

#### `lib/validations/__tests__/finance.test.ts`
- `createFinanceSchema`:
  - valid income entry
  - amount 0 → error (must be positive)
  - amount negatif → error
  - amount float → error (must be int)
  - tanpa category → error
  - tanggal tidak valid (string "bukan-tanggal") → error

#### `lib/validations/__tests__/scrim.test.ts`
- `matchFormatSchema`: semua valid values (bo1..bo7, 4match), nilai invalid → error
- `createScrimSchema`:
  - valid minimal input
  - opponent_name kosong → error
  - opponent_name > 120 char → error
  - scheduled_at bukan ISO valid → error
  - format invalid → error
  - optional fields (server_region, room_info, notes) → transform ke null kalau kosong
- `submitResultSchema`:
  - valid result
  - our_score > 5 → error
  - performance_rating 0 → error (min 1)
  - performance_rating 6 → error (max 5)
- `updateAttendanceSchema`: valid statuses, invalid status → error

#### `lib/validations/__tests__/calendar.test.ts`
- `eventTypeSchema`: semua valid types, "scrim" → error (bukan valid type)
- `createCalendarEventSchema`:
  - valid event dengan starts_at saja (ends_at opsional)
  - ends_at < starts_at → refine error "Waktu selesai tidak boleh sebelum waktu mulai"
  - ends_at = starts_at → valid
  - ends_at > starts_at → valid
  - ends_at null → valid
  - title kosong → error
  - title > 200 char → error
  - visibility levels semua valid values
- `updateCalendarEventSchema`:
  - partial update (hanya title)
  - starts_at + ends_at dimana ends_at < starts_at → error
  - starts_at tanpa ends_at → valid

---

### Wave 3 — `lib/permissions/` (estimasi: ~120 baris tercovered)

#### `lib/permissions/__tests__/calendar-rules.test.ts`
Focus pada fungsi-fungsi decision logic (bukan data matrix itu sendiri):
- Owner dapat semua permission di semua visibility level
- Member hanya bisa view di `all`, tidak bisa di `management` atau `coach_up`
- Coach bisa view di `coach_up` tapi tidak di `management`
- Manager bisa view di `management`
- Captain tidak bisa view di `management` atau `private` orang lain
- Permission `manage-calendar` hanya untuk owner/manager

Perlu baca `calendar-rules.ts` lebih lanjut saat implementasi untuk identify exported functions yang bisa langsung di-call.

---

### Wave 4 — `features/` Expansion (estimasi: ~150 baris tercovered)

#### `features/finances/__tests__/queries.test.ts` (expand yang sudah ada)
Tambahkan edge cases:
- Mixed income dan expense multiple entries
- Semua expense, tidak ada income (balance negatif)
- Amount sangat besar (overflow check)

#### `features/scrim/__tests__/queries.test.ts` (baru)
Baca `features/scrim/queries.ts` untuk identify fungsi pure yang bisa ditest tanpa DB.
Target: fungsi-fungsi yang melakukan transformasi/kalkulasi data scrim (win rate, format label, dll).

---

## Estimasi Coverage

| Wave | Target File(s) | Est. Lines Covered |
|------|---------------|-------------------|
| 1 | lib/utils (slug, format, wa-templates) | ~160 |
| 2 | lib/validations (shared, finance, scrim, calendar) | ~300 |
| 3 | lib/permissions (calendar-rules) | ~120 |
| 4 | features/finances + features/scrim | ~150 |
| **Existing** | features/finances/queries | 28 |
| **Total** | | **~758** |

**758 / 7264 = ~10.4%** ✓ (buffer untuk kalau beberapa estimasi meleset)

---

## Struktur File yang Akan Dibuat

```
lib/
  utils/
    __tests__/
      slug.test.ts          ← BARU
      format.test.ts        ← BARU
      wa-templates.test.ts  ← BARU
  validations/
    __tests__/
      shared.test.ts        ← BARU
      finance.test.ts       ← BARU
      scrim.test.ts         ← BARU
      calendar.test.ts      ← BARU
  permissions/
    __tests__/
      calendar-rules.test.ts ← BARU
features/
  finances/
    __tests__/
      queries.test.ts       ← EXPAND (sudah ada)
  scrim/
    __tests__/
      queries.test.ts       ← BARU
```

Total: **8 test files** (7 baru + 1 expanded)

---

## Konvensi Test

Ikuti pola yang sudah ada di `features/finances/__tests__/queries.test.ts`:
- `describe()` per fungsi/schema
- `it()` dengan bahasa deskriptif ("calculates X correctly", "rejects invalid Y")
- Untuk Zod: gunakan `.safeParse()` dan assert `success` / `error.issues`
- Untuk pure functions: langsung call dan assert return value
- Tidak perlu mock tambahan — setup global di `__tests__/setup.ts` sudah cukup

---

## Urutan Eksekusi

1. **Wave 1** dulu — quickest feedback, semua passing tanpa kompleksitas mock
2. **Wave 2** — validasi schemas paling banyak contribute ke coverage
3. **Wave 3** — perlu baca lebih dalam calendar-rules.ts sebelum mulai
4. **Wave 4** — expand + tambah scrim, yang ini paling bergantung pada struktur internal

Jalankan setelah setiap wave: `rtk vitest run --coverage` untuk monitor progress.
