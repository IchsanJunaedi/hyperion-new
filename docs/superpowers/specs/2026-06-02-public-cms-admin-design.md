# Public CMS Admin — Design Spec
**Date:** 2026-06-02  
**Status:** Approved

---

## Overview

Replace all hardcoded landing page content with a database-driven CMS. Add a separate `/admin` panel (distinct from `/dashboard`) where the owner or a dedicated admin can edit all public-facing content — hero text, gallery/achievements, partners, testimonials, divisions, join section, and footer.

---

## Auth

- **Access:** `ADMIN_EMAIL` env var OR `OWNER_EMAIL` env var — either email can access `/admin`
- **Login:** `/admin/login` — separate page, Supabase Auth email/password
- **Middleware:** Extend `middleware.ts` — path `/admin/*` (except `/admin/login`) requires session + email check
- **Logout:** button in `/admin` sidebar

---

## Database Schema

### New tables

**`gallery_entries`** — replaces `lib/data/gallery.ts`
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
slug        text UNIQUE NOT NULL
title       text NOT NULL
division    text NOT NULL
tournament_date text NOT NULL
position    text NOT NULL           -- "Juara 1", "Champion", etc.
status      text NOT NULL           -- "Online" | "Offline"
logo_url    text
preview_images text[] DEFAULT '{}'
description text NOT NULL
sort_order  int  NOT NULL DEFAULT 0
created_at  timestamptz DEFAULT now()
updated_at  timestamptz DEFAULT now()
```
RLS: public SELECT (anon), admin/owner INSERT/UPDATE/DELETE via service role in server actions.

**`partners`**
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
name        text NOT NULL
logo_url    text
website_url text
sort_order  int NOT NULL DEFAULT 0
is_active   bool NOT NULL DEFAULT true
```

**`testimonials`**
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
author_name text NOT NULL
author_role text NOT NULL
content     text NOT NULL
avatar_url  text
sort_order  int NOT NULL DEFAULT 0
is_active   bool NOT NULL DEFAULT true
```

**`divisions_public`** — landing page display only, separate from team management `divisions` table
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
name        text NOT NULL
description text
icon_url    text
sort_order  int NOT NULL DEFAULT 0
is_active   bool NOT NULL DEFAULT true
```

**`site_settings`** — scalar text content per section
```sql
key         text PRIMARY KEY
value       text NOT NULL DEFAULT ''
updated_at  timestamptz DEFAULT now()
```

`site_settings` keys seeded:
| Key | Default value |
|-----|---------------|
| `hero_eyebrow` | `Est. 2020 — Palembang, Indonesia` |
| `hero_tagline` | `Empowering Young Talents to Rise and Rule.` |
| `hero_cta_label` | `Join Us` |
| `hero_cta_href` | `/register` |
| `footer_tagline` | `Empowering Young Talents to Rise and Rule. Est. 2020 — Palembang, Indonesia.` |
| `footer_instagram_handle` | `@hyperionteam.id` |
| `footer_instagram_url` | `https://www.instagram.com/hyperionteam.id/` |
| `footer_hashtag` | `#HypeWin` |
| `join_eyebrow` | `#HypeWin` |
| `join_title_line1` | `Ready To` |
| `join_title_line2` | `Join The Team?` |
| `join_description` | `Unleash your potential. Kembangkan skill, bangun karir esports, dan jadilah bagian dari keluarga Hyperion Team.` |
| `join_fine_print` | `Gratis · Tanpa syarat umur minimum` |

### Seed data (from existing hardcoded values)

Migration includes `INSERT` statements seeding all 3 gallery entries, 8 partners, 3 testimonials, and all `site_settings` keys so landing page is never empty.

### Hero slides

`HeroSection` pulls its background slides from `gallery_entries ORDER BY sort_order LIMIT 3`. No separate `hero_slides` table — gallery entries double as hero backgrounds. Admin controls hero imagery by reordering gallery entries.

### DivisionsSection

Currently reads `divisions WHERE organization_id IS NULL`. After migration, reads `divisions_public WHERE is_active = true ORDER BY sort_order`. Standalone divisions stay in the team management `divisions` table; the landing page display is independently curated via the admin.

---

## Image Upload

