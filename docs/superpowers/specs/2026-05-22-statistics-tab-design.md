# Design Spec: Statistics Tab + Ban Pipeline Fix
**Date:** 2026-05-22  
**Status:** Approved  
**Scope:** `/analytics` → new "Statistics" tab + fix scrim ban data not being persisted

---

## Problem Statement

1. **Ban data is lost:** `DraftSection.tsx` has full ban UI (5 slots our + 5 enemy), but `finishScrimAction` never saves ban data to any table. The `scrim_draft_bans` table does not exist.
2. **No hero-level statistics:** There is no aggregated view of hero pick/ban rates, win rates, or synergy/counter data across scrims.

---

## Bagian 1 — Ban Pipeline Fix

### 1.1 New Table: `scrim_draft_bans`

```sql
CREATE TABLE scrim_draft_bans (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  scrim_id    UUID        NOT NULL REFERENCES scrims(id) ON DELETE CASCADE,
  game_number INTEGER     NOT NULL,
  side        TEXT        NOT NULL CHECK (side IN ('our', 'enemy')),
  hero_name   TEXT        NOT NULL,
  ban_order   INTEGER     NOT NULL CHECK (ban_order BETWEEN 1 AND 5),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (scrim_id, game_number, side, ban_order)
);
```

`ban_order` (1–5) enables future ban-phase analytics (e.g. "most first-banned heroes").

### 1.2 Indexes (performance at scale)

**On `scrim_draft_bans`:**
- `idx_sdb_scrim` on `(scrim_id)` — primary join path
- `idx_sdb_hero` on `(hero_name)` — GROUP BY in RPC
- `idx_sdb_scrim_hero` on `(scrim_id, hero_name)` — covering for RPC self-join

**On `scrim_draft_picks` (additions):**
- `idx_sdp_hero` on `(hero_name)` — GROUP BY in RPC

### 1.3 RLS Policy

Same pattern as `scrim_draft_picks`: team members of the owning org can SELECT.

### 1.4 Data Flow Fix

```
DraftPicks.bans.our[]   ──┐
DraftPicks.bans.enemy[] ──┤──► GameInput.bans → finishScrimAction → scrim_draft_bans
```

Files to update:
- `finishScrimAction.ts`: add `bans?: { our: string[]; enemy: string[] }` to `GameInput`, upsert into `scrim_draft_bans`
- `FinishScrimForm.tsx`: pass `draft.bans` into game payload

### 1.5 `scrim_draft_picks` — Player Relation

Already has `player_id UUID REFERENCES auth.users(id)` (added in `20260521100000`). No schema change needed. Display name resolved via `profiles` table join in RPC.

---

## Bagian 2 — Statistics Tab

### 2.1 Approach: Supabase RPC (PostgreSQL stored procedures)

All aggregation runs inside Postgres. Two RPC functions:

#### `get_hero_statistics(p_org_id UUID)`
Returns one row per hero with:
- `hero_name TEXT`
- `pick_total INT`, `pick_wins INT`, `pick_losses INT`, `pick_wr NUMERIC`, `pick_pct NUMERIC` (% of games where hero was picked by us)
- `team_ban_total INT`, `team_ban_pct NUMERIC` (% of games where we banned this hero)
- `enemy_ban_total INT`, `enemy_ban_pct NUMERIC` (% of games where enemy banned this hero)
- `pb_total INT`, `pb_pct NUMERIC` (picks + all bans combined)

`pick_pct` and `ban_pct` denominator = total **game** count (rows in `scrim_game_results` for org), not scrim count — correctly handles BO3/BO5 multi-game formats. Migration timestamp: `20260522100000`.

#### `get_hero_detail(p_org_id UUID, p_hero_name TEXT)`
Returns three JSON arrays:
1. **`played_by_player`** — `[{ display_name, total, wins, losses, win_rate }]` — players on our team who picked this hero
2. **`played_with`** — `[{ hero_name, total, wins, losses, win_rate }]` — heroes picked by teammates in same game/side (self-join on `scrim_draft_picks` same scrim_id + game_number + side='our', different role)
3. **`played_against`** — `[{ hero_name, total, wins, losses, win_rate }]` — enemy heroes in same game (join `scrim_draft_picks` our side with `scrim_draft_picks` enemy side on same scrim_id + game_number)

