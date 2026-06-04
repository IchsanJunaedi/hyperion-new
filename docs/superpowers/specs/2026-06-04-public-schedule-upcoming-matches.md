# Design Spec: Public Schedule + Upcoming Matches
**Date:** 2026-06-04  
**Scope:** Public-facing schedule page, home upcoming matches section, hero countdown update, admin toggle  

---

## Overview

Tournaments created in the manager/admin panel can be toggled as "public" (`show_on_schedule`). Public tournaments automatically appear on:
1. `/schedule` — full schedule page with countdown to nearest tournament
2. Home page — "Upcoming Matches" section (3 nearest)
3. Hero — countdown auto-picks nearest public tournament

One toggle controls all three surfaces. No per-surface configuration needed.

---

## Section 1: Data Layer

### Migration
Add column to `tournaments` table:
```sql
ALTER TABLE tournaments ADD COLUMN show_on_schedule boolean NOT NULL DEFAULT false;
```

Migration file: `supabase/migrations/YYYYMMDDHHMMSS_tournaments_show_on_schedule.sql`

### New Queries (`features/admin/queries.ts`)

**`getScheduleTournaments()`**
- Fetches: `id, name, start_date, start_time, status, organizer, prize_pool, registration_url, division_id, organization_id`
- Filter: `show_on_schedule = true` AND `start_date >= today` (ISO date string)
- Order: `start_date` ascending
- Limit: 50
- Returns: enriched with division name + game via join on `divisions(name, game)`

**`getUpcomingPublicTournaments(limit = 3)`**
- Same filter as above, limit = param (default 3)
- Used by home page UpcomingMatchesSection

**`getNearestPublicTournament()`**
- Same filter, limit = 1
- Returns single tournament or null
- Used by home page hero countdown

### Type
```ts
export interface PublicTournament {
  id: string;
  name: string;
  start_date: string;
  start_time: string | null;
  status: string;
  organizer: string | null;
  prize_pool: string | null;
  registration_url: string | null;
  division_name: string | null;
  game: string | null;
}
```

---

## Section 2: Admin Toggle

### Server Action
File: `features/admin/actions.ts` (or existing actions file)

```ts
export async function toggleTournamentSchedule(id: string, value: boolean): Promise<{ ok: boolean; message?: string }>
```
- Validates auth (owner only via OWNER_EMAIL)
- Updates `tournaments.show_on_schedule` for the given id
- Returns `{ ok: true }` or `{ ok: false, message: string }`

### UI Change (`features/admin/components/TournamentsAdminClient.tsx`)
- Add second toggle button "Publik" next to existing "Aktif di Hero" button
- Same optimistic update pattern as `show_in_hero` toggle
- Button states:
  - Off: `border border-white/20 text-white/40` + text "Tampilkan"
  - On: `bg-[#071428] border border-[#F5C400]/40 text-[#F5C400]` + text "Publik ✓"
- No limit on how many tournaments can be public (unlike show_in_hero which caps at 5)

---

## Section 3: `/schedule` Page

**File:** `app/schedule/page.tsx` — server component

### Layout
```
Header (shared)
├── Hero section
│   ├── "SCHEDULE" h1 + eyebrow label
│   ├── Countdown client component (to nearest public tournament)
│   └── Tournament name being counted down to
├── Tournament list (grouped by month)
│   ├── Month header: "JUNI 2026"
│   └── Tournament rows per month:
│       ├── Date (left, gold)
│       ├── Tournament name (bold white)
│       ├── Game / Division (muted)
│       ├── Status badge (UPCOMING / ONGOING)
│       └── "Daftar →" button if registration_url exists
└── Footer (shared)
```

### Countdown Component
**File:** `components/landing/ScheduleCountdown.tsx` — `"use client"`

- Accepts: `{ targetDate: string; targetTime: string | null; name: string }`
- Shows: `DD HH MM SS` countdown (days, hours, minutes, seconds)
- Updates every second via `setInterval`
- When tournament has passed: hides itself (return null)
- When no tournament: entire section not rendered

### Grouping Logic
Tournaments grouped by `start_date.slice(0, 7)` (YYYY-MM) on the server.

