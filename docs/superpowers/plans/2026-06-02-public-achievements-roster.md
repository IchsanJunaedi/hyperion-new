# Public Achievements & Roster Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire tournament completions to auto-create public achievements, add admin management UI, update the landing page to read from the achievements table, and add public team roster + player profile pages.

**Architecture:** Achievement auto-creation hooks into the existing `completeTournamentAction` when `placement ≤ 3`. A new `/admin/achievements` CMS page manages the list. The landing page's "Our Achievement" section switches from `gallery_entries` to the `achievements` table. Public division pages gain player previews, team detail pages, and individual player profiles.

**Tech Stack:** Next.js 15 App Router (Server Components), Supabase (Postgres + RLS bypass via admin client), TypeScript strict, Tailwind CSS v4, Vitest, Sonner (toast), Lucide React icons.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `features/tournaments/achievement-helpers.ts` | Create | Pure functions: trigger check + title builder |
| `features/tournaments/__tests__/achievement-helpers.test.ts` | Create | Unit tests for helpers |
| `features/admin/queries.ts` | Edit | Add `getAchievements`, `getPublicAchievements` |
| `features/admin/__tests__/achievement-actions.test.ts` | Create | Unit tests for CRUD actions |
| `features/admin/actions.ts` | Edit | Add `createAchievement`, `updateAchievement`, `deleteAchievement` |
| `features/tournaments/actions.ts` | Edit | Call auto-achievement insert in `completeTournamentAction` |
| `features/admin/components/AchievementForm.tsx` | Create | Inline edit/create form for an achievement |
| `features/admin/components/AchievementsAdminClient.tsx` | Create | List + CRUD client component for admin panel |
| `features/admin/components/AdminSidebarNav.tsx` | Edit | Add Achievements nav item |
| `app/admin/(panel)/achievements/page.tsx` | Create | Admin achievements page |
| `components/landing/AchievementsSection.tsx` | Edit | Accept `Achievement[]` instead of `GalleryEntry[]` |
| `app/page.tsx` | Edit | Add `getPublicAchievements()` call, pass to section |
| `app/divisions/[slug]/page.tsx` | Edit | Add player previews per team card |
| `app/divisions/[slug]/[org-slug]/page.tsx` | Create | Team detail: full roster + achievements |
| `app/players/[username]/page.tsx` | Create | Public player profile |

---

### Task 1: Achievement helper functions

**Files:**
- Create: `features/tournaments/achievement-helpers.ts`
- Create: `features/tournaments/__tests__/achievement-helpers.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// features/tournaments/__tests__/achievement-helpers.test.ts
import { describe, it, expect } from "vitest";
import { shouldAutoCreateAchievement, buildAchievementTitle } from "../achievement-helpers";

describe("shouldAutoCreateAchievement", () => {
  it("returns true for placement 1", () => {
    expect(shouldAutoCreateAchievement(1)).toBe(true);
  });
  it("returns true for placement 2", () => {
    expect(shouldAutoCreateAchievement(2)).toBe(true);
  });
  it("returns true for placement 3", () => {
    expect(shouldAutoCreateAchievement(3)).toBe(true);
  });
  it("returns false for placement 4", () => {
    expect(shouldAutoCreateAchievement(4)).toBe(false);
  });
  it("returns false for null", () => {
    expect(shouldAutoCreateAchievement(null)).toBe(false);
  });
  it("returns false for undefined", () => {
    expect(shouldAutoCreateAchievement(undefined)).toBe(false);
  });
});

describe("buildAchievementTitle", () => {
  it("formats placement 1 correctly", () => {
    expect(buildAchievementTitle(1, "Piala Presiden 2026")).toBe("Juara 1 — Piala Presiden 2026");
  });
  it("formats placement 3 correctly", () => {
    expect(buildAchievementTitle(3, "MLBB Regional Cup")).toBe("Juara 3 — MLBB Regional Cup");
  });
});
```

- [ ] **Step 2: Run to verify they fail**

```bash
npx vitest run features/tournaments/__tests__/achievement-helpers.test.ts
```
Expected: FAIL — module not found.

- [ ] **Step 3: Create the helpers file**

```ts
// features/tournaments/achievement-helpers.ts
export function shouldAutoCreateAchievement(placement: number | null | undefined): boolean {
  return placement != null && placement <= 3;
}

export function buildAchievementTitle(placement: number, tournamentName: string): string {
  return `Juara ${placement} — ${tournamentName}`;
}
```

- [ ] **Step 4: Run to verify they pass**

```bash
npx vitest run features/tournaments/__tests__/achievement-helpers.test.ts
```
Expected: PASS (2 suites, 8 tests).

- [ ] **Step 5: Commit**

```bash
rtk git add features/tournaments/achievement-helpers.ts features/tournaments/__tests__/achievement-helpers.test.ts
rtk git commit -m "feat(achievements): add pure helper functions for auto-trigger logic"
```

---

### Task 2: Achievement queries

**Files:**
- Modify: `features/admin/queries.ts`

- [ ] **Step 1: Add Achievement type and two query functions**

Open `features/admin/queries.ts`. After the existing type exports at the top, add:

```ts
export type Achievement = Database["public"]["Tables"]["achievements"]["Row"];
```

Then at the bottom of the file, add:

```ts
export async function getAchievements(): Promise<Achievement[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("achievements")
    .select("id, title, description, placement, achieved_at, image_url, organization_id, division_id, tournament_id, created_at")
    .order("achieved_at", { ascending: false })
    .limit(50);
  if (error) console.error("getAchievements:", error);
  return data ?? [];
}

export async function getPublicAchievements(): Promise<Achievement[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("achievements")
    .select("id, title, description, placement, achieved_at, image_url, organization_id, division_id, tournament_id, created_at")
    .order("achieved_at", { ascending: false })
    .limit(50);
  if (error) console.error("getPublicAchievements:", error);
  return data ?? [];
}
```

- [ ] **Step 2: Run typecheck**

```bash
npx tsc --noEmit
```
Expected: exit 0 (no errors on this file).

- [ ] **Step 3: Commit**

```bash
rtk git add features/admin/queries.ts
rtk git commit -m "feat(achievements): add getAchievements and getPublicAchievements queries"
```

---

### Task 3: Achievement admin actions + tests

