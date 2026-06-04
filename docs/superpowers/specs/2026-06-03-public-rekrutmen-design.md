# Public Rekrutmen Page — Design Spec
**Date:** 2026-06-03
**Status:** Approved

---

## Problem

Open trials yang dibuat manager di workspace tidak bisa ditemukan oleh outsider tanpa dikirim link manual. Tidak ada discovery surface publik.

## Goal

Halaman `/rekrutmen` publik yang otomatis menampilkan semua trial berstatus `active` dari semua org. Visitor bisa langsung klik "Daftar" → form pendaftaran yang sudah ada.

---

## Architecture

```
Manager set trial status = "active" di workspace
  ↓
getActivePublicTrials() query → open_trials WHERE status="active"
  ↓
/rekrutmen page → list semua trial aktif
  ↓
Tombol "Daftar" → /trial/[public_token] (form existing, tidak diubah)
  ↓
Pendaftar masuk ke kanban workspace (existing, tidak diubah)
```

---

## Data Flow

### Query baru — `features/trials/queries.ts`

```ts
export interface PublicTrial extends TrialRow {
  org_name: string;
  org_slug: string;
  org_logo_url: string | null;
}

export async function getActivePublicTrials(): Promise<PublicTrial[]>
  // SELECT open_trials.*, organizations(name, slug, logo_url)
  // WHERE status = "active"
  // ORDER BY created_at DESC
  // LIMIT 50
```

### Page — `app/rekrutmen/page.tsx`

- Server component, `export const dynamic = "force-dynamic"`
- `generateMetadata` → title "Rekrutmen Terbuka — Hyperion Team"
- Panggil `getActivePublicTrials()`
- Render Header + main + Footer (pola sama dengan `/divisions`)

### Layout tiap trial card

```
[Logo org atau initial]  [Nama Org]
[Judul Trial]
[Game badge]  [posisi 1]  [posisi 2]  ...
[Tombol "Daftar Sekarang" → /trial/[public_token]]
```

- Kalau `positions` kosong: tidak tampil badge posisi
- Kalau tidak ada trial aktif: empty state "Tidak ada rekrutmen terbuka saat ini. Pantau terus!"
- Dark theme: bg `#070707`, cards `#0D0D0D`, borders `#2D2D2D`

### Nav — `components/landing/HeaderClient.tsx`

Tambah `{ href: "/rekrutmen", label: "Rekrutmen" }` ke `NAV_LINKS` setelah "Division".

---

## Files

| File | Action |
|------|--------|
| `features/trials/queries.ts` | Edit — tambah `PublicTrial` interface + `getActivePublicTrials()` |
| `app/rekrutmen/page.tsx` | Create — public page |
| `components/landing/HeaderClient.tsx` | Edit — tambah nav link |

**Tidak ada migrasi DB.** `open_trials` table + `public_token` sudah ada.

---

## Error Handling

- Query error → console.error, return empty array → empty state ditampilkan
- `public_token` selalu ada (NOT NULL default, auto-generated di DB)
- Trial dengan status bukan "active" tidak muncul

## Out of Scope

- Filter by game / org
- Pagination (limit 50 cukup untuk MVP)
- Deadline / tanggal tutup per trial (kolom tidak ada di schema)
