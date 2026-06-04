# Admin Public Profile Control — Design Spec

**Date:** 2026-06-04
**Scope:** 4 new admin features to control what appears on the public-facing site

---

## Overview

Four independent admin features, each with the same pattern: admin controls visibility/content → data surfaces on public pages. All admin pages follow the existing Notion dark theme pattern. All public pages follow the existing navy (`#040D1C`) palette.

---

## Feature 1: News CMS (`/admin/news`)

### Goal
Let admin publish news articles (match recaps, roster updates, org announcements) visible on the public site.

### DB — New table `news_posts`
```sql
CREATE TABLE news_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  excerpt text,
  content text,
  cover_image_url text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);
```
Slug is auto-generated from title on create (slugify), editable on update. `published_at` is set to `now()` when status flips to `published` (only if null).

### Admin — `/admin/news`
- List view: title, status badge (Draft/Published), published_at, cover image thumbnail
- Actions: Create, Edit, Delete (with ConfirmDeleteDialog + phrase "HAPUS"), toggle Published/Draft inline
- Form (create + edit): title, slug (auto-filled, editable), excerpt (short textarea), content (long textarea), cover image upload (ImageUpload component, folder: `news`), status selector

### Public — `/news` + `/news/[slug]`
- `/news`: grid of published articles sorted by `published_at DESC`, limit 20. Card: cover image, title, excerpt, date.
- `/news/[slug]`: full article. cover image hero, title, date, content (rendered as whitespace-preserved text or markdown-lite). Header + Footer included.
- Both pages: `export const dynamic = "force-dynamic"`. Empty state if no published posts.

### Sidebar
Add `{ href: "/admin/news", Icon: Newspaper, label: "News" }` to KONTEN LIST group in `AdminSidebarNav`.

---

## Feature 2: Results Control (`/admin/results`)

### Goal
Admin uploads a public photo (podium/poster) for tournament results and toggles which results appear on the public `/results` page.

### Flow
1. Manager completes tournament in workspace → `tournament_results` row created (placement, prize_earned, notes)
2. Admin opens `/admin/results` → sees all results joined with tournament name → uploads photo + toggles public
3. Public `/results` shows only `is_public = true` results with photo

### DB — Alter `tournament_results`
```sql
ALTER TABLE tournament_results
  ADD COLUMN is_public boolean NOT NULL DEFAULT false,
  ADD COLUMN result_image_url text;
```

### Admin — `/admin/results`
- List: tournament name, date, placement badge (Juara 1/2/3 or "Gugur"), prize_earned, is_public toggle, photo thumbnail (or placeholder)
- Per row: upload photo button (opens ImageUpload inline, folder: `results`), toggle is_public button
- Sorted: `recorded_at DESC`, limit 50
- No create/delete — results come from workspace only. Admin only controls `is_public` + `result_image_url`.

### Public — `/results`
- List of public results sorted by `recorded_at DESC`
- Each card: result_image_url (photo/poster), tournament name, date, placement badge, prize_earned (if any)
- Header + Footer. Empty state if no public results.

### Sidebar
Add `{ href: "/admin/results", Icon: Medal, label: "Results" }` to KONTEN LIST group.

---

## Feature 3: Sponsor Public Control (`/admin/sponsor-control`)

### Goal
Expose workspace sponsors (from `sponsors` table) to the public site. Distinct from `partners` table (which is manually managed brand logos). Sponsors = financial/contractual partners that org wants to showcase publicly.

### DB — Alter `sponsors`
```sql
ALTER TABLE sponsors
  ADD COLUMN is_public boolean NOT NULL DEFAULT false,
  ADD COLUMN public_sort_order int NOT NULL DEFAULT 0;
```
Only sponsors with `logo_url IS NOT NULL` are eligible to be public.

### Admin — `/admin/sponsor-control`
- List: sponsor name, logo thumbnail, status (active/inactive), is_public toggle, sort order (up/down buttons)
- Sorted by `public_sort_order ASC`, then `name ASC`
- Warning shown if sponsor has no logo (cannot be made public)
- Toggle updates `is_public`; up/down buttons swap `public_sort_order` with adjacent item

### Public — `/sponsors`
- New public page: grid of sponsors where `is_public = true AND logo_url IS NOT NULL`, ordered by `public_sort_order`
- Card: logo, name, (no deal_value/contact — confidential)
- Header + Footer. Empty state if none public.
- Add "Sponsors" to `DEFAULT_NAV` in Header (after "Schedule", before "Rekrutmen")

### Sidebar
Add `{ href: "/admin/sponsor-control", Icon: Handshake, label: "Sponsors Publik" }` to KONTEN LIST group.

---

## Feature 4: Player Visibility (`/admin/players`)

### Goal
Control which team members are visible on the public `/divisions` page. Admin toggles per-player; the player manages their own bio/social_links via workspace profile settings.

### DB — Alter `team_members`
```sql
ALTER TABLE team_members
  ADD COLUMN is_public boolean NOT NULL DEFAULT false;
```

### Admin — `/admin/players`
- List: avatar, display_name, role badge, division name, is_public toggle
- Filter: only `is_active = true` members, sorted by division then role then display_name
- Grouped by division for readability
- Toggle updates `is_public`

### Public — update `/divisions` page
- `getDivisionsWithMembers()` in `features/admin/queries.ts`: add `.eq("is_public", true)` filter to the `team_members` query
- Members with `is_public = false` are hidden from public division pages
- No separate `/players` page needed — existing `/divisions` and `/divisions/[slug]` already handle display

### Sidebar
Add `{ href: "/admin/players", Icon: Users, label: "Players Publik" }` to KONTEN LIST group.

---

## Shared Patterns

- All admin pages: sticky header breadcrumb, `max-w-4xl` main content, same dark Notion style
- All toggles: optimistic update + server action rollback on error, `toast` from sonner
- All image uploads: use existing `ImageUpload` component from `features/admin/components/ImageUpload`
- All deletes (only News has delete): `ConfirmDeleteDialog` with phrase "HAPUS"
- All server actions: `verifyAdminAccess()` guard, return `{ ok: true } | { ok: false, message }`
- All queries: explicit column selects (no `select("*")`), `.limit()` on every list

## Implementation Order
1. News CMS (most complex, new table + public pages)
2. Results control (DB alter + admin page, no new public page structure)
3. Sponsor public control (DB alter + admin page + new public page)
4. Player visibility (DB alter + admin page + update existing query)