**Files:**
- Modify: `features/admin/actions.ts`
- Create: `features/admin/__tests__/achievement-actions.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// features/admin/__tests__/achievement-actions.test.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createAchievement, updateAchievement, deleteAchievement } from "@/features/admin/actions";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/admin");
vi.mock("@/lib/supabase/server");

const mockAdminInsert = vi.fn().mockResolvedValue({ error: null });
const mockAdminUpdate = vi.fn().mockResolvedValue({ error: null });
const mockAdminDelete = vi.fn().mockResolvedValue({ error: null });
const mockEq = vi.fn().mockReturnThis();

function makeMockAdmin() {
  return {
    from: vi.fn().mockReturnValue({
      insert: mockAdminInsert,
      update: vi.fn().mockReturnValue({ eq: mockEq.mockResolvedValue({ error: null }) }),
      delete: vi.fn().mockReturnValue({ eq: mockEq.mockResolvedValue({ error: null }) }),
    }),
  } as any;
}

function makeMockSupabase(email: string) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { email } } }),
    },
  } as any;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(createAdminClient).mockReturnValue(makeMockAdmin());
});

describe("createAchievement", () => {
  it("returns forbidden when not admin or owner", async () => {
    vi.mocked(createClient).mockResolvedValue(makeMockSupabase("other@example.com") as any);
    process.env.ADMIN_EMAIL = "admin@example.com";
    process.env.OWNER_EMAIL = "owner@example.com";
    const result = await createAchievement({
      title: "Juara 1 — Cup",
      achieved_at: "2026-06-01",
    });
    expect(result.ok).toBe(false);
    expect((result as any).message).toBe("Akses ditolak");
  });

  it("succeeds when called by owner", async () => {
    process.env.OWNER_EMAIL = "owner@example.com";
    vi.mocked(createClient).mockResolvedValue(makeMockSupabase("owner@example.com") as any);
    const mockFrom = { insert: vi.fn().mockResolvedValue({ error: null }) };
    vi.mocked(createAdminClient).mockReturnValue({ from: vi.fn().mockReturnValue(mockFrom) } as any);
    const result = await createAchievement({
      title: "Juara 1 — Cup",
      achieved_at: "2026-06-01",
    });
    expect(result.ok).toBe(true);
  });
});

describe("deleteAchievement", () => {
  it("succeeds when called by admin", async () => {
    process.env.ADMIN_EMAIL = "admin@example.com";
    process.env.OWNER_EMAIL = "owner@example.com";
    vi.mocked(createClient).mockResolvedValue(makeMockSupabase("admin@example.com") as any);
    const mockEqFn = vi.fn().mockResolvedValue({ error: null });
    const mockDeleteFn = vi.fn().mockReturnValue({ eq: mockEqFn });
    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn().mockReturnValue({ delete: mockDeleteFn }),
    } as any);
    const result = await deleteAchievement("some-id");
    expect(result.ok).toBe(true);
    expect(mockDeleteFn).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run to verify they fail**

```bash
npx vitest run features/admin/__tests__/achievement-actions.test.ts
```
Expected: FAIL — functions not exported.

- [ ] **Step 3: Add the three actions to `features/admin/actions.ts`**

Add at the bottom of `features/admin/actions.ts`, after the existing `upsertSiteSettings`:

```ts
// ── Achievements ─────────────────────────────────────────────────────────────

export async function createAchievement(data: {
  title: string;
  description?: string | null;
  placement?: number | null;
  achieved_at: string;
  image_url?: string | null;
  division_id?: string | null;
  organization_id?: string | null;
  tournament_id?: string | null;
}): Promise<ActionResult> {
  const auth = await verifyAdminAccess();
  if (!auth.ok) return auth;
  const admin = createAdminClient();
  const { error } = await admin.from("achievements").insert({
    ...data,
    organization_id: data.organization_id ?? "",
  });
  if (error) return { ok: false, message: error.message };
  revalidatePath("/");
  revalidatePath("/admin/achievements");
  return { ok: true };
}

export async function updateAchievement(
  id: string,
  data: {
    title?: string;
    description?: string | null;
    placement?: number | null;
    achieved_at?: string;
    image_url?: string | null;
  },
): Promise<ActionResult> {
  const auth = await verifyAdminAccess();
  if (!auth.ok) return auth;
  const admin = createAdminClient();
  const { error } = await admin.from("achievements").update(data).eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/");
  revalidatePath("/admin/achievements");
  return { ok: true };
}

