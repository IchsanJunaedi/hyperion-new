# Statistics Tab + Ban Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Statistics tab to `/analytics` with hero pick/ban aggregation, synergy/counter modal, and fix the broken ban pipeline that loses data on scrim finish.

**Architecture:** Supabase RPC functions handle all aggregation SQL (picks, bans, self-joins for Played With/Against). Client `StatisticsTab` lazy-fetches on first mount via server action. `HeroStatDetailModal` fetches hero detail on open.

**Tech Stack:** Next.js 15 App Router, Supabase RPC, TypeScript, Tailwind CSS v4, Lucide React, Sonner toast

---

## File Map

| File | Action |
|------|--------|
| `supabase/migrations/20260522100000_hero_statistics.sql` | CREATE |
| `features/scrim/actions/finishScrimAction.ts` | MODIFY — add ban saving |
| `features/scrim/components/FinishScrimForm.tsx` | MODIFY — pass bans separately, remove ban-as-picks hack |
| `features/analytics/queries.ts` | MODIFY — add `getHeroStatistics`, `getHeroDetail`, types |
| `features/analytics/actions.ts` | MODIFY — add `getHeroStatisticsAction`, `getHeroDetailAction` |
| `features/analytics/components/tabs/StatisticsTab.tsx` | CREATE |
| `features/analytics/components/HeroStatDetailModal.tsx` | CREATE |
| `features/analytics/components/AnalyticsDashboard.tsx` | MODIFY — add statistics tab |

---

## Task 1: Migration — scrim_draft_bans table + indexes + RPC functions

**Files:**
- Create: `supabase/migrations/20260522100000_hero_statistics.sql`

- [ ] **Step 1.1: Write the migration file**

