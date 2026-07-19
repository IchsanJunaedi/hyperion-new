# Hero Tournament Countdown — Design Spec

**Date:** 2026-06-04  
**Status:** Approved by user

---

## Goal

Upgrade the public landing page hero section to display a live countdown to the next featured tournament, styled editorially — big countdown numbers overlaid directly on the full-bleed background image, no borders or boxes. Admin can pick which tournament to feature via `/admin/tournaments`.

---

## Visual Design (Approved)

- Full-bleed dark background image (existing gallery slides, barely-visible grayscale)
- Countdown positioned **absolutely in the center** of the hero section
- Tournament name: small uppercase label above the countdown
- Countdown row: huge bold numbers separated by yellow dots (`·`) — `DD · HH · MM · SS`
- Unit labels below each number in muted uppercase: `HARI · JAM · MENIT · DETIK`
- No borders, no boxes, no background cards — clean text on image
- Yellow (`#F5C400`) used for dots and "NEXT TOURNAMENT" label
- Existing wordmark ("HYPERION // TEAM") + CTA stay at bottom-left — unchanged

---

## Hero States

| Condition | Display |
|-----------|---------|
| No tournament featured | Normal hero only (existing, unchanged) |
| Featured tournament, `start_date` in the future | Live countdown `DD · HH · MM · SS` |
| Featured tournament, `start_date` has passed | "SEDANG BERLANGSUNG" pulsing yellow text |

Admin manually toggles the tournament off after it ends.

---

## Admin Panel Flow

1. Tournament created in `/dashboard/tournaments` or workspace
2. When `is_registered = true` → tournament visible in `/admin/tournaments`
3. Admin toggles **"Tampilkan di Hero"** — exactly one tournament can be active at a time
4. Toggle ON: sets `show_in_hero = true` on selected tournament, clears all others
5. Toggle OFF: sets `show_in_hero = false` (hero returns to normal)

---

## Data Model Change

```sql
ALTER TABLE tournaments ADD COLUMN show_in_hero BOOLEAN DEFAULT false;
```

No additional tables needed — single column on existing `tournaments` table.

---

## Components

| Component | Responsibility |
|-----------|---------------|
| `lib/utils/countdown.ts` | Pure functions: parse target date, compute time-left diff — testable |
| `components/landing/HeroCountdown.tsx` | Client component — setInterval countdown, 3 display states |
| `components/landing/HeroSection.tsx` | Accept optional `featuredTournament` prop, render HeroCountdown absolutely |
| `features/admin/queries.ts` | `getTournamentsForAdmin()`, `getFeaturedTournament()` |
| `features/admin/actions.ts` | `toggleHeroTournamentAction(id \| null)` |
| `features/admin/components/TournamentsAdminClient.tsx` | List + toggle UI for admin |
| `app/admin/(panel)/tournaments/page.tsx` | Server page — fetches + renders client |
| `features/admin/components/AdminSidebarNav.tsx` | Add "Tournaments" nav item |
| `app/page.tsx` | Add `getFeaturedTournament()` to Promise.all, pass to HeroSection |

---

## Constraints

- `getTournamentsForAdmin()` filters `is_registered = true`, ordered by `start_date DESC`, `.limit(50)`
- `getFeaturedTournament()` returns first row where `show_in_hero = true`, `.maybeSingle()`
- Countdown uses `setInterval(1000)` with mounted flag cleanup
- When `show_in_hero` toggled ON for tournament A, all other tournaments auto-cleared via server action
- If `start_time` is null, countdown targets `start_date` at `00:00:00` local