- **Bucket:** `public-assets` (create if not exists, public read policy)
- **Path pattern:** `gallery/{filename}`, `partners/{filename}`, `testimonials/{filename}`, `avatars/{filename}`
- **Admin UI:** file input → upload via `supabase.storage.from('public-assets').upload(path, file)` → store public URL in DB
- **Validation:** client-side file type (image/*) + max 5 MB

---

## `/admin` Panel Structure

```
app/
  admin/
    login/
      page.tsx            ← email/password login, redirects to /admin on success
    layout.tsx            ← sidebar + auth gate (checks ADMIN_EMAIL || OWNER_EMAIL)
    page.tsx              ← redirect → /admin/gallery
    gallery/
      page.tsx            ← gallery list + add/edit/delete
    partners/
      page.tsx            ← partners list + add/edit/delete
    testimonials/
      page.tsx            ← testimonials list + add/edit/delete
    divisions/
      page.tsx            ← divisions_public list + add/edit/delete
    hero/
      page.tsx            ← site_settings hero_* form
    join/
      page.tsx            ← site_settings join_* form
    footer/
      page.tsx            ← site_settings footer_* form

features/
  admin/
    actions.ts            ← server actions (createGalleryEntry, updatePartner, etc.)
    queries.ts            ← DB reads for admin panel
    components/
      GalleryForm.tsx
      PartnerForm.tsx
      TestimonialForm.tsx
      DivisionPublicForm.tsx
      SettingsForm.tsx    ← reusable for hero/join/footer
      ImageUpload.tsx     ← shared file upload component
```

### Sidebar nav
```
KONTEN LIST
  · Gallery & Achievement
  · Partners
  · Testimonials
  · Divisions

SECTIONS TEKS
  · Hero
  · Join Section
  · Footer
```

### UI pattern (list pages)
- Table: name + sort_order + is_active toggle + Edit/Delete buttons
- Add button → inline slide-down form or modal
- Edit → same form pre-filled
- Delete → 2-step confirm (type "HAPUS") via `ConfirmDeleteDialog`
- Sort order: manual number input (up/down via `NumberInput`)

### UI pattern (settings pages)
- Form fields for each key group (hero_*, join_*, footer_*)
- Single "Simpan" button → server action updates `site_settings` batch
- Toast (sonner) on success/error

---

## Landing Page Changes

All landing components become **async Server Components** (or pass data as props from the page). Each reads from Supabase on every request (`export const dynamic = "force-dynamic"` already in place).

| Component | Change |
|-----------|--------|
| `HeroSection` | Accept `slides` + `settings` as props from page.tsx |
| `AchievementsSection` | Accept `entries` as props, remove hardcoded ACHIEVEMENTS |
| `DivisionsSection` | Read `divisions_public` instead of `divisions` |
| `TestimonialsSection` | Accept `testimonials` as props, remove hardcoded TESTIMONIALS |
| `PartnersSection` | Accept `partners` as props, remove hardcoded PARTNERS |
| `JoinUsSection` | Accept `settings` as props, remove hardcoded text |
| `Footer` | Accept `settings` as props, remove hardcoded LINKS text |
| `app/gallery/page.tsx` | Read `gallery_entries` from DB |
| `app/gallery/[slug]/page.tsx` | Read `gallery_entries` by slug from DB |

Root `app/page.tsx` fetches all data in parallel (`Promise.all`) and passes down as props. This keeps each component pure and testable.

**`lib/data/gallery.ts`** → deleted after migration.

---

## Server Actions Pattern

All admin mutations go through server actions in `features/admin/actions.ts`. Each action:
1. Verifies `user.email === ADMIN_EMAIL || user.email === OWNER_EMAIL`
2. Uses `createAdminClient()` (bypasses RLS)
3. Returns `{ ok: true }` or `{ ok: false, message: string }`

---

## Migration Strategy

1. New migration: create 4 tables + seed all existing hardcoded data
2. Create `public-assets` storage bucket
3. Build `/admin` panel
4. Update landing components to accept props
5. Update `app/page.tsx` to fetch from DB
6. Delete `lib/data/gallery.ts`

---

## Out of Scope

- Footer nav links (Team, Legal columns) — internal routes, stay hardcoded
- Header nav — stays hardcoded
- JoinModal form — stays as-is (Supabase trial applicants flow)
- Multi-admin support (only one ADMIN_EMAIL)
- Image CDN / optimization beyond Supabase Storage