### Empty State
If no public tournaments: show message "Belum ada jadwal turnamen yang dipublikasikan." — no countdown rendered.

### Nav Link
Add "Schedule" to the default nav in `components/landing/Header.tsx`:
```ts
{ label: "Schedule", href: "/schedule" }
```
Note: nav links can be overridden via CMS (`nav_links_json` in site_settings), so this is a default fallback addition only.

---

## Section 4: Upcoming Matches Section (Home Page)

**File:** `components/landing/UpcomingMatchesSection.tsx` — `"use client"` (needs motion animations)

### Props
```ts
interface UpcomingMatchesSectionProps {
  tournaments: PublicTournament[];
}
```

### Layout
- Section bg: `bg-[#040D1C]`
- Section label: `"05 — Schedule"` (numbered like other sections)
- H2: `"Upcoming Matches"`
- Cards grid: `grid-cols-1 sm:grid-cols-3` gap-4
- "View schedule page →" link to `/schedule`
- Returns `null` if `tournaments.length === 0`

### Card Design (Team Liquid style)
```
┌──────────────────────────────┐
│ Sabtu, 15 Juni 2026  [MLBB] │  ← date gold, game badge
│                              │
│ Liga Esport Nasional 2026    │  ← name bold white uppercase
│                              │
│ Hyperion DOM                 │  ← division muted
│ Organizer name               │  ← organizer muted (if exists)
└──────────────────────────────┘
```
- Card: `bg-[#071428] border border-white/10 p-5`
- Hover: `hover:border-[#F5C400]/40 hover:bg-[#0C1E3C]`
- Date format: Indonesian locale (`toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })`)
- Game badge: `bg-[#F5C400]/10 text-[#F5C400] text-[10px] uppercase tracking-wider px-2 py-0.5`

### Home Page Integration (`app/page.tsx`)
- Import `UpcomingMatchesSection`
- Add `getUpcomingPublicTournaments(3)` to the `Promise.all` data fetch
- Render after `<HeroSection>` and before `<DivisionsSection>`

---

## Section 5: Hero Countdown Update

**File:** `app/page.tsx`

### Change
Replace `getFeaturedTournaments()` with `getNearestPublicTournament()` for the hero countdown data:

```ts
// Before
const featuredTournaments = await getFeaturedTournaments();
const heroSlides: HeroSlide[] = ...
// passed as featuredTournaments to HeroSection

// After
const nearestTournament = await getNearestPublicTournament();
const featuredTournaments: FeaturedTournament[] = nearestTournament
  ? [{ id: nearestTournament.id, name: nearestTournament.name, start_date: nearestTournament.start_date, start_time: nearestTournament.start_time }]
  : [];
```

- `HeroSection` and `HeroCountdown` components unchanged
- `FeaturedTournament` type already matches (`id, name, start_date, start_time`)
- `show_in_hero` column remains in DB untouched (no migration needed to remove it)
- `getFeaturedTournaments()` query can remain for backward compat but is no longer called from home page

---

## What Does NOT Change
- `HeroSection.tsx` — unchanged
- `HeroCountdown.tsx` — unchanged
- `FeaturedTournament` type — unchanged
- Workspace tournament routes (`/[team-slug]/tournaments/`) — unchanged
- Manager tournament create/edit forms — no new fields needed (toggle is admin-only)
- `show_in_hero` column — stays in DB, not removed

---

## File Summary

| Action | File |
|---|---|
| Create | `supabase/migrations/TIMESTAMP_tournaments_show_on_schedule.sql` |
| Modify | `features/admin/queries.ts` — add 3 queries + PublicTournament type |
| Modify | `features/admin/actions.ts` — add toggleTournamentSchedule action |
| Modify | `features/admin/components/TournamentsAdminClient.tsx` — add Publik toggle |
| Create | `app/schedule/page.tsx` |
| Create | `components/landing/ScheduleCountdown.tsx` |
| Create | `components/landing/UpcomingMatchesSection.tsx` |
| Modify | `app/page.tsx` — add upcoming section + update hero countdown source |
| Modify | `components/landing/Header.tsx` — add Schedule to default nav |
