# Meta Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a patch-versioned MLBB hero tier list with ban priority and priority-to-learn sections, editable by coach/manager/owner and readable by all members.

**Architecture:** Two DB tables (`meta_patches` + `meta_hero_ratings`) scoped to an organization with RLS. Server Components fetch data; Server Actions mutate. Client component handles edit-mode UI (add/edit hero modal, tier selection). Sidebar gets a new "Meta" nav item in the KOMPETISI group.

**Tech Stack:** Next.js 15 App Router, Supabase (Postgres + RLS), TypeScript strict, Tailwind CSS v4, Lucide React, Sonner toast, `cn()` from `@/lib/utils/cn`.

---

## File Map

| Path | Action | Purpose |
|------|--------|---------|
| `supabase/migrations/20260521200000_meta_tracker.sql` | Create | DB schema + RLS for meta_patches + meta_hero_ratings |
| `types/database.ts` | Modify | Add Row/Insert/Update types for both tables |
| `features/meta/queries.ts` | Create | getPatches, getPatchWithHeroes |
| `features/meta/actions.ts` | Create | createPatch, upsertHeroRating, deleteHeroRating, deletePatch |
| `features/meta/components/MetaPage.tsx` | Create | Main client component (tabs, edit mode, patch selector) |
| `features/meta/components/AddHeroModal.tsx` | Create | Modal to add/edit a hero's tier + meta info |
| `app/[team-slug]/(workspace)/meta/page.tsx` | Create | Server page — fetches data, passes to MetaPage |
| `components/layout/WorkspaceSidebar.tsx` | Modify | Add "Meta" nav item in KOMPETISI group |

---

## Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/20260521200000_meta_tracker.sql`

- [ ] **Step 1: Write migration file**

```sql
-- meta_patches: one row per patch version per org
CREATE TABLE IF NOT EXISTS meta_patches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  patch_version   TEXT NOT NULL,
  notes           TEXT,
  created_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, patch_version)
);

-- meta_hero_ratings: one row per hero per patch
CREATE TABLE IF NOT EXISTS meta_hero_ratings (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patch_id         UUID NOT NULL REFERENCES meta_patches(id) ON DELETE CASCADE,
  hero_name        TEXT NOT NULL,
  tier             TEXT NOT NULL CHECK (tier IN ('S', 'A', 'B', 'C', 'D')),
  role_tag         TEXT CHECK (role_tag IS NULL OR role_tag IN ('exp_lane','jungler','mid_lane','gold_lane','roamer')),
  is_ban_priority  BOOLEAN NOT NULL DEFAULT false,
  priority_to_learn BOOLEAN NOT NULL DEFAULT false,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(patch_id, hero_name)
);

CREATE INDEX IF NOT EXISTS idx_meta_patches_org ON meta_patches(organization_id);
CREATE INDEX IF NOT EXISTS idx_meta_hero_ratings_patch ON meta_hero_ratings(patch_id);

-- RLS
ALTER TABLE meta_patches ENABLE ROW LEVEL SECURITY;
ALTER TABLE meta_hero_ratings ENABLE ROW LEVEL SECURITY;

-- meta_patches: any active org member can read
CREATE POLICY "meta_patches_select" ON meta_patches
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.organization_id = meta_patches.organization_id
        AND tm.user_id = auth.uid()
        AND tm.is_active = true
    )
  );

-- meta_patches: coach / manager / owner can insert/update/delete
CREATE POLICY "meta_patches_write" ON meta_patches
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.organization_id = meta_patches.organization_id
        AND tm.user_id = auth.uid()
        AND tm.is_active = true
        AND tm.role IN ('coach','manager','owner')
    )
  );

-- meta_hero_ratings: member can read if they can read the patch
CREATE POLICY "meta_hero_ratings_select" ON meta_hero_ratings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM meta_patches mp
      JOIN team_members tm ON tm.organization_id = mp.organization_id
      WHERE mp.id = meta_hero_ratings.patch_id
        AND tm.user_id = auth.uid()
        AND tm.is_active = true
    )
  );

-- meta_hero_ratings: coach+ can write
CREATE POLICY "meta_hero_ratings_write" ON meta_hero_ratings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM meta_patches mp
      JOIN team_members tm ON tm.organization_id = mp.organization_id
      WHERE mp.id = meta_hero_ratings.patch_id
        AND tm.user_id = auth.uid()
        AND tm.is_active = true
        AND tm.role IN ('coach','manager','owner')
    )
  );
```

- [ ] **Step 2: Apply migration**

```bash
npx supabase db push
```

Expected: `Applying migration 20260521200000_meta_tracker.sql...` with no errors.

- [ ] **Step 3: Commit**

```bash
rtk git add supabase/migrations/20260521200000_meta_tracker.sql
rtk git commit -m "feat: add meta_patches + meta_hero_ratings tables with RLS"
```

---

## Task 2: TypeScript Types

**Files:**
- Modify: `types/database.ts`

- [ ] **Step 1: Add types for both tables**

In `types/database.ts`, inside the `Tables` object (same pattern as existing tables), add:

```typescript
meta_patches: {
  Row: {
    id: string;
    organization_id: string;
    patch_version: string;
    notes: string | null;
    created_by: string | null;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    organization_id: string;
    patch_version: string;
    notes?: string | null;
    created_by?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    organization_id?: string;
    patch_version?: string;
    notes?: string | null;
    created_by?: string | null;
    created_at?: string;
    updated_at?: string;
  };
};
meta_hero_ratings: {
  Row: {
    id: string;
    patch_id: string;
    hero_name: string;
    tier: "S" | "A" | "B" | "C" | "D";
    role_tag: "exp_lane" | "jungler" | "mid_lane" | "gold_lane" | "roamer" | null;
    is_ban_priority: boolean;
    priority_to_learn: boolean;
    notes: string | null;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    patch_id: string;
    hero_name: string;
    tier: "S" | "A" | "B" | "C" | "D";
    role_tag?: "exp_lane" | "jungler" | "mid_lane" | "gold_lane" | "roamer" | null;
    is_ban_priority?: boolean;
    priority_to_learn?: boolean;
    notes?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    patch_id?: string;
    hero_name?: string;
    tier?: "S" | "A" | "B" | "C" | "D";
    role_tag?: "exp_lane" | "jungler" | "mid_lane" | "gold_lane" | "roamer" | null;
    is_ban_priority?: boolean;
    priority_to_learn?: boolean;
    notes?: string | null;
    created_at?: string;
    updated_at?: string;
  };
};
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
rtk tsc --noEmit
```

Expected: no errors on the new types.

---

## Task 3: Queries

**Files:**
- Create: `features/meta/queries.ts`

- [ ] **Step 1: Write queries file**

```typescript
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type MetaPatch = Database["public"]["Tables"]["meta_patches"]["Row"];
export type MetaHeroRating = Database["public"]["Tables"]["meta_hero_ratings"]["Row"];

export interface PatchWithHeroes extends MetaPatch {
  heroes: MetaHeroRating[];
}

export async function getMetaPatches(orgId: string): Promise<MetaPatch[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("meta_patches")
    .select("*")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getPatchWithHeroes(patchId: string): Promise<PatchWithHeroes | null> {
  const supabase = await createClient();
  const { data: patch } = await supabase
    .from("meta_patches")
    .select("*")
    .eq("id", patchId)
    .maybeSingle();
  if (!patch) return null;

  const { data: heroes } = await supabase
    .from("meta_hero_ratings")
    .select("*")
    .eq("patch_id", patchId)
    .order("tier")
    .order("hero_name");

  return { ...patch, heroes: heroes ?? [] };
}

export async function getLatestPatchWithHeroes(orgId: string): Promise<PatchWithHeroes | null> {
  const supabase = await createClient();
  const { data: patch } = await supabase
    .from("meta_patches")
    .select("*")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!patch) return null;

  const { data: heroes } = await supabase
    .from("meta_hero_ratings")
    .select("*")
    .eq("patch_id", patch.id)
    .order("tier")
    .order("hero_name");

  return { ...patch, heroes: heroes ?? [] };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
rtk tsc --noEmit
```

Expected: no errors.

---

## Task 4: Server Actions

**Files:**
- Create: `features/meta/actions.ts`

- [ ] **Step 1: Write actions file**

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type ActionResult = { ok: true } | { ok: false; message: string };

async function getCoachRole(orgId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, isCoachPlus: false };

  const ownerEmail = process.env.OWNER_EMAIL;
  if (user.email === ownerEmail) return { user, isCoachPlus: true };

  const { data: tm } = await supabase
    .from("team_members")
    .select("role")
    .eq("user_id", user.id)
    .eq("organization_id", orgId)
    .eq("is_active", true)
    .maybeSingle();

  const isCoachPlus = ["coach", "manager", "owner"].includes(tm?.role ?? "");
  return { user, isCoachPlus };
}

export async function createMetaPatchAction(
  orgSlug: string,
  orgId: string,
  patchVersion: string,
  notes: string,
): Promise<ActionResult & { id?: string }> {
  const { user, isCoachPlus } = await getCoachRole(orgId);
  if (!user) return { ok: false, message: "Anda harus login" };
  if (!isCoachPlus) return { ok: false, message: "Hanya coach ke atas yang bisa membuat patch" };

  const trimmed = patchVersion.trim();
  if (!trimmed) return { ok: false, message: "Versi patch tidak boleh kosong" };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("meta_patches")
    .insert({ organization_id: orgId, patch_version: trimmed, notes: notes.trim() || null, created_by: user.id })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") return { ok: false, message: `Patch ${trimmed} sudah ada` };
    return { ok: false, message: error.message };
  }

  revalidatePath(`/${orgSlug}/meta`);
  return { ok: true, id: data.id };
}

