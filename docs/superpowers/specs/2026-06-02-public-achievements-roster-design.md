# Public Achievements & Roster — Design Spec
**Date:** 2026-06-02  
**Status:** Approved

---

## Problem

Backend data (tournament results, team rosters) tidak otomatis tercermin di frontend publik. Admin harus entry manual di gallery untuk menampilkan prestasi. Halaman divisi tidak menampilkan roster player. Tidak ada profil publik untuk player.

## Goals

1. Tournament selesai dengan podium → achievement muncul otomatis di admin & landing page
2. Admin bisa tambah gambar/poster ke achievement (opsional)
3. `/divisions` menampilkan roster tim dan player yang bisa diklik
4. Player punya profil publik dengan daftar prestasi

---

## Architecture Overview

```
[completeTournamentAction]
  placement ≤ 3 → INSERT achievements table

[/admin/(panel)/achievements]
  CRUD achievements (auto + manual)
  Upload image_url (poster, opsional)

[Landing Page — AchievementsSection]
  Reads from achievements table (bukan gallery_entries)
  gallery_entries TETAP untuk hero slider

[/divisions/[slug]]
  Card tim + preview 3 player
  Clickable → /divisions/[slug]/[org-slug]

[/divisions/[slug]/[org-slug]]
  Full roster + achievement tim

[/players/[username]]
  Profil publik: foto, nama, achievement list
```

---

## Section 1: Achievement Auto-Sync

### Trigger

Di `features/tournaments/actions.ts` → `completeTournamentAction`, setelah `tournament_results` upsert berhasil dan `org` ditemukan:

```ts
if (data.placement && data.placement <= 3) {
  const { data: tournamentRow } = await admin
    .from("tournaments")
    .select("name, division_id, end_date")
    .eq("id", tournamentId)
    .maybeSingle();

  if (tournamentRow) {
    await admin.from("achievements").insert({
      title: `Juara ${data.placement} — ${tournamentRow.name}`,
      organization_id: org.id,
      division_id: tournamentRow.division_id,
      tournament_id: tournamentId,
      placement: data.placement,
      achieved_at: tournamentRow.end_date ?? new Date().toISOString().slice(0, 10),
      image_url: null,
    });
  }
}
```

**Idempotency**: Tidak ada `upsert` — jika admin memanggil complete dua kali, akan ada duplikat. Mitigasi: di admin panel, achievement duplikat bisa dihapus manual. (Tidak perlu over-engineer untuk edge case ini.)

---

## Section 2: Admin Achievement Management

### Queries — `features/admin/queries.ts`

```ts
export type Achievement = Database["public"]["Tables"]["achievements"]["Row"];

export async function getAchievements(): Promise<Achievement[]>
  // SELECT * FROM achievements ORDER BY achieved_at DESC LIMIT 50

export async function getPublicAchievements(): Promise<Achievement[]>
  // Same query — semua achievements adalah public
```

### Actions — `features/admin/actions.ts`

```ts
createAchievement(data: {
  title: string;
  description?: string | null;
  placement?: number | null;
  achieved_at: string;
  image_url?: string | null;
  division_id?: string | null;
}): Promise<ActionResult>

updateAchievement(id: string, data: Partial<...>): Promise<ActionResult>

deleteAchievement(id: string): Promise<ActionResult>
```

Semua action pakai `verifyAdminAccess()` yang sudah ada.

### Admin Page — `app/admin/(panel)/achievements/page.tsx`

```
Header: "Achievements"
Button: "+ Tambah Manual"

List (ordered by achieved_at DESC):
  Per row:
    [thumbnail jika ada] [title] [Juara N badge] [tanggal] [Edit] [Hapus]
  
  Edit form (inline, sama pola dengan GalleryForm):
    - title (text input)
    - description (textarea, opsional)
    - placement (NumberInput, opsional)
    - achieved_at (date input)
    - image_url via ImageUpload component (opsional)
```

Komponen baru:
- `features/admin/components/AchievementsAdminClient.tsx`
- `features/admin/components/AchievementForm.tsx`

### Sidebar Nav

Update `AdminSidebarNav.tsx` — tambah link "Achievements" di antara Gallery dan Divisions.

---

## Section 3: Landing Page Update

### `app/page.tsx`

```ts
// Sebelum
const [galleryEntries, ...] = await Promise.all([getGalleryEntries(), ...]);
<AchievementsSection entries={galleryEntries} />

// Sesudah
const [galleryEntries, achievements, ...] = await Promise.all([
  getGalleryEntries(),      // ← tetap untuk hero slider
  getPublicAchievements(),  // ← baru untuk achievements section
  ...
]);
<AchievementsSection entries={achievements} />
```

### `AchievementsSection.tsx`

Ubah prop type dari `GalleryEntry[]` ke `Achievement[]`. Mapping fields:
- `item.title` → sama
- `item.placement` → format sebagai `"Juara ${placement}"` (menggantikan `item.position`)
- `item.achieved_at` → ambil tahun (menggantikan `item.tournament_date`)
- `item.image_url` → preview hover image (menggantikan `item.preview_images[0]`)
- Link: hapus `href` (achievements tidak punya slug/detail page), row jadi non-clickable `<div>` bukan `<Link>`