```sql
-- supabase/migrations/20260522100000_hero_statistics.sql
-- =============================================================================
-- Hero statistics infrastructure:
--   1. scrim_draft_bans  — proper ban tracking (replaces ban-as-picks hack)
--   2. Performance indexes on pick + ban tables
--   3. get_hero_statistics(org_id) — aggregate pick/ban stats per hero
--   4. get_hero_detail(org_id, hero_name) — synergy/counter detail
-- =============================================================================

-- ── 1. scrim_draft_bans table ─────────────────────────────────────────────────

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

-- ── 2. Indexes ────────────────────────────────────────────────────────────────

-- scrim_draft_bans indexes
CREATE INDEX idx_sdb_scrim    ON scrim_draft_bans(scrim_id);
CREATE INDEX idx_sdb_hero     ON scrim_draft_bans(hero_name);
CREATE INDEX idx_sdb_scrim_hero ON scrim_draft_bans(scrim_id, hero_name);

-- scrim_draft_picks: add hero_name index for GROUP BY in RPC
CREATE INDEX IF NOT EXISTS idx_sdp_hero ON scrim_draft_picks(hero_name);

-- ── 3. RLS on scrim_draft_bans ────────────────────────────────────────────────

ALTER TABLE scrim_draft_bans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view bans"
  ON scrim_draft_bans FOR SELECT
  USING (
    scrim_id IN (
      SELECT s.id FROM scrims s
      WHERE s.organization_id IN (
        SELECT organization_id FROM team_members
        WHERE user_id = auth.uid() AND is_active = true
      )
    )
  );

-- ── 4. RPC: get_hero_statistics ───────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_hero_statistics(p_org_id UUID)
RETURNS TABLE (
  hero_name       TEXT,
  pick_total      BIGINT,
  pick_wins       BIGINT,
  pick_losses     BIGINT,
  pick_wr         NUMERIC,
  pick_pct        NUMERIC,
  team_ban_total  BIGINT,
  team_ban_pct    NUMERIC,
  enemy_ban_total BIGINT,
  enemy_ban_pct   NUMERIC,
  pb_total        BIGINT,
  pb_pct          NUMERIC
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH
    org_scrims AS (
      SELECT s.id AS scrim_id
      FROM scrims s
      WHERE s.organization_id = p_org_id
        AND s.status = 'completed'
    ),
    total_games AS (
      SELECT COUNT(*) AS cnt
      FROM scrim_game_results sgr
      WHERE sgr.scrim_id IN (SELECT scrim_id FROM org_scrims)
    ),
    our_picks AS (
      SELECT
        sdp.hero_name,
        COUNT(*)                                          AS pick_total,
        COUNT(*) FILTER (WHERE sgr.is_win = true)        AS pick_wins,
        COUNT(*) FILTER (WHERE sgr.is_win = false)       AS pick_losses
      FROM scrim_draft_picks sdp
      JOIN scrim_game_results sgr
        ON sgr.scrim_id = sdp.scrim_id
       AND sgr.game_number = sdp.game_number
      WHERE sdp.scrim_id IN (SELECT scrim_id FROM org_scrims)
        AND sdp.side = 'our'
      GROUP BY sdp.hero_name
    ),
    team_bans AS (
      SELECT sdb.hero_name, COUNT(*) AS ban_total
      FROM scrim_draft_bans sdb
      WHERE sdb.scrim_id IN (SELECT scrim_id FROM org_scrims)
        AND sdb.side = 'our'
      GROUP BY sdb.hero_name
    ),
    enemy_bans AS (
      SELECT sdb.hero_name, COUNT(*) AS ban_total
      FROM scrim_draft_bans sdb
      WHERE sdb.scrim_id IN (SELECT scrim_id FROM org_scrims)
        AND sdb.side = 'enemy'
      GROUP BY sdb.hero_name
    ),
    all_heroes AS (
      SELECT hero_name FROM our_picks
      UNION SELECT hero_name FROM team_bans
      UNION SELECT hero_name FROM enemy_bans
    )
  SELECT
    ah.hero_name,
    COALESCE(op.pick_total,  0)                                              AS pick_total,
    COALESCE(op.pick_wins,   0)                                              AS pick_wins,
    COALESCE(op.pick_losses, 0)                                              AS pick_losses,
    CASE WHEN COALESCE(op.pick_total, 0) = 0 THEN 0
         ELSE ROUND(COALESCE(op.pick_wins,0)::NUMERIC / op.pick_total * 100, 1)
    END                                                                      AS pick_wr,
    CASE WHEN (SELECT cnt FROM total_games) = 0 THEN 0
         ELSE ROUND(COALESCE(op.pick_total,0)::NUMERIC / (SELECT cnt FROM total_games) * 100, 1)
    END                                                                      AS pick_pct,
    COALESCE(tb.ban_total, 0)                                                AS team_ban_total,
    CASE WHEN (SELECT cnt FROM total_games) = 0 THEN 0
         ELSE ROUND(COALESCE(tb.ban_total,0)::NUMERIC / (SELECT cnt FROM total_games) * 100, 1)
    END                                                                      AS team_ban_pct,
    COALESCE(eb.ban_total, 0)                                                AS enemy_ban_total,
    CASE WHEN (SELECT cnt FROM total_games) = 0 THEN 0
         ELSE ROUND(COALESCE(eb.ban_total,0)::NUMERIC / (SELECT cnt FROM total_games) * 100, 1)
    END                                                                      AS enemy_ban_pct,
    COALESCE(op.pick_total,0) + COALESCE(tb.ban_total,0) + COALESCE(eb.ban_total,0)
                                                                             AS pb_total,
    CASE WHEN (SELECT cnt FROM total_games) = 0 THEN 0
         ELSE ROUND(
           (COALESCE(op.pick_total,0) + COALESCE(tb.ban_total,0) + COALESCE(eb.ban_total,0))::NUMERIC
           / (SELECT cnt FROM total_games) * 100, 1)
    END                                                                      AS pb_pct
  FROM all_heroes ah
  LEFT JOIN our_picks  op ON op.hero_name = ah.hero_name
  LEFT JOIN team_bans  tb ON tb.hero_name = ah.hero_name
  LEFT JOIN enemy_bans eb ON eb.hero_name = ah.hero_name
  ORDER BY pb_total DESC, pick_total DESC;
$$;

-- ── 5. RPC: get_hero_detail ───────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_hero_detail(p_org_id UUID, p_hero_name TEXT)
RETURNS JSON
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH
    org_scrims AS (
      SELECT s.id AS scrim_id
      FROM scrims s
      WHERE s.organization_id = p_org_id
        AND s.status = 'completed'
    ),
    -- All game instances where this hero was picked on our side
    hero_game_instances AS (
      SELECT sdp.scrim_id, sdp.game_number, sdp.player_id, sgr.is_win
      FROM scrim_draft_picks sdp
      JOIN scrim_game_results sgr
        ON sgr.scrim_id = sdp.scrim_id
       AND sgr.game_number = sdp.game_number
      WHERE sdp.scrim_id IN (SELECT scrim_id FROM org_scrims)
        AND sdp.side = 'our'
        AND sdp.hero_name = p_hero_name
    ),
    -- 1. Played by player
    played_by_player AS (
      SELECT
        COALESCE(pr.display_name, 'Unknown')              AS display_name,
        COUNT(*)::INT                                      AS total,
        COUNT(*) FILTER (WHERE hgi.is_win = true)::INT    AS wins,
        COUNT(*) FILTER (WHERE hgi.is_win = false)::INT   AS losses,
        CASE WHEN COUNT(*) = 0 THEN 0::NUMERIC
             ELSE ROUND(COUNT(*) FILTER (WHERE hgi.is_win = true)::NUMERIC / COUNT(*) * 100, 1)
        END                                                AS win_rate
      FROM hero_game_instances hgi
      JOIN profiles pr ON pr.id = hgi.player_id
      WHERE hgi.player_id IS NOT NULL
      GROUP BY hgi.player_id, pr.display_name
      ORDER BY total DESC
    ),
    -- 2. Played with (self-join: same game our side, different hero)
    played_with AS (
      SELECT
        companion.hero_name,
        COUNT(*)::INT                                      AS total,
        COUNT(*) FILTER (WHERE hgi.is_win = true)::INT    AS wins,
        COUNT(*) FILTER (WHERE hgi.is_win = false)::INT   AS losses,
        CASE WHEN COUNT(*) = 0 THEN 0::NUMERIC
             ELSE ROUND(COUNT(*) FILTER (WHERE hgi.is_win = true)::NUMERIC / COUNT(*) * 100, 1)
        END                                                AS win_rate
      FROM hero_game_instances hgi
      JOIN scrim_draft_picks companion
        ON companion.scrim_id = hgi.scrim_id
       AND companion.game_number = hgi.game_number
       AND companion.side = 'our'
       AND companion.hero_name <> p_hero_name
      GROUP BY companion.hero_name
      ORDER BY total DESC
      LIMIT 10
    ),
    -- 3. Played against (enemy picks in same game)
    played_against AS (
      SELECT
        enemy_pick.hero_name,
        COUNT(*)::INT                                      AS total,
        COUNT(*) FILTER (WHERE hgi.is_win = true)::INT    AS wins,
        COUNT(*) FILTER (WHERE hgi.is_win = false)::INT   AS losses,
        CASE WHEN COUNT(*) = 0 THEN 0::NUMERIC
             ELSE ROUND(COUNT(*) FILTER (WHERE hgi.is_win = true)::NUMERIC / COUNT(*) * 100, 1)
        END                                                AS win_rate
      FROM hero_game_instances hgi
      JOIN scrim_draft_picks enemy_pick
        ON enemy_pick.scrim_id = hgi.scrim_id
       AND enemy_pick.game_number = hgi.game_number
       AND enemy_pick.side = 'enemy'
      GROUP BY enemy_pick.hero_name
      ORDER BY total DESC
      LIMIT 10
    )
  SELECT json_build_object(
    'played_by_player',
      COALESCE((SELECT json_agg(row_to_json(pbp.*)) FROM played_by_player pbp), '[]'::json),
    'played_with',
      COALESCE((SELECT json_agg(row_to_json(pw.*))  FROM played_with pw),        '[]'::json),
    'played_against',
      COALESCE((SELECT json_agg(row_to_json(pa.*))  FROM played_against pa),     '[]'::json)
  );
$$;
```

