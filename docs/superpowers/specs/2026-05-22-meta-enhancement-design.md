# /meta Enhancement — Draft Intelligence Design

**Date:** 2026-05-22  
**Status:** Approved  
**Scope:** Upgrade /meta tier list to match mlbb.io/hero-tier capability while keeping all data manual (coach-curated). No external API dependencies.

---

## Overview

The current /meta feature tracks hero tiers (S–D), role tags, ban priority, priority-to-learn, and coach notes per patch. This design adds:

1. **SS tier** — above S, for truly meta-defining heroes
2. **Counter/synergy arrays** — per hero, coach-curated lists of counters and synergies
3. **Draft notes** — composition/matchup context separate from training notes
4. **Tier descriptions** — per-tier text blurb editable per patch
5. **Hero detail panel** — slide-in UI for viewing all hero intelligence at a glance

---

## Data Model

### `meta_hero_ratings` — 3 new columns

| Column | Type | Description |
|--------|------|-------------|
| `counters` | `text[]` | Hero names that counter this hero. Coach-picked from MLBB_HEROES. Null = empty. |
| `synergies` | `text[]` | Hero names that pair well with this hero. Same format. |
| `draft_notes` | `text` | Composition/matchup context ("strong in dive comps, pair with Atlas"). Separate from `notes` (training/eval notes). |

Counter/synergy arrays store hero names as strings (no FK). This allows referencing heroes not yet in the tier list and avoids cascade complexity.

### `meta_patches` — 1 new column

| Column | Type | Description |
|--------|------|-------------|
| `tier_descriptions` | `jsonb` | Map of tier → description. e.g., `{"SS": "Meta-defining, always ban/first-pick", "S": "Dominant, ban or first-pick", "A": "Reliable in most compositions", "B": "Situationally strong", "C": "Niche picks", "D": "Avoid unless mastered"}`. Null → UI falls back to hardcoded defaults. |

### Tier enum — add "SS"

Migration alters the `CHECK` constraint on `meta_hero_ratings.tier` to include `'SS'`.

TypeScript: `type Tier = "SS" | "S" | "A" | "B" | "C" | "D"`

SS tier color: violet/purple (`bg-violet-500/5`, `border-violet-500/30`, badge `bg-violet-500/20 text-violet-400`)

---

## UI Components

### Tier List

- SS row rendered at the top, above S, using violet styling
- Each tier label area shows the tier description text below the badge in faded italic (`text-[10px] italic text-white/40`). Falls back to hardcoded defaults if `tier_descriptions` is null.

### Hero Card (existing 72px card)

No visual changes. New behavior:
- **Non-edit mode:** click anywhere → open hero detail panel
- **Edit mode:** existing hover overlay (edit/delete buttons) takes priority; click still shows overlay

### Hero Detail Panel

Slide-in panel from the right on desktop (`sm` breakpoint and above), bottom sheet on mobile (below `sm`). Triggered by hero card click in non-edit mode.

Layout:
```
┌─────────────────────────────────────────┐
│  [64px img]  Hero Name        [Tier] ×  │
│  Role Tag  · Ban Priority  · Learn      │
│─────────────────────────────────────────│
│  Counters                               │
│  [32px img + name chips]                │
│  (empty state: "Belum ada counter")     │
│─────────────────────────────────────────│
│  Synergies                              │
│  [32px img + name chips]                │
│─────────────────────────────────────────│
│  Draft Notes                            │
│  [text or "—"]                          │
│─────────────────────────────────────────│
│  Coach Notes                            │
│  [text or "—"]                          │
└─────────────────────────────────────────┘
```

Counter/synergy chips: clicking a chip opens that hero's detail panel (chain navigation). Back arrow or ESC to close. If the referenced hero is not in the current patch's tier list, the panel header shows the hero image + name with "Hero ini belum ada di tier list patch ini" and no other sections.

### AddHeroModal (edit modal) — extended

New fields added below existing notes textarea:
1. **Draft Notes** — `textarea` rows=2, placeholder "Misal: kuat di turtle fight, pair dengan Atlas..."
2. **Counters** — multi-hero picker (search input + scrollable grid, same pattern as existing hero picker but allows multi-select with X chips for each selected hero)
3. **Synergies** — same multi-hero picker

These fields are optional. Counter/synergy pickers exclude the hero being edited from the available list.

### Patch Settings

Small gear icon (`Settings` from lucide) next to the active patch name in the patch selector row. Clicking opens an inline form (same pattern as the new-patch form):
- Patch notes (existing)
- Tier descriptions: 6 labeled inputs (SS / S / A / B / C / D), each with a placeholder showing the hardcoded default

---

## Architecture

### File changes

| File | Change |
|------|--------|
| `supabase/migrations/<ts>_meta_enhancement.sql` | New migration: add columns, alter tier constraint |
| `types/database.ts` | Manual update: add `counters`, `synergies`, `draft_notes` to `meta_hero_ratings` Row/Insert/Update; add `tier_descriptions` to `meta_patches` |
| `features/meta/actions.ts` | `upsertHeroRatingAction` accepts counters, synergies, draft_notes; new `updatePatchDescriptionsAction` |
| `features/meta/queries.ts` | No changes (columns auto-included in `select("*")`) |
| `features/meta/components/MetaPage.tsx` | SS tier styling, hero card click handler, tier description display, patch settings toggle |
| `features/meta/components/AddHeroModal.tsx` | Counter/synergy multi-pickers, draft_notes field |
| `features/meta/components/HeroDetailPanel.tsx` | New component — slide-in panel |

### Action changes

`upsertHeroRatingAction` — add to input shape:
```typescript
counters: string[];
synergies: string[];
draft_notes: string;
```

New action:
```typescript
updatePatchDescriptionsAction(orgSlug, orgId, patchId, descriptions: Record<string, string>)
```

---

## Error Handling

- Counter/synergy pickers: if a referenced hero name no longer exists in MLBB_HEROES (e.g., hero renamed), the chip still renders with the name but without an image (graceful degradation via `onError` on `<img>`).
- `tier_descriptions` null: UI falls back to hardcoded default strings — no error state.
- Hero detail panel: if counters/synergies arrays are null/empty, show "Belum ditambahkan" placeholder — no loading state needed since data is loaded with the patch.

---

## Migration SQL

```sql
-- Add SS to tier constraint
ALTER TABLE meta_hero_ratings
  DROP CONSTRAINT IF EXISTS meta_hero_ratings_tier_check;
ALTER TABLE meta_hero_ratings
  ADD CONSTRAINT meta_hero_ratings_tier_check
  CHECK (tier IN ('SS', 'S', 'A', 'B', 'C', 'D'));

-- New columns on meta_hero_ratings
ALTER TABLE meta_hero_ratings
  ADD COLUMN IF NOT EXISTS counters text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS synergies text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS draft_notes text;

-- New column on meta_patches
ALTER TABLE meta_patches
  ADD COLUMN IF NOT EXISTS tier_descriptions jsonb;
```

---

## Out of Scope

- Draft Board / pick-ban simulator (Approach C) — deferred
- External win-rate or stats API — explicitly excluded, all data is coach-curated
- Hero role assignment from external source — coaches set roles manually