---

## Section 4: Public Division → Roster

### `app/divisions/[slug]/page.tsx` (update)

Tambah query player per org (max 3 per tim, ordered by role priority: captain > coach > member):

```ts
// Setelah dapat list orgs, parallel fetch players
const playersByOrg = await Promise.all(
  teams.map(async (team) => {
    const { data } = await supabase
      .from("team_members")
      .select("role, profiles(display_name, avatar_url, username)")
      .eq("organization_id", team.id)
      .eq("is_active", true)
      .order("role")
      .limit(3);
    return { orgId: team.id, players: data ?? [] };
  })
);
```

Card tim update:
- Tambah avatar row (3 avatar kecil + nama)
- Card jadi `<Link href={/divisions/${slug}/${team.slug}}>` — clickable

### `app/divisions/[slug]/[org-slug]/page.tsx` (baru)

```
Section 1 — Header:
  Logo + nama tim + deskripsi

Section 2 — Roster:
  Grid 2-3 kolom
  Per player card:
    avatar (bulat) | display_name | role badge | posisi | jersey #
    Card clickable → /players/[username]

Section 3 — Prestasi Tim:
  Hanya muncul jika ada achievements
  List: "Juara [n] — [title]" + tahun
  Hidden jika kosong
```

Query:
```ts
// org by slug
supabase.from("organizations").select(...).eq("slug", orgSlug).maybeSingle()

// full roster
supabase.from("team_members")
  .select("role, jersey_number, position, profiles(id, display_name, avatar_url, username)")
  .eq("organization_id", org.id)
  .eq("is_active", true)
  .order("role")
  .limit(30)

// team achievements
supabase.from("achievements")
  .select("id, title, placement, achieved_at")
  .eq("organization_id", org.id)
  .order("achieved_at", { ascending: false })
  .limit(20)
```

---

## Section 5: Public Player Profile

### `app/players/[username]/page.tsx` (baru)

Query flow:
```ts
// 1. Profil
const profile = await supabase.from("profiles")
  .select("id, display_name, username, avatar_url")
  .eq("username", username)
  .maybeSingle()
if (!profile) notFound()

// 2. Tim aktif
const memberships = await supabase.from("team_members")
  .select("organization_id, role, organizations(name, slug)")
  .eq("user_id", profile.id)
  .eq("is_active", true)
  .limit(5)

// 3. Achievements (dari semua org yang player ikuti)
const orgIds = memberships.map(m => m.organization_id)
const achievements = orgIds.length > 0
  ? await supabase.from("achievements")
      .select("id, title, placement, achieved_at, organizations(name)")
      .in("organization_id", orgIds)
      .order("achieved_at", { ascending: false })
      .limit(30)
  : []
```

Layout:
```
Header:
  Avatar besar (80px, bulat)
  display_name (bold, large)
  @username (muted)
  Tim aktif: badge kecil nama org (jika ada)

Achievements section:
  Judul: "Prestasi"
  List per achievement:
    badge placement (🥇/🥈/🥉 warna emas/perak/perunggu — pakai div warna, bukan emoji)
    "Juara [n] — [title]"
    tahun + nama org
  Jika kosong: teks muted "Belum ada prestasi tercatat."
```

**Catatan privasi**: `phone_wa`, `email`, `date_of_birth`, `game_ids`, `bio`, `social_links` — tidak ditampilkan.

---

## Files Changed / Created

| File | Action |
|------|--------|
| `features/tournaments/actions.ts` | Edit — tambah auto-insert achievement di `completeTournamentAction` |
| `features/admin/queries.ts` | Edit — tambah `getAchievements`, `getPublicAchievements` |
| `features/admin/actions.ts` | Edit — tambah `createAchievement`, `updateAchievement`, `deleteAchievement` |
| `features/admin/components/AchievementsAdminClient.tsx` | New |
| `features/admin/components/AchievementForm.tsx` | New |
| `features/admin/components/AdminSidebarNav.tsx` | Edit — tambah Achievements link |
| `app/admin/(panel)/achievements/page.tsx` | New |
| `app/page.tsx` | Edit — tambah `getPublicAchievements()`, pass ke `AchievementsSection` |
| `components/landing/AchievementsSection.tsx` | Edit — ubah prop type ke `Achievement[]` |
| `app/divisions/[slug]/page.tsx` | Edit — tambah player preview per tim |
| `app/divisions/[slug]/[org-slug]/page.tsx` | New |
| `app/players/[username]/page.tsx` | New |

**Tidak ada migrasi DB baru** — `achievements` table sudah ada.

---

## Error Handling

- Semua query destructure `{ data, error }` dan `console.error` jika error
- `notFound()` jika username/org-slug tidak ditemukan
- Achievement auto-create failure (di `completeTournamentAction`) — log error tapi tidak gagalkan seluruh action (tournament masih bisa selesai)

## Out of Scope

- Detail page per achievement (`/achievements/[id]`) — tidak ada slug, tidak dibutuhkan
- Filter/search achievements di admin
- Player profile edit dari halaman publik
- Gallery entries migration ke achievements — gallery_entries tetap ada untuk hero slider
