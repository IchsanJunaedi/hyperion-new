# /meta Draft Intelligence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the /meta tier list with SS tier, hero counter/synergy tagging, draft notes, per-patch tier descriptions, and a hero detail slide-in panel — all coach-curated, no external API.

**Architecture:** All changes are additive. Three new nullable columns on `meta_hero_ratings`, one new nullable JSONB column on `meta_patches`, a new `SS` tier value in the check constraint, and new/extended UI components. No existing queries change (new columns are auto-included via `select("*")`).

**Tech Stack:** Next.js 15 App Router, Supabase Postgres, TypeScript strict, Tailwind CSS v4, Lucide React, Sonner toast

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `supabase/migrations/20260522120000_meta_enhancement.sql` | Create | DB: SS tier constraint + new columns |
| `types/database.ts` | Modify | Add new fields to meta_hero_ratings + meta_patches types |
| `features/meta/actions.ts` | Modify | Extend upsert action, add updatePatchSettingsAction |
| `features/meta/components/HeroDetailPanel.tsx` | Create | Slide-in panel: counters, synergies, draft/coach notes |
| `features/meta/components/AddHeroModal.tsx` | Modify | Counter/synergy multi-pickers + draft_notes textarea |
| `features/meta/components/MetaPage.tsx` | Modify | SS tier, hero card click → detail panel, tier descriptions, patch settings |

---

### Task 1: DB Migration

**Files:**
- Create: `supabase/migrations/20260522120000_meta_enhancement.sql`

- [ ] **Step 1: Create migration file**

Create `supabase/migrations/20260522120000_meta_enhancement.sql` with this content:

```sql
-- Extend tier constraint to include SS
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

- [ ] **Step 2: Push migration**

```bash
npx supabase db push
```

Expected: `Applying migration 20260522120000_meta_enhancement.sql... done`

If error "constraint already exists": check the existing migration files in `supabase/migrations/` to find the actual constraint name, then adjust the DROP line accordingly. If error "column already exists": investigate — `IF NOT EXISTS` should handle it.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260522120000_meta_enhancement.sql
git commit -m "feat(meta): migration — SS tier, counters, synergies, draft_notes, tier_descriptions"
```

---

### Task 2: TypeScript Types

**Files:**
- Modify: `types/database.ts` (lines ~1250–1318)

- [ ] **Step 1: Update meta_patches Row, Insert, Update**

Find the `meta_patches` block in `types/database.ts` and replace it entirely with:

```typescript
meta_patches: {
  Row: {
    id: string
    organization_id: string
    patch_version: string
    notes: string | null
    created_by: string | null
    created_at: string
    updated_at: string
    tier_descriptions: Record<string, string> | null
  }
  Insert: {
    id?: string
    organization_id: string
    patch_version: string
    notes?: string | null
    created_by?: string | null
    created_at?: string
    updated_at?: string
    tier_descriptions?: Record<string, string> | null
  }
  Update: {
    id?: string
    organization_id?: string
    patch_version?: string
    notes?: string | null
    created_by?: string | null
    created_at?: string
    updated_at?: string
    tier_descriptions?: Record<string, string> | null
  }
  Relationships: []
}
```

- [ ] **Step 2: Update meta_hero_ratings Row, Insert, Update**

Find the `meta_hero_ratings` block and replace it entirely with:

```typescript
meta_hero_ratings: {
  Row: {
    id: string
    patch_id: string
    hero_name: string
    tier: "SS" | "S" | "A" | "B" | "C" | "D"
    role_tag: "exp_lane" | "jungler" | "mid_lane" | "gold_lane" | "roamer" | null
    is_ban_priority: boolean
    priority_to_learn: boolean
    notes: string | null
    counters: string[] | null
    synergies: string[] | null
    draft_notes: string | null
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: string
    patch_id: string
    hero_name: string
    tier: "SS" | "S" | "A" | "B" | "C" | "D"
    role_tag?: "exp_lane" | "jungler" | "mid_lane" | "gold_lane" | "roamer" | null
    is_ban_priority?: boolean
    priority_to_learn?: boolean
    notes?: string | null
    counters?: string[] | null
    synergies?: string[] | null
    draft_notes?: string | null
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: string
    patch_id?: string
    hero_name?: string
    tier?: "SS" | "S" | "A" | "B" | "C" | "D"
    role_tag?: "exp_lane" | "jungler" | "mid_lane" | "gold_lane" | "roamer" | null
    is_ban_priority?: boolean
    priority_to_learn?: boolean
    notes?: string | null
    counters?: string[] | null
    synergies?: string[] | null
    draft_notes?: string | null
    created_at?: string
    updated_at?: string
  }
  Relationships: []
}
```