Win/loss for Played With/Against uses `scrim_game_results` joined on `(scrim_id, game_number)`.

### 2.2 Server Query Layer

`features/analytics/queries.ts` — add:
```typescript
export async function getHeroStatistics(orgId: string): Promise<HeroStatRow[]>
export async function getHeroDetail(orgId: string, heroName: string): Promise<HeroDetailData>
```

Both call `supabase.rpc(...)`. Types defined locally (not from `types/database.ts` since gen is broken — defined inline).

### 2.3 Tab Integration

`AnalyticsDashboard.tsx`:
- Add `"statistics"` to `TabKey` union
- Insert `{ key: "statistics", label: "Statistics" }` between `"overview"` and `"draft"`
- Lazy-load: `StatisticsTab` fetches its own data via server action on first mount (avoids adding to initial page load)

### 2.4 Components

#### `StatisticsTab` (client)
- Fetches data via `getHeroStatisticsAction()` server action on first render (loading spinner until ready)
- Table uses CSS Grid (not `<table>`), consistent with CLAUDE.md
- Header: two rows — group labels row + sub-column labels row
- Columns: Hero (thumbnail + name) | Picks (Total, W, L, WR, %T) | Team Bans (Total, %T) | Enemy Bans (Total, %T) | P&B (Total, %T) | Details (Show button)
- Sortable by any numeric column (client-side, no re-fetch)
- Empty state if no scrim data

#### `HeroDetailModal` (client)
- Triggered by "Show" button in table row
- Full-screen backdrop blur, centered panel
- Header: hero thumbnail + name + overall pick stats summary
- 3 equal-width columns:
  1. **Played By Player** — player rows with Total / W / L / WR
  2. **Played With** — hero rows (thumbnail + name) with Total / W / L / WR
  3. **Played Against** — hero rows (thumbnail + name) with Total / W / L / WR
- Close button (X) top-right
- Loading state while fetching detail

### 2.5 Server Action (for lazy-load)

`features/analytics/actions.ts` — add:
```typescript
export async function getHeroStatisticsAction(orgId: string): Promise<HeroStatRow[]>
export async function getHeroDetailAction(orgId: string, heroName: string): Promise<HeroDetailData>
```

### 2.6 Migration File Plan

One migration file: `YYYYMMDDHHMMSS_hero_statistics.sql`
- Create `scrim_draft_bans` table
- Create indexes on `scrim_draft_bans` and `scrim_draft_picks`
- Create RPC function `get_hero_statistics`
- Create RPC function `get_hero_detail`
- RLS policy on `scrim_draft_bans`

---

## File Touchlist

| File | Action |
|------|--------|
| `supabase/migrations/20260522100000_hero_statistics.sql` | CREATE (table + indexes + RPC functions + RLS) |
| `features/scrim/actions/finishScrimAction.ts` | UPDATE — add ban saving |
| `features/analytics/queries.ts` | UPDATE — add `getHeroStatistics`, `getHeroDetail` |
| `features/analytics/actions.ts` | UPDATE — add server actions for lazy-load |
| `features/analytics/components/AnalyticsDashboard.tsx` | UPDATE — add statistics tab |
| `features/analytics/components/tabs/StatisticsTab.tsx` | CREATE |
| `features/analytics/components/HeroStatDetailModal.tsx` | CREATE (new file, distinct from `PlayerHeroModal.tsx` which is for Player Stats tab) |

---

## Constraints

- No `<table>` element — CSS Grid only
- No emojis as icons — Lucide React
- `toast` from sonner for error feedback (workspace context)
- All server actions return `{ ok: true } | { ok: false, message: string }`
- `types/database.ts` gen is broken — define new types inline, not via gen