export async function deleteAchievement(id: string): Promise<ActionResult> {
  const auth = await verifyAdminAccess();
  if (!auth.ok) return auth;
  const admin = createAdminClient();
  const { error } = await admin.from("achievements").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/");
  revalidatePath("/admin/achievements");
  return { ok: true };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run features/admin/__tests__/achievement-actions.test.ts
```
Expected: PASS (2 suites).

- [ ] **Step 5: Run full CI gate**

```bash
npm run lint && npm run typecheck && npm run test:unit
```
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
rtk git add features/admin/actions.ts features/admin/__tests__/achievement-actions.test.ts
rtk git commit -m "feat(achievements): add create/update/delete admin actions"
```

---

### Task 4: Auto-trigger achievement on tournament completion

**Files:**
- Modify: `features/tournaments/actions.ts`

- [ ] **Step 1: Add the import at the top of `features/tournaments/actions.ts`**

Find the existing imports block and add:

```ts
import { shouldAutoCreateAchievement, buildAchievementTitle } from "./achievement-helpers";
```

- [ ] **Step 2: Find the insertion point in `completeTournamentAction`**

In `completeTournamentAction`, find this block (around line 579–588):

```ts
  await logAudit({
    actorId: user.id,
    action: "tournament.complete",
    entityType: "tournament",
    entityId: tournamentId,
    metadata: { won: data.won, placement: data.placement, prizeEarned: data.prizeEarned },
  });
```

- [ ] **Step 3: Add the achievement auto-insert BEFORE the logAudit call**

Insert this block immediately before the `await logAudit(...)` call:

```ts
  // Auto-create achievement for podium placements
  if (org && shouldAutoCreateAchievement(data.placement)) {
    const { data: tournamentRow, error: tErr } = await admin
      .from("tournaments")
      .select("name, division_id, end_date")
      .eq("id", tournamentId)
      .maybeSingle();
    if (tErr) console.error("completeTournamentAction: fetch tournament for achievement:", tErr);
    if (tournamentRow) {
      const { error: achErr } = await admin.from("achievements").insert({
        title: buildAchievementTitle(data.placement!, tournamentRow.name),
        organization_id: org.id,
        division_id: tournamentRow.division_id,
        tournament_id: tournamentId,
        placement: data.placement!,
        achieved_at: tournamentRow.end_date ?? new Date().toISOString().slice(0, 10),
        image_url: null,
      });
      if (achErr) console.error("completeTournamentAction: achievement insert:", achErr);
      else revalidatePath("/");
    }
  }
```

- [ ] **Step 4: Run typecheck**

```bash
npx tsc --noEmit
```
Expected: exit 0.

- [ ] **Step 5: Run full CI gate**

```bash
npm run lint && npm run typecheck && npm run test:unit
```
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
rtk git add features/tournaments/actions.ts
rtk git commit -m "feat(achievements): auto-create achievement on tournament top-3 completion"
```

---

### Task 5: AchievementForm component

**Files:**
- Create: `features/admin/components/AchievementForm.tsx`

- [ ] **Step 1: Create the file**

```tsx
// features/admin/components/AchievementForm.tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { NumberInput } from "@/components/ui/number-input";
import { ImageUpload } from "./ImageUpload";
import { createAchievement, updateAchievement } from "@/features/admin/actions";
import type { Achievement } from "@/features/admin/queries";

interface Props {
  entry?: Achievement;
  onDone: () => void;
}

const AchievementForm = ({ entry, onDone }: Props) => {
  const [title, setTitle] = useState(entry?.title ?? "");
  const [description, setDescription] = useState(entry?.description ?? "");
  const [placement, setPlacement] = useState<number>(entry?.placement ?? 1);
  const [achievedAt, setAchievedAt] = useState(entry?.achieved_at?.slice(0, 10) ?? "");
  const [imageUrl, setImageUrl] = useState<string | null>(entry?.image_url ?? null);
  const [saving, setSaving] = useState(false);

  const inputClass =
    "w-full border border-[#2D2D2D] bg-[#191919] px-3 py-2 text-sm text-[#E5E2E1] outline-none transition focus:border-[#F5C400]/50 placeholder:text-[#6B6A68]";
  const labelClass = "mb-1 block text-xs font-medium text-[#9B9A97]";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !achievedAt) {
      toast.error("Title dan tanggal wajib diisi");
      return;
    }
    setSaving(true);
    const data = {
      title,
      description: description || null,
      placement: placement || null,
      achieved_at: achievedAt,
      image_url: imageUrl,
    };
    const result = entry
      ? await updateAchievement(entry.id, data)
      : await createAchievement(data);
    setSaving(false);
    if (!result.ok) {
      toast.error((result as { ok: false; message: string }).message);
      return;
    }
    toast.success(entry ? "Achievement diperbarui" : "Achievement ditambahkan");
    onDone();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded border border-[#2D2D2D] bg-[#141414] p-5"
    >
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className={labelClass}>Title *</label>
          <input
            className={inputClass}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Juara 1 — Tournament Name"
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Placement (1-3)</label>
          <NumberInput
            value={placement}
            min={1}
            max={3}
            onChange={(e) => setPlacement(Number(e.target.value))}
          />
        </div>
        <div>
          <label className={labelClass}>Tanggal *</label>
          <input
            type="date"
            className={inputClass}
            value={achievedAt}
            onChange={(e) => setAchievedAt(e.target.value)}
            required
          />
        </div>
      </div>
      <div>
        <label className={labelClass}>Deskripsi (opsional)</label>
        <textarea
          className={inputClass + " min-h-[60px] resize-y"}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div>
        <ImageUpload
          value={imageUrl}
          onChange={setImageUrl}
          folder="achievements"
          label="Poster / Gambar (opsional)"
        />
      </div>
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="cursor-pointer border border-[#F5C400] px-5 py-2 text-xs font-bold uppercase tracking-wider text-[#F5C400] transition hover:bg-[#F5C400] hover:text-black disabled:opacity-50"
        >
          {saving ? "Menyimpan..." : entry ? "Simpan" : "Tambah"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="cursor-pointer border border-[#2D2D2D] px-5 py-2 text-xs font-bold uppercase tracking-wider text-[#9B9A97] transition hover:border-[#E5E2E1] hover:text-[#E5E2E1]"
        >
          Batal
        </button>
      </div>
    </form>
  );
};
export { AchievementForm };
```

- [ ] **Step 2: Run typecheck**

```bash
npx tsc --noEmit
```
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
rtk git add features/admin/components/AchievementForm.tsx
rtk git commit -m "feat(achievements): add AchievementForm admin component"
```

---

### Task 6: AchievementsAdminClient component

**Files:**
- Create: `features/admin/components/AchievementsAdminClient.tsx`

- [ ] **Step 1: Create the file**

```tsx
// features/admin/components/AchievementsAdminClient.tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Trophy } from "lucide-react";
import { ConfirmDeleteDialog } from "@/features/dashboard/components/ConfirmDeleteDialog";
import { AchievementForm } from "./AchievementForm";
import { deleteAchievement } from "@/features/admin/actions";
import type { Achievement } from "@/features/admin/queries";

const PLACEMENT_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: "Juara 1", color: "#F5C400" },
  2: { label: "Juara 2", color: "#9B9A97" },
  3: { label: "Juara 3", color: "#CD7F32" },
};

interface Props {
  entries: Achievement[];
}

const AchievementsAdminClient = ({ entries: initialEntries }: Props) => {
  const [entries, setEntries] = useState(initialEntries);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Achievement | null>(null);
  const [deleting, setDeleting] = useState<Achievement | null>(null);
  const [deletePending, setDeletePending] = useState(false);

  const handleDone = () => {
    setShowForm(false);
    setEditing(null);
    window.location.reload();
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeletePending(true);
    const result = await deleteAchievement(deleting.id);
    setDeletePending(false);
    if (!result.ok) {
      toast.error((result as { ok: false; message: string }).message);
      return;
    }
    toast.success("Achievement dihapus");
    setEntries((prev) => prev.filter((e) => e.id !== deleting.id));
    setDeleting(null);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-black uppercase tracking-tight text-white">Achievements</h1>
        <button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="flex cursor-pointer items-center gap-2 border border-[#F5C400] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#F5C400] transition hover:bg-[#F5C400] hover:text-black"
        >
          <Plus className="h-3.5 w-3.5" />
          Tambah Manual
        </button>
      </div>

      {showForm && !editing && (
        <div className="mb-6">
          <AchievementForm onDone={handleDone} />
        </div>
      )}

      <div className="space-y-2">
        {entries.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Trophy className="h-8 w-8 text-[#2D2D2D]" />
            <p className="text-sm text-[#6B6A68]">Belum ada achievement.</p>
            <p className="text-xs text-[#6B6A68]">
              Achievement akan muncul otomatis saat turnamen diselesaikan dengan placement ≤ 3.
            </p>
          </div>
        )}

        {entries.map((entry) => {
          const placement = entry.placement ?? 0;
          const meta = PLACEMENT_LABELS[placement];
          return (
            <div key={entry.id}>
              {editing?.id === entry.id ? (
                <AchievementForm entry={entry} onDone={handleDone} />
              ) : (
                <div className="flex items-center gap-4 border border-[#2D2D2D] bg-[#141414] p-4">
                  {entry.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={entry.image_url}
                      alt=""
                      className="h-12 w-20 shrink-0 object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-[#1E1E1E]">
                      <Trophy className="h-5 w-5 text-[#2D2D2D]" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-[#E5E2E1]">{entry.title}</p>
                    <div className="mt-0.5 flex items-center gap-3">
                      {meta && (
                        <span
                          className="text-xs font-bold uppercase tracking-widest"
                          style={{ color: meta.color }}
                        >
                          {meta.label}
                        </span>
                      )}
                      <span className="text-xs text-[#6B6A68]">
                        {entry.achieved_at?.slice(0, 4)}
                      </span>
                      {entry.tournament_id && (
                        <span className="text-xs text-[#6B6A68]">• Auto</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditing(entry)}
                      className="cursor-pointer rounded p-2 text-[#9B9A97] transition hover:bg-[#2C2C2C] hover:text-[#D4D4D4]"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleting(entry)}
                      className="cursor-pointer rounded p-2 text-[#9B9A97] transition hover:bg-[#2C2C2C] hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <ConfirmDeleteDialog
        open={!!deleting}
        onCancel={() => setDeleting(null)}
        onConfirm={handleDelete}
        pending={deletePending}
        title="Hapus Achievement"
        message={`Hapus "${deleting?.title}"? Tindakan ini tidak bisa dibatalkan.`}
        confirmPhrase="HAPUS"
      />
    </div>
  );
};
export { AchievementsAdminClient };
```

- [ ] **Step 2: Run typecheck**

```bash
npx tsc --noEmit
```
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
rtk git add features/admin/components/AchievementsAdminClient.tsx
rtk git commit -m "feat(achievements): add AchievementsAdminClient list component"
```

---

### Task 7: Admin achievements page + sidebar nav

**Files:**
- Create: `app/admin/(panel)/achievements/page.tsx`
- Modify: `features/admin/components/AdminSidebarNav.tsx`

- [ ] **Step 1: Create the achievements admin page**

```tsx
// app/admin/(panel)/achievements/page.tsx
import { getAchievements } from "@/features/admin/queries";
import { AchievementsAdminClient } from "@/features/admin/components/AchievementsAdminClient";

export const dynamic = "force-dynamic";

export default async function AdminAchievementsPage() {
  const entries = await getAchievements();
  return (
    <>
      <header className="sticky top-0 z-40 flex h-12 items-center border-b border-[#2D2D2D] bg-[#191919] px-6">
        <div className="text-sm text-[#9B9A97]">
          Admin <span className="text-[#6B6A68]">/</span>{" "}
          <span className="text-[#D4D4D4]">Achievements</span>
        </div>
      </header>
      <main className="mx-auto w-full max-w-4xl flex-1 px-8 py-10">
        <AchievementsAdminClient entries={entries} />
      </main>
    </>
  );
}
```

- [ ] **Step 2: Update `AdminSidebarNav.tsx` — add Achievements item**

Open `features/admin/components/AdminSidebarNav.tsx`.

Change the import line to add `Trophy`:
```ts
import {
  Image,
  Users,
  MessageSquare,
  Grid3x3,
  Layers,
  UserCircle,
  Heart,
  LayoutTemplate,
  Trophy,
} from "lucide-react";
```

In `NAV_GROUPS`, update the first group's `items` array to add Achievements after Gallery:

```ts
items: [
  { href: "/admin/gallery", Icon: Image, label: "Gallery & Achievement" },
  { href: "/admin/achievements", Icon: Trophy, label: "Achievements" },
  { href: "/admin/partners", Icon: Layers, label: "Partners" },
  { href: "/admin/testimonials", Icon: MessageSquare, label: "Testimonials" },
  { href: "/admin/divisions", Icon: Grid3x3, label: "Divisions" },
],
```

- [ ] **Step 3: Run typecheck + lint**

```bash
npm run lint && npx tsc --noEmit
```
Expected: exit 0.

- [ ] **Step 4: Start dev server and verify**

```bash
npm run dev
```

Navigate to `http://localhost:3000/admin/achievements`. Verify:
- Page loads without error
- Empty state with Trophy icon + helper text visible
- "Tambah Manual" button opens the form
- Sidebar shows "Achievements" link with active state

- [ ] **Step 5: Commit**

```bash
rtk git add app/admin/(panel)/achievements/page.tsx features/admin/components/AdminSidebarNav.tsx
rtk git commit -m "feat(achievements): add admin achievements page and sidebar nav item"
```

---

### Task 8: Update AchievementsSection + landing page

**Files:**
- Modify: `components/landing/AchievementsSection.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Update `AchievementsSection.tsx`**

Replace the entire file content with:

```tsx
// components/landing/AchievementsSection.tsx
"use client";

import { useRef } from "react";
import { motion, useInView } from "motion/react";
import type { Achievement } from "@/features/admin/queries";

const PLACEMENT_LABEL: Record<number, string> = { 1: "Juara 1", 2: "Juara 2", 3: "Juara 3" };

interface RowProps {
  item: Achievement;
  index: number;
}

const AchievementRow = ({ item, index }: RowProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.08, ease: "easeOut" }}
    >
      <div className="group relative block overflow-hidden border-b border-white/8">
        {/* Hover-reveal photo */}
        {item.image_url && (
          <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.image_url}
              alt=""
              aria-hidden="true"
              loading="lazy"
              className="h-full w-full object-cover"
              style={{ filter: "brightness(0.12) grayscale(60%)" }}
            />
          </div>
        )}

        <div className="relative grid grid-cols-[3rem_1fr] items-center gap-4 py-7 sm:grid-cols-[4rem_1fr_auto] sm:gap-8 sm:py-8">
          {/* Number */}
          <span className="text-3xl font-black tabular-nums text-white/12 sm:text-4xl">
            {String(index + 1).padStart(2, "0")}
          </span>

          {/* Title + description */}
          <div className="min-w-0">
            <h3 className="text-base font-black uppercase leading-tight tracking-tight text-white sm:text-xl lg:text-2xl">
              {item.title}
            </h3>
            {item.description && (
              <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-white/32 sm:text-sm">
                {item.description}
              </p>
            )}
          </div>

          {/* Right meta — hidden on mobile */}
          <div className="hidden flex-col items-end gap-2 sm:flex">
            {item.placement != null && (
              <span className="text-[11px] font-black uppercase tracking-widest text-[#F5C400]">
                {PLACEMENT_LABEL[item.placement] ?? `Juara ${item.placement}`}
              </span>
            )}
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/28">
              {item.achieved_at?.slice(0, 4)}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