- [ ] **Step 1.2: Apply migration**

```bash
npx supabase db push
```

Expected: migration applied without errors.

- [ ] **Step 1.3: Commit**

```bash
rtk git add supabase/migrations/20260522100000_hero_statistics.sql
rtk git commit -m "feat(db): add scrim_draft_bans table + hero statistics RPC functions"
```

---

## Task 2: Fix finishScrimAction — save bans to scrim_draft_bans

**Files:**
- Modify: `features/scrim/actions/finishScrimAction.ts`

- [ ] **Step 2.1: Add `bans` to `GameInput` and save to `scrim_draft_bans`**

In `features/scrim/actions/finishScrimAction.ts`, apply these changes:

```typescript
// Replace the GameInput interface — add bans field
interface GameInput {
  gameNumber: number;
  isWin: boolean;
  notes: string | null;
  imageUrl: string | null;
  draftPicks?: DraftPickInput[];
  bans?: { our: string[]; enemy: string[] };  // ADD THIS
}
```

Then after the draft picks upsert block (after line `if (draftErr) return ...`), add the ban saving block:

```typescript
  // Ban data → scrim_draft_bans
  const banRows = input.games.flatMap((g) => {
    const rows: Array<{
      scrim_id: string;
      game_number: number;
      side: "our" | "enemy";
      hero_name: string;
      ban_order: number;
    }> = [];
    const ourBans = g.bans?.our ?? [];
    const enemyBans = g.bans?.enemy ?? [];
    ourBans.forEach((hero, idx) => {
      if (hero) rows.push({ scrim_id: input.scrimId, game_number: g.gameNumber, side: "our", hero_name: hero, ban_order: idx + 1 });
    });
    enemyBans.forEach((hero, idx) => {
      if (hero) rows.push({ scrim_id: input.scrimId, game_number: g.gameNumber, side: "enemy", hero_name: hero, ban_order: idx + 1 });
    });
    return rows;
  });
  if (banRows.length > 0) {
    const { error: banErr } = await admin
      .from("scrim_draft_bans")
      .upsert(banRows, { onConflict: "scrim_id,game_number,side,ban_order" });
    if (banErr) return { ok: false, message: banErr.message };
  }
```