- [ ] **Step 3: Verify with getDiagnostics**

Run getDiagnostics on `types/database.ts`. Expect zero errors.

- [ ] **Step 4: Commit**

```bash
git add types/database.ts
git commit -m "feat(meta): update TS types — SS tier, counters, synergies, draft_notes"
```

---

### Task 3: Server Actions

**Files:**
- Modify: `features/meta/actions.ts`

- [ ] **Step 1: Extend upsertHeroRatingAction input shape**

In `features/meta/actions.ts`, find the `upsertHeroRatingAction` function. Replace its `hero` parameter type:

Old:
```typescript
hero: {
  hero_name: string;
  tier: "S" | "A" | "B" | "C" | "D";
  role_tag: "exp_lane" | "jungler" | "mid_lane" | "gold_lane" | "roamer" | null;
  is_ban_priority: boolean;
  priority_to_learn: boolean;
  notes: string;
}
```

New:
```typescript
hero: {
  hero_name: string;
  tier: "SS" | "S" | "A" | "B" | "C" | "D";
  role_tag: "exp_lane" | "jungler" | "mid_lane" | "gold_lane" | "roamer" | null;
  is_ban_priority: boolean;
  priority_to_learn: boolean;
  notes: string;
  draft_notes: string;
  counters: string[];
  synergies: string[];
}
```

Then update the upsert body inside the `admin.from("meta_hero_ratings").upsert(...)` call:

Old upsert body:
```typescript
{
  patch_id: patchId,
  hero_name: hero.hero_name,
  tier: hero.tier,
  role_tag: hero.role_tag,
  is_ban_priority: hero.is_ban_priority,
  priority_to_learn: hero.priority_to_learn,
  notes: hero.notes.trim() || null,
  updated_at: new Date().toISOString(),
}
```

New upsert body:
```typescript
{
  patch_id: patchId,
  hero_name: hero.hero_name,
  tier: hero.tier,
  role_tag: hero.role_tag,
  is_ban_priority: hero.is_ban_priority,
  priority_to_learn: hero.priority_to_learn,
  notes: hero.notes.trim() || null,
  draft_notes: hero.draft_notes.trim() || null,
  counters: hero.counters,
  synergies: hero.synergies,
  updated_at: new Date().toISOString(),
}
```

- [ ] **Step 2: Add updatePatchSettingsAction**

Append this function at the end of `features/meta/actions.ts`:

```typescript
export async function updatePatchSettingsAction(
  orgSlug: string,
  orgId: string,
  patchId: string,
  notes: string,
  tierDescriptions: Record<string, string>,
): Promise<ActionResult> {
  const { user, isCoachPlus } = await getCoachRole(orgId);
  if (!user) return { ok: false, message: "Anda harus login" };
  if (!isCoachPlus) return { ok: false, message: "Hanya coach ke atas yang bisa mengedit meta" };

  const admin = createAdminClient();
  const { error } = await admin
    .from("meta_patches")
    .update({
      notes: notes.trim() || null,
      tier_descriptions: Object.keys(tierDescriptions).length > 0 ? tierDescriptions : null,
    })
    .eq("id", patchId);

  if (error) return { ok: false, message: error.message };
  revalidatePath(`/${orgSlug}/meta`);
  return { ok: true };
}
```

- [ ] **Step 3: Verify with getDiagnostics**

Run getDiagnostics on `features/meta/actions.ts`. Expect zero errors.

- [ ] **Step 4: Commit**

```bash
git add features/meta/actions.ts
git commit -m "feat(meta): extend upsertHeroRating + add updatePatchSettings action"
```

---

### Task 4: HeroDetailPanel Component

**Files:**
- Create: `features/meta/components/HeroDetailPanel.tsx`

- [ ] **Step 1: Create the component file**

Create `features/meta/components/HeroDetailPanel.tsx`:

