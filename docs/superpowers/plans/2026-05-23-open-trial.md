# Open Trial Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sistem open trial publik — manager/coach buat trial, pemain daftar via link publik tanpa login, WA konfirmasi otomatis ke pendaftar, manager/coach kelola status pendaftar.

**Architecture:** Trial disimpan di tabel `open_trials` dengan `public_token` unik sebagai URL pendaftaran. Pendaftar masuk ke `trial_applicants` tanpa auth. Management panel di workspace `/{slug}/trials` (coach + manager), public form di `/trial/[token]`. WA konfirmasi via `sendWaMessage` (Fonnte) saat submit.

**Tech Stack:** Next.js 15 App Router, Supabase (admin client bypass RLS), Server Actions, Fonnte WA, Tailwind v4 Notion dark theme, Lucide React, `useNotify` (NotifyModal) untuk feedback di panel.

---

## File Structure

```
supabase/migrations/
  20260523120000_open_trials.sql         ← new: tables + RLS

features/trials/
  actions.ts                             ← new: createTrial, updateTrialStatus, updateApplicantStatus, deleteApplicant, registerApplicant
  queries.ts                             ← new: listTrials, getTrialByToken, getTrialById, listApplicants

  components/
    TrialListClient.tsx                  ← new: list trials + create button
    TrialFormModal.tsx                   ← new: create trial modal
    TrialDetailClient.tsx                ← new: applicant table + status management
    ApplicantRow.tsx                     ← new: single applicant row with status dropdown

app/
  trial/[token]/
    page.tsx                             ← new: public registration form (no auth)

  [team-slug]/(workspace)/trials/
    page.tsx                             ← new: fetch + render TrialListClient
    [id]/
      page.tsx                           ← new: fetch + render TrialDetailClient

components/layout/WorkspaceSidebar.tsx  ← modify: add "Open Trial" nav item
middleware.ts                            ← modify: add "trial" to RESERVED_ROOT_SEGMENTS
```

---

## Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/20260523120000_open_trials.sql`

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/20260523120000_open_trials.sql

