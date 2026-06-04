# Design Spec: Public Pages Redesign — Team Liquid Aesthetic
**Date:** 2026-06-04  
**Scope:** All public-facing pages only (workspace/dashboard untouched)  
**Reference:** teamliquid.com — home page + Dota 2 team page  

---

## 1. Color System

The entire public site switches from pure black to **deep navy blue**. Accent yellow stays (`#F5C400`).

| Token | Old | New |
|---|---|---|
| Page background | `#070707` / `bg-black` | `#040D1C` |
| Surface (cards) | `#0D0D0D` | `#071428` |
| Surface elevated | `#1E1E1E` / `#2E2E2E` | `#0C1E3C` |
| Border subtle | `white/5`, `white/6`, `white/8` | `white/12` |
| Text primary | `#E5E2E1` | `#FFFFFF` |
| Text secondary | `white/35`, `white/32`, `white/28` | `white/55` |
| Text muted | `white/18`, `white/20`, `white/22` | `white/38` |
| Accent | `#F5C400` | `#F5C400` (unchanged) |

**Tailwind shorthand mapping:**
- All `bg-black` and `bg-[#070707]` → `bg-[#040D1C]`
- All `bg-[#0D0D0D]` → `bg-[#071428]`
- All `bg-[#1E1E1E]`, `bg-[#2E2E2E]` → `bg-[#0C1E3C]`
- All `border-white/5`, `border-white/6`, `border-white/8` → `border-white/12`

---

## 2. Header (`components/landing/HeaderClient.tsx`)

**Changes:** Background color only.
- `bg-black` → `bg-[#040D1C]`
- Border stays `border-white/8` → `border-white/12`
- All other structure, nav, mobile drawer: unchanged

---

## 3. Footer (`components/landing/Footer.tsx`)

**Changes:** Background + border colors only.
- `bg-black` → `bg-[#040D1C]`
- All `border-white/8` → `border-white/12`
- All `text-white/28`, `text-white/18`, `text-white/30` → match new Text secondary/muted tokens

---

## 4. Hero Section (`components/landing/HeroSection.tsx`)

**Changes:**
- Section background: `bg-black` → `bg-[#040D1C]`
- Gradient overlay tint: Add navy blue tint to the gradient so it blends with new background
  - Custom background: overlay gradient `linear-gradient(to bottom, rgba(4,13,28,0.4) 0%, rgba(4,13,28,0.65) 100%)`
  - Fallback slides: same slide container, but section bg navy
- CTA button (JoinModal trigger): ensure sharp corners (`rounded-none`) and solid yellow fill — matching Team Liquid's sharp-edged CTAs
- Dot pattern overlay: keep existing radial dot pattern but slightly more visible on navy

No structural changes — HeroSection layout is already well-structured.

---

## 5. Divisions Section — Full Redesign (`components/landing/DivisionsSection.tsx`)

This is the biggest change. Current: vertical list rows. New: **Team Liquid games grid**.

### Grid Layout
- **Desktop:** 4 columns (`grid-cols-2 sm:grid-cols-3 lg:grid-cols-4`)  
- **Mobile:** 2 columns
- Gap: `gap-px` with `bg-white/8` container for grid-line effect (Team Liquid style), OR `gap-4` with individual card borders

### Card Design (per division)
```
┌─────────────────────────┐
│  [logo/icon 40px]       │
│                     →   │
│  DIVISION NAME          │
│  Game Name              │
└─────────────────────────┘
```
- Background: `bg-[#071428]`
- Border: `border border-white/10`
- Padding: `p-5 sm:p-6`
- Logo: `h-10 w-10` square, `object-contain`, `rounded`
- Division name: `font-black uppercase tracking-tight text-white text-base sm:text-lg`
- Game name: `text-[11px] uppercase tracking-wider text-white/45 mt-0.5`
- Arrow `→`: positioned bottom-right, `text-white/25`
- Hover: `hover:border-[#F5C400]/50 hover:bg-[#0C1E3C]` — border lights up yellow on hover
- Transition: `transition-all duration-200`