- [ ] **Step 2.2: Commit**

```bash
rtk git add features/scrim/actions/finishScrimAction.ts
rtk git commit -m "feat(scrim): save ban heroes to scrim_draft_bans on finish"
```

---

## Task 3: Fix FinishScrimForm — remove ban-as-picks hack, pass bans separately

**Files:**
- Modify: `features/scrim/components/FinishScrimForm.tsx`

**Context:** Lines 258-263 currently map bans into `draftPicks` with `role: 'ban_1'` etc. This fails the DB CHECK constraint on `scrim_draft_picks.role`. Remove this and pass bans via the new `bans` field.

- [ ] **Step 3.1: Fix the game payload in `handleSubmit`**

Find the `games: games.map(...)` block in `handleSubmit` (lines ~236-265). Replace the `draftPicks` array construction to remove the ban rows, and add `bans`:

```typescript
      games: games.map((g, i) => ({
        gameNumber: i + 1,
        isWin: g.isWin!,
        notes: g.notes || null,
        imageUrl: g.imageUrl,
        bans: {
          our: g.draft.bans?.our ?? [],
          enemy: g.draft.bans?.enemy ?? [],
        },
        draftPicks: [
          ...Object.entries(g.draft.our)
            .filter(([, slot]) => slot.hero)
            .map(([role, slot]) => ({
              side: "our" as const,
              role,
              hero_name: slot.hero,
              player_id: slot.playerId,
            })),
          ...Object.entries(g.draft.enemy)
            .filter(([, hero]) => hero)
            .map(([role, hero]) => ({
              side: "enemy" as const,
              role,
              hero_name: hero,
              player_id: null,
            })),
          // Bans removed from here — now saved to scrim_draft_bans separately
        ],
      })),
```

- [ ] **Step 3.2: Commit**

```bash
rtk git add features/scrim/components/FinishScrimForm.tsx
rtk git commit -m "fix(scrim): pass bans separately to finishScrimAction, remove invalid ban-as-picks hack"
```

---

## Task 4: Add hero statistics queries

**Files:**
- Modify: `features/analytics/queries.ts`

- [ ] **Step 4.1: Add types and query functions at end of file**

Append to `features/analytics/queries.ts`:

```typescript
// ─── Hero Statistics (RPC-backed) ─────────────────────────────────────────────

export interface HeroStatRow {
  hero_name: string;
  pick_total: number;
  pick_wins: number;
  pick_losses: number;
  pick_wr: number;
  pick_pct: number;
  team_ban_total: number;
  team_ban_pct: number;
  enemy_ban_total: number;
  enemy_ban_pct: number;
  pb_total: number;
  pb_pct: number;
}

export interface HeroDetailPlayerRow {
  display_name: string;
  total: number;
  wins: number;
  losses: number;
  win_rate: number;
}

export interface HeroDetailHeroRow {
  hero_name: string;
  total: number;
  wins: number;
  losses: number;
  win_rate: number;
}

export interface HeroDetailData {
  played_by_player: HeroDetailPlayerRow[];
  played_with: HeroDetailHeroRow[];
  played_against: HeroDetailHeroRow[];
}

export async function getHeroStatistics(orgId: string): Promise<HeroStatRow[]> {
  const supabase = await createClient();
  const { data, error } = await (supabase as any).rpc("get_hero_statistics", { p_org_id: orgId });
  if (error) throw new Error(error.message);
  return (data ?? []) as HeroStatRow[];
}

export async function getHeroDetail(orgId: string, heroName: string): Promise<HeroDetailData> {
  const supabase = await createClient();
  const { data, error } = await (supabase as any).rpc("get_hero_detail", {
    p_org_id: orgId,
    p_hero_name: heroName,
  });
  if (error) throw new Error(error.message);
  const result = data as HeroDetailData | null;
  return {
    played_by_player: result?.played_by_player ?? [],
    played_with: result?.played_with ?? [],
    played_against: result?.played_against ?? [],
  };
}
```

- [ ] **Step 4.2: Commit**

```bash
rtk git add features/analytics/queries.ts
rtk git commit -m "feat(analytics): add getHeroStatistics + getHeroDetail RPC queries"
```

---

## Task 5: Add server actions for lazy-load

**Files:**
- Modify: `features/analytics/actions.ts`

- [ ] **Step 5.1: Add two server actions at end of file**

Append to `features/analytics/actions.ts` (after existing `fetchPlayerHeroHistory`):