create table public.open_trials (
  id             uuid primary key default gen_random_uuid(),
  org_id         uuid not null references public.organizations(id) on delete cascade,
  title          text not null,
  game           text not null,
  positions      text[] not null default '{}',
  status         text not null default 'draft'
                   check (status in ('draft', 'active', 'closed')),
  public_token   uuid not null unique default gen_random_uuid(),
  created_by     uuid references auth.users(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table public.trial_applicants (
  id              uuid primary key default gen_random_uuid(),
  trial_id        uuid not null references public.open_trials(id) on delete cascade,
  name            text not null,
  ign             text not null,
  phone           text not null,
  email           text not null,
  role_applied    text not null,
  rank            text not null,
  server          text not null,
  main_game       text not null,
  secondary_game  text,
  is_free_agent   boolean not null default true,
  age             integer not null,
  social_media    text,
  status          text not null default 'pending'
                    check (status in ('pending', 'accepted', 'rejected', 'waitlisted')),
  notes           text,
  created_at      timestamptz not null default now()
);

-- Indexes for common queries
create index on public.open_trials (org_id);
create index on public.open_trials (public_token);
create index on public.trial_applicants (trial_id);
create index on public.trial_applicants (status);

-- RLS enabled — all access via admin client (bypasses RLS)
alter table public.open_trials enable row level security;
alter table public.trial_applicants enable row level security;

-- Public read for active trials (needed for /trial/[token] public page)
create policy "public can read active trials by token"
  on public.open_trials for select
  using (status = 'active');

-- Public insert for applicants (registration form — no auth)
create policy "public can register as applicant"
  on public.trial_applicants for insert
  with check (true);
```

- [ ] **Step 2: Push migration**

```bash
npx supabase db push
```

Expected: `Applying migration 20260523120000_open_trials.sql...` with no errors.

- [ ] **Step 3: Update TypeScript types**

```bash
npx supabase gen types typescript --project-id pqzdukrlmbwjjgjyoqva --schema public > types/database.ts
```

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260523120000_open_trials.sql types/database.ts
git commit -m "feat(trials): add open_trials + trial_applicants migration"
```

---

## Task 2: Queries

**Files:**
- Create: `features/trials/queries.ts`

- [ ] **Step 1: Write queries**

```typescript
// features/trials/queries.ts
import { createAdminClient } from "@/lib/supabase/admin";

export interface TrialRow {
  id: string;
  org_id: string;
  title: string;
  game: string;
  positions: string[];
  status: "draft" | "active" | "closed";
  public_token: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApplicantRow {
  id: string;
  trial_id: string;
  name: string;
  ign: string;
  phone: string;
  email: string;
  role_applied: string;
  rank: string;
  server: string;
  main_game: string;
  secondary_game: string | null;
  is_free_agent: boolean;
  age: number;
  social_media: string | null;
  status: "pending" | "accepted" | "rejected" | "waitlisted";
  notes: string | null;
  created_at: string;
}

export interface TrialWithCount extends TrialRow {
  applicant_count: number;
}

export async function listTrials(orgId: string): Promise<TrialWithCount[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("open_trials")
    .select("*, trial_applicants(count)")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((t) => ({
    ...t,
    positions: t.positions ?? [],
    applicant_count: (t.trial_applicants as unknown as [{ count: number }])[0]?.count ?? 0,
  })) as TrialWithCount[];
}

export async function getTrialById(id: string): Promise<TrialRow | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("open_trials")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return (data as TrialRow | null) ?? null;
}

export async function getTrialByToken(token: string): Promise<(TrialRow & { org_name: string }) | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("open_trials")
    .select("*, organizations(name)")
    .eq("public_token", token)
    .maybeSingle();

  if (!data) return null;
  const org = data.organizations as unknown as { name: string } | null;
  return { ...(data as unknown as TrialRow), org_name: org?.name ?? "Tim" };
}

export async function listApplicants(trialId: string): Promise<ApplicantRow[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("trial_applicants")
    .select("*")
    .eq("trial_id", trialId)
    .order("created_at", { ascending: false });
  return (data as ApplicantRow[]) ?? [];
}
```

- [ ] **Step 2: Commit**

```bash
git add features/trials/queries.ts
git commit -m "feat(trials): add trial + applicant queries"
```

---

## Task 3: Server Actions

**Files:**
- Create: `features/trials/actions.ts`

- [ ] **Step 1: Write actions**

```typescript
// features/trials/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { sendWaMessage } from "@/lib/utils/fonnte";

type ActionResult = { ok: true } | { ok: false; message: string };

async function getManagerOrCoach() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createAdminClient();
  const { data } = await admin
    .from("team_members")
    .select("organization_id, role")
    .eq("user_id", user.id)
    .in("role", ["manager", "coach", "owner"])
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (!data) return null;
  return { user, orgId: data.organization_id, role: data.role };
}

export async function createTrialAction(
  raw: { title: unknown; game: unknown; positions: unknown },
  revalidatePaths: string[]
): Promise<ActionResult> {
  const session = await getManagerOrCoach();
  if (!session) return { ok: false, message: "Akses ditolak" };

  const title = String(raw.title ?? "").trim();
  const game = String(raw.game ?? "").trim();
  const positions = Array.isArray(raw.positions) ? (raw.positions as string[]).filter(Boolean) : [];

  if (!title || !game) return { ok: false, message: "Judul dan game wajib diisi" };

  const admin = createAdminClient();
  const { error } = await admin.from("open_trials").insert({
    org_id: session.orgId,
    title,
    game,
    positions,
    created_by: session.user.id,
  });

  if (error) return { ok: false, message: error.message };
  revalidatePaths.forEach((p) => revalidatePath(p));
  return { ok: true };
}

export async function updateTrialStatusAction(
  trialId: string,
  status: "draft" | "active" | "closed",
  revalidatePaths: string[]
): Promise<ActionResult> {
  const session = await getManagerOrCoach();
  if (!session) return { ok: false, message: "Akses ditolak" };

  const admin = createAdminClient();
  const { error } = await admin
    .from("open_trials")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", trialId)
    .eq("org_id", session.orgId);

  if (error) return { ok: false, message: error.message };
  revalidatePaths.forEach((p) => revalidatePath(p));
  return { ok: true };
}

export async function updateApplicantStatusAction(
  applicantId: string,
  trialId: string,
  status: "pending" | "accepted" | "rejected" | "waitlisted",
  notes: string | undefined,
  revalidatePaths: string[]
): Promise<ActionResult> {
  const session = await getManagerOrCoach();
  if (!session) return { ok: false, message: "Akses ditolak" };

  const admin = createAdminClient();

  // Verify trial belongs to org
  const { data: trial } = await admin
    .from("open_trials")
    .select("id, org_id")
    .eq("id", trialId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!trial) return { ok: false, message: "Trial tidak ditemukan" };

  const { error } = await admin
    .from("trial_applicants")
    .update({ status, notes: notes ?? null })
    .eq("id", applicantId)
    .eq("trial_id", trialId);

  if (error) return { ok: false, message: error.message };
  revalidatePaths.forEach((p) => revalidatePath(p));
  return { ok: true };
}

export async function deleteApplicantAction(
  applicantId: string,
  trialId: string,
  revalidatePaths: string[]
): Promise<ActionResult> {
  const session = await getManagerOrCoach();
  if (!session) return { ok: false, message: "Akses ditolak" };

  const admin = createAdminClient();
  const { data: trial } = await admin
    .from("open_trials")
    .select("id, org_id")
    .eq("id", trialId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!trial) return { ok: false, message: "Trial tidak ditemukan" };

  const { error } = await admin
    .from("trial_applicants")
    .delete()
    .eq("id", applicantId);

  if (error) return { ok: false, message: error.message };
  revalidatePaths.forEach((p) => revalidatePath(p));
  return { ok: true };
}

// Public action — no auth required
export async function registerApplicantAction(raw: {
  trial_id: unknown;
  name: unknown;
  ign: unknown;
  phone: unknown;
  email: unknown;
  role_applied: unknown;
  rank: unknown;
  server: unknown;
  main_game: unknown;
  secondary_game: unknown;
  is_free_agent: unknown;
  age: unknown;
  social_media: unknown;
}): Promise<ActionResult> {
  const trialId = String(raw.trial_id ?? "").trim();
  const name = String(raw.name ?? "").trim();
  const ign = String(raw.ign ?? "").trim();
  const phone = String(raw.phone ?? "").trim().replace(/\D/g, "");
  const email = String(raw.email ?? "").trim();
  const roleApplied = String(raw.role_applied ?? "").trim();
  const rank = String(raw.rank ?? "").trim();
  const server = String(raw.server ?? "").trim();
  const mainGame = String(raw.main_game ?? "").trim();
  const secondaryGame = String(raw.secondary_game ?? "").trim() || null;
  const isFreeAgent = raw.is_free_agent === true || raw.is_free_agent === "true";
  const age = parseInt(String(raw.age ?? "0"), 10);
  const socialMedia = String(raw.social_media ?? "").trim() || null;

  if (!trialId || !name || !ign || !phone || !email || !roleApplied || !rank || !server || !mainGame || !age) {
    return { ok: false, message: "Semua field wajib diisi" };
  }

  const admin = createAdminClient();

  // Check trial is active
  const { data: trial } = await admin
    .from("open_trials")
    .select("id, title, status")
    .eq("id", trialId)
    .maybeSingle();

  if (!trial) return { ok: false, message: "Trial tidak ditemukan" };
  if (trial.status !== "active") return { ok: false, message: "Pendaftaran trial ini sudah ditutup" };

  // Check duplicate phone in this trial
  const { data: existing } = await admin
    .from("trial_applicants")
    .select("id")
    .eq("trial_id", trialId)
    .eq("phone", phone)
    .maybeSingle();
  if (existing) return { ok: false, message: "Nomor WhatsApp sudah terdaftar di trial ini" };

  const { error } = await admin.from("trial_applicants").insert({
    trial_id: trialId,
    name,
    ign,
    phone,
    email,
    role_applied: roleApplied,
    rank,
    server,
    main_game: mainGame,
    secondary_game: secondaryGame,
    is_free_agent: isFreeAgent,
    age,
    social_media: socialMedia,
  });

  if (error) return { ok: false, message: error.message };

  // WA confirmation — best effort, don't fail registration if WA fails
  await sendWaMessage(
    phone,
    `Halo ${name}! ✅ Pendaftaran trial *${trial.title}* berhasil diterima.\n\nData kamu:\n• IGN: ${ign}\n• Role: ${roleApplied}\n• Rank: ${rank} (${server})\n\nTim akan menghubungi kamu setelah proses seleksi selesai. Semangat! 🎮`
  );

  return { ok: true };
}
```

- [ ] **Step 2: Commit**

```bash
git add features/trials/actions.ts
git commit -m "feat(trials): add trial + applicant server actions with WA confirmation"
```

---

## Task 4: TrialFormModal Component

**Files:**
- Create: `features/trials/components/TrialFormModal.tsx`

- [ ] **Step 1: Write component**

```tsx
// features/trials/components/TrialFormModal.tsx
"use client";

import { Loader2, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { useNotify } from "@/features/dashboard/components/NotifyModal";
import { createTrialAction } from "@/features/trials/actions";

interface TrialFormModalProps {
  revalidatePaths: string[];
  onClose: () => void;
}

const POSITION_SUGGESTIONS = [
  "Duelist", "Controller", "Initiator", "Sentinel",
  "IGL", "Support", "Jungler", "Mid Laner", "Top Laner", "Bot Laner",
  "Carry", "Offlaner", "Hard Support", "Pos 1", "Pos 2", "Pos 3", "Pos 4", "Pos 5",
];

export function TrialFormModal({ revalidatePaths, onClose }: TrialFormModalProps) {
  const router = useRouter();
  const { success, error: notifyError } = useNotify();
  const [pending, startTransition] = useTransition();
  const [positions, setPositions] = useState<string[]>([]);
  const [posInput, setPosInput] = useState("");
  const [err, setErr] = useState<string | null>(null);

  function addPosition(pos: string) {
    const trimmed = pos.trim();
    if (!trimmed || positions.includes(trimmed)) return;
    setPositions((prev) => [...prev, trimmed]);
    setPosInput("");
  }

  function removePosition(pos: string) {
    setPositions((prev) => prev.filter((p) => p !== pos));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      setErr(null);
      const res = await createTrialAction(
        {
          title: fd.get("title"),
          game: fd.get("game"),
          positions,
        },
        revalidatePaths
      );
      if (res.ok) {
        success("Trial berhasil dibuat");
        onClose();
        router.refresh();
      } else {
        setErr(res.message);
        notifyError(res.message);
      }
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-[#2D2D2D] bg-[#202020] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-[#E5E2E1]">Buat Open Trial</h3>
          <button type="button" onClick={onClose} className="text-[#9B9A97] hover:text-[#E5E2E1] cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-[#9B9A97] mb-1">
              Judul Trial <span className="text-red-400">*</span>
            </label>
            <input
              name="title"
              type="text"
              required
              className="h-10 w-full rounded-md border border-[#2D2D2D] bg-[#191919] px-3 text-sm text-[#E5E2E1] focus:border-[#9B9A97] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs text-[#9B9A97] mb-1">
              Game <span className="text-red-400">*</span>
            </label>
            <input
              name="game"
              type="text"
              required
              className="h-10 w-full rounded-md border border-[#2D2D2D] bg-[#191919] px-3 text-sm text-[#E5E2E1] focus:border-[#9B9A97] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs text-[#9B9A97] mb-1">Posisi yang Dibutuhkan</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={posInput}
                onChange={(e) => setPosInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); addPosition(posInput); }
                }}
                className="h-9 flex-1 rounded-md border border-[#2D2D2D] bg-[#191919] px-3 text-sm text-[#E5E2E1] focus:border-[#9B9A97] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => addPosition(posInput)}
                className="h-9 rounded-md border border-[#2D2D2D] px-3 text-[#9B9A97] hover:bg-[#2C2C2C] cursor-pointer"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {/* Suggestions */}
            <div className="mt-2 flex flex-wrap gap-1">
              {POSITION_SUGGESTIONS.filter((s) => !positions.includes(s)).slice(0, 8).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => addPosition(s)}
                  className="rounded-full border border-[#2D2D2D] px-2 py-0.5 text-[10px] text-[#6B6A68] hover:border-[#9B9A97] hover:text-[#9B9A97] cursor-pointer"
                >
                  + {s}
                </button>
              ))}
            </div>
            {/* Selected positions */}
            {positions.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {positions.map((p) => (
                  <span
                    key={p}
                    className="inline-flex items-center gap-1 rounded-full bg-[#2C2C2C] px-2 py-0.5 text-xs text-[#E5E2E1]"
                  >
                    {p}
                    <button type="button" onClick={() => removePosition(p)} className="cursor-pointer">
                      <X className="h-2.5 w-2.5 text-[#9B9A97]" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {err && (
            <p className="text-xs text-red-400 rounded border border-red-500/20 bg-red-500/10 px-3 py-2">
              {err}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-9 rounded-md border border-[#2D2D2D] px-4 text-sm text-[#9B9A97] hover:bg-[#2C2C2C] cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex h-9 items-center gap-2 rounded-md bg-[#E5E2E1] px-4 text-sm font-semibold text-[#191919] hover:bg-white disabled:opacity-50 cursor-pointer"
            >
              {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Buat Trial
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add features/trials/components/TrialFormModal.tsx
git commit -m "feat(trials): add TrialFormModal component"
```

---

## Task 5: TrialListClient Component

**Files:**
- Create: `features/trials/components/TrialListClient.tsx`

- [ ] **Step 1: Write component**

```tsx
// features/trials/components/TrialListClient.tsx
"use client";

import { ClipboardList, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { TrialFormModal } from "@/features/trials/components/TrialFormModal";
import type { TrialWithCount } from "@/features/trials/queries";

const STATUS_BADGE: Record<string, string> = {
  draft:  "bg-[#2C2C2C] text-[#9B9A97]",
  active: "bg-green-500/15 text-green-400",
  closed: "bg-[#2C2C2C] text-[#6B6A68]",
};

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  active: "Aktif",
  closed: "Ditutup",
};

interface TrialListClientProps {
  orgSlug: string;
  trials: TrialWithCount[];
  canManage: boolean; // manager or coach
  revalidatePaths: string[];
}

export function TrialListClient({ orgSlug, trials, canManage, revalidatePaths }: TrialListClientProps) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[#9B9A97] uppercase tracking-wide">
          Semua Trial ({trials.length})
        </h2>
        {canManage && (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex h-9 items-center gap-2 rounded-md bg-[#E5E2E1] px-4 text-sm font-semibold text-[#191919] hover:bg-white cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Buat Trial
          </button>
        )}
      </div>

      {trials.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#2D2D2D] bg-[#202020]/40 p-10 text-center">
          <ClipboardList className="mx-auto h-8 w-8 text-[#6B6A68]" />
          <p className="mt-3 text-sm text-[#9B9A97]">Belum ada open trial.</p>
          {canManage && (
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="mt-4 inline-flex h-9 items-center rounded-md border border-white/15 px-4 text-sm font-medium text-white transition hover:bg-white/5 cursor-pointer"
            >
              Buat trial pertama
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {trials.map((t) => (
            <Link
              key={t.id}
              href={`/${orgSlug}/trials/${t.id}`}
              className="flex items-center justify-between rounded-xl border border-[#2D2D2D] bg-[#202020] px-5 py-4 hover:bg-[#2C2C2C] transition"
            >
              <div className="space-y-1">
                <p className="text-sm font-medium text-[#E5E2E1]">{t.title}</p>
                <p className="text-xs text-[#6B6A68]">
                  {t.game}
                  {t.positions.length > 0 && ` · ${t.positions.join(", ")}`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-[#9B9A97]">{t.applicant_count} pendaftar</span>
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${STATUS_BADGE[t.status]}`}>
                  {STATUS_LABEL[t.status]}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {modalOpen && (
        <TrialFormModal
          revalidatePaths={revalidatePaths}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add features/trials/components/TrialListClient.tsx
git commit -m "feat(trials): add TrialListClient component"
```

---

## Task 6: ApplicantRow + TrialDetailClient Components

**Files:**
- Create: `features/trials/components/ApplicantRow.tsx`
- Create: `features/trials/components/TrialDetailClient.tsx`

- [ ] **Step 1: Write ApplicantRow**

```tsx
// features/trials/components/ApplicantRow.tsx
"use client";

import { ChevronDown, Check, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { useNotify } from "@/features/dashboard/components/NotifyModal";
import { updateApplicantStatusAction, deleteApplicantAction } from "@/features/trials/actions";
import type { ApplicantRow as ApplicantRowType } from "@/features/trials/queries";
import { cn } from "@/lib/utils/cn";

const STATUS_OPTIONS = [
  { value: "pending",    label: "Pending",    color: "text-[#9B9A97] bg-[#2C2C2C]" },
  { value: "accepted",   label: "Diterima",   color: "text-green-400 bg-green-500/15" },
  { value: "waitlisted", label: "Waitlist",   color: "text-yellow-400 bg-yellow-500/15" },
  { value: "rejected",   label: "Ditolak",    color: "text-red-400 bg-red-500/15" },
] as const;

interface ApplicantRowProps {
  applicant: ApplicantRowType;
  trialId: string;
  canManage: boolean;
  revalidatePaths: string[];
}

export function ApplicantRow({ applicant, trialId, canManage, revalidatePaths }: ApplicantRowProps) {
  const router = useRouter();
  const { success, error: notifyError } = useNotify();
  const [dropOpen, setDropOpen] = useState(false);
  const [updating, startUpdate] = useTransition();
  const [deleting, startDelete] = useTransition();
  const dropRef = useRef<HTMLDivElement>(null);

  const currentStatus = STATUS_OPTIONS.find((s) => s.value === applicant.status) ?? STATUS_OPTIONS[0];

  useEffect(() => {
    if (!dropOpen) return;
    function handle(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [dropOpen]);

  function handleStatus(val: string) {
    setDropOpen(false);
    startUpdate(async () => {
      const res = await updateApplicantStatusAction(applicant.id, trialId, val as ApplicantRowType["status"], undefined, revalidatePaths);
      if (res.ok) { success("Status diperbarui"); router.refresh(); }
      else notifyError(res.message);
    });
  }

  function handleDelete() {
    if (!confirm(`Hapus pendaftar ${applicant.name}?`)) return;
    startDelete(async () => {
      const res = await deleteApplicantAction(applicant.id, trialId, revalidatePaths);
      if (res.ok) { success("Pendaftar dihapus"); router.refresh(); }
      else notifyError(res.message);
    });
  }

  return (
    <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-4 items-center border-b border-[#2D2D2D] px-4 py-3 text-sm last:border-0 hover:bg-[#202020]/50">
      {/* Identitas */}
      <div>
        <p className="font-medium text-[#E5E2E1]">{applicant.name}</p>
        <p className="text-xs text-[#6B6A68]">{applicant.ign} · {applicant.age} th</p>
        <p className="text-xs text-[#6B6A68]">
          {applicant.is_free_agent ? "Free agent" : "Masih di tim"}
        </p>
      </div>
      {/* Kontak */}
      <div className="space-y-0.5">
        <p className="text-xs text-[#9B9A97]">{applicant.phone}</p>
        <p className="text-xs text-[#6B6A68] truncate">{applicant.email}</p>
        {applicant.social_media && (
          <p className="text-xs text-[#6B6A68] truncate">{applicant.social_media}</p>
        )}
      </div>
      {/* Game info */}
      <div className="space-y-0.5">
        <p className="text-xs text-[#E5E2E1]">{applicant.role_applied}</p>
        <p className="text-xs text-[#9B9A97]">{applicant.rank} · {applicant.server}</p>
        <p className="text-xs text-[#6B6A68]">
          {applicant.main_game}
          {applicant.secondary_game ? ` / ${applicant.secondary_game}` : ""}
        </p>
      </div>
      {/* Actions */}
      <div className="flex items-center gap-2">
        {canManage ? (
          <div ref={dropRef} className="relative">
            <button
              type="button"
              onClick={() => setDropOpen((v) => !v)}
              disabled={updating}
              className={cn("inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-semibold cursor-pointer", currentStatus.color)}
            >
              {currentStatus.label}
              <ChevronDown className="h-3 w-3" />
            </button>
            {dropOpen && (
              <div className="absolute right-0 top-full z-50 mt-1 w-36 rounded-lg border border-[#2D2D2D] bg-[#202020] py-1 shadow-xl">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleStatus(opt.value)}
                    className="flex w-full items-center justify-between px-3 py-1.5 text-xs hover:bg-[#2C2C2C] cursor-pointer"
                  >
                    <span className={opt.color.split(" ")[0]}>{opt.label}</span>
                    {applicant.status === opt.value && <Check className="h-3 w-3 text-[#9B9A97]" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <span className={cn("inline-flex h-7 items-center rounded-full px-2.5 text-[11px] font-semibold", currentStatus.color)}>
            {currentStatus.label}
          </span>
        )}
        {canManage && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="text-[#6B6A68] hover:text-red-400 cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Write TrialDetailClient**

```tsx
// features/trials/components/TrialDetailClient.tsx
"use client";

import { Check, ChevronDown, Copy, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { useNotify } from "@/features/dashboard/components/NotifyModal";
import { updateTrialStatusAction } from "@/features/trials/actions";
import { ApplicantRow } from "@/features/trials/components/ApplicantRow";
import type { ApplicantRow as ApplicantRowType, TrialRow } from "@/features/trials/queries";

const STATUS_OPTIONS: Array<{ value: "draft" | "active" | "closed"; label: string; color: string }> = [
  { value: "draft",  label: "Draft",   color: "text-[#9B9A97]" },
  { value: "active", label: "Aktif",   color: "text-green-400" },
  { value: "closed", label: "Ditutup", color: "text-[#6B6A68]" },
];

interface TrialDetailClientProps {
  trial: TrialRow;
  applicants: ApplicantRowType[];
  canManage: boolean;
  appUrl: string;
  revalidatePaths: string[];
}

export function TrialDetailClient({ trial, applicants, canManage, appUrl, revalidatePaths }: TrialDetailClientProps) {
  const router = useRouter();
  const { success, error: notifyError } = useNotify();
  const [updating, startUpdate] = useTransition();
  const [copied, setCopied] = useState(false);

  const registrationUrl = `${appUrl}/trial/${trial.public_token}`;

  function copyLink() {
    navigator.clipboard.writeText(registrationUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleStatus(val: "draft" | "active" | "closed") {
    startUpdate(async () => {
      const res = await updateTrialStatusAction(trial.id, val, revalidatePaths);
      if (res.ok) { success("Status trial diperbarui"); router.refresh(); }
      else notifyError(res.message);
    });
  }

  const pending    = applicants.filter((a) => a.status === "pending").length;
  const accepted   = applicants.filter((a) => a.status === "accepted").length;
  const waitlisted = applicants.filter((a) => a.status === "waitlisted").length;
  const rejected   = applicants.filter((a) => a.status === "rejected").length;

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="rounded-xl border border-[#2D2D2D] bg-[#202020] p-5 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-[#E5E2E1]">{trial.title}</h2>
            <p className="text-sm text-[#9B9A97]">{trial.game}</p>
            {trial.positions.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {trial.positions.map((p) => (
                  <span key={p} className="rounded-full bg-[#2C2C2C] px-2 py-0.5 text-xs text-[#9B9A97]">{p}</span>
                ))}
              </div>
            )}
          </div>
          {canManage && (
            <div className="flex items-center gap-2">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleStatus(opt.value)}
                  disabled={updating || trial.status === opt.value}
                  className={`h-8 rounded-md border px-3 text-xs font-semibold transition cursor-pointer disabled:opacity-40 ${
                    trial.status === opt.value
                      ? "border-[#9B9A97] bg-[#2C2C2C] text-[#E5E2E1]"
                      : "border-[#2D2D2D] text-[#6B6A68] hover:border-[#9B9A97] hover:text-[#9B9A97]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Registration link */}
        {trial.status === "active" && (
          <div className="flex items-center gap-2 rounded-lg border border-[#2D2D2D] bg-[#191919] px-3 py-2">
            <p className="flex-1 truncate text-xs text-[#9B9A97] font-mono">{registrationUrl}</p>
            <button
              type="button"
              onClick={copyLink}
              className="inline-flex items-center gap-1.5 rounded-md border border-[#2D2D2D] px-2.5 py-1 text-xs text-[#9B9A97] hover:bg-[#2C2C2C] cursor-pointer"
            >
              {copied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
              {copied ? "Tersalin" : "Salin"}
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 text-center">
          {[
            { label: "Total", value: applicants.length, color: "text-[#E5E2E1]" },
            { label: "Pending", value: pending, color: "text-[#9B9A97]" },
            { label: "Diterima", value: accepted, color: "text-green-400" },
            { label: "Waitlist", value: waitlisted, color: "text-yellow-400" },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border border-[#2D2D2D] py-2">
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-[#6B6A68]">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Applicant table */}
      <div className="rounded-xl border border-[#2D2D2D] bg-[#202020] overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-4 border-b border-[#2D2D2D] px-4 py-2">
          {["Identitas", "Kontak", "Game Info", "Status"].map((h) => (
            <p key={h} className="text-[10px] font-semibold uppercase tracking-wide text-[#6B6A68]">{h}</p>
          ))}
        </div>

        {applicants.length === 0 ? (
          <div className="py-12 text-center">
            <Users className="mx-auto h-8 w-8 text-[#6B6A68]" />
            <p className="mt-3 text-sm text-[#9B9A97]">
              {trial.status === "active" ? "Belum ada pendaftar." : "Tidak ada pendaftar."}
            </p>
          </div>
        ) : (
          applicants.map((a) => (
            <ApplicantRow
              key={a.id}
              applicant={a}
              trialId={trial.id}
              canManage={canManage}
              revalidatePaths={revalidatePaths}
            />
          ))
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add features/trials/components/ApplicantRow.tsx features/trials/components/TrialDetailClient.tsx
git commit -m "feat(trials): add ApplicantRow + TrialDetailClient components"
```

---

## Task 7: Workspace Pages

**Files:**
- Create: `app/[team-slug]/(workspace)/trials/page.tsx`
- Create: `app/[team-slug]/(workspace)/trials/[id]/page.tsx`

- [ ] **Step 1: Write trials list page**

```tsx
// app/[team-slug]/(workspace)/trials/page.tsx
import { redirect } from "next/navigation";

import { TrialListClient } from "@/features/trials/components/TrialListClient";
import { listTrials } from "@/features/trials/queries";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ "team-slug": string }>;
}

export default async function TrialsPage({ params }: Props) {
  const { "team-slug": slug } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/${slug}/trials`);

  const admin = createAdminClient();
  const { data: org } = await admin
    .from("organizations")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (!org) redirect("/");

  const { data: membership } = await admin
    .from("team_members")
    .select("role")
    .eq("user_id", user.id)
    .eq("organization_id", org.id)
    .eq("is_active", true)
    .maybeSingle();
  if (!membership) redirect("/");

  const canManage = ["manager", "coach", "owner"].includes(membership.role ?? "");
  const trials = await listTrials(org.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Open Trial</h1>
        <p className="mt-1 text-sm text-[#9B9A97]">Kelola seleksi pemain baru untuk tim.</p>
      </div>
      <TrialListClient
        orgSlug={slug}
        trials={trials}
        canManage={canManage}
        revalidatePaths={[`/${slug}/trials`]}
      />
    </div>
  );
}
```

- [ ] **Step 2: Write trial detail page**

```tsx
// app/[team-slug]/(workspace)/trials/[id]/page.tsx
import { redirect } from "next/navigation";

import { TrialDetailClient } from "@/features/trials/components/TrialDetailClient";
import { getTrialById, listApplicants } from "@/features/trials/queries";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ "team-slug": string; id: string }>;
}

export default async function TrialDetailPage({ params }: Props) {
  const { "team-slug": slug, id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/${slug}/trials/${id}`);

  const admin = createAdminClient();
  const { data: org } = await admin
    .from("organizations")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (!org) redirect("/");

  const { data: membership } = await admin
    .from("team_members")
    .select("role")
    .eq("user_id", user.id)
    .eq("organization_id", org.id)
    .eq("is_active", true)
    .maybeSingle();
  if (!membership) redirect("/");

  const [trial, applicants] = await Promise.all([
    getTrialById(id),
    listApplicants(id),
  ]);

  if (!trial || trial.org_id !== org.id) redirect(`/${slug}/trials`);

  const canManage = ["manager", "coach", "owner"].includes(membership.role ?? "");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Detail Trial</h1>
      </div>
      <TrialDetailClient
        trial={trial}
        applicants={applicants}
        canManage={canManage}
        appUrl={appUrl}
        revalidatePaths={[`/${slug}/trials`, `/${slug}/trials/${id}`]}
      />
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add "app/[team-slug]/(workspace)/trials/page.tsx" "app/[team-slug]/(workspace)/trials/[id]/page.tsx"
git commit -m "feat(trials): add workspace trials list + detail pages"
```

---

## Task 8: Public Registration Page

**Files:**
- Create: `app/trial/[token]/page.tsx`
- Modify: `middleware.ts` — add "trial" to RESERVED_ROOT_SEGMENTS

- [ ] **Step 1: Add "trial" to middleware**

In `middleware.ts`, inside `RESERVED_ROOT_SEGMENTS`:

```typescript
// After "invite":
"trial",
```

- [ ] **Step 2: Write public registration page**

```tsx
// app/trial/[token]/page.tsx
import type { Metadata } from "next";

import { getTrialByToken } from "@/features/trials/queries";
import { TrialRegistrationForm } from "@/features/trials/components/TrialRegistrationForm";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const trial = await getTrialByToken(token);
  return { title: trial ? `Daftar Trial — ${trial.title}` : "Trial tidak ditemukan" };
}

export default async function TrialPublicPage({ params }: Props) {
  const { token } = await params;
  const trial = await getTrialByToken(token);

  return (
    <div className="min-h-screen bg-[#191919] flex flex-col">
      <header className="border-b border-[#2D2D2D] bg-[#202020]">
        <div className="mx-auto flex h-14 w-full max-w-3xl items-center px-4">
          <span className="text-sm font-semibold tracking-tight text-[#E5E2E1]">Hyperion Team</span>
        </div>
      </header>
      <main className="flex flex-1 items-start justify-center px-4 py-10">
        <div className="w-full max-w-lg">
          {!trial ? (
            <div className="rounded-xl border border-[#2D2D2D] bg-[#202020] p-8 text-center">
              <p className="text-sm font-semibold text-[#E5E2E1]">Trial tidak ditemukan</p>
              <p className="mt-1 text-xs text-[#9B9A97]">Link mungkin sudah tidak aktif atau salah ketik.</p>
            </div>
          ) : trial.status !== "active" ? (
            <div className="rounded-xl border border-[#2D2D2D] bg-[#202020] p-8 text-center">
              <p className="text-sm font-semibold text-[#E5E2E1]">Pendaftaran ditutup</p>
              <p className="mt-1 text-xs text-[#9B9A97]">Trial ini sudah tidak menerima pendaftar baru.</p>
            </div>
          ) : (
            <TrialRegistrationForm trial={trial} />
          )}
        </div>
      </main>
    </div>
  );
}
```

- [ ] **Step 3: Write TrialRegistrationForm component**

Create: `features/trials/components/TrialRegistrationForm.tsx`

```tsx
// features/trials/components/TrialRegistrationForm.tsx
"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import { useState, useTransition } from "react";

import { registerApplicantAction } from "@/features/trials/actions";
import type { getTrialByToken } from "@/features/trials/queries";
import { cn } from "@/lib/utils/cn";

type TrialPublic = NonNullable<Awaited<ReturnType<typeof getTrialByToken>>>;

const inputCls = "h-10 w-full rounded-md border border-[#2D2D2D] bg-[#191919] px-3 text-sm text-[#E5E2E1] focus:border-[#9B9A97] focus:outline-none";

export function TrialRegistrationForm({ trial }: { trial: TrialPublic }) {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [isFreeAgent, setIsFreeAgent] = useState(true);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      setErr(null);
      const res = await registerApplicantAction({
        trial_id: trial.id,
        name: fd.get("name"),
        ign: fd.get("ign"),
        phone: fd.get("phone"),
        email: fd.get("email"),
        role_applied: fd.get("role_applied"),
        rank: fd.get("rank"),
        server: fd.get("server"),
        main_game: trial.game,
        secondary_game: fd.get("secondary_game"),
        is_free_agent: isFreeAgent,
        age: fd.get("age"),
        social_media: fd.get("social_media"),
      });
      if (res.ok) setDone(true);
      else setErr(res.message);
    });
  }

  if (done) {
    return (
      <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-10 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-green-400" />
        <p className="mt-4 text-base font-semibold text-[#E5E2E1]">Pendaftaran berhasil!</p>
        <p className="mt-1 text-sm text-[#9B9A97]">
          Cek WhatsApp kamu untuk konfirmasi. Tim akan menghubungi setelah seleksi.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#2D2D2D] bg-[#202020] p-6 space-y-6">
      <div>
        <p className="text-xs text-[#9B9A97] uppercase tracking-wide">{trial.org_name}</p>
        <h1 className="mt-1 text-xl font-bold text-[#E5E2E1]">{trial.title}</h1>
        <p className="text-sm text-[#9B9A97]">{trial.game}</p>
        {trial.positions.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {trial.positions.map((p) => (
              <span key={p} className="rounded-full bg-[#2C2C2C] px-2 py-0.5 text-xs text-[#9B9A97]">{p}</span>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-[#9B9A97] mb-1">Nama Lengkap <span className="text-red-400">*</span></label>
            <input name="name" type="text" required className={inputCls} />
          </div>
          <div>
            <label className="block text-xs text-[#9B9A97] mb-1">IGN (In-Game Name) <span className="text-red-400">*</span></label>
            <input name="ign" type="text" required className={inputCls} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-[#9B9A97] mb-1">No. WhatsApp <span className="text-red-400">*</span></label>
            <input name="phone" type="tel" required inputMode="numeric" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs text-[#9B9A97] mb-1">Email <span className="text-red-400">*</span></label>
            <input name="email" type="email" required className={inputCls} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-[#9B9A97] mb-1">Umur <span className="text-red-400">*</span></label>
            <input name="age" type="number" min={10} max={99} required inputMode="numeric" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs text-[#9B9A97] mb-1">Role / Posisi Dilamar <span className="text-red-400">*</span></label>
            {trial.positions.length > 0 ? (
              <select name="role_applied" required className={inputCls}>
                <option value="">— Pilih posisi —</option>
                {trial.positions.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            ) : (
              <input name="role_applied" type="text" required className={inputCls} />
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-[#9B9A97] mb-1">Rank Saat Ini <span className="text-red-400">*</span></label>
            <input name="rank" type="text" required className={inputCls} />
          </div>
          <div>
            <label className="block text-xs text-[#9B9A97] mb-1">Server <span className="text-red-400">*</span></label>
            <input name="server" type="text" required className={inputCls} />
          </div>
        </div>

        <div>
          <label className="block text-xs text-[#9B9A97] mb-1">Game Sampingan</label>
          <input name="secondary_game" type="text" className={inputCls} />
        </div>

        <div>
          <label className="block text-xs text-[#9B9A97] mb-1">Sosial Media <span className="text-red-400">*</span></label>
          <input name="social_media" type="text" required className={inputCls} />
        </div>

        {/* Free agent toggle */}
        <div className="flex items-center justify-between rounded-lg border border-[#2D2D2D] bg-[#191919] px-4 py-3">
          <div>
            <p className="text-sm font-medium text-[#E5E2E1]">Status</p>
            <p className="text-xs text-[#9B9A97]">{isFreeAgent ? "Free agent / tidak di tim manapun" : "Masih tergabung di tim lain"}</p>
          </div>
          <label className="relative inline-flex cursor-pointer items-center">
            <input type="checkbox" className="sr-only" checked={isFreeAgent} onChange={(e) => setIsFreeAgent(e.target.checked)} />
            <div className={cn("h-5 w-9 rounded-full transition-colors", isFreeAgent ? "bg-green-500" : "bg-[#2D2D2D]")}>
              <div className={cn("h-4 w-4 translate-y-0.5 rounded-full bg-white shadow transition-transform", isFreeAgent ? "translate-x-4.5" : "translate-x-0.5")} />
            </div>
          </label>
        </div>

        {err && (
          <p className="text-xs text-red-400 rounded border border-red-500/20 bg-red-500/10 px-3 py-2">{err}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[#E5E2E1] text-sm font-semibold text-[#191919] hover:bg-white disabled:opacity-50 cursor-pointer"
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Daftar Sekarang
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add middleware.ts app/trial/[token]/page.tsx features/trials/components/TrialRegistrationForm.tsx
git commit -m "feat(trials): add public registration page + TrialRegistrationForm"
```

---

## Task 9: Sidebar Nav + Middleware

**Files:**
- Modify: `components/layout/WorkspaceSidebar.tsx`
- Modify: `middleware.ts`

- [ ] **Step 1: Add "trial" to RESERVED_ROOT_SEGMENTS in middleware.ts**

In `middleware.ts`, in the `RESERVED_ROOT_SEGMENTS` set (after `"invite"`):

```typescript
"trial",
```

(Already done in Task 8 Step 1 — verify it's there, skip if already committed.)

- [ ] **Step 2: Add "Open Trial" to sidebar nav**

In `WorkspaceSidebar.tsx`, add `ClipboardList` to the Lucide import, then add to `WORKSPACE_NAV_GROUPS` under `KOMPETISI`:

```typescript
// Add to lucide-react import:
ClipboardList,

// Add inside KOMPETISI items array (after "scouting" entry):
{
  key: "trials",
  href: "/trials",
  label: "Open Trial",
  Icon: ClipboardList,
},
```

- [ ] **Step 3: Also add to MANAGER_NAV_GROUP** (optional, for quick access from manage panel)

```typescript
// In MANAGER_NAV_GROUP items, after "manage-salaries":
{
  key: "manage-trials",
  href: "",
  absoluteHref: "/manage/trials",
  label: "Open Trial",
  Icon: ClipboardList,
},
```

Wait — this requires a `/manage/trials` page. Instead, skip the MANAGER_NAV_GROUP entry. The manager can navigate to trials via their workspace slug from the KOMPETISI group. Remove this step.

- [ ] **Step 4: Commit**

```bash
git add components/layout/WorkspaceSidebar.tsx middleware.ts
git commit -m "feat(trials): add Open Trial nav item to workspace sidebar"
```

---

## Self-Review

**Spec coverage check:**
- ✅ Manager/Coach buat trial → `createTrialAction` + `TrialFormModal`
- ✅ Owner bisa view → role check allows "owner" in canManage (read-only via no `canManage` condition on view)
- ✅ List pemain dengan WA, email, sosial media, dll → `trial_applicants` table + `ApplicantRow`
- ✅ Daftar via link publik tanpa login → `/trial/[token]` public page
- ✅ WA konfirmasi saat daftar → `sendWaMessage` di `registerApplicantAction`
- ✅ Satu trial = satu tim → `org_id` FK on `open_trials`
- ✅ Coach bisa buat trial → `getManagerOrCoach()` includes coach role
- ✅ Status pendaftar (pending/accepted/rejected/waitlisted) → `updateApplicantStatusAction`
- ✅ Cegah duplikat pendaftar → phone uniqueness check per trial

**Placeholder scan:** None found — all steps have actual code.

**Type consistency:** `ApplicantRow` type dari `queries.ts` dipakai konsisten di `ApplicantRow.tsx` dan `TrialDetailClient.tsx`. `TrialRow` dipakai di `TrialDetailClient.tsx` dan detail page.