interface AchievementsSectionProps {
  entries: Achievement[];
}

const AchievementsSection = ({ entries }: AchievementsSectionProps) => {
  const headerRef = useRef<HTMLDivElement>(null);
  const headerInView = useInView(headerRef, { once: true });

  if (entries.length === 0) return null;

  return (
    <section id="achievements" className="scroll-mt-14 bg-black px-5 py-20 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 16 }}
          animate={headerInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mb-0 border-b border-white/8 pb-8"
        >
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.4em] text-white/28">
                01 — Trophy Room
              </p>
              <h2 className="text-3xl font-black uppercase tracking-tight text-white sm:text-4xl lg:text-5xl">
                Our Achievement
              </h2>
            </div>
          </div>
        </motion.div>

        <div>
          {entries.map((item, i) => (
            <AchievementRow key={item.id} item={item} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
};
export { AchievementsSection };
```

- [ ] **Step 2: Update `app/page.tsx`**

Find this line:
```ts
import {
  getGalleryEntries,
  getActivePartners,
  getActiveTestimonials,
  getSiteSettings,
} from "@/features/admin/queries";
```

Replace with:
```ts
import {
  getGalleryEntries,
  getActivePartners,
  getActiveTestimonials,
  getSiteSettings,
  getPublicAchievements,
} from "@/features/admin/queries";
```

Find:
```ts
  const [galleryEntries, partners, testimonials, settings] = await Promise.all([
    getGalleryEntries(),
    getActivePartners(),
    getActiveTestimonials(),
    getSiteSettings(),
  ]);
```

Replace with:
```ts
  const [galleryEntries, achievements, partners, testimonials, settings] = await Promise.all([
    getGalleryEntries(),
    getPublicAchievements(),
    getActivePartners(),
    getActiveTestimonials(),
    getSiteSettings(),
  ]);
```

Find:
```tsx
        <AchievementsSection entries={galleryEntries} />
```

Replace with:
```tsx
        <AchievementsSection entries={achievements} />
```

- [ ] **Step 3: Run typecheck**

```bash
npx tsc --noEmit
```
Expected: exit 0. (The old `GalleryEntry` type is no longer used in `AchievementsSection`.)

- [ ] **Step 4: Verify landing page in browser**

With dev server running, open `http://localhost:3000`. Verify:
- "Our Achievement" section is gone if no achievements exist (returns null)
- After manually adding an achievement in `/admin/achievements`, the section appears on landing page (may require hard refresh due to `force-dynamic`)
- Hover on a row with `image_url` shows dim background image

- [ ] **Step 5: Run full CI gate**

```bash
npm run lint && npm run typecheck && npm run test:unit
```
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
rtk git add components/landing/AchievementsSection.tsx app/page.tsx
rtk git commit -m "feat(achievements): wire landing page AchievementsSection to achievements table"
```

---

### Task 9: Update `/divisions/[slug]` with player previews

**Files:**
- Modify: `app/divisions/[slug]/page.tsx`

- [ ] **Step 1: Replace the file content**

Open `app/divisions/[slug]/page.tsx`. Replace the entire file with:

```tsx
// app/divisions/[slug]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users, ArrowRight } from "lucide-react";
import Image from "next/image";

import { Footer } from "@/components/landing/Footer";
import { Header } from "@/components/landing/Header";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const GAME_META: Record<string, { color: string; abbr: string }> = {
  "mobile legends": { color: "#F5C400", abbr: "MLBB" },
  "mobile_legends": { color: "#F5C400", abbr: "MLBB" },
  "pubg":           { color: "#F97316", abbr: "PUBG" },
  "pubg mobile":    { color: "#F97316", abbr: "PUBGM" },
  "free fire":      { color: "#22C55E", abbr: "FF" },
};

function getMeta(game: string) {
  return GAME_META[game.toLowerCase()] ?? { color: "#9B9A97", abbr: game.slice(0, 4).toUpperCase() };
}

interface Props {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

export default async function DivisionDetailPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: division } = await supabase
    .from("divisions")
    .select("id, name, slug, game, description, is_active")
    .is("organization_id", null)
    .eq("slug", slug)
    .maybeSingle();

  if (!division) notFound();

  const meta = getMeta(division.game ?? "");

  const subQuery = await supabase
    .from("divisions")
    .select("organization_id")
    .eq("slug", slug)
    .not("organization_id", "is", null);

  const orgIds = (subQuery.data ?? []).map((d) => d.organization_id).filter(Boolean) as string[];

  let teams: { id: string; name: string; slug: string; logo_url: string | null; description: string | null }[] = [];
  if (orgIds.length > 0) {
    const { data } = await supabase
      .from("organizations")
      .select("id, name, slug, logo_url, description")
      .in("id", orgIds)
      .order("name")
      .limit(50);
    teams = data ?? [];
  }

  // Batch-fetch players for all teams (max 3 per team shown as preview)
  type PlayerPreview = { role: string; display_name: string | null; avatar_url: string | null; username: string | null };
  const membersByOrg = new Map<string, PlayerPreview[]>();

  if (teams.length > 0) {
    const allOrgIds = teams.map((t) => t.id);

    const { data: membersData, error: mErr } = await admin
      .from("team_members")
      .select("organization_id, role, user_id")
      .in("organization_id", allOrgIds)
      .eq("is_active", true)
      .limit(200);
    if (mErr) console.error("DivisionDetailPage: team_members fetch:", mErr);

    const userIds = [...new Set((membersData ?? []).map((m) => m.user_id))];
    let profileMap = new Map<string, { display_name: string | null; avatar_url: string | null; username: string | null }>();

    if (userIds.length > 0) {
      const { data: profilesData, error: pErr } = await admin
        .from("profiles")
        .select("id, display_name, avatar_url, username")
        .in("id", userIds)
        .limit(200);
      if (pErr) console.error("DivisionDetailPage: profiles fetch:", pErr);
      profileMap = new Map((profilesData ?? []).map((p) => [p.id, p]));
    }

    const roleOrder: Record<string, number> = { captain: 0, coach: 1, member: 2, manager: 3 };
    const sorted = [...(membersData ?? [])].sort(
      (a, b) => (roleOrder[a.role] ?? 9) - (roleOrder[b.role] ?? 9),
    );

    for (const m of sorted) {
      const list = membersByOrg.get(m.organization_id) ?? [];
      if (list.length < 3) {
        const p = profileMap.get(m.user_id);
        list.push({
          role: m.role,
          display_name: p?.display_name ?? null,
          avatar_url: p?.avatar_url ?? null,
          username: p?.username ?? null,
        });
        membersByOrg.set(m.organization_id, list);
      }
    }
  }

  return (
    <>
      <Header />
      <main className="flex-1 bg-[#070707]">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-white/5 px-6 py-20 sm:px-10 lg:px-16">
          <div
            className="pointer-events-none absolute inset-0 opacity-10"
            style={{
              backgroundImage: "radial-gradient(circle, rgba(245,196,0,0.2) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />
          <div
            className="pointer-events-none absolute right-0 top-0 h-[400px] w-[400px]"
            style={{ background: `radial-gradient(circle at 80% 50%, ${meta.color}0A 0%, transparent 70%)` }}
          />
          <div className="relative mx-auto max-w-7xl">
            <Link
              href="/divisions"
              className="mb-8 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/30 transition hover:text-white"
            >
              <ArrowLeft className="h-3 w-3" /> All Divisions
            </Link>
            <div className="flex items-end gap-6">
              <div>
                <div className="mb-3 flex items-center gap-3">
                  <div className="h-px w-8" style={{ background: meta.color }} />
                  <span className="text-[11px] font-bold uppercase tracking-[0.3em]" style={{ color: meta.color }}>
                    Division
                  </span>
                </div>
                <p
                  className="text-7xl font-black uppercase leading-none tracking-tighter sm:text-8xl"
                  style={{ color: meta.color, textShadow: `0 0 60px ${meta.color}30` }}
                >
                  {meta.abbr}
                </p>
                <p className="mt-2 text-sm font-semibold uppercase tracking-wider text-white/30">
                  {division.name}
                </p>
                {division.description && (
                  <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/45">
                    {division.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Teams */}
        <section className="px-6 py-16 sm:px-10 lg:px-16">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 flex items-center gap-3">
              <Users className="h-4 w-4 text-white/30" />
              <h2 className="text-sm font-bold uppercase tracking-widest text-white/30">
                Tim dalam divisi ini
              </h2>
            </div>

            {teams.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {teams.map((team) => {
                  const players = membersByOrg.get(team.id) ?? [];
                  return (
                    <Link
                      key={team.id}
                      href={`/divisions/${slug}/${team.slug}`}
                      className="group flex flex-col gap-4 border border-white/5 bg-[#0D0D0D] p-5 transition hover:border-white/10"
                    >
                      {/* Team header */}
                      <div className="flex items-center gap-4">
                        {team.logo_url ? (
                          <Image
                            src={team.logo_url}
                            alt={team.name}
                            width={48}
                            height={48}
                            className="h-12 w-12 shrink-0 rounded object-cover"
                          />
                        ) : (
                          <div
                            className="flex h-12 w-12 shrink-0 items-center justify-center rounded text-sm font-black"
                            style={{ background: `${meta.color}18`, color: meta.color }}
                          >
                            {team.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-bold text-white">{team.name}</p>
                          {team.description && (
                            <p className="mt-0.5 truncate text-xs text-white/35">{team.description}</p>
                          )}
                        </div>
                      </div>

                      {/* Player preview */}
                      {players.length > 0 && (
                        <div className="flex flex-col gap-1.5 border-t border-white/5 pt-3">
                          {players.map((p, i) => (
                            <div key={i} className="flex items-center gap-2">
                              {p.avatar_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={p.avatar_url}
                                  alt=""
                                  className="h-5 w-5 shrink-0 rounded-full object-cover"
                                />
                              ) : (
                                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#2C2C2C] text-[8px] font-bold text-white/50">
                                  {(p.display_name ?? "?").slice(0, 1).toUpperCase()}
                                </div>
                              )}
                              <span className="truncate text-xs text-white/60">
                                {p.display_name ?? p.username ?? "—"}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Footer */}
                      <div
                        className="mt-auto flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider transition-all group-hover:gap-2"
                        style={{ color: meta.color }}
                      >
                        Lihat Tim <ArrowRight className="h-3 w-3" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="border border-white/5 bg-[#0D0D0D] py-20 text-center">
                <p className="text-sm text-white/30">Roster sedang dalam persiapan.</p>
                <p className="mt-2 text-xs text-white/20">Stay tuned — tim akan segera diumumkan.</p>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 2: Run typecheck**

```bash
npx tsc --noEmit
```
Expected: exit 0.

- [ ] **Step 3: Verify in browser**

Navigate to `http://localhost:3000/divisions/[any-slug]`. Verify:
- Team cards still appear
- Player avatar/name previews appear under each team
- Card is now clickable (cursor changes)
- Empty state text still shows if no teams

- [ ] **Step 4: Commit**

```bash
rtk git add app/divisions/[slug]/page.tsx
rtk git commit -m "feat(roster): add player previews to division team cards"
```

---

### Task 10: Team detail page `/divisions/[slug]/[org-slug]`

**Files:**
- Create: `app/divisions/[slug]/[org-slug]/page.tsx`

- [ ] **Step 1: Create the file**

```tsx
// app/divisions/[slug]/[org-slug]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trophy } from "lucide-react";
import Image from "next/image";

import { Footer } from "@/components/landing/Footer";
import { Header } from "@/components/landing/Header";
import { createAdminClient } from "@/lib/supabase/admin";

const ROLE_LABEL: Record<string, string> = {
  captain: "Captain",
  coach: "Coach",
  member: "Member",
};

const ROLE_COLOR: Record<string, string> = {
  captain: "#A855F7",
  coach: "#3B82F6",
  member: "#9B9A97",
};

const PLACEMENT_LABEL: Record<number, string> = { 1: "Juara 1", 2: "Juara 2", 3: "Juara 3" };
const PLACEMENT_COLOR: Record<number, string> = {
  1: "#F5C400",
  2: "#9B9A97",
  3: "#CD7F32",
};

interface Props {
  params: Promise<{ slug: string; "org-slug": string }>;
}

export const dynamic = "force-dynamic";

export default async function TeamDetailPage({ params }: Props) {
  const { slug: divisionSlug, "org-slug": orgSlug } = await params;
  const admin = createAdminClient();

  const { data: org, error: orgErr } = await admin
    .from("organizations")
    .select("id, name, slug, logo_url, description")
    .eq("slug", orgSlug)
    .maybeSingle();
  if (orgErr) console.error("TeamDetailPage: org fetch:", orgErr);
  if (!org) notFound();

  const { data: membersData, error: mErr } = await admin
    .from("team_members")
    .select("user_id, role, jersey_number, position, main_role")
    .eq("organization_id", org.id)
    .eq("is_active", true)
    .order("role")
    .limit(30);
  if (mErr) console.error("TeamDetailPage: members fetch:", mErr);

  const userIds = (membersData ?? []).map((m) => m.user_id);
  let profileMap = new Map<string, { display_name: string | null; avatar_url: string | null; username: string | null }>();

  if (userIds.length > 0) {
    const { data: profilesData, error: pErr } = await admin
      .from("profiles")
      .select("id, display_name, avatar_url, username")
      .in("id", userIds)
      .limit(30);
    if (pErr) console.error("TeamDetailPage: profiles fetch:", pErr);
    profileMap = new Map((profilesData ?? []).map((p) => [p.id, p]));
  }

  const { data: achievements, error: aErr } = await admin
    .from("achievements")
    .select("id, title, placement, achieved_at")
    .eq("organization_id", org.id)
    .order("achieved_at", { ascending: false })
    .limit(20);
  if (aErr) console.error("TeamDetailPage: achievements fetch:", aErr);

  const members = (membersData ?? []).map((m) => ({
    ...m,
    profile: profileMap.get(m.user_id),
  }));

  return (
    <>
      <Header />
      <main className="flex-1 bg-[#070707]">
        {/* Header */}
        <section className="relative overflow-hidden border-b border-white/5 px-6 py-16 sm:px-10 lg:px-16">
          <div
            className="pointer-events-none absolute inset-0 opacity-8"
            style={{
              backgroundImage: "radial-gradient(circle, rgba(245,196,0,0.15) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />
          <div className="relative mx-auto max-w-7xl">
            <Link
              href={`/divisions/${divisionSlug}`}
              className="mb-8 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/30 transition hover:text-white"
            >
              <ArrowLeft className="h-3 w-3" /> Kembali ke Divisi
            </Link>

            <div className="flex items-center gap-6">
              {org.logo_url ? (
                <Image
                  src={org.logo_url}
                  alt={org.name}
                  width={72}
                  height={72}
                  className="h-18 w-18 rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-[#1E1E1E] text-xl font-black text-white/20">
                  {org.name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <h1 className="text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">
                  {org.name}
                </h1>
                {org.description && (
                  <p className="mt-1.5 max-w-lg text-sm text-white/40">{org.description}</p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Roster */}
        <section className="px-6 py-14 sm:px-10 lg:px-16">
          <div className="mx-auto max-w-7xl">
            <h2 className="mb-6 text-xs font-bold uppercase tracking-[0.3em] text-white/30">
              Roster
            </h2>

            {members.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {members.map((m) => (
                  <Link
                    key={m.user_id}
                    href={m.profile?.username ? `/players/${m.profile.username}` : "#"}
                    className="flex items-center gap-4 border border-white/5 bg-[#0D0D0D] p-4 transition hover:border-white/10"
                  >
                    {m.profile?.avatar_url ? (
                      <Image
                        src={m.profile.avatar_url}
                        alt={m.profile.display_name ?? ""}
                        width={44}
                        height={44}
                        className="h-11 w-11 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#1E1E1E] text-sm font-bold text-white/30">
                        {(m.profile?.display_name ?? "?").slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-[#E5E2E1]">
                        {m.profile?.display_name ?? m.profile?.username ?? "—"}
                      </p>
                      <div className="mt-0.5 flex items-center gap-2">
                        <span
                          className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                          style={{
                            background: `${ROLE_COLOR[m.role] ?? "#9B9A97"}18`,
                            color: ROLE_COLOR[m.role] ?? "#9B9A97",
                          }}
                        >
                          {ROLE_LABEL[m.role] ?? m.role}
                        </span>
                        {m.position && (
                          <span className="truncate text-[10px] text-white/30">{m.position}</span>
                        )}
                        {m.jersey_number != null && (
                          <span className="text-[10px] text-white/20">#{m.jersey_number}</span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-white/30">Roster belum tersedia.</p>
            )}
          </div>
        </section>

        {/* Achievements */}
        {achievements && achievements.length > 0 && (
          <section className="px-6 pb-14 sm:px-10 lg:px-16">
            <div className="mx-auto max-w-7xl">
              <div className="mb-6 flex items-center gap-3">
                <Trophy className="h-4 w-4 text-white/30" />
                <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-white/30">
                  Prestasi Tim
                </h2>
              </div>
              <div className="space-y-2">
                {achievements.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center gap-4 border border-white/5 bg-[#0D0D0D] px-5 py-4"
                  >
                    {a.placement != null && (
                      <span
                        className="shrink-0 text-lg font-black"
                        style={{ color: PLACEMENT_COLOR[a.placement] ?? "#9B9A97" }}
                      >
                        #{a.placement}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[#E5E2E1]">{a.title}</p>
                    </div>
                    {a.placement != null && (
                      <span
                        className="shrink-0 text-[10px] font-bold uppercase tracking-widest"
                        style={{ color: PLACEMENT_COLOR[a.placement] ?? "#9B9A97" }}
                      >
                        {PLACEMENT_LABEL[a.placement] ?? `Juara ${a.placement}`}
                      </span>
                    )}
                    <span className="shrink-0 text-[10px] text-white/25">
                      {a.achieved_at?.slice(0, 4)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 2: Run typecheck**

```bash
npx tsc --noEmit
```
Expected: exit 0.

- [ ] **Step 3: Verify in browser**

Navigate to `http://localhost:3000/divisions/[div-slug]/[org-slug]`. Verify:
- Team header with logo/name shows
- Roster grid shows player cards
- Role badge colors match style guide (captain=purple, coach=blue, member=gray)
- Achievement section only renders if achievements exist
- Back link navigates to correct division page

- [ ] **Step 4: Commit**

```bash
rtk git add "app/divisions/[slug]/[org-slug]/page.tsx"
rtk git commit -m "feat(roster): add public team detail page with roster and achievements"
```

---

### Task 11: Public player profile `/players/[username]`

**Files:**
- Create: `app/players/[username]/page.tsx`

- [ ] **Step 1: Create the file**

```tsx
// app/players/[username]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trophy } from "lucide-react";
import Image from "next/image";

import { Footer } from "@/components/landing/Footer";
import { Header } from "@/components/landing/Header";
import { createAdminClient } from "@/lib/supabase/admin";

const ROLE_LABEL: Record<string, string> = {
  captain: "Captain",
  coach: "Coach",
  member: "Member",
  manager: "Manager",
  owner: "Owner",
};

const PLACEMENT_COLOR: Record<number, string> = {
  1: "#F5C400",
  2: "#9B9A97",
  3: "#CD7F32",
};

const PLACEMENT_LABEL: Record<number, string> = { 1: "Juara 1", 2: "Juara 2", 3: "Juara 3" };

interface Props {
  params: Promise<{ username: string }>;
}

export const dynamic = "force-dynamic";

export default async function PlayerProfilePage({ params }: Props) {
  const { username } = await params;
  const admin = createAdminClient();

  const { data: profile, error: pErr } = await admin
    .from("profiles")
    .select("id, display_name, username, avatar_url")
    .eq("username", username)
    .maybeSingle();
  if (pErr) console.error("PlayerProfilePage: profile fetch:", pErr);
  if (!profile) notFound();

  const { data: memberships, error: mErr } = await admin
    .from("team_members")
    .select("organization_id, role")
    .eq("user_id", profile.id)
    .eq("is_active", true)
    .limit(5);
  if (mErr) console.error("PlayerProfilePage: memberships fetch:", mErr);

  const orgIds = (memberships ?? []).map((m) => m.organization_id);

  let orgMap = new Map<string, { name: string; slug: string }>();
  if (orgIds.length > 0) {
    const { data: orgs, error: oErr } = await admin
      .from("organizations")
      .select("id, name, slug")
      .in("id", orgIds)
      .limit(5);
    if (oErr) console.error("PlayerProfilePage: orgs fetch:", oErr);
    orgMap = new Map((orgs ?? []).map((o) => [o.id, { name: o.name, slug: o.slug }]));
  }

  type AchievementRow = { id: string; title: string; placement: number | null; achieved_at: string | null; organization_id: string };
  let achievements: AchievementRow[] = [];
  if (orgIds.length > 0) {
    const { data, error: aErr } = await admin
      .from("achievements")
      .select("id, title, placement, achieved_at, organization_id")
      .in("organization_id", orgIds)
      .order("achieved_at", { ascending: false })
      .limit(30);
    if (aErr) console.error("PlayerProfilePage: achievements fetch:", aErr);
    achievements = (data ?? []) as AchievementRow[];
  }

  const currentTeam = (memberships ?? [])[0];
  const currentOrg = currentTeam ? orgMap.get(currentTeam.organization_id) : null;

  return (
    <>
      <Header />
      <main className="flex-1 bg-[#070707]">
        {/* Profile header */}
        <section className="relative overflow-hidden border-b border-white/5 px-6 py-16 sm:px-10 lg:px-16">
          <div
            className="pointer-events-none absolute inset-0 opacity-8"
            style={{
              backgroundImage: "radial-gradient(circle, rgba(245,196,0,0.12) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />
          <div className="relative mx-auto max-w-4xl">
            <Link
              href="/"
              className="mb-8 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/30 transition hover:text-white"
            >
              <ArrowLeft className="h-3 w-3" /> Beranda
            </Link>

            <div className="flex items-center gap-6">
              {profile.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={profile.display_name ?? profile.username ?? ""}
                  width={80}
                  height={80}
                  className="h-20 w-20 shrink-0 rounded-full object-cover ring-2 ring-white/10"
                />
              ) : (
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[#1E1E1E] text-2xl font-black text-white/30 ring-2 ring-white/5">
                  {(profile.display_name ?? profile.username ?? "?").slice(0, 1).toUpperCase()}
                </div>
              )}
              <div>
                <h1 className="text-2xl font-black uppercase tracking-tight text-white sm:text-3xl">
                  {profile.display_name ?? profile.username}
                </h1>
                <p className="mt-0.5 text-sm text-white/35">@{profile.username}</p>
                {currentOrg && currentTeam && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-white/25">Tim aktif:</span>
                    <span className="text-xs font-semibold text-white/60">{currentOrg.name}</span>
                    <span className="rounded bg-[#1E1E1E] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white/40">
                      {ROLE_LABEL[currentTeam.role] ?? currentTeam.role}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Achievements */}
        <section className="px-6 py-14 sm:px-10 lg:px-16">
          <div className="mx-auto max-w-4xl">
            <div className="mb-6 flex items-center gap-3">
              <Trophy className="h-4 w-4 text-white/30" />
              <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-white/30">
                Prestasi
              </h2>
            </div>

            {achievements.length > 0 ? (
              <div className="space-y-2">
                {achievements.map((a) => {
                  const org = orgMap.get(a.organization_id);
                  return (
                    <div
                      key={a.id}
                      className="flex items-center gap-4 border border-white/5 bg-[#0D0D0D] px-5 py-4"
                    >
                      {a.placement != null && (
                        <span
                          className="w-6 shrink-0 text-center text-lg font-black"
                          style={{ color: PLACEMENT_COLOR[a.placement] ?? "#9B9A97" }}
                        >
                          #{a.placement}
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[#E5E2E1]">{a.title}</p>
                        {org && (
                          <p className="mt-0.5 text-[10px] text-white/30">{org.name}</p>
                        )}
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        {a.placement != null && (
                          <span
                            className="text-[10px] font-bold uppercase tracking-widest"
                            style={{ color: PLACEMENT_COLOR[a.placement] ?? "#9B9A97" }}
                          >
                            {PLACEMENT_LABEL[a.placement] ?? `Juara ${a.placement}`}
                          </span>
                        )}
                        <span className="text-[10px] text-white/20">
                          {a.achieved_at?.slice(0, 4)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="border border-white/5 bg-[#0D0D0D] py-14 text-center">
                <Trophy className="mx-auto mb-3 h-6 w-6 text-white/10" />
                <p className="text-sm text-white/25">Belum ada prestasi tercatat.</p>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 2: Run typecheck**

```bash
npx tsc --noEmit
```
Expected: exit 0.

- [ ] **Step 3: Verify in browser**

Navigate to `http://localhost:3000/players/[any-username]`. Verify:
- Profile header with avatar, name, username shows
- Current team + role shown if player is active
- Achievements list shows with placement colors (gold/silver/bronze)
- Empty state with trophy icon if no achievements
- `notFound()` triggers for unknown usernames

- [ ] **Step 4: Run full final CI gate**

```bash
npm run lint && npm run typecheck && npm run test:unit
```
Expected: all pass.

- [ ] **Step 5: Final commit**

```bash
rtk git add "app/players/[username]/page.tsx"
rtk git commit -m "feat(roster): add public player profile page with achievements"
```

---

## Done Checklist

- [ ] Achievement helpers: pure functions tested
- [ ] Achievement queries: `getAchievements` + `getPublicAchievements`
- [ ] Achievement admin actions: create / update / delete, tested
- [ ] Auto-trigger: `completeTournamentAction` inserts achievement for placement ≤ 3
- [ ] Admin panel: `/admin/achievements` CRUD with image upload
- [ ] Sidebar nav: "Achievements" link added
- [ ] Landing page: `AchievementsSection` reads from `achievements` table
- [ ] Division page: player previews per team card, cards clickable
- [ ] Team detail page: `/divisions/[slug]/[org-slug]` with full roster + achievements
- [ ] Player profile: `/players/[username]` with avatar, name, achievements
- [ ] All CI checks pass: lint + typecheck + test:unit