```typescript
import type {
  HeroStatRow,
  HeroDetailData,
} from "@/features/analytics/queries";
import {
  getHeroStatistics,
  getHeroDetail,
} from "@/features/analytics/queries";

export async function getHeroStatisticsAction(
  orgId: string,
): Promise<{ ok: true; data: HeroStatRow[] } | { ok: false; message: string }> {
  try {
    const data = await getHeroStatistics(orgId);
    return { ok: true, data };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Gagal memuat statistik hero" };
  }
}

export async function getHeroDetailAction(
  orgId: string,
  heroName: string,
): Promise<{ ok: true; data: HeroDetailData } | { ok: false; message: string }> {
  try {
    const data = await getHeroDetail(orgId, heroName);
    return { ok: true, data };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Gagal memuat detail hero" };
  }
}
```

- [ ] **Step 5.2: Commit**

```bash
rtk git add features/analytics/actions.ts
rtk git commit -m "feat(analytics): add getHeroStatisticsAction + getHeroDetailAction server actions"
```

---

## Task 6: Create StatisticsTab component

**Files:**
- Create: `features/analytics/components/tabs/StatisticsTab.tsx`

- [ ] **Step 6.1: Create the component**

```typescript
"use client";

import { useEffect, useState } from "react";
import { ChevronUp, ChevronDown, BarChart2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";
import { getHeroImageUrl } from "@/features/scrim/data/mlbb-heroes";
import { getHeroStatisticsAction } from "@/features/analytics/actions";
import type { HeroStatRow } from "@/features/analytics/queries";
import { HeroStatDetailModal } from "@/features/analytics/components/HeroStatDetailModal";

type SortKey = keyof Pick<
  HeroStatRow,
  | "pick_total" | "pick_wins" | "pick_losses" | "pick_wr" | "pick_pct"
  | "team_ban_total" | "team_ban_pct"
  | "enemy_ban_total" | "enemy_ban_pct"
  | "pb_total" | "pb_pct"
>;

function SortBtn({
  col,
  sortKey,
  dir,
  onSort,
  children,
}: {
  col: SortKey;
  sortKey: SortKey;
  dir: "asc" | "desc";
  onSort: (k: SortKey) => void;
  children: React.ReactNode;
}) {
  const active = col === sortKey;
  return (
    <button
      type="button"
      onClick={() => onSort(col)}
      className={cn(
        "flex w-full cursor-pointer items-center justify-center gap-0.5 text-[10px] font-semibold uppercase tracking-wider transition-colors",
        active ? "text-yellow-400" : "text-[#6B6A68] hover:text-[#9B9A97]",
      )}
    >
      {children}
      {active && (
        dir === "desc"
          ? <ChevronDown className="h-2.5 w-2.5" />
          : <ChevronUp className="h-2.5 w-2.5" />
      )}
    </button>
  );
}

function WrChip({ wr }: { wr: number }) {
  return (
    <span
      className={cn(
        "inline-block text-[11px] font-semibold",
        wr >= 60 ? "text-emerald-400" : wr >= 50 ? "text-yellow-400" : wr > 0 ? "text-rose-400" : "text-[#4B4A48]",
      )}
    >
      {wr > 0 ? `${wr}%` : "—"}
    </span>
  );
}

export function StatisticsTab({ orgId }: { orgId: string }) {
  const [rows, setRows] = useState<HeroStatRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>("pb_total");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selectedHero, setSelectedHero] = useState<string | null>(null);

  useEffect(() => {
    getHeroStatisticsAction(orgId).then((res) => {
      if (res.ok) setRows(res.data);
      else toast.error(res.message);
      setLoading(false);
    });
  }, [orgId]);

  function handleSort(key: SortKey) {
    if (key === sortKey) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else { setSortKey(key); setSortDir("desc"); }
  }

  const sorted = [...rows].sort((a, b) => {
    const diff = (a[sortKey] as number) - (b[sortKey] as number);
    return sortDir === "desc" ? -diff : diff;
  });

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-11 animate-pulse rounded-xl bg-[#1C1C1C]" />
        ))}
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-[#2D2D2D] bg-[#1C1C1C] p-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#252525]">
          <BarChart2 className="h-6 w-6 text-[#6B6A68]" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[#E5E2E1]">Belum ada data statistik</p>
          <p className="mt-1 text-xs text-[#6B6A68]">
            Selesaikan scrim dengan mengisi draft dan ban hero.
          </p>
        </div>
      </div>
    );
  }

  // CSS Grid: Hero | P.Total | P.W | P.L | P.WR | P.%T | TB.Total | TB.%T | EB.Total | EB.%T | PB.Total | PB.%T | Details
  const GRID = "grid-cols-[180px_repeat(5,52px)_repeat(2,52px)_repeat(2,52px)_repeat(2,52px)_64px]";

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-[#2D2D2D] bg-[#1C1C1C]">
        {/* ── Group header row ── */}
        <div className={cn("grid border-b border-[#2D2D2D] bg-[#202020] px-3 py-1.5 text-center text-[9px] font-semibold uppercase tracking-wider text-[#6B6A68]", GRID)}>
          <span className="text-left">Hero</span>
          <span className="col-span-5">Picks</span>
          <span className="col-span-2">Team Bans</span>
          <span className="col-span-2">Enemy Bans</span>
          <span className="col-span-2">Picks &amp; Bans</span>
          <span>Details</span>
        </div>

        {/* ── Sub-column sort header ── */}
        <div className={cn("grid border-b border-[#2D2D2D] bg-[#1A1A1A] px-3 py-1.5", GRID)}>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#4B4A48]">—</span>
          <SortBtn col="pick_total"  sortKey={sortKey} dir={sortDir} onSort={handleSort}>Total</SortBtn>
          <SortBtn col="pick_wins"   sortKey={sortKey} dir={sortDir} onSort={handleSort}>W</SortBtn>
          <SortBtn col="pick_losses" sortKey={sortKey} dir={sortDir} onSort={handleSort}>L</SortBtn>
          <SortBtn col="pick_wr"     sortKey={sortKey} dir={sortDir} onSort={handleSort}>WR</SortBtn>
          <SortBtn col="pick_pct"    sortKey={sortKey} dir={sortDir} onSort={handleSort}>%T</SortBtn>
          <SortBtn col="team_ban_total" sortKey={sortKey} dir={sortDir} onSort={handleSort}>Total</SortBtn>
          <SortBtn col="team_ban_pct"   sortKey={sortKey} dir={sortDir} onSort={handleSort}>%T</SortBtn>
          <SortBtn col="enemy_ban_total" sortKey={sortKey} dir={sortDir} onSort={handleSort}>Total</SortBtn>
          <SortBtn col="enemy_ban_pct"   sortKey={sortKey} dir={sortDir} onSort={handleSort}>%T</SortBtn>
          <SortBtn col="pb_total" sortKey={sortKey} dir={sortDir} onSort={handleSort}>Total</SortBtn>
          <SortBtn col="pb_pct"   sortKey={sortKey} dir={sortDir} onSort={handleSort}>%T</SortBtn>
          <span />
        </div>

        {/* ── Data rows ── */}
        <div className="divide-y divide-[#252525]">
          {sorted.map((row) => (
            <div
              key={row.hero_name}
              className={cn("grid items-center px-3 py-2 text-center transition-colors hover:bg-[#202020]", GRID)}
            >
              {/* Hero */}
              <div className="flex items-center gap-2 text-left">
                <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full border border-white/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getHeroImageUrl(row.hero_name)}
                    alt={row.hero_name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <span className="truncate text-xs font-medium text-[#E5E2E1]">{row.hero_name}</span>
              </div>
              {/* Picks */}
              <span className="text-xs font-semibold text-[#E5E2E1]">{row.pick_total || "—"}</span>
              <span className="text-xs font-semibold text-emerald-400">{row.pick_wins || "—"}</span>
              <span className="text-xs font-semibold text-rose-400">{row.pick_losses || "—"}</span>
              <WrChip wr={Number(row.pick_wr)} />
              <span className="text-xs text-[#9B9A97]">{row.pick_pct > 0 ? `${row.pick_pct}%` : "—"}</span>
              {/* Team Bans */}
              <span className="text-xs font-semibold text-amber-400">{row.team_ban_total || "—"}</span>
              <span className="text-xs text-[#9B9A97]">{row.team_ban_pct > 0 ? `${row.team_ban_pct}%` : "—"}</span>
              {/* Enemy Bans */}
              <span className="text-xs font-semibold text-violet-400">{row.enemy_ban_total || "—"}</span>
              <span className="text-xs text-[#9B9A97]">{row.enemy_ban_pct > 0 ? `${row.enemy_ban_pct}%` : "—"}</span>
              {/* P&B */}
              <span className="text-xs font-bold text-[#E5E2E1]">{row.pb_total || "—"}</span>
              <span className="text-xs text-[#9B9A97]">{row.pb_pct > 0 ? `${row.pb_pct}%` : "—"}</span>
              {/* Details */}
              <button
                type="button"
                onClick={() => setSelectedHero(row.hero_name)}
                className="cursor-pointer rounded-md border border-[#2D2D2D] px-2 py-1 text-[10px] font-medium text-[#9B9A97] transition hover:border-[#4D4D4D] hover:bg-[#252525] hover:text-[#E5E2E1]"
              >
                Show
              </button>
            </div>
          ))}
        </div>
      </div>

      <HeroStatDetailModal
        orgId={orgId}
        heroName={selectedHero}
        onClose={() => setSelectedHero(null)}
      />
    </>
  );
}
```