```typescript
"use client";

import { useState } from "react";
import { X, ArrowLeft, Shield, Star } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { getHeroImageUrl } from "@/features/scrim/data/mlbb-heroes";
import type { MetaHeroRating } from "../queries";

type Tier = "SS" | "S" | "A" | "B" | "C" | "D";

const TIER_STYLES: Record<Tier, { badge: string; label: string; border: string }> = {
  SS: { badge: "bg-violet-500/20 text-violet-300", label: "text-violet-300", border: "border-violet-500/40" },
  S: { badge: "bg-red-500/20 text-red-400", label: "text-red-400", border: "border-red-500/40" },
  A: { badge: "bg-orange-500/20 text-orange-400", label: "text-orange-400", border: "border-orange-500/40" },
  B: { badge: "bg-yellow-500/20 text-yellow-400", label: "text-yellow-400", border: "border-yellow-500/40" },
  C: { badge: "bg-green-500/20 text-green-400", label: "text-green-400", border: "border-green-500/40" },
  D: { badge: "bg-blue-500/20 text-blue-400", label: "text-blue-400", border: "border-blue-500/40" },
};

const ROLE_LABELS: Record<string, string> = {
  exp_lane: "EXP", jungler: "JGL", mid_lane: "MID", gold_lane: "GOLD", roamer: "ROAM",
};

const ROLE_COLORS: Record<string, string> = {
  exp_lane: "text-amber-400", jungler: "text-violet-400", mid_lane: "text-cyan-400",
  gold_lane: "text-yellow-400", roamer: "text-rose-400",
};

function HeroChip({ name, onClick }: { name: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#2D2D2D] bg-[#141414] px-2 py-1 transition hover:border-white/20 hover:bg-[#2C2C2C]"
    >
      <div className="h-6 w-6 shrink-0 overflow-hidden rounded-md">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={getHeroImageUrl(name)}
          alt={name}
          className="h-full w-full object-cover"
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
      </div>
      <span className="text-xs text-white/70">{name}</span>
    </button>
  );
}

interface HeroDetailPanelProps {
  hero: MetaHeroRating;
  allHeroes: MetaHeroRating[];
  onClose: () => void;
}

export function HeroDetailPanel({ hero: initialHero, allHeroes, onClose }: HeroDetailPanelProps) {
  const [navStack, setNavStack] = useState<MetaHeroRating[]>([]);

  const current = navStack.length > 0 ? navStack[navStack.length - 1] : initialHero;
  const isStub = !current.tier;
  const style = current.tier ? TIER_STYLES[current.tier as Tier] : null;
  const counters = current.counters ?? [];
  const synergies = current.synergies ?? [];

  function navigateTo(heroName: string) {
    const found = allHeroes.find((h) => h.hero_name === heroName);
    if (found) {
      setNavStack((prev) => [...prev, found]);
    } else {
      setNavStack((prev) => [...prev, { hero_name: heroName, tier: null } as unknown as MetaHeroRating]);
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />
      <div className="fixed bottom-0 right-0 top-0 z-50 flex w-full max-w-sm flex-col overflow-hidden border-l border-[#2D2D2D] bg-[#1C1C1C] shadow-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-center gap-3 border-b border-[#2D2D2D] px-4 py-3">
          {navStack.length > 0 && (
            <button
              type="button"
              onClick={() => setNavStack((prev) => prev.slice(0, -1))}
              className="cursor-pointer text-white/40 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className={cn("h-12 w-12 shrink-0 overflow-hidden rounded-xl border", style?.border ?? "border-white/10")}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={getHeroImageUrl(current.hero_name)} alt={current.hero_name} className="h-full w-full object-cover" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold text-white">{current.hero_name}</p>
              {!isStub && (
                <div className="mt-0.5 flex items-center gap-2">
                  {current.tier && (
                    <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-black", style?.badge)}>
                      {current.tier}
                    </span>
                  )}
                  {current.role_tag && (
                    <span className={cn("text-[10px] font-semibold", ROLE_COLORS[current.role_tag])}>
                      {ROLE_LABELS[current.role_tag]}
                    </span>
                  )}
                  {current.is_ban_priority && <Shield className="h-3 w-3 text-red-400" />}
                  {current.priority_to_learn && <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />}
                </div>
              )}
            </div>
          </div>
          <button type="button" onClick={onClose} className="cursor-pointer text-white/40 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="sidebar-scroll flex-1 overflow-y-auto">
          {isStub ? (
            <p className="p-6 text-center text-sm text-white/40">Hero ini belum ada di tier list patch ini</p>
          ) : (
            <div className="space-y-5 p-4">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/40">Counters</p>
                {counters.length === 0 ? (
                  <p className="text-xs text-white/25">Belum ditambahkan</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {counters.map((name) => (
                      <HeroChip key={name} name={name} onClick={() => navigateTo(name)} />
                    ))}
                  </div>
                )}
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/40">Synergies</p>
                {synergies.length === 0 ? (
                  <p className="text-xs text-white/25">Belum ditambahkan</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {synergies.map((name) => (
                      <HeroChip key={name} name={name} onClick={() => navigateTo(name)} />
                    ))}
                  </div>
                )}
              </div>

              {current.draft_notes && (
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-white/40">Draft Notes</p>
                  <p className="text-sm leading-relaxed text-white/70">{current.draft_notes}</p>
                </div>
              )}

              {current.notes && (
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-white/40">Coach Notes</p>
                  <p className="text-sm italic leading-relaxed text-white/50">{current.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 2: Verify with getDiagnostics**

Run getDiagnostics on `features/meta/components/HeroDetailPanel.tsx`. Expect zero errors.

- [ ] **Step 3: Commit**

```bash
git add features/meta/components/HeroDetailPanel.tsx
git commit -m "feat(meta): add HeroDetailPanel slide-in component"
```

---

### Task 5: Extend AddHeroModal

**Files:**
- Modify: `features/meta/components/AddHeroModal.tsx`

- [ ] **Step 1: Update Tier type and TIER_COLORS**

At the top of the file, change:
```typescript
type Tier = "S" | "A" | "B" | "C" | "D";
```
to:
```typescript
type Tier = "SS" | "S" | "A" | "B" | "C" | "D";
```

Replace TIER_COLORS entirely:
```typescript
const TIER_COLORS: Record<Tier, string> = {
  SS: "bg-violet-500/20 text-violet-300 border-violet-500/40",
  S: "bg-red-500/20 text-red-400 border-red-500/30",
  A: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  B: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  C: "bg-green-500/20 text-green-400 border-green-500/30",
  D: "bg-blue-500/20 text-blue-400 border-blue-500/30",
};
```

- [ ] **Step 2: Add new state variables**

In the component body, after `const [notes, setNotes] = useState(...)`, add:

```typescript
const [draftNotes, setDraftNotes] = useState(editing?.draft_notes ?? "");
const [counters, setCounters] = useState<string[]>(editing?.counters ?? []);
const [synergies, setSynergies] = useState<string[]>(editing?.synergies ?? []);
```

- [ ] **Step 3: Reset new state in useEffect**

In the existing `useEffect`, inside the `if (open)` block after `setNotes(...)`, add:

```typescript
setDraftNotes(editing?.draft_notes ?? "");
setCounters(editing?.counters ?? []);
setSynergies(editing?.synergies ?? []);
```

- [ ] **Step 4: Update handleSave to pass new fields**

In `handleSave`, replace the `upsertHeroRatingAction` call:

Old:
```typescript
const res = await upsertHeroRatingAction(orgSlug, orgId, patchId, {
  hero_name: selectedHero,
  tier,
  role_tag: roleTag,
  is_ban_priority: isBan,
  priority_to_learn: isPriority,
  notes,
});
```

New:
```typescript
const res = await upsertHeroRatingAction(orgSlug, orgId, patchId, {
  hero_name: selectedHero,
  tier,
  role_tag: roleTag,
  is_ban_priority: isBan,
  priority_to_learn: isPriority,
  notes,
  draft_notes: draftNotes,
  counters,
  synergies,
});
```

- [ ] **Step 5: Update tier buttons to include SS**

In the JSX tier buttons section, change `["S", "A", "B", "C", "D"] as Tier[]` to `["SS", "S", "A", "B", "C", "D"] as Tier[]`.

- [ ] **Step 6: Add MultiHeroPicker helper component**

Add this function above the `AddHeroModal` export (it's file-local):

```typescript
function MultiHeroPicker({
  label,
  selected,
  onToggle,
  excludeHero,
}: {
  label: string;
  selected: string[];
  onToggle: (name: string) => void;
  excludeHero: string;
}) {
  const [search, setSearch] = useState("");
  const available = MLBB_HEROES.filter((h) => h !== excludeHero);
  const filtered = search
    ? available.filter((h) => h.toLowerCase().includes(search.toLowerCase()))
    : available;

  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-white/60">{label}</label>
      {selected.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {selected.map((name) => (
            <span
              key={name}
              className="flex items-center gap-1 rounded-full border border-[#2D2D2D] bg-[#141414] px-2 py-0.5 text-xs text-white/70"
            >
              {name}
              <button
                type="button"
                onClick={() => onToggle(name)}
                className="cursor-pointer text-white/30 hover:text-white"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2 rounded-md border border-[#2D2D2D] bg-[#141414] px-3 py-1.5">
        <Search className="h-3 w-3 shrink-0 text-white/30" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari hero..."
          className="flex-1 bg-transparent text-xs text-white placeholder-white/30 outline-none"
        />
      </div>
      {search && (
        <ul className="sidebar-scroll mt-1 max-h-28 overflow-y-auto rounded-md border border-[#2D2D2D] bg-[#141414]">
          {filtered.slice(0, 30).map((h) => (
            <li key={h}>
              <button
                type="button"
                onClick={() => { onToggle(h); setSearch(""); }}
                className={cn(
                  "w-full cursor-pointer px-3 py-1 text-left text-xs transition",
                  selected.includes(h)
                    ? "text-yellow-400 hover:bg-yellow-500/10"
                    : "text-white/60 hover:bg-[#2C2C2C] hover:text-white",
                )}
              >
                {selected.includes(h) ? `✓ ${h}` : h}
              </button>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="px-3 py-2 text-center text-xs text-white/30">Tidak ditemukan</li>
          )}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 7: Add new fields to the modal form JSX**

In the modal's `<div className="space-y-4 p-5">` section, after the existing Notes textarea block and before the Actions buttons block, add:

```tsx
{/* Draft Notes */}
<div>
  <label className="mb-1.5 block text-xs font-medium text-white/60">Draft Notes (opsional)</label>
  <textarea
    value={draftNotes}
    onChange={(e) => setDraftNotes(e.target.value)}
    rows={2}
    placeholder="Misal: kuat di turtle fight, pair dengan Atlas..."
    className="w-full resize-none rounded-md border border-[#2D2D2D] bg-[#141414] px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-white/30"
  />
</div>

{/* Counters */}
<MultiHeroPicker
  label="Counters"
  selected={counters}
  onToggle={(name) =>
    setCounters((prev) =>
      prev.includes(name) ? prev.filter((h) => h !== name) : [...prev, name],
    )
  }
  excludeHero={selectedHero || editing?.hero_name || ""}
/>

{/* Synergies */}
<MultiHeroPicker
  label="Synergies"
  selected={synergies}
  onToggle={(name) =>
    setSynergies((prev) =>
      prev.includes(name) ? prev.filter((h) => h !== name) : [...prev, name],
    )
  }
  excludeHero={selectedHero || editing?.hero_name || ""}
/>
```

- [ ] **Step 8: Verify with getDiagnostics**

Run getDiagnostics on `features/meta/components/AddHeroModal.tsx`. Expect zero errors.

- [ ] **Step 9: Commit**

```bash
git add features/meta/components/AddHeroModal.tsx
git commit -m "feat(meta): counter/synergy pickers and draft_notes in edit modal"
```

---

### Task 6: Update MetaPage

**Files:**
- Modify: `features/meta/components/MetaPage.tsx`

#### 6a: SS Tier

- [ ] **Step 1: Update Tier type and TIERS array**

Change:
```typescript
type Tier = "S" | "A" | "B" | "C" | "D";
const TIERS: Tier[] = ["S", "A", "B", "C", "D"];
```
to:
```typescript
type Tier = "SS" | "S" | "A" | "B" | "C" | "D";
const TIERS: Tier[] = ["SS", "S", "A", "B", "C", "D"];
```

- [ ] **Step 2: Add SS to TIER_STYLES**

Replace TIER_STYLES entirely:

```typescript
const TIER_STYLES: Record<Tier, { bg: string; border: string; badge: string; label: string; activeBorder: string }> = {
  SS: { bg: "bg-violet-500/5", border: "border-violet-500/30", badge: "bg-violet-500/20 text-violet-300", label: "text-violet-300", activeBorder: "border-violet-500/50" },
  S: { bg: "bg-red-500/5", border: "border-red-500/30", badge: "bg-red-500/20 text-red-400", label: "text-red-400", activeBorder: "border-red-500/50" },
  A: { bg: "bg-orange-500/5", border: "border-orange-500/30", badge: "bg-orange-500/20 text-orange-400", label: "text-orange-400", activeBorder: "border-orange-500/50" },
  B: { bg: "bg-yellow-500/5", border: "border-yellow-500/30", badge: "bg-yellow-500/20 text-yellow-400", label: "text-yellow-400", activeBorder: "border-yellow-500/50" },
  C: { bg: "bg-green-500/5", border: "border-green-500/30", badge: "bg-green-500/20 text-green-400", label: "text-green-400", activeBorder: "border-green-500/50" },
  D: { bg: "bg-blue-500/5", border: "border-blue-500/30", badge: "bg-blue-500/20 text-blue-400", label: "text-blue-400", activeBorder: "border-blue-500/50" },
};
```

#### 6b: Tier Descriptions

- [ ] **Step 3: Add TIER_DESCRIPTIONS_DEFAULT constant**

Add this constant after TIER_STYLES:

```typescript
const TIER_DESCRIPTIONS_DEFAULT: Record<Tier, string> = {
  SS: "Meta-defining — always ban or first-pick",
  S: "Dominant — ban or first-pick when available",
  A: "Reliable in most compositions",
  B: "Situationally strong with the right comp",
  C: "Niche picks — requires specific conditions",
  D: "Avoid unless heavily mastered",
};
```

- [ ] **Step 4: Show tier description in tier row**

In the JSX tier row (inside `TIERS.map((tier) => {...})`), find the tier badge column:

```tsx
<div className="flex shrink-0 flex-col items-center gap-1">
  <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg text-xl font-black", style.badge)}>
    {tier}
  </div>
  <span className="text-[9px] text-white/30">
    {roleFilter === "all" ? totalInTier : `${tierHeroes.length}/${totalInTier}`}
  </span>
</div>
```

Replace with:

```tsx
<div className="flex shrink-0 flex-col items-center gap-1">
  <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg text-xl font-black", style.badge)}>
    {tier}
  </div>
  <span className="text-[9px] text-white/30">
    {roleFilter === "all" ? totalInTier : `${tierHeroes.length}/${totalInTier}`}
  </span>
  <span className="mt-0.5 hidden max-w-[80px] text-center text-[8px] italic leading-tight text-white/25 sm:block">
    {(activePatch?.tier_descriptions as Record<string, string> | null)?.[tier] ?? TIER_DESCRIPTIONS_DEFAULT[tier]}
  </span>
</div>
```

#### 6c: Hero Card Click → Detail Panel

- [ ] **Step 5: Import HeroDetailPanel and add detailHero state**

Add import:
```typescript
import { HeroDetailPanel } from "./HeroDetailPanel";
```

Add import for `Settings` icon to the existing lucide-react import:
```typescript
import { Plus, Pencil, X, Trash2, Shield, Star, Search, Settings } from "lucide-react";
```

Add state in MetaPage component (after existing state declarations):
```typescript
const [detailHero, setDetailHero] = useState<MetaHeroRating | null>(null);
const [showPatchSettings, setShowPatchSettings] = useState(false);
const [settingsNotes, setSettingsNotes] = useState("");
const [settingsDescriptions, setSettingsDescriptions] = useState<Record<string, string>>({});
```

Also add the new action import:
```typescript
import {
  deleteHeroRatingAction,
  createMetaPatchAction,
  deleteMetaPatchAction,
  upsertHeroRatingAction,
  updatePatchSettingsAction,
} from "../actions";
```

- [ ] **Step 6: Add onDetail prop to HeroCard component**

Change the `HeroCard` function signature from:
```typescript
function HeroCard({
  hero,
  editMode,
  onEdit,
  onDelete,
}: {
  hero: MetaHeroRating;
  editMode: boolean;
  onEdit: (h: MetaHeroRating) => void;
  onDelete: (id: string, name: string) => void;
})
```
to:
```typescript
function HeroCard({
  hero,
  editMode,
  onEdit,
  onDelete,
  onDetail,
}: {
  hero: MetaHeroRating;
  editMode: boolean;
  onEdit: (h: MetaHeroRating) => void;
  onDelete: (id: string, name: string) => void;
  onDetail: (h: MetaHeroRating) => void;
})
```

In `HeroCard`, change the image container div:
```tsx
<div
  className={cn(
    "relative aspect-square w-full overflow-hidden rounded-xl border-2 transition group-hover:scale-105",
    style.border,
  )}
>
```
to:
```tsx
<div
  className={cn(
    "relative aspect-square w-full overflow-hidden rounded-xl border-2 transition group-hover:scale-105",
    style.border,
    !editMode && "cursor-pointer",
  )}
  onClick={() => !editMode && onDetail(hero)}
>
```

- [ ] **Step 7: Pass onDetail everywhere HeroCard is used**

In the tier list tab, update the `<HeroCard>` render:
```tsx
<HeroCard
  key={h.id}
  hero={h}
  editMode={editMode}
  onEdit={openEditModal}
  onDelete={handleDelete}
  onDetail={setDetailHero}
/>
```

For the ban tab, find each `<div key={h.id} className="group relative w-[72px] shrink-0 select-none">` and add `cursor-pointer` + onClick:
```tsx
<div
  key={h.id}
  className="group relative w-[72px] shrink-0 cursor-pointer select-none"
  onClick={() => setDetailHero(h)}
>
```

For the learn tab, do the same to each `<div key={h.id} className="group relative w-[72px] shrink-0 select-none">`:
```tsx
<div
  key={h.id}
  className="group relative w-[72px] shrink-0 cursor-pointer select-none"
  onClick={() => setDetailHero(h)}
>
```

- [ ] **Step 8: Render HeroDetailPanel**

After the closing `</AddHeroModal>` tag, add:
```tsx
{detailHero && (
  <HeroDetailPanel
    hero={detailHero}
    allHeroes={heroes}
    onClose={() => setDetailHero(null)}
  />
)}
```

#### 6d: Patch Settings

- [ ] **Step 9: Add gear icon button next to active patch**

In the patch selector row, after the `{patchList.length === 0 && ...}` block and the "Patch Baru" button, add:

```tsx
{activePatch && canEdit && (
  <button
    type="button"
    onClick={() => {
      setSettingsNotes(activePatch.notes ?? "");
      setSettingsDescriptions((activePatch.tier_descriptions as Record<string, string>) ?? {});
      setShowPatchSettings((v) => !v);
    }}
    className={cn(
      "inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border transition",
      showPatchSettings
        ? "border-yellow-500/50 bg-yellow-500/10 text-yellow-400"
        : "border-[#2D2D2D] text-white/40 hover:border-white/20 hover:text-white/70",
    )}
  >
    <Settings className="h-3.5 w-3.5" />
  </button>
)}
```

- [ ] **Step 10: Add patch settings form**

After the `{showNewPatchForm && canEdit && (...)}` block, add:

```tsx
{showPatchSettings && activePatch && canEdit && (
  <div className="space-y-4 rounded-xl border border-[#2D2D2D] bg-[#1C1C1C] p-4">
    <p className="text-xs font-medium text-white/70">Pengaturan Patch {activePatch.patch_version}</p>

    <div>
      <label className="mb-1 block text-xs text-white/50">Catatan patch</label>
      <input
        value={settingsNotes}
        onChange={(e) => setSettingsNotes(e.target.value)}
        placeholder="Catatan singkat tentang patch ini..."
        className="w-full rounded-md border border-[#2D2D2D] bg-[#141414] px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-white/30"
      />
    </div>

    <div>
      <label className="mb-2 block text-xs text-white/50">Deskripsi tier</label>
      <div className="space-y-2">
        {(["SS", "S", "A", "B", "C", "D"] as Tier[]).map((t) => (
          <div key={t} className="flex items-center gap-3">
            <span className={cn("w-7 shrink-0 text-center text-xs font-bold", TIER_STYLES[t].label)}>{t}</span>
            <input
              value={settingsDescriptions[t] ?? ""}
              onChange={(e) =>
                setSettingsDescriptions((prev) => ({ ...prev, [t]: e.target.value }))
              }
              placeholder={TIER_DESCRIPTIONS_DEFAULT[t]}
              className="flex-1 rounded-md border border-[#2D2D2D] bg-[#141414] px-3 py-1.5 text-xs text-white placeholder-white/25 outline-none focus:border-white/30"
            />
          </div>
        ))}
      </div>
    </div>

    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => setShowPatchSettings(false)}
        className="cursor-pointer rounded-md border border-[#2D2D2D] px-4 py-1.5 text-sm text-white/60 transition hover:bg-white/5"
      >
        Batal
      </button>
      <button
        type="button"
        onClick={() => {
          startTransition(async () => {
            const res = await updatePatchSettingsAction(
              orgSlug,
              orgId,
              activePatch.id,
              settingsNotes,
              settingsDescriptions,
            );
            if (res.ok) {
              setActivePatch((prev) =>
                prev
                  ? {
                      ...prev,
                      notes: settingsNotes.trim() || null,
                      tier_descriptions:
                        Object.keys(settingsDescriptions).length > 0
                          ? settingsDescriptions
                          : null,
                    }
                  : prev,
              );
              setShowPatchSettings(false);
              toast.success("Pengaturan patch disimpan");
            } else {
              toast.error(res.message);
            }
          });
        }}
        disabled={pending}
        className="cursor-pointer rounded-md bg-yellow-400 px-4 py-1.5 text-sm font-semibold text-black transition hover:bg-yellow-300 disabled:opacity-50"
      >
        {pending ? "Menyimpan..." : "Simpan"}
      </button>
    </div>
  </div>
)}
```

#### 6e: Update HeroPickerPanel caller

- [ ] **Step 11: Pass new required fields from HeroPickerPanel**

In `HeroPickerPanel`'s `handleConfirm` function, update the `upsertHeroRatingAction` call to include the new required fields (empty values — the picker is for quick-add, detail editing uses AddHeroModal):

```typescript
const res = await upsertHeroRatingAction(orgSlug, orgId, patchId, {
  hero_name: selected,
  tier,
  role_tag: configRole,
  is_ban_priority: configBan,
  priority_to_learn: configLearn,
  notes: "",
  draft_notes: "",
  counters: [],
  synergies: [],
});
```

- [ ] **Step 12: Verify with getDiagnostics**

Run getDiagnostics on `features/meta/components/MetaPage.tsx`. Expect zero errors.

- [ ] **Step 13: Commit**

```bash
git add features/meta/components/MetaPage.tsx
git commit -m "feat(meta): SS tier, hero detail panel, tier descriptions, patch settings"
```

---

## Manual Testing Checklist

After all tasks complete, verify in the browser at `/{org-slug}/meta`:

- [ ] Page loads without console errors
- [ ] Patch selector shows correctly; gear icon visible when coach is logged in
- [ ] Patch settings form opens on gear click; saves tier descriptions and notes; descriptions appear under tier badges immediately after save
- [ ] SS tier row appears above S with violet/purple styling
- [ ] Adding a hero to SS tier via the inline picker works; hero card shows SS badge
- [ ] Clicking a hero card (non-edit mode) opens the detail panel from the right
- [ ] Detail panel shows tier badge, role, ban/learn flags in header
- [ ] ESC key or backdrop click closes the panel (note: ESC requires a `useEffect` key listener if needed — backdrop click is implemented, ESC is not in this plan; add if desired)
- [ ] After editing a hero with counters and synergies, detail panel shows the chips
- [ ] Clicking a counter/synergy chip navigates to that hero; back arrow returns
- [ ] Clicking a chip for a hero not in the tier list shows "Hero ini belum ada di tier list patch ini"
- [ ] Edit modal (pencil icon in edit mode) shows draft_notes textarea, counters/synergy pickers; data persists after save + page reload
- [ ] Ban Priority tab: clicking hero card opens detail panel
- [ ] Priority to Learn tab: clicking hero card opens detail panel
- [ ] Role filter still works correctly on tier list