export async function upsertHeroRatingAction(
  orgSlug: string,
  orgId: string,
  patchId: string,
  hero: {
    hero_name: string;
    tier: "S" | "A" | "B" | "C" | "D";
    role_tag: "exp_lane" | "jungler" | "mid_lane" | "gold_lane" | "roamer" | null;
    is_ban_priority: boolean;
    priority_to_learn: boolean;
    notes: string;
  },
): Promise<ActionResult> {
  const { user, isCoachPlus } = await getCoachRole(orgId);
  if (!user) return { ok: false, message: "Anda harus login" };
  if (!isCoachPlus) return { ok: false, message: "Hanya coach ke atas yang bisa mengedit meta" };

  const admin = createAdminClient();
  const { error } = await admin
    .from("meta_hero_ratings")
    .upsert(
      {
        patch_id: patchId,
        hero_name: hero.hero_name,
        tier: hero.tier,
        role_tag: hero.role_tag,
        is_ban_priority: hero.is_ban_priority,
        priority_to_learn: hero.priority_to_learn,
        notes: hero.notes.trim() || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "patch_id,hero_name" },
    );

  if (error) return { ok: false, message: error.message };
  revalidatePath(`/${orgSlug}/meta`);
  return { ok: true };
}

export async function deleteHeroRatingAction(
  orgSlug: string,
  orgId: string,
  ratingId: string,
): Promise<ActionResult> {
  const { user, isCoachPlus } = await getCoachRole(orgId);
  if (!user) return { ok: false, message: "Anda harus login" };
  if (!isCoachPlus) return { ok: false, message: "Hanya coach ke atas yang bisa menghapus" };

  const admin = createAdminClient();
  const { error } = await admin.from("meta_hero_ratings").delete().eq("id", ratingId);
  if (error) return { ok: false, message: error.message };

  revalidatePath(`/${orgSlug}/meta`);
  return { ok: true };
}