- [ ] **Step 6.2: Commit**

```bash
rtk git add features/analytics/components/tabs/StatisticsTab.tsx
rtk git commit -m "feat(analytics): add StatisticsTab with hero pick/ban table + sort"
```

---

## Task 7: Create HeroStatDetailModal component

**Files:**
- Create: `features/analytics/components/HeroStatDetailModal.tsx`

- [ ] **Step 7.1: Create the modal**

```typescript
"use client";

import { useEffect, useState } from "react";
import { X, Users, Swords, Shield } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { getHeroImageUrl } from "@/features/scrim/data/mlbb-heroes";
import { getHeroDetailAction } from "@/features/analytics/actions";
import type { HeroDetailData, HeroDetailPlayerRow, HeroDetailHeroRow } from "@/features/analytics/queries";

interface HeroStatDetailModalProps {
  orgId: string;
  heroName: string | null;
  onClose: () => void;
}

function WrBadge({ wr }: { wr: number }) {
  return (
    <span
      className={cn(
        "text-[11px] font-bold tabular-nums",
        wr >= 60 ? "text-emerald-400" : wr >= 50 ? "text-yellow-400" : wr > 0 ? "text-rose-400" : "text-[#4B4A48]",
      )}
    >
      {wr > 0 ? `${wr}%` : "—"}
    </span>
  );
}

function ColHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5 border-b border-[#2D2D2D] bg-[#202020] px-4 py-3">
      {icon}
      <span className="text-xs font-semibold text-[#E5E2E1]">{label}</span>
    </div>
  );
}

function ColSubHeader() {
  return (
    <div className="grid grid-cols-[1fr_32px_32px_32px_40px] gap-1 border-b border-[#252525] bg-[#1A1A1A] px-4 py-1.5 text-center text-[9px] font-semibold uppercase tracking-wider text-[#4B4A48]">
      <span className="text-left">—</span>
      <span>Tot</span><span>W</span><span>L</span><span>WR</span>
    </div>
  );
}

function PlayerRow({ row }: { row: HeroDetailPlayerRow }) {
  return (
    <div className="grid grid-cols-[1fr_32px_32px_32px_40px] items-center gap-1 px-4 py-2.5 text-center transition-colors hover:bg-[#202020]">
      <span className="truncate text-left text-xs font-medium text-[#E5E2E1]">{row.display_name}</span>
      <span className="text-xs font-semibold text-[#E5E2E1]">{row.total}</span>
      <span className="text-xs font-semibold text-emerald-400">{row.wins}</span>
      <span className="text-xs font-semibold text-rose-400">{row.losses}</span>
      <WrBadge wr={Number(row.win_rate)} />
    </div>
  );
}

function HeroRow({ row }: { row: HeroDetailHeroRow }) {
  return (
    <div className="grid grid-cols-[1fr_32px_32px_32px_40px] items-center gap-1 px-4 py-2 text-center transition-colors hover:bg-[#202020]">
      <div className="flex items-center gap-2">
        <div className="h-5 w-5 shrink-0 overflow-hidden rounded-full border border-white/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={getHeroImageUrl(row.hero_name)} alt={row.hero_name} className="h-full w-full object-cover" />
        </div>
        <span className="truncate text-xs font-medium text-[#E5E2E1]">{row.hero_name}</span>
      </div>
      <span className="text-xs font-semibold text-[#E5E2E1]">{row.total}</span>
      <span className="text-xs font-semibold text-emerald-400">{row.wins}</span>
      <span className="text-xs font-semibold text-rose-400">{row.losses}</span>
      <WrBadge wr={Number(row.win_rate)} />
    </div>
  );
}

function EmptyCol({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      <p className="text-xs text-[#4B4A48]">Belum ada data {label}</p>
    </div>
  );
}

export function HeroStatDetailModal({ orgId, heroName, onClose }: HeroStatDetailModalProps) {
  const [data, setData] = useState<HeroDetailData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!heroName) { setData(null); return; }
    setLoading(true);
    setData(null);
    getHeroDetailAction(orgId, heroName).then((res) => {
      if (res.ok) setData(res.data);
      setLoading(false);
    });
  }, [orgId, heroName]);

  useEffect(() => {
    if (!heroName) return;
    function handleEsc(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [heroName, onClose]);

  if (!heroName) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-[#2D2D2D] bg-[#181818] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Modal header ── */}
        <div className="flex items-center gap-4 border-b border-[#2D2D2D] bg-[#1C1C1C] px-6 py-4">
          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={getHeroImageUrl(heroName)} alt={heroName} className="h-full w-full object-cover" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#E5E2E1]">{heroName}</h2>
            <p className="text-xs text-[#6B6A68]">Detailed Statistics</p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto shrink-0 cursor-pointer rounded-lg p-1.5 text-[#6B6A68] transition hover:bg-[#2C2C2C] hover:text-[#D4D4D4]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Body ── */}
        {loading ? (
          <div className="flex flex-1 items-center justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#2D2D2D] border-t-yellow-400" />
          </div>
        ) : (
          <div className="flex flex-1 overflow-hidden">
            {/* Column 1: Played By Player */}
            <div className="flex w-1/3 flex-col overflow-hidden border-r border-[#2D2D2D]">
              <ColHeader icon={<Users className="h-3.5 w-3.5 text-emerald-400" />} label="Played By Player" />
              <ColSubHeader />
              <div className="flex-1 overflow-y-auto divide-y divide-[#252525]">
                {(data?.played_by_player ?? []).length > 0
                  ? data!.played_by_player.map((r, i) => <PlayerRow key={i} row={r} />)
                  : <EmptyCol label="pemain" />}
              </div>
            </div>

            {/* Column 2: Played With */}
            <div className="flex w-1/3 flex-col overflow-hidden border-r border-[#2D2D2D]">
              <ColHeader icon={<Shield className="h-3.5 w-3.5 text-blue-400" />} label="Played With" />
              <ColSubHeader />
              <div className="flex-1 overflow-y-auto divide-y divide-[#252525]">
                {(data?.played_with ?? []).length > 0
                  ? data!.played_with.map((r, i) => <HeroRow key={i} row={r} />)
                  : <EmptyCol label="kombo" />}
              </div>
            </div>

            {/* Column 3: Played Against */}
            <div className="flex w-1/3 flex-col overflow-hidden">
              <ColHeader icon={<Swords className="h-3.5 w-3.5 text-rose-400" />} label="Played Against" />
              <ColSubHeader />
              <div className="flex-1 overflow-y-auto divide-y divide-[#252525]">
                {(data?.played_against ?? []).length > 0
                  ? data!.played_against.map((r, i) => <HeroRow key={i} row={r} />)
                  : <EmptyCol label="musuh" />}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 7.2: Commit**

```bash
rtk git add features/analytics/components/HeroStatDetailModal.tsx
rtk git commit -m "feat(analytics): add HeroStatDetailModal with 3-column synergy/counter view"
```

---

## Task 8: Wire Statistics tab into AnalyticsDashboard

**Files:**
- Modify: `features/analytics/components/AnalyticsDashboard.tsx`

- [ ] **Step 8.1: Add import, tab key, and tab render**

In `AnalyticsDashboard.tsx`:

1. Add import at top:
```typescript
import { StatisticsTab } from "./tabs/StatisticsTab";
```

2. Replace `TabKey` type:
```typescript
type TabKey = "overview" | "statistics" | "draft" | "players" | "ai";
```

3. Replace `TABS` array:
```typescript
const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "overview",    label: "Overview" },
  { key: "statistics",  label: "Statistics" },
  { key: "draft",       label: "Draft Analytics" },
  { key: "players",     label: "Player Stats" },
  { key: "ai",          label: "AI Insights" },
];
```

4. Add statistics tab content render (after `{activeTab === "overview" && ...}`):
```typescript
{activeTab === "statistics" && <StatisticsTab orgId={orgId} />}
```

- [ ] **Step 8.2: Commit**

```bash
rtk git add features/analytics/components/AnalyticsDashboard.tsx
rtk git commit -m "feat(analytics): wire Statistics tab into AnalyticsDashboard"
```

---

## Task 9: Push to remote

- [ ] **Step 9.1: Final push**

```bash
rtk git push
```

---

## Self-Review Checklist

- [x] **scrim_draft_bans table** — Task 1 ✓
- [x] **ban_order column (1-5)** — Task 1 ✓ (CHECK BETWEEN 1 AND 5)
- [x] **Indexes** — Task 1 ✓ (idx_sdb_scrim, idx_sdb_hero, idx_sdb_scrim_hero, idx_sdp_hero)
- [x] **RLS policy** — Task 1 ✓
- [x] **finishScrimAction saves bans** — Task 2 ✓
- [x] **FinishScrimForm ban-as-picks hack removed** — Task 3 ✓
- [x] **getHeroStatistics RPC** — Task 4 ✓
- [x] **getHeroDetail RPC with self-join** — Task 4 ✓
- [x] **Server actions for lazy-load** — Task 5 ✓
- [x] **StatisticsTab with sortable columns** — Task 6 ✓
- [x] **HeroStatDetailModal — 3 columns** — Task 7 ✓
- [x] **Tab integration** — Task 8 ✓
- [x] **pick_pct denominator is game count not scrim count** — Task 1 SQL ✓
- [x] **No <table> elements — CSS Grid throughout** — Tasks 6, 7 ✓
- [x] **Lucide icons, no emojis** — Tasks 6, 7 ✓
- [x] **toast from sonner for errors** — Task 6 ✓
- [x] **Types defined inline (supabase gen is broken)** — Tasks 4, 7 ✓