### Section Header
Keep existing header structure but update colors:
- Section label: `text-white/40` (was `white/28`)
- H2 title stays `font-black uppercase`
- Separator `border-white/12`

---

## 6. Achievements Section (`components/landing/AchievementsSection.tsx`)

**Changes:** Color tokens only — the row list format is already close to Team Liquid's editorial list style.
- Section + rows: `bg-black` → `bg-[#040D1C]`
- Row borders: `border-white/8` → `border-white/12`
- Numbered counter text: `text-white/12` → `text-white/15`
- Description text: `text-white/32` → `text-white/55`
- Hover bg: `hover:bg-white/[0.02]` → `hover:bg-white/[0.04]`

---

## 7. Testimonials Section (`components/landing/TestimonialsSection.tsx`)

**Changes:** Color tokens only.
- Section: `bg-black` → `bg-[#040D1C]`
- Quote text: `text-white/55` (was `text-white/55` — already ok, keep)
- Header separator: `border-white/8` → `border-white/12`
- Navigation buttons: `border-white/12` borders (already close)
- Large quote mark: `text-white/6` → `text-white/8`

---

## 8. Partners Section (`components/landing/PartnersSection.tsx`)

**Changes:** Color tokens only.
- Section: `bg-black` → `bg-[#040D1C]`
- Grid borders: `border-white/6` → `border-white/12`
- Header separator: `border-white/8` → `border-white/12`

---

## 9. Join Us Section (`components/landing/JoinUsSection.tsx`)

**Changes:** Color tokens + button style.
- Section: `bg-black` → `bg-[#040D1C]`
- Top/bottom borders: `border-white/8` → `border-white/12`
- Eyebrow text: `text-white/28` → `text-white/45`
- CTA button inside `JoinModal`: ensure sharp corners

---

## 10. About Page (`app/about/page.tsx`)

**Changes:**
- `main` background: `bg-[#070707]` → `bg-[#040D1C]`
- Hero banner: `border-white/5` → `border-white/12`
- Vision/Mission/Values cards: `#2E2E2E` → `#0C1E3C`
- Body text: `text-gray-300` → `text-white/70`
- Alumni section: keep layout, update photo card border to navy
- CTA border: `border-white/5` → `border-white/12`

---

## 11. Player Profile Page (`app/players/[username]/page.tsx`)

Team Liquid-inspired: photo prominent, bold name, clean achievement list.

**Changes:**
- `main` background: `bg-[#070707]` → `bg-[#040D1C]`
- Profile header section: dot pattern + gradient stays, bg → navy
- Avatar ring: `ring-white/10` → `ring-[#F5C400]/30` (yellow ring, more Team Liquid)
- Avatar fallback bg: `bg-[#1E1E1E]` → `bg-[#0C1E3C]`
- Username text: `text-white/35` → `text-white/50`
- Active team badge: `bg-[#1E1E1E]` → `bg-[#0C1E3C]`
- Achievement rows: `bg-[#0D0D0D]` → `bg-[#071428]`, `border-white/5` → `border-white/12`
- Empty state: `bg-[#0D0D0D]` → `bg-[#071428]`

---

## 12. Gallery Page

No read yet — apply same navy token mapping when encountered.

---

## 13. Divisions Page (`app/divisions/`)

Apply same navy token mapping. The `/divisions` page list will benefit from the navy palette.

---

## Implementation Order

1. **Header + Footer** (shared, fast wins)
2. **HeroSection** (most visible)
3. **DivisionsSection** (biggest structural change)
4. **AchievementsSection, TestimonialsSection, PartnersSection, JoinUsSection** (color-only, can batch)
5. **About page**
6. **Player profile page**
7. **Gallery + Divisions pages**

---

## What Does NOT Change
- Workspace routes (`/[team-slug]/*`) — untouched
- Dashboard (`/dashboard`) — untouched
- Manage panel (`/manage`) — untouched  
- Auth pages (`/login`, `/register`) — untouched
- Onboarding — untouched
- Any server action logic
- Database queries
- Font family (Instrument Sans is fine — Team Liquid uses a similar bold sans)
