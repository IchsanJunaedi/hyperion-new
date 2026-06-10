# Mobile Responsiveness — Audit & Execution Plan
Date: 2026-06-10  
Viewport target: 375px (iPhone SE / standard mobile)

---

## Audit Results (375px Playwright screenshots)

### ✅ PASS — No fixes needed
| Page | Status | Notes |
|------|--------|-------|
| `/login` | ✅ | Form stacks cleanly |
| `/register` | ✅ | Same layout as login |
| `/divisions` | ✅ | Cards single-column, hero centered |
| `/schedule` | ✅ | Countdown ok, tournament cards stack |
| `/news` | ✅ | Featured card + grid stacks fine |
| `/rekrutmen` | ✅ | Cards single-column, badges wrap ok |
| `/sponsors` | ✅ | Empty state centered |
| `/results` | ✅ | Similar pattern to schedule |

### ❌ ISSUES FOUND

#### P0 — Workspace (high-usage, members access from phone)
> Cannot screenshot without login — must fix based on code review
- `[team-slug]/scrim` — CSS Grid tables likely overflow horizontally
- `[team-slug]/calendar` — calendar grid almost certainly broken at 375px
- `[team-slug]/roster` — grid columns likely too wide
- `[team-slug]/announcements` — likely ok but unverified
- `[team-slug]/polls` — availability grid will overflow
- `[team-slug]/analytics` — charts/stat tables will overflow
- `[team-slug]/tournaments` — bracket view will overflow
- `[team-slug]/strategy` — likely ok
- `[team-slug]/files` — table layout likely overflows
- `[team-slug]/development` — table layout likely overflows
- `[team-slug]/meta` — hero grid likely overflows
- `[team-slug]/trials` — kanban/table may overflow

#### P1 — Public pages with issues
- `/about` — **BROKEN**: "HYPERION TEAM" heading overflows, 2-col hero doesn't adapt, stats row cramped, timeline section broken layout
- `/` (homepage) — hero card content very compressed at 375px, countdown numbers tiny, right column (upcoming matches) hidden/stacked oddly

#### P2 — Dashboard / Manage (owner/manager, mostly desktop but fix anyway)
> Cannot screenshot without login
- `/dashboard/*` — tables, forms, CRUD panels likely not mobile-optimized
- `/manage/*` — similar, assign/roster tables likely overflow

#### P3 — Admin panel
> Internal tool, desktop-primary. Low priority but fix obvious overflows.
- `/admin/*` — settings forms, CMS editors

---

## Execution Plan

### Phase 1 — Public pages (P1) — 1 session
**Files to fix:**
- `app/about/AboutClient.tsx` — fix hero 2-col → stack, heading overflow, stats grid
- `app/page.tsx` + `components/landing/HeroSection.tsx` — fix hero card mobile layout, ensure countdown readable

**Pattern fixes:**
- Any `grid-cols-2` or `flex-row` without `flex-col` fallback on mobile → add `flex-col sm:flex-row`
- Oversized `font-bebas` headings → reduce size on xs: `text-4xl sm:text-6xl lg:text-8xl`

---

### Phase 2 — Workspace routes (P0) — 2 sessions

#### Session 2a — Tables & Lists
Files with CSS Grid tables that need horizontal scroll or responsive reflow:
- `features/scrim/components/ScrimList.tsx` (or similar)
- `features/roster/components/` 
- `features/files/components/`
- `features/player-development/components/`
- `features/salary/components/`

**Pattern:** Grid table columns → wrap with `overflow-x-auto` OR reflow to card layout on mobile using `hidden sm:grid` + mobile card alternative

#### Session 2b — Complex UI
- `features/calendar/` — calendar grid → switch to list view on mobile (`hidden sm:block` for grid, `block sm:hidden` for list)
- `features/polls/` — availability grid → horizontal scroll with `overflow-x-auto min-w-max`  
- `features/tournaments/` — bracket → `overflow-x-auto`
- `features/analytics/` — charts → full width, stat cards stack

---

### Phase 3 — Dashboard & Manage (P2) — 1 session
- Wrap all data tables in `overflow-x-auto`
- CRUD forms: `grid-cols-2` → `grid-cols-1 sm:grid-cols-2`
- Sidebar navigation: already hidden on mobile (verify)
- Panel header actions: stack on mobile

---

### Phase 4 — Admin panel (P3) — 1 session
- Forms: ensure single column on mobile
- Tables: `overflow-x-auto`
- CMS editors: full-width on mobile

---

## Common Patterns to Apply Throughout

### 1. Overflow table → scroll wrapper
```tsx
// Before
<div className="grid grid-cols-[200px_100px_150px_100px]">

// After  
<div className="overflow-x-auto">
  <div className="grid grid-cols-[200px_100px_150px_100px] min-w-[600px]">
```

### 2. Two-col → stack on mobile
```tsx
// Before
<div className="flex flex-row gap-6">

// After
<div className="flex flex-col sm:flex-row gap-6">
```

### 3. Hide table on mobile, show cards
```tsx
// Table: hidden on mobile
<div className="hidden sm:grid grid-cols-[...]">

// Cards: shown only on mobile
<div className="grid sm:hidden gap-3">
  {items.map(item => <MobileCard key={item.id} {...item} />)}
</div>
```

### 4. Responsive heading sizes
```tsx
// Before
<h1 className="font-bebas text-8xl">

// After
<h1 className="font-bebas text-5xl sm:text-7xl lg:text-8xl">
```

### 5. Touch targets
- All buttons/links: minimum `h-10` or `py-2.5 px-4` on mobile
- Icon-only buttons: `h-10 w-10` minimum

---

## Sidebar / Nav — Already Handled
- Landing `Header` / `HeaderClient` — hamburger menu ✅ already implemented
- Dashboard sidebar — check if mobile drawer exists, if not add
- Workspace sidebar — check if mobile drawer exists, if not add

---

## Progress Tracker

| Phase | Status | Session |
|-------|--------|---------|
| Phase 1 — Public pages | ⬜ TODO | Next |
| Phase 2a — Workspace tables | ⬜ TODO | +1 |
| Phase 2b — Workspace complex UI | ⬜ TODO | +2 |
| Phase 3 — Dashboard/Manage | ⬜ TODO | +3 |
| Phase 4 — Admin | ⬜ TODO | +4 |