export async function deleteMetaPatchAction(
  orgSlug: string,
  orgId: string,
  patchId: string,
): Promise<ActionResult> {
  const { user, isCoachPlus } = await getCoachRole(orgId);
  if (!user) return { ok: false, message: "Anda harus login" };
  if (!isCoachPlus) return { ok: false, message: "Hanya coach ke atas yang bisa menghapus patch" };

  const admin = createAdminClient();
  const { error } = await admin.from("meta_patches").delete().eq("id", patchId);
  if (error) return { ok: false, message: error.message };

  revalidatePath(`/${orgSlug}/meta`);
  return { ok: true };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
rtk tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
rtk git add features/meta/queries.ts features/meta/actions.ts types/database.ts
rtk git commit -m "feat: meta tracker queries + server actions"
```

---

## Task 5: AddHeroModal Component

**Files:**
- Create: `features/meta/components/AddHeroModal.tsx`

This modal handles both adding a new hero and editing an existing one's meta info.

- [ ] **Step 1: Write AddHeroModal**

```typescript
"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Search, X } from "lucide-react";
import { toast } from "sonner";
import { MLBB_HEROES } from "@/features/scrim/data/mlbb-heroes";
import { cn } from "@/lib/utils/cn";
import { upsertHeroRatingAction } from "../actions";
import type { MetaHeroRating } from "../queries";

type Tier = "S" | "A" | "B" | "C" | "D";
type RoleTag = "exp_lane" | "jungler" | "mid_lane" | "gold_lane" | "roamer" | null;

const TIER_COLORS: Record<Tier, string> = {
  S: "bg-red-500/20 text-red-400 border-red-500/30",
  A: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  B: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  C: "bg-green-500/20 text-green-400 border-green-500/30",
  D: "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

const ROLE_OPTIONS: Array<{ value: RoleTag; label: string }> = [
  { value: null, label: "— Tidak ada —" },
  { value: "exp_lane", label: "EXP Lane" },
  { value: "jungler", label: "Jungler" },
  { value: "mid_lane", label: "Mid Lane" },
  { value: "gold_lane", label: "Gold Lane" },
  { value: "roamer", label: "Roamer" },
];

interface AddHeroModalProps {
  open: boolean;
  onClose: () => void;
  orgSlug: string;
  orgId: string;
  patchId: string;
  existingHeroes: Set<string>;
  editing?: MetaHeroRating | null;
  defaultTier?: Tier;
}

export function AddHeroModal({
  open,
  onClose,
  orgSlug,
  orgId,
  patchId,
  existingHeroes,
  editing,
  defaultTier = "B",
}: AddHeroModalProps) {
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [selectedHero, setSelectedHero] = useState<string>(editing?.hero_name ?? "");
  const [tier, setTier] = useState<Tier>(editing?.tier ?? defaultTier);
  const [roleTag, setRoleTag] = useState<RoleTag>(editing?.role_tag ?? null);
  const [isBan, setIsBan] = useState(editing?.is_ban_priority ?? false);
  const [isPriority, setIsPriority] = useState(editing?.priority_to_learn ?? false);
  const [notes, setNotes] = useState(editing?.notes ?? "");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setSelectedHero(editing?.hero_name ?? "");
      setTier(editing?.tier ?? defaultTier);
      setRoleTag(editing?.role_tag ?? null);
      setIsBan(editing?.is_ban_priority ?? false);
      setIsPriority(editing?.priority_to_learn ?? false);
      setNotes(editing?.notes ?? "");
      setSearch("");
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [open, editing, defaultTier]);

  if (!open) return null;

  const available = MLBB_HEROES.filter(
    (h) => !existingHeroes.has(h) || h === editing?.hero_name,
  );
  const filtered = search
    ? available.filter((h) => h.toLowerCase().includes(search.toLowerCase()))
    : available;

  function handleSave() {
    if (!selectedHero) { toast.error("Pilih hero terlebih dahulu"); return; }
    startTransition(async () => {
      const res = await upsertHeroRatingAction(orgSlug, orgId, patchId, {
        hero_name: selectedHero,
        tier,
        role_tag: roleTag,
        is_ban_priority: isBan,
        priority_to_learn: isPriority,
        notes,
      });
      if (res.ok) {
        toast.success(editing ? "Hero diperbarui" : `${selectedHero} ditambahkan ke Tier ${tier}`);
        onClose();
      } else {
        toast.error(res.message);
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl border border-[#2D2D2D] bg-[#1C1C1C] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2D2D2D] px-5 py-4">
          <h2 className="text-sm font-semibold text-white">
            {editing ? `Edit — ${editing.hero_name}` : "Tambah Hero ke Meta"}
          </h2>
          <button type="button" onClick={onClose} className="text-white/40 hover:text-white cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          {/* Hero picker — only shown when adding new */}
          {!editing && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/60">Hero</label>
              {selectedHero ? (
                <div className="flex items-center justify-between rounded-md border border-[#2D2D2D] bg-[#141414] px-3 py-2">
                  <span className="text-sm font-medium text-white">{selectedHero}</span>
                  <button type="button" onClick={() => setSelectedHero("")} className="text-white/40 hover:text-white cursor-pointer">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 rounded-md border border-[#2D2D2D] bg-[#141414] px-3 py-2">
                    <Search className="h-3.5 w-3.5 shrink-0 text-white/40" />
                    <input
                      ref={searchRef}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Cari hero..."
                      className="flex-1 bg-transparent text-sm text-white placeholder-white/30 outline-none"
                    />
                  </div>
                  <ul className="sidebar-scroll max-h-40 overflow-y-auto rounded-md border border-[#2D2D2D] bg-[#141414]">
                    {filtered.slice(0, 50).map((h) => (
                      <li key={h}>
                        <button
                          type="button"
                          onClick={() => setSelectedHero(h)}
                          className="w-full px-3 py-1.5 text-left text-sm text-white/70 hover:bg-[#2C2C2C] hover:text-white cursor-pointer"
                        >
                          {h}
                        </button>
                      </li>
                    ))}
                    {filtered.length === 0 && (
                      <li className="px-3 py-3 text-center text-xs text-white/40">Hero tidak ditemukan</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Tier */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/60">Tier</label>
            <div className="flex gap-2">
              {(["S", "A", "B", "C", "D"] as Tier[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTier(t)}
                  className={cn(
                    "h-9 w-12 rounded-md border text-sm font-bold transition cursor-pointer",
                    tier === t ? TIER_COLORS[t] : "border-[#2D2D2D] text-white/30 hover:border-white/20 hover:text-white/60",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Role tag */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/60">Lane / Role</label>
            <div className="flex flex-wrap gap-2">
              {ROLE_OPTIONS.map((r) => (
                <button
                  key={String(r.value)}
                  type="button"
                  onClick={() => setRoleTag(r.value)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs transition cursor-pointer",
                    roleTag === r.value
                      ? "border-yellow-500/50 bg-yellow-500/10 text-yellow-400"
                      : "border-[#2D2D2D] text-white/40 hover:border-white/20 hover:text-white/60",
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Flags */}
          <div className="flex gap-4">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={isBan}
                onChange={(e) => setIsBan(e.target.checked)}
                className="h-4 w-4 accent-red-500"
              />
              <span className="text-xs text-white/70">Ban Priority</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={isPriority}
                onChange={(e) => setIsPriority(e.target.checked)}
                className="h-4 w-4 accent-yellow-400"
              />
              <span className="text-xs text-white/70">Priority to Learn</span>
            </label>
          </div>

          {/* Notes */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/60">Notes coach (opsional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Misal: kuat di early game, counter Fanny..."
              className="w-full resize-none rounded-md border border-[#2D2D2D] bg-[#141414] px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-white/30"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-md border border-[#2D2D2D] py-2 text-sm text-white/60 transition hover:bg-white/5 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={pending || (!selectedHero && !editing)}
              className="flex-1 rounded-md bg-yellow-400 py-2 text-sm font-semibold text-black transition hover:bg-yellow-300 disabled:opacity-50 cursor-pointer"
            >
              {pending ? "Menyimpan..." : editing ? "Simpan" : "Tambahkan"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
rtk tsc --noEmit
```

---

## Task 6: MetaPage Client Component

**Files:**
- Create: `features/meta/components/MetaPage.tsx`

This is the main client component with tabs (Tier List / Ban Priority / Priority to Learn), patch selector, edit mode, and hero management.

- [ ] **Step 1: Write MetaPage component**

```typescript
"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, X, Trash2, Shield, Star } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";
import { AddHeroModal } from "./AddHeroModal";
import { deleteHeroRatingAction, createMetaPatchAction, deleteMetaPatchAction } from "../actions";
import type { MetaHeroRating, MetaPatch, PatchWithHeroes } from "../queries";

type Tier = "S" | "A" | "B" | "C" | "D";

const TIERS: Tier[] = ["S", "A", "B", "C", "D"];

const TIER_STYLES: Record<Tier, { label: string; bg: string; text: string; border: string; badge: string }> = {
  S: { label: "S", bg: "bg-red-500/5", text: "text-red-400", border: "border-red-500/20", badge: "bg-red-500/20 text-red-400" },
  A: { label: "A", bg: "bg-orange-500/5", text: "text-orange-400", border: "border-orange-500/20", badge: "bg-orange-500/20 text-orange-400" },
  B: { label: "B", bg: "bg-yellow-500/5", text: "text-yellow-400", border: "border-yellow-500/20", badge: "bg-yellow-500/20 text-yellow-400" },
  C: { label: "C", bg: "bg-green-500/5", text: "text-green-400", border: "border-green-500/20", badge: "bg-green-500/20 text-green-400" },
  D: { label: "D", bg: "bg-blue-500/5", text: "text-blue-400", border: "border-blue-500/20", badge: "bg-blue-500/20 text-blue-400" },
};

const ROLE_LABELS: Record<string, string> = {
  exp_lane: "EXP",
  jungler: "JGL",
  mid_lane: "MID",
  gold_lane: "GOLD",
  roamer: "ROAM",
};

const ROLE_COLORS: Record<string, string> = {
  exp_lane: "text-amber-400",
  jungler: "text-violet-400",
  mid_lane: "text-cyan-400",
  gold_lane: "text-yellow-400",
  roamer: "text-rose-400",
};

function HeroChip({
  hero,
  editMode,
  onEdit,
  onDelete,
}: {
  hero: MetaHeroRating;
  editMode: boolean;
  onEdit: (h: MetaHeroRating) => void;
  onDelete: (id: string, name: string) => void;
}) {
  const style = TIER_STYLES[hero.tier];
  return (
    <div
      className={cn(
        "group relative inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition",
        style.bg,
        style.border,
      )}
    >
      {hero.is_ban_priority && (
        <Shield className="h-3 w-3 text-red-400 shrink-0" />
      )}
      {hero.priority_to_learn && (
        <Star className="h-3 w-3 text-yellow-400 shrink-0" />
      )}
      <span className="font-medium text-white/90">{hero.hero_name}</span>
      {hero.role_tag && (
        <span className={cn("font-mono text-[10px]", ROLE_COLORS[hero.role_tag])}>
          {ROLE_LABELS[hero.role_tag]}
        </span>
      )}
      {editMode && (
        <div className="absolute -right-1 -top-1 hidden gap-0.5 group-hover:flex">
          <button
            type="button"
            onClick={() => onEdit(hero)}
            className="grid h-4 w-4 place-items-center rounded-full bg-[#2D2D2D] text-white/60 hover:text-white cursor-pointer"
          >
            <Pencil className="h-2.5 w-2.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(hero.id, hero.hero_name)}
            className="grid h-4 w-4 place-items-center rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/40 cursor-pointer"
          >
            <X className="h-2.5 w-2.5" />
          </button>
        </div>
      )}
    </div>
  );
}

interface MetaPageProps {
  orgSlug: string;
  orgId: string;
  patches: MetaPatch[];
  initialPatch: PatchWithHeroes | null;
  canEdit: boolean;
}

export function MetaPage({ orgSlug, orgId, patches, initialPatch, canEdit }: MetaPageProps) {
  const [activePatch, setActivePatch] = useState<PatchWithHeroes | null>(initialPatch);
  const [patchList, setPatchList] = useState<MetaPatch[]>(patches);
  const [activeTab, setActiveTab] = useState<"tier" | "ban" | "learn">("tier");
  const [editMode, setEditMode] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingHero, setEditingHero] = useState<MetaHeroRating | null>(null);
  const [defaultTier, setDefaultTier] = useState<Tier>("B");
  const [showNewPatchForm, setShowNewPatchForm] = useState(false);
  const [newPatchVersion, setNewPatchVersion] = useState("");
  const [newPatchNotes, setNewPatchNotes] = useState("");
  const [pending, startTransition] = useTransition();

  const heroes = activePatch?.heroes ?? [];
  const existingHeroNames = new Set(heroes.map((h) => h.hero_name));

  function openAddModal(tier: Tier) {
    setEditingHero(null);
    setDefaultTier(tier);
    setModalOpen(true);
  }

  function openEditModal(hero: MetaHeroRating) {
    setEditingHero(hero);
    setModalOpen(true);
  }

  function handleDelete(ratingId: string, heroName: string) {
    if (!confirm(`Hapus ${heroName} dari tier list?`)) return;
    startTransition(async () => {
      const res = await deleteHeroRatingAction(orgSlug, orgId, ratingId);
      if (res.ok) {
        setActivePatch((prev) =>
          prev ? { ...prev, heroes: prev.heroes.filter((h) => h.id !== ratingId) } : prev,
        );
        toast.success(`${heroName} dihapus dari tier list`);
      } else {
        toast.error(res.message);
      }
    });
  }

  function handleCreatePatch() {
    startTransition(async () => {
      const res = await createMetaPatchAction(orgSlug, orgId, newPatchVersion, newPatchNotes);
      if (res.ok && res.id) {
        const newPatch: PatchWithHeroes = {
          id: res.id,
          organization_id: orgId,
          patch_version: newPatchVersion.trim(),
          notes: newPatchNotes.trim() || null,
          created_by: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          heroes: [],
        };
        setPatchList((prev) => [newPatch, ...prev]);
        setActivePatch(newPatch);
        setShowNewPatchForm(false);
        setNewPatchVersion("");
        setNewPatchNotes("");
        toast.success(`Patch ${newPatch.patch_version} dibuat`);
      } else {
        toast.error(res.message);
      }
    });
  }

  function handleDeletePatch() {
    if (!activePatch) return;
    if (!confirm(`Hapus patch ${activePatch.patch_version}? Semua hero di patch ini akan ikut terhapus.`)) return;
    startTransition(async () => {
      const res = await deleteMetaPatchAction(orgSlug, orgId, activePatch.id);
      if (res.ok) {
        const remaining = patchList.filter((p) => p.id !== activePatch.id);
        setPatchList(remaining);
        setActivePatch(remaining[0] ? { ...remaining[0], heroes: [] } : null);
        toast.success("Patch dihapus");
      } else {
        toast.error(res.message);
      }
    });
  }

  // Optimistic update after modal save
  function handleModalClose() {
    setModalOpen(false);
    // Re-fetch is handled by revalidatePath; page will refresh on next navigation.
    // For immediate optimistic feel, we reload the heroes from server via router.refresh approach:
    // Since we're in a server-revalidated page, the data will refresh on next visit.
    // If we want instant update, we'd need a client-side cache. For now, close modal —
    // the page revalidates automatically via revalidatePath in the action.
    window.location.reload(); // simple refresh to show updated data
  }

  const banHeroes = heroes.filter((h) => h.is_ban_priority);
  const learnHeroes = heroes.filter((h) => h.priority_to_learn);
  const learnByRole = {
    exp_lane: learnHeroes.filter((h) => h.role_tag === "exp_lane"),
    jungler: learnHeroes.filter((h) => h.role_tag === "jungler"),
    mid_lane: learnHeroes.filter((h) => h.role_tag === "mid_lane"),
    gold_lane: learnHeroes.filter((h) => h.role_tag === "gold_lane"),
    roamer: learnHeroes.filter((h) => h.role_tag === "roamer"),
    untagged: learnHeroes.filter((h) => !h.role_tag),
  };

  return (
    <div className="space-y-6 px-4 py-6 sm:px-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">Meta MLBB</h1>
          <p className="mt-1 text-sm text-white/50">Tier list hero per patch — dikelola coach</p>
        </div>
        {canEdit && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setEditMode((v) => !v)}
              className={cn(
                "inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm transition cursor-pointer",
                editMode
                  ? "border-yellow-500/50 bg-yellow-500/10 text-yellow-400"
                  : "border-[#2D2D2D] text-white/60 hover:bg-white/5",
              )}
            >
              <Pencil className="h-3.5 w-3.5" />
              {editMode ? "Selesai Edit" : "Edit"}
            </button>
          </div>
        )}
      </div>

      {/* Patch selector */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/50">Patch:</span>
          <div className="flex flex-wrap gap-1.5">
            {patchList.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  // Load patch heroes — for simplicity, we rely on page refresh or server fetch.
                  // Since we pass initialPatch from server, switching patches requires a page visit.
                  // We navigate to ?patch=id to let server fetch correct patch.
                  window.location.search = `?patch=${p.id}`;
                }}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs transition cursor-pointer",
                  activePatch?.id === p.id
                    ? "border-yellow-500/50 bg-yellow-500/10 text-yellow-400"
                    : "border-[#2D2D2D] text-white/50 hover:border-white/20 hover:text-white/80",
                )}
              >
                {p.patch_version}
              </button>
            ))}
          </div>
        </div>
        {canEdit && (
          <button
            type="button"
            onClick={() => setShowNewPatchForm((v) => !v)}
            className="inline-flex h-7 items-center gap-1.5 rounded-full border border-dashed border-[#2D2D2D] px-3 text-xs text-white/40 hover:border-white/20 hover:text-white/70 transition cursor-pointer"
          >
            <Plus className="h-3 w-3" />
            Patch Baru
          </button>
        )}
      </div>

      {/* New patch form */}
      {showNewPatchForm && canEdit && (
        <div className="rounded-xl border border-[#2D2D2D] bg-[#1C1C1C] p-4 space-y-3">
          <p className="text-xs font-medium text-white/70">Tambah Patch Baru</p>
          <div className="flex gap-2">
            <input
              value={newPatchVersion}
              onChange={(e) => setNewPatchVersion(e.target.value)}
              placeholder="Versi patch (misal: 33.1)"
              className="flex-1 rounded-md border border-[#2D2D2D] bg-[#141414] px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-white/30"
            />
            <input
              value={newPatchNotes}
              onChange={(e) => setNewPatchNotes(e.target.value)}
              placeholder="Catatan singkat (opsional)"
              className="flex-1 rounded-md border border-[#2D2D2D] bg-[#141414] px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-white/30"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowNewPatchForm(false)}
              className="rounded-md border border-[#2D2D2D] px-4 py-1.5 text-sm text-white/60 hover:bg-white/5 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleCreatePatch}
              disabled={pending || !newPatchVersion.trim()}
              className="rounded-md bg-yellow-400 px-4 py-1.5 text-sm font-semibold text-black hover:bg-yellow-300 disabled:opacity-50 transition cursor-pointer"
            >
              Buat Patch
            </button>
          </div>
        </div>
      )}

      {!activePatch ? (
        <div className="rounded-xl border border-dashed border-white/10 bg-zinc-900/30 p-10 text-center">
          <p className="text-sm text-white/50">Belum ada patch. Buat patch baru untuk mulai tracking meta.</p>
        </div>
      ) : (
        <>
          {/* Patch notes */}
          {activePatch.notes && (
            <p className="text-xs text-white/50 italic">{activePatch.notes}</p>
          )}

          {/* Tab navigation */}
          <div className="flex gap-1 border-b border-[#2D2D2D]">
            {(["tier", "ban", "learn"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-4 py-2 text-sm transition cursor-pointer border-b-2 -mb-px",
                  activeTab === tab
                    ? "border-yellow-400 text-yellow-400"
                    : "border-transparent text-white/50 hover:text-white/80",
                )}
              >
                {tab === "tier" && "Tier List"}
                {tab === "ban" && `Ban Priority ${banHeroes.length > 0 ? `(${banHeroes.length})` : ""}`}
                {tab === "learn" && `Priority to Learn ${learnHeroes.length > 0 ? `(${learnHeroes.length})` : ""}`}
              </button>
            ))}
          </div>

          {/* Tier List tab */}
          {activeTab === "tier" && (
            <div className="space-y-3">
              {TIERS.map((tier) => {
                const style = TIER_STYLES[tier];
                const tierHeroes = heroes.filter((h) => h.tier === tier);
                return (
                  <div
                    key={tier}
                    className={cn("rounded-xl border p-4", style.bg, style.border)}
                  >
                    <div className="flex items-start gap-4">
                      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg font-black", style.badge)}>
                        {tier}
                      </div>
                      <div className="flex flex-1 flex-wrap gap-2">
                        {tierHeroes.map((h) => (
                          <HeroChip
                            key={h.id}
                            hero={h}
                            editMode={editMode}
                            onEdit={openEditModal}
                            onDelete={handleDelete}
                          />
                        ))}
                        {tierHeroes.length === 0 && !editMode && (
                          <span className="text-xs text-white/20 italic">Belum ada hero</span>
                        )}
                        {editMode && (
                          <button
                            type="button"
                            onClick={() => openAddModal(tier)}
                            className="inline-flex items-center gap-1 rounded-lg border border-dashed border-white/10 px-2.5 py-1.5 text-xs text-white/30 hover:border-white/30 hover:text-white/60 transition cursor-pointer"
                          >
                            <Plus className="h-3 w-3" />
                            Tambah
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Delete patch button */}
              {editMode && canEdit && (
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleDeletePatch}
                    disabled={pending}
                    className="inline-flex items-center gap-2 rounded-md border border-red-500/20 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 transition cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Hapus Patch {activePatch.patch_version}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Ban Priority tab */}
          {activeTab === "ban" && (
            <div className="space-y-2">
              {banHeroes.length === 0 ? (
                <p className="py-8 text-center text-sm text-white/40">
                  Belum ada hero yang ditandai sebagai ban priority.
                  {canEdit && " Tandai hero di Tier List dengan flag Ban Priority."}
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {banHeroes.map((h) => (
                    <div
                      key={h.id}
                      className="inline-flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2"
                    >
                      <Shield className="h-3.5 w-3.5 text-red-400" />
                      <span className="text-sm font-medium text-white/90">{h.hero_name}</span>
                      <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-bold", TIER_STYLES[h.tier].badge)}>
                        {h.tier}
                      </span>
                      {h.notes && (
                        <span className="max-w-[200px] truncate text-xs text-white/40">{h.notes}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Priority to Learn tab */}
          {activeTab === "learn" && (
            <div className="space-y-4">
              {learnHeroes.length === 0 ? (
                <p className="py-8 text-center text-sm text-white/40">
                  Belum ada hero yang ditandai sebagai priority to learn.
                </p>
              ) : (
                Object.entries(learnByRole).map(([role, roleHeroes]) => {
                  if (roleHeroes.length === 0) return null;
                  const label = role === "untagged" ? "Tanpa Lane" : ROLE_LABELS[role] ?? role;
                  const color = role === "untagged" ? "text-white/60" : ROLE_COLORS[role] ?? "text-white/60";
                  return (
                    <div key={role} className="space-y-2">
                      <p className={cn("text-xs font-semibold uppercase tracking-wide", color)}>{label}</p>
                      <div className="flex flex-wrap gap-2">
                        {roleHeroes.map((h) => (
                          <div
                            key={h.id}
                            className="inline-flex items-center gap-2 rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-3 py-2"
                          >
                            <Star className="h-3.5 w-3.5 text-yellow-400" />
                            <span className="text-sm font-medium text-white/90">{h.hero_name}</span>
                            <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-bold", TIER_STYLES[h.tier].badge)}>
                              {h.tier}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </>
      )}

      {/* Add/Edit hero modal */}
      <AddHeroModal
        open={modalOpen}
        onClose={handleModalClose}
        orgSlug={orgSlug}
        orgId={orgId}
        patchId={activePatch?.id ?? ""}
        existingHeroes={existingHeroNames}
        editing={editingHero}
        defaultTier={defaultTier}
      />
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
rtk tsc --noEmit
```

---

## Task 7: Server Page + Sidebar

**Files:**
- Create: `app/[team-slug]/(workspace)/meta/page.tsx`
- Modify: `components/layout/WorkspaceSidebar.tsx`

- [ ] **Step 1: Write server page**

```typescript
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOrgBySlug } from "@/features/teams/queries";
import { getMetaPatches, getLatestPatchWithHeroes, getPatchWithHeroes } from "@/features/meta/queries";
import { MetaPage } from "@/features/meta/components/MetaPage";

export const dynamic = "force-dynamic";

interface MetaPageProps {
  params: Promise<{ "team-slug": string }>;
  searchParams: Promise<{ patch?: string }>;
}

export default async function MetaPageRoute({ params, searchParams }: MetaPageProps) {
  const { "team-slug": slug } = await params;
  const { patch: patchId } = await searchParams;

  const org = await getOrgBySlug(slug);
  if (!org) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();

  const ownerEmail = process.env.OWNER_EMAIL;
  const isOwner = user.email === ownerEmail;

  let userRole: string | null = null;
  if (isOwner) {
    userRole = "owner";
  } else {
    const { data: tm } = await supabase
      .from("team_members")
      .select("role")
      .eq("user_id", user.id)
      .eq("organization_id", org.id)
      .eq("is_active", true)
      .maybeSingle();
    userRole = tm?.role ?? null;
  }

  const canEdit = isOwner || ["coach", "manager", "owner"].includes(userRole ?? "");

  const [patches, activePatch] = await Promise.all([
    getMetaPatches(org.id),
    patchId ? getPatchWithHeroes(patchId) : getLatestPatchWithHeroes(org.id),
  ]);

  return (
    <MetaPage
      orgSlug={slug}
      orgId={org.id}
      patches={patches}
      initialPatch={activePatch}
      canEdit={canEdit}
    />
  );
}
```

- [ ] **Step 2: Add "Meta" to WorkspaceSidebar**

In `components/layout/WorkspaceSidebar.tsx`, add the `Zap` icon to imports and add the nav item to the KOMPETISI group.

At line 1 (imports from lucide-react), add `Zap` to the import list:

```typescript
import {
  Activity,
  BarChart3,
  Calendar,
  CalendarClock,
  ChevronDown,
  DollarSign,
  FolderOpen,
  Home,
  LayoutDashboard,
  Lightbulb,
  LogOut,
  Megaphone,
  Settings,
  Shield,
  Swords,
  Tags,
  TrendingUp,
  Trophy,
  UserPlus,
  Users,
  Zap,
} from "lucide-react";
```

Then in `WORKSPACE_NAV_GROUPS`, in the KOMPETISI group, add "Meta" after "analytics":

```typescript
{
  label: "KOMPETISI",
  items: [
    { key: "scrim", href: "/scrim", label: "Scrim", Icon: Swords },
    { key: "tournaments", href: "/tournaments", label: "Turnamen", Icon: Trophy },
    { key: "analytics", href: "/analytics", label: "Analytics", Icon: Activity },
    { key: "meta", href: "/meta", label: "Meta", Icon: Zap },
  ],
},
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
rtk tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit all feature files**

```bash
rtk git add features/meta/ app/[team-slug]/\(workspace\)/meta/ components/layout/WorkspaceSidebar.tsx
rtk git commit -m "feat: meta tracker — tier list, ban priority, priority to learn"
```

---

## Task 8: Final Verification

- [ ] **Step 1: Run full type check**

```bash
rtk tsc --noEmit
```

Expected: no errors.

- [ ] **Step 2: Start dev server and verify**

```bash
rtk next dev
```

Verify:
1. "Meta" appears in sidebar under KOMPETISI
2. `/[slug]/meta` loads without error
3. "Patch Baru" form creates a patch
4. Edit mode shows "Tambah" buttons per tier
5. AddHeroModal opens, saves a hero, tier list updates
6. Hero chip shows edit/delete icons on hover in edit mode
7. Ban Priority tab shows flagged heroes
8. Priority to Learn tab shows starred heroes grouped by role
9. Patch selector switches between patches
10. Members (non-coach) cannot see Edit button

- [ ] **Step 3: Final commit if dev verification needed adjustments**

```bash
rtk git add -p
rtk git commit -m "fix: meta tracker UI adjustments from dev verification"
```
