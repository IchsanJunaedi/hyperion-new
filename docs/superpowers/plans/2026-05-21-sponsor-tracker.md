# Sponsor/Partner Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full CRM-lite Sponsor/Partner Tracker accessible from both `/dashboard` (owner) and `/manage` (manager), with sponsor profiles, deliverable tracking, and note history.

**Architecture:** Three DB tables (`sponsors`, `sponsor_deliverables`, `sponsor_notes`) scoped per org. Shared feature components in `features/sponsors/`. Server pages at both `/dashboard/sponsors` and `/manage/sponsors` fetch data and pass it to shared client components. Actions use `createAdminClient()` with manual auth guards. Notifications use `notify` from NotifyModal (not sonner — this is a management panel context).

**Tech Stack:** Next.js 15 App Router, Supabase (Postgres + RLS + admin client), TypeScript strict, Tailwind CSS v4, Lucide React, `notify` from `@/features/dashboard/components/NotifyModal`, `cn()` from `@/lib/utils/cn`.

---

## File Map

| Path | Action | Purpose |
|------|--------|---------|
| `supabase/migrations/20260521210000_sponsors.sql` | Create | DB schema + RLS |
| `types/database.ts` | Modify | Add sponsors, sponsor_deliverables, sponsor_notes types |
| `features/sponsors/queries.ts` | Create | getSponsors(orgIds), getSponsorDetail(id) |
| `features/sponsors/actions.ts` | Create | All CRUD server actions |
| `features/sponsors/components/SponsorStatusBadge.tsx` | Create | Reusable status chip (prospect/active/inactive/ended) |
| `features/sponsors/components/SponsorCard.tsx` | Create | Summary card for list view |
| `features/sponsors/components/SponsorFormModal.tsx` | Create | Create/edit sponsor modal form |
| `features/sponsors/components/SponsorListClient.tsx` | Create | Client list page with stats + modal state |
| `features/sponsors/components/SponsorDetailClient.tsx` | Create | Client detail page with deliverables + notes |
| `app/dashboard/(panel)/sponsors/page.tsx` | Create | Owner: fetch all orgs' sponsors → SponsorListClient |
| `app/dashboard/(panel)/sponsors/[id]/page.tsx` | Create | Owner: fetch sponsor detail → SponsorDetailClient |
| `app/manage/sponsors/page.tsx` | Create | Manager: fetch org sponsors → SponsorListClient |
| `app/manage/sponsors/[id]/page.tsx` | Create | Manager: fetch sponsor detail → SponsorDetailClient |
| `app/dashboard/(panel)/layout.tsx` | Modify | Add "Sponsor" nav item to MANAJEMEN group |
| `components/layout/WorkspaceSidebar.tsx` | Modify | Add "Sponsor" to MANAGER_NAV_GROUP |

---

## Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/20260521210000_sponsors.sql`

- [ ] **Step 1: Write migration**

```sql
-- sponsors: one row per sponsor deal per org
CREATE TABLE IF NOT EXISTS sponsors (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  logo_url       TEXT,
  status         TEXT NOT NULL DEFAULT 'prospect'
                   CHECK (status IN ('prospect','active','inactive','ended')),
  contact_name   TEXT,
  contact_email  TEXT,
  contact_phone  TEXT,
  deal_value     NUMERIC(15,2),
  currency       TEXT NOT NULL DEFAULT 'IDR',
  start_date     DATE,
  end_date       DATE,
  notes          TEXT,
  created_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- sponsor_deliverables: items to deliver per sponsor
CREATE TABLE IF NOT EXISTS sponsor_deliverables (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_id  UUID NOT NULL REFERENCES sponsors(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  category    TEXT NOT NULL DEFAULT 'content'
                CHECK (category IN ('content','post','branding','event','other')),
  status      TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','in_progress','done','cancelled')),
  due_date    DATE,
  completed_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- sponsor_notes: CRM history timeline per sponsor
CREATE TABLE IF NOT EXISTS sponsor_notes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_id  UUID NOT NULL REFERENCES sponsors(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  created_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sponsors_org ON sponsors(organization_id);
CREATE INDEX IF NOT EXISTS idx_sponsor_deliverables_sponsor ON sponsor_deliverables(sponsor_id);
CREATE INDEX IF NOT EXISTS idx_sponsor_notes_sponsor ON sponsor_notes(sponsor_id);

-- RLS
ALTER TABLE sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsor_deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsor_notes ENABLE ROW LEVEL SECURITY;

-- sponsors: manager/owner in the org can do everything
CREATE POLICY "sponsors_manager_access" ON sponsors
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.organization_id = sponsors.organization_id
        AND tm.user_id = auth.uid()
        AND tm.is_active = true
        AND tm.role IN ('manager','owner')
    )
  );

CREATE POLICY "sponsor_deliverables_access" ON sponsor_deliverables
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM sponsors s
      JOIN team_members tm ON tm.organization_id = s.organization_id
      WHERE s.id = sponsor_deliverables.sponsor_id
        AND tm.user_id = auth.uid()
        AND tm.is_active = true
        AND tm.role IN ('manager','owner')
    )
  );

CREATE POLICY "sponsor_notes_access" ON sponsor_notes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM sponsors s
      JOIN team_members tm ON tm.organization_id = s.organization_id
      WHERE s.id = sponsor_notes.sponsor_id
        AND tm.user_id = auth.uid()
        AND tm.is_active = true
        AND tm.role IN ('manager','owner')
    )
  );
```

- [ ] **Step 2: Apply migration**

```bash
npx supabase db push
```

Expected: `Applying migration 20260521210000_sponsors.sql...` with no errors.

- [ ] **Step 3: Commit**

```bash
rtk git add supabase/migrations/20260521210000_sponsors.sql
rtk git commit -m "feat: add sponsors + deliverables + notes tables with RLS"
```

---

## Task 2: TypeScript Types

**Files:**
- Modify: `types/database.ts`

- [ ] **Step 1: Add types for all three tables**

In `types/database.ts`, inside the `Tables` object, add before `strategy_notes` (or after `meta_hero_ratings`):

```typescript
sponsors: {
  Row: {
    id: string;
    organization_id: string;
    name: string;
    logo_url: string | null;
    status: "prospect" | "active" | "inactive" | "ended";
    contact_name: string | null;
    contact_email: string | null;
    contact_phone: string | null;
    deal_value: number | null;
    currency: string;
    start_date: string | null;
    end_date: string | null;
    notes: string | null;
    created_by: string | null;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    organization_id: string;
    name: string;
    logo_url?: string | null;
    status?: "prospect" | "active" | "inactive" | "ended";
    contact_name?: string | null;
    contact_email?: string | null;
    contact_phone?: string | null;
    deal_value?: number | null;
    currency?: string;
    start_date?: string | null;
    end_date?: string | null;
    notes?: string | null;
    created_by?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    organization_id?: string;
    name?: string;
    logo_url?: string | null;
    status?: "prospect" | "active" | "inactive" | "ended";
    contact_name?: string | null;
    contact_email?: string | null;
    contact_phone?: string | null;
    deal_value?: number | null;
    currency?: string;
    start_date?: string | null;
    end_date?: string | null;
    notes?: string | null;
    created_by?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [];
};
sponsor_deliverables: {
  Row: {
    id: string;
    sponsor_id: string;
    title: string;
    description: string | null;
    category: "content" | "post" | "branding" | "event" | "other";
    status: "pending" | "in_progress" | "done" | "cancelled";
    due_date: string | null;
    completed_at: string | null;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    sponsor_id: string;
    title: string;
    description?: string | null;
    category?: "content" | "post" | "branding" | "event" | "other";
    status?: "pending" | "in_progress" | "done" | "cancelled";
    due_date?: string | null;
    completed_at?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    sponsor_id?: string;
    title?: string;
    description?: string | null;
    category?: "content" | "post" | "branding" | "event" | "other";
    status?: "pending" | "in_progress" | "done" | "cancelled";
    due_date?: string | null;
    completed_at?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [];
};
sponsor_notes: {
  Row: {
    id: string;
    sponsor_id: string;
    content: string;
    created_by: string | null;
    created_at: string;
  };
  Insert: {
    id?: string;
    sponsor_id: string;
    content: string;
    created_by?: string | null;
    created_at?: string;
  };
  Update: {
    id?: string;
    sponsor_id?: string;
    content?: string;
    created_by?: string | null;
    created_at?: string;
  };
  Relationships: [];
};
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no output (no errors).

---

## Task 3: Queries + Actions

**Files:**
- Create: `features/sponsors/queries.ts`
- Create: `features/sponsors/actions.ts`

- [ ] **Step 1: Write queries file**

```typescript
// features/sponsors/queries.ts
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";

export type Sponsor = Database["public"]["Tables"]["sponsors"]["Row"];
export type SponsorDeliverable = Database["public"]["Tables"]["sponsor_deliverables"]["Row"];
export type SponsorNote = Database["public"]["Tables"]["sponsor_notes"]["Row"];

export interface SponsorWithStats extends Sponsor {
  deliverableTotal: number;
  deliverableDone: number;
}

export interface SponsorDetail extends Sponsor {
  deliverables: SponsorDeliverable[];
  notes: SponsorNote[];
  creatorName: string | null;
}

export async function getSponsors(orgIds: string[]): Promise<SponsorWithStats[]> {
  if (orgIds.length === 0) return [];
  const admin = createAdminClient();

  const { data: sponsors } = await admin
    .from("sponsors")
    .select("*")
    .in("organization_id", orgIds)
    .order("status")
    .order("name");

  if (!sponsors || sponsors.length === 0) return [];

  const sponsorIds = sponsors.map((s) => s.id);
  const { data: deliverables } = await admin
    .from("sponsor_deliverables")
    .select("sponsor_id, status")
    .in("sponsor_id", sponsorIds);

  const dlMap = new Map<string, { total: number; done: number }>();
  for (const d of deliverables ?? []) {
    const cur = dlMap.get(d.sponsor_id) ?? { total: 0, done: 0 };
    dlMap.set(d.sponsor_id, {
      total: cur.total + 1,
      done: cur.done + (d.status === "done" ? 1 : 0),
    });
  }

  return sponsors.map((s) => ({
    ...s,
    deliverableTotal: dlMap.get(s.id)?.total ?? 0,
    deliverableDone: dlMap.get(s.id)?.done ?? 0,
  }));
}

export async function getSponsorDetail(id: string): Promise<SponsorDetail | null> {
  const admin = createAdminClient();

  const { data: sponsor } = await admin
    .from("sponsors")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!sponsor) return null;

  const [{ data: deliverables }, { data: notes }] = await Promise.all([
    admin.from("sponsor_deliverables").select("*").eq("sponsor_id", id).order("created_at"),
    admin.from("sponsor_notes").select("*").eq("sponsor_id", id).order("created_at", { ascending: false }),
  ]);

  let creatorName: string | null = null;
  if (sponsor.created_by) {
    const { data: profile } = await admin
      .from("profiles")
      .select("display_name, username")
      .eq("id", sponsor.created_by)
      .maybeSingle();
    creatorName = profile?.display_name ?? profile?.username ?? null;
  }

  return {
    ...sponsor,
    deliverables: deliverables ?? [],
    notes: notes ?? [],
    creatorName,
  };
}
```

- [ ] **Step 2: Write actions file**

```typescript
// features/sponsors/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";

type ActionResult = { ok: true } | { ok: false; message: string };
type SponsorStatus = Database["public"]["Tables"]["sponsors"]["Row"]["status"];
type DeliverableStatus = Database["public"]["Tables"]["sponsor_deliverables"]["Row"]["status"];
type DeliverableCategory = Database["public"]["Tables"]["sponsor_deliverables"]["Row"]["category"];

async function requireManagerAuth(orgId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, ok: false as const };

  const ownerEmail = process.env.OWNER_EMAIL;
  if (user.email === ownerEmail) return { user, ok: true as const };

  const { data: tm } = await supabase
    .from("team_members")
    .select("role")
    .eq("user_id", user.id)
    .eq("organization_id", orgId)
    .eq("is_active", true)
    .maybeSingle();

  if (!["manager", "owner"].includes(tm?.role ?? "")) return { user: null, ok: false as const };
  return { user, ok: true as const };
}

export async function createSponsorAction(
  orgId: string,
  data: {
    name: string;
    status: SponsorStatus;
    logo_url: string;
    contact_name: string;
    contact_email: string;
    contact_phone: string;
    deal_value: string;
    currency: string;
    start_date: string;
    end_date: string;
    notes: string;
  },
): Promise<ActionResult & { id?: string }> {
  const { user, ok } = await requireManagerAuth(orgId);
  if (!ok || !user) return { ok: false, message: "Akses ditolak" };

  const admin = createAdminClient();
  const { data: created, error } = await admin
    .from("sponsors")
    .insert({
      organization_id: orgId,
      name: data.name.trim(),
      status: data.status,
      logo_url: data.logo_url.trim() || null,
      contact_name: data.contact_name.trim() || null,
      contact_email: data.contact_email.trim() || null,
      contact_phone: data.contact_phone.trim() || null,
      deal_value: data.deal_value ? parseFloat(data.deal_value) : null,
      currency: data.currency || "IDR",
      start_date: data.start_date || null,
      end_date: data.end_date || null,
      notes: data.notes.trim() || null,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) return { ok: false, message: error.message };
  return { ok: true, id: created.id };
}

export async function updateSponsorAction(
  orgId: string,
  sponsorId: string,
  data: {
    name: string;
    status: SponsorStatus;
    logo_url: string;
    contact_name: string;
    contact_email: string;
    contact_phone: string;
    deal_value: string;
    currency: string;
    start_date: string;
    end_date: string;
    notes: string;
  },
): Promise<ActionResult> {
  const { ok } = await requireManagerAuth(orgId);
  if (!ok) return { ok: false, message: "Akses ditolak" };

  const admin = createAdminClient();
  const { error } = await admin
    .from("sponsors")
    .update({
      name: data.name.trim(),
      status: data.status,
      logo_url: data.logo_url.trim() || null,
      contact_name: data.contact_name.trim() || null,
      contact_email: data.contact_email.trim() || null,
      contact_phone: data.contact_phone.trim() || null,
      deal_value: data.deal_value ? parseFloat(data.deal_value) : null,
      currency: data.currency || "IDR",
      start_date: data.start_date || null,
      end_date: data.end_date || null,
      notes: data.notes.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sponsorId);

  if (error) return { ok: false, message: error.message };
  return { ok: true };
}

export async function deleteSponsorAction(orgId: string, sponsorId: string): Promise<ActionResult> {
  const { ok } = await requireManagerAuth(orgId);
  if (!ok) return { ok: false, message: "Akses ditolak" };

  const admin = createAdminClient();
  const { error } = await admin.from("sponsors").delete().eq("id", sponsorId);
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}

export async function addDeliverableAction(
  orgId: string,
  sponsorId: string,
  data: { title: string; description: string; category: DeliverableCategory; due_date: string },
): Promise<ActionResult & { deliverable?: { id: string; title: string; description: string | null; category: DeliverableCategory; status: DeliverableStatus; due_date: string | null; completed_at: string | null; sponsor_id: string; created_at: string; updated_at: string } }> {
  const { ok } = await requireManagerAuth(orgId);
  if (!ok) return { ok: false, message: "Akses ditolak" };
  if (!data.title.trim()) return { ok: false, message: "Judul deliverable tidak boleh kosong" };

  const admin = createAdminClient();
  const { data: created, error } = await admin
    .from("sponsor_deliverables")
    .insert({
      sponsor_id: sponsorId,
      title: data.title.trim(),
      description: data.description.trim() || null,
      category: data.category,
      due_date: data.due_date || null,
    })
    .select("*")
    .single();

  if (error) return { ok: false, message: error.message };
  return { ok: true, deliverable: created };
}

export async function updateDeliverableStatusAction(
  orgId: string,
  deliverableId: string,
  status: DeliverableStatus,
): Promise<ActionResult> {
  const { ok } = await requireManagerAuth(orgId);
  if (!ok) return { ok: false, message: "Akses ditolak" };

  const admin = createAdminClient();
  const { error } = await admin
    .from("sponsor_deliverables")
    .update({
      status,
      completed_at: status === "done" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", deliverableId);

  if (error) return { ok: false, message: error.message };
  return { ok: true };
}

export async function deleteDeliverableAction(orgId: string, deliverableId: string): Promise<ActionResult> {
  const { ok } = await requireManagerAuth(orgId);
  if (!ok) return { ok: false, message: "Akses ditolak" };

  const admin = createAdminClient();
  const { error } = await admin.from("sponsor_deliverables").delete().eq("id", deliverableId);
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}

export async function addSponsorNoteAction(
  orgId: string,
  sponsorId: string,
  content: string,
): Promise<ActionResult & { note?: { id: string; sponsor_id: string; content: string; created_by: string | null; created_at: string } }> {
  const { user, ok } = await requireManagerAuth(orgId);
  if (!ok || !user) return { ok: false, message: "Akses ditolak" };
  if (!content.trim()) return { ok: false, message: "Catatan tidak boleh kosong" };

  const admin = createAdminClient();
  const { data: note, error } = await admin
    .from("sponsor_notes")
    .insert({ sponsor_id: sponsorId, content: content.trim(), created_by: user.id })
    .select("*")
    .single();

  if (error) return { ok: false, message: error.message };
  return { ok: true, note };
}

export async function deleteSponsorNoteAction(orgId: string, noteId: string): Promise<ActionResult> {
  const { ok } = await requireManagerAuth(orgId);
  if (!ok) return { ok: false, message: "Akses ditolak" };

  const admin = createAdminClient();
  const { error } = await admin.from("sponsor_notes").delete().eq("id", noteId);
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no output (no errors).

- [ ] **Step 4: Commit**

```bash
rtk git add types/database.ts features/sponsors/queries.ts features/sponsors/actions.ts
rtk git commit -m "feat: sponsor tracker types, queries, and server actions"
```

---

## Task 4: SponsorStatusBadge + SponsorCard + SponsorFormModal

**Files:**
- Create: `features/sponsors/components/SponsorStatusBadge.tsx`
- Create: `features/sponsors/components/SponsorCard.tsx`
- Create: `features/sponsors/components/SponsorFormModal.tsx`

- [ ] **Step 1: Write SponsorStatusBadge**

```typescript
// features/sponsors/components/SponsorStatusBadge.tsx
import { cn } from "@/lib/utils/cn";
import type { Database } from "@/types/database";

type SponsorStatus = Database["public"]["Tables"]["sponsors"]["Row"]["status"];

const STATUS_STYLES: Record<SponsorStatus, string> = {
  prospect:  "bg-blue-500/10 text-blue-400 border-blue-500/20",
  active:    "bg-green-500/10 text-green-400 border-green-500/20",
  inactive:  "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  ended:     "bg-white/5 text-white/40 border-white/10",
};

const STATUS_LABELS: Record<SponsorStatus, string> = {
  prospect: "Prospek",
  active:   "Aktif",
  inactive: "Tidak Aktif",
  ended:    "Selesai",
};

export function SponsorStatusBadge({ status }: { status: SponsorStatus }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", STATUS_STYLES[status])}>
      {STATUS_LABELS[status]}
    </span>
  );
}

export { STATUS_LABELS, STATUS_STYLES };
export type { SponsorStatus };
```

- [ ] **Step 2: Write SponsorCard**

```typescript
// features/sponsors/components/SponsorCard.tsx
import Link from "next/link";
import { SponsorStatusBadge } from "./SponsorStatusBadge";
import type { SponsorWithStats } from "../queries";

function formatCurrency(value: number | null, currency: string) {
  if (value === null) return null;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function daysUntil(date: string | null): number | null {
  if (!date) return null;
  const diff = new Date(date).getTime() - Date.now();
  return Math.ceil(diff / 86_400_000);
}

interface SponsorCardProps {
  sponsor: SponsorWithStats;
  detailHref: string;
}

export function SponsorCard({ sponsor, detailHref }: SponsorCardProps) {
  const days = daysUntil(sponsor.end_date);
  const formattedValue = formatCurrency(sponsor.deal_value, sponsor.currency);
  const progressPct = sponsor.deliverableTotal > 0
    ? Math.round((sponsor.deliverableDone / sponsor.deliverableTotal) * 100)
    : null;
  const initials = sponsor.name.slice(0, 2).toUpperCase();

  return (
    <div className="flex flex-col rounded-xl border border-[#2D2D2D] bg-[#1C1C1C] p-4 gap-3">
      {/* Header */}
      <div className="flex items-start gap-3">
        {sponsor.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={sponsor.logo_url} alt={sponsor.name} className="h-10 w-10 shrink-0 rounded-lg object-cover" />
        ) : (
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#2C2C2C] text-sm font-bold text-white/70">
            {initials}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{sponsor.name}</p>
          {formattedValue && (
            <p className="text-xs text-yellow-400 font-medium">{formattedValue}</p>
          )}
        </div>
        <SponsorStatusBadge status={sponsor.status} />
      </div>

      {/* Contact */}
      {sponsor.contact_name && (
        <p className="text-xs text-white/50 truncate">{sponsor.contact_name}</p>
      )}

      {/* End date warning */}
      {days !== null && days >= 0 && days <= 30 && (
        <p className="text-xs text-red-400">
          Berakhir dalam {days} hari
        </p>
      )}
      {days !== null && days < 0 && (
        <p className="text-xs text-white/30">Sudah berakhir</p>
      )}

      {/* Deliverable progress */}
      {sponsor.deliverableTotal > 0 && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-white/40">
            <span>Deliverable</span>
            <span>{sponsor.deliverableDone}/{sponsor.deliverableTotal}</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-[#2D2D2D]">
            <div
              className="h-1.5 rounded-full bg-green-500/70 transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Detail link */}
      <Link
        href={detailHref}
        className="mt-auto inline-flex h-8 items-center justify-center rounded-md border border-[#2D2D2D] text-xs text-white/60 transition hover:bg-white/5 hover:text-white"
      >
        Lihat Detail
      </Link>
    </div>
  );
}
```

- [ ] **Step 3: Write SponsorFormModal**

```typescript
// features/sponsors/components/SponsorFormModal.tsx
"use client";

import { useEffect, useState, useTransition } from "react";
import { X } from "lucide-react";
import { notify } from "@/features/dashboard/components/NotifyModal";
import { cn } from "@/lib/utils/cn";
import { createSponsorAction, updateSponsorAction } from "../actions";
import type { Sponsor, SponsorStatus } from "../queries";

const STATUS_OPTIONS: Array<{ value: SponsorStatus; label: string }> = [
  { value: "prospect", label: "Prospek" },
  { value: "active", label: "Aktif" },
  { value: "inactive", label: "Tidak Aktif" },
  { value: "ended", label: "Selesai" },
];

interface SponsorFormModalProps {
  open: boolean;
  onClose: () => void;
  orgId: string;
  editing?: Sponsor | null;
  onSaved: (id: string) => void;
}

const EMPTY = {
  name: "", status: "prospect" as SponsorStatus, logo_url: "",
  contact_name: "", contact_email: "", contact_phone: "",
  deal_value: "", currency: "IDR", start_date: "", end_date: "", notes: "",
};

export function SponsorFormModal({ open, onClose, orgId, editing, onSaved }: SponsorFormModalProps) {
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (open) {
      if (editing) {
        setForm({
          name: editing.name,
          status: editing.status,
          logo_url: editing.logo_url ?? "",
          contact_name: editing.contact_name ?? "",
          contact_email: editing.contact_email ?? "",
          contact_phone: editing.contact_phone ?? "",
          deal_value: editing.deal_value?.toString() ?? "",
          currency: editing.currency,
          start_date: editing.start_date ?? "",
          end_date: editing.end_date ?? "",
          notes: editing.notes ?? "",
        });
      } else {
        setForm(EMPTY);
      }
    }
  }, [open, editing]);

  if (!open) return null;

  function set(key: keyof typeof EMPTY, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  function handleSave() {
    if (!form.name.trim()) { notify.error("Nama sponsor tidak boleh kosong"); return; }
    startTransition(async () => {
      const res = editing
        ? await updateSponsorAction(orgId, editing.id, form)
        : await createSponsorAction(orgId, form);
      if (res.ok) {
        notify.success(editing ? "Sponsor diperbarui" : "Sponsor ditambahkan");
        onSaved(res.id ?? editing!.id);
        onClose();
      } else {
        notify.error(res.message);
      }
    });
  }

  const inputCls = "w-full rounded-md border border-[#2D2D2D] bg-[#141414] px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-white/30";
  const labelCls = "mb-1 block text-xs font-medium text-white/60";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 pt-16">
      <div className="w-full max-w-lg rounded-xl border border-[#2D2D2D] bg-[#1C1C1C] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#2D2D2D] px-5 py-4">
          <h2 className="text-sm font-semibold text-white">
            {editing ? "Edit Sponsor" : "Tambah Sponsor"}
          </h2>
          <button type="button" onClick={onClose} className="cursor-pointer text-white/40 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          {/* Name + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className={labelCls}>Nama Sponsor *</label>
              <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Nama perusahaan / brand" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <div className="flex flex-wrap gap-1.5">
                {STATUS_OPTIONS.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => set("status", s.value)}
                    className={cn(
                      "cursor-pointer rounded-full border px-3 py-1 text-xs transition",
                      form.status === s.value
                        ? "border-yellow-500/50 bg-yellow-500/10 text-yellow-400"
                        : "border-[#2D2D2D] text-white/40 hover:border-white/20 hover:text-white/60",
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={labelCls}>Logo URL (opsional)</label>
              <input value={form.logo_url} onChange={(e) => set("logo_url", e.target.value)} placeholder="https://..." className={inputCls} />
            </div>
          </div>

          {/* Contact */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/40">Kontak</p>
            </div>
            <div>
              <label className={labelCls}>Nama PIC</label>
              <input value={form.contact_name} onChange={(e) => set("contact_name", e.target.value)} placeholder="Nama kontak" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Email</label>
              <input type="email" value={form.contact_email} onChange={(e) => set("contact_email", e.target.value)} placeholder="email@domain.com" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>No. HP / WA</label>
              <input value={form.contact_phone} onChange={(e) => set("contact_phone", e.target.value)} placeholder="08xx" className={inputCls} />
            </div>
          </div>

          {/* Deal */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/40">Deal</p>
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Nilai Deal</label>
              <input type="number" value={form.deal_value} onChange={(e) => set("deal_value", e.target.value)} placeholder="0" min="0" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Mata Uang</label>
              <div className="flex gap-1.5">
                {["IDR", "USD"].map((c) => (
                  <button key={c} type="button" onClick={() => set("currency", c)}
                    className={cn("flex-1 cursor-pointer rounded-md border py-2 text-xs font-mono transition",
                      form.currency === c ? "border-yellow-500/50 bg-yellow-500/10 text-yellow-400" : "border-[#2D2D2D] text-white/40 hover:border-white/20"
                    )}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={labelCls}>Mulai</label>
              <input type="date" value={form.start_date} onChange={(e) => set("start_date", e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Berakhir</label>
              <input type="date" value={form.end_date} onChange={(e) => set("end_date", e.target.value)} className={inputCls} />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className={labelCls}>Deskripsi / Catatan</label>
            <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={3} placeholder="Ringkasan deal, lingkup kerja sama..." className={cn(inputCls, "resize-none")} />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 cursor-pointer rounded-md border border-[#2D2D2D] py-2 text-sm text-white/60 transition hover:bg-white/5">
              Batal
            </button>
            <button type="button" onClick={handleSave} disabled={pending}
              className="flex-1 cursor-pointer rounded-md bg-yellow-400 py-2 text-sm font-semibold text-black transition hover:bg-yellow-300 disabled:opacity-50">
              {pending ? "Menyimpan..." : editing ? "Simpan" : "Tambahkan"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no output (no errors).

- [ ] **Step 5: Commit**

```bash
rtk git add features/sponsors/components/SponsorStatusBadge.tsx features/sponsors/components/SponsorCard.tsx features/sponsors/components/SponsorFormModal.tsx
rtk git commit -m "feat: sponsor status badge, card, and form modal components"
```

---

## Task 5: SponsorDetailClient

**Files:**
- Create: `features/sponsors/components/SponsorDetailClient.tsx`

This is the full detail view with deliverables CRUD and notes timeline.

- [ ] **Step 1: Write SponsorDetailClient**

```typescript
// features/sponsors/components/SponsorDetailClient.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  ArrowLeft, Pencil, Trash2, Plus, CheckCircle2, Clock,
  Loader2, XCircle, Calendar, FileText, Share2, Tag, Package,
  X as XIcon,
} from "lucide-react";
import Link from "next/link";
import { notify } from "@/features/dashboard/components/NotifyModal";
import { cn } from "@/lib/utils/cn";
import { SponsorStatusBadge } from "./SponsorStatusBadge";
import { SponsorFormModal } from "./SponsorFormModal";
import {
  deleteSponsorAction, addDeliverableAction, updateDeliverableStatusAction,
  deleteDeliverableAction, addSponsorNoteAction, deleteSponsorNoteAction,
} from "../actions";
import type { SponsorDetail, SponsorDeliverable, SponsorNote } from "../queries";
import type { Database } from "@/types/database";

type DeliverableStatus = Database["public"]["Tables"]["sponsor_deliverables"]["Row"]["status"];
type DeliverableCategory = Database["public"]["Tables"]["sponsor_deliverables"]["Row"]["category"];

const STATUS_CYCLE: Record<DeliverableStatus, DeliverableStatus> = {
  pending: "in_progress",
  in_progress: "done",
  done: "pending",
  cancelled: "pending",
};

const STATUS_ICON: Record<DeliverableStatus, React.ReactNode> = {
  pending:     <Clock className="h-4 w-4 text-white/40" />,
  in_progress: <Loader2 className="h-4 w-4 text-blue-400" />,
  done:        <CheckCircle2 className="h-4 w-4 text-green-400" />,
  cancelled:   <XCircle className="h-4 w-4 text-red-400" />,
};

const STATUS_LABEL: Record<DeliverableStatus, string> = {
  pending: "Pending", in_progress: "In Progress", done: "Done", cancelled: "Dibatalkan",
};

const CATEGORY_ICON: Record<DeliverableCategory, React.ReactNode> = {
  content:  <FileText className="h-3.5 w-3.5" />,
  post:     <Share2 className="h-3.5 w-3.5" />,
  branding: <Tag className="h-3.5 w-3.5" />,
  event:    <Calendar className="h-3.5 w-3.5" />,
  other:    <Package className="h-3.5 w-3.5" />,
};

const CATEGORY_OPTIONS: Array<{ value: DeliverableCategory; label: string }> = [
  { value: "content", label: "Konten" },
  { value: "post", label: "Post / Sosmed" },
  { value: "branding", label: "Branding" },
  { value: "event", label: "Event" },
  { value: "other", label: "Lainnya" },
];

function formatDate(d: string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function formatCurrency(value: number | null, currency: string) {
  if (value === null) return null;
  return new Intl.NumberFormat("id-ID", { style: "currency", currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
}

interface SponsorDetailClientProps {
  sponsor: SponsorDetail;
  orgId: string;
  backHref: string;
  listHref: string;
}

export function SponsorDetailClient({ sponsor: initial, orgId, backHref, listHref }: SponsorDetailClientProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [sponsor, setSponsor] = useState(initial);
  const [deliverables, setDeliverables] = useState<SponsorDeliverable[]>(initial.deliverables);
  const [notes, setNotes] = useState<SponsorNote[]>(initial.notes);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // New deliverable form state
  const [dlForm, setDlForm] = useState({ title: "", description: "", category: "content" as DeliverableCategory, due_date: "" });
  const [showDlForm, setShowDlForm] = useState(false);
  const [newNote, setNewNote] = useState("");

  function handleDelete() {
    if (!confirm(`Hapus sponsor "${sponsor.name}"? Semua deliverable dan catatan akan ikut terhapus.`)) return;
    startTransition(async () => {
      const res = await deleteSponsorAction(orgId, sponsor.id);
      if (res.ok) {
        notify.success("Sponsor dihapus");
        router.push(listHref);
      } else {
        notify.error(res.message);
      }
    });
  }

  function handleStatusCycle(dl: SponsorDeliverable) {
    const next = STATUS_CYCLE[dl.status];
    startTransition(async () => {
      const res = await updateDeliverableStatusAction(orgId, dl.id, next);
      if (res.ok) {
        setDeliverables((prev) => prev.map((d) => d.id === dl.id ? { ...d, status: next, completed_at: next === "done" ? new Date().toISOString() : null } : d));
      } else {
        notify.error(res.message);
      }
    });
  }

  function handleDeleteDeliverable(id: string) {
    startTransition(async () => {
      const res = await deleteDeliverableAction(orgId, id);
      if (res.ok) {
        setDeliverables((prev) => prev.filter((d) => d.id !== id));
      } else {
        notify.error(res.message);
      }
    });
  }

  function handleAddDeliverable() {
    if (!dlForm.title.trim()) { notify.error("Judul deliverable tidak boleh kosong"); return; }
    startTransition(async () => {
      const res = await addDeliverableAction(orgId, sponsor.id, dlForm);
      if (res.ok && res.deliverable) {
        setDeliverables((prev) => [...prev, res.deliverable!]);
        setDlForm({ title: "", description: "", category: "content", due_date: "" });
        setShowDlForm(false);
      } else if (!res.ok) {
        notify.error(res.message);
      }
    });
  }

  function handleAddNote() {
    if (!newNote.trim()) return;
    startTransition(async () => {
      const res = await addSponsorNoteAction(orgId, sponsor.id, newNote);
      if (res.ok && res.note) {
        setNotes((prev) => [res.note!, ...prev]);
        setNewNote("");
      } else if (!res.ok) {
        notify.error(res.message);
      }
    });
  }

  function handleDeleteNote(id: string) {
    startTransition(async () => {
      const res = await deleteSponsorNoteAction(orgId, id);
      if (res.ok) {
        setNotes((prev) => prev.filter((n) => n.id !== id));
      } else {
        notify.error(res.message);
      }
    });
  }

  const inputCls = "w-full rounded-md border border-[#2D2D2D] bg-[#141414] px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-white/30";
  const doneDl = deliverables.filter((d) => d.status === "done").length;

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-6 sm:px-8">
      {/* Back + actions */}
      <div className="flex items-center justify-between gap-4">
        <Link href={backHref} className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition">
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Link>
        <div className="flex gap-2">
          <button type="button" onClick={() => setEditModalOpen(true)}
            className="inline-flex h-8 cursor-pointer items-center gap-2 rounded-md border border-[#2D2D2D] px-3 text-xs text-white/60 transition hover:bg-white/5">
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </button>
          <button type="button" onClick={handleDelete} disabled={pending}
            className="inline-flex h-8 cursor-pointer items-center gap-2 rounded-md border border-red-500/20 px-3 text-xs text-red-400 transition hover:bg-red-500/10 disabled:opacity-50">
            <Trash2 className="h-3.5 w-3.5" />
            Hapus
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="rounded-xl border border-[#2D2D2D] bg-[#1C1C1C] p-6">
        <div className="flex items-start gap-4">
          {sponsor.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={sponsor.logo_url} alt={sponsor.name} className="h-14 w-14 shrink-0 rounded-xl object-cover" />
          ) : (
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-[#2C2C2C] text-xl font-bold text-white/60">
              {sponsor.name.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-white">{sponsor.name}</h1>
              <SponsorStatusBadge status={sponsor.status} />
            </div>
            {formatCurrency(sponsor.deal_value, sponsor.currency) && (
              <p className="mt-1 text-base font-semibold text-yellow-400">
                {formatCurrency(sponsor.deal_value, sponsor.currency)}
              </p>
            )}
            <div className="mt-2 flex flex-wrap gap-4 text-xs text-white/50">
              {sponsor.start_date && <span>Mulai: {formatDate(sponsor.start_date)}</span>}
              {sponsor.end_date && <span>Berakhir: {formatDate(sponsor.end_date)}</span>}
            </div>
          </div>
        </div>

        {/* Contact */}
        {(sponsor.contact_name || sponsor.contact_email || sponsor.contact_phone) && (
          <div className="mt-4 border-t border-[#2D2D2D] pt-4 grid grid-cols-3 gap-3 text-xs">
            {sponsor.contact_name && (
              <div>
                <p className="text-white/40">PIC</p>
                <p className="text-white/80">{sponsor.contact_name}</p>
              </div>
            )}
            {sponsor.contact_email && (
              <div>
                <p className="text-white/40">Email</p>
                <p className="text-white/80">{sponsor.contact_email}</p>
              </div>
            )}
            {sponsor.contact_phone && (
              <div>
                <p className="text-white/40">Telepon</p>
                <p className="text-white/80">{sponsor.contact_phone}</p>
              </div>
            )}
          </div>
        )}

        {/* Notes/desc */}
        {sponsor.notes && (
          <div className="mt-4 border-t border-[#2D2D2D] pt-4">
            <p className="text-xs text-white/50 leading-relaxed whitespace-pre-wrap">{sponsor.notes}</p>
          </div>
        )}
      </div>

      {/* Deliverables */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">
            Deliverables
            {deliverables.length > 0 && (
              <span className="ml-2 text-xs font-normal text-white/40">{doneDl}/{deliverables.length} selesai</span>
            )}
          </h2>
          <button type="button" onClick={() => setShowDlForm((v) => !v)}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-dashed border-[#2D2D2D] px-3 py-1.5 text-xs text-white/40 transition hover:border-white/20 hover:text-white/70">
            <Plus className="h-3 w-3" />
            Tambah
          </button>
        </div>

        {/* New deliverable form */}
        {showDlForm && (
          <div className="rounded-xl border border-[#2D2D2D] bg-[#1C1C1C] p-4 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <input value={dlForm.title} onChange={(e) => setDlForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Judul deliverable *" className={cn(inputCls, "col-span-2")} />
              <input value={dlForm.description} onChange={(e) => setDlForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Deskripsi (opsional)" className={inputCls} />
              <input type="date" value={dlForm.due_date} onChange={(e) => setDlForm((f) => ({ ...f, due_date: e.target.value }))}
                className={inputCls} />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORY_OPTIONS.map((c) => (
                <button key={c.value} type="button" onClick={() => setDlForm((f) => ({ ...f, category: c.value }))}
                  className={cn("cursor-pointer rounded-full border px-2.5 py-1 text-xs transition",
                    dlForm.category === c.value ? "border-yellow-500/50 bg-yellow-500/10 text-yellow-400" : "border-[#2D2D2D] text-white/40 hover:border-white/20"
                  )}>
                  {c.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowDlForm(false)} className="cursor-pointer rounded-md border border-[#2D2D2D] px-3 py-1.5 text-xs text-white/60 hover:bg-white/5 transition">Batal</button>
              <button type="button" onClick={handleAddDeliverable} disabled={pending}
                className="cursor-pointer rounded-md bg-yellow-400 px-3 py-1.5 text-xs font-semibold text-black hover:bg-yellow-300 disabled:opacity-50 transition">Tambahkan</button>
            </div>
          </div>
        )}

        {/* Deliverable list */}
        <div className="divide-y divide-[#2D2D2D] rounded-xl border border-[#2D2D2D] overflow-hidden">
          {deliverables.length === 0 ? (
            <p className="py-6 text-center text-xs text-white/30">Belum ada deliverable</p>
          ) : (
            deliverables.map((dl) => (
              <div key={dl.id} className="flex items-start gap-3 px-4 py-3 hover:bg-white/[0.02]">
                <button type="button" onClick={() => handleStatusCycle(dl)} title={`Status: ${STATUS_LABEL[dl.status]} — klik untuk ubah`}
                  className="mt-0.5 cursor-pointer shrink-0">
                  {STATUS_ICON[dl.status]}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm text-white/80", dl.status === "done" && "line-through text-white/40")}>{dl.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="inline-flex items-center gap-1 text-[10px] text-white/30">
                      {CATEGORY_ICON[dl.category]}
                      {CATEGORY_OPTIONS.find((c) => c.value === dl.category)?.label}
                    </span>
                    {dl.due_date && <span className="text-[10px] text-white/30">Due: {formatDate(dl.due_date)}</span>}
                  </div>
                  {dl.description && <p className="mt-1 text-xs text-white/40">{dl.description}</p>}
                </div>
                <button type="button" onClick={() => handleDeleteDeliverable(dl.id)}
                  className="cursor-pointer shrink-0 text-white/20 hover:text-red-400 transition">
                  <XIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Notes timeline */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-white">Catatan / Histori</h2>
        <div className="flex gap-2">
          <textarea value={newNote} onChange={(e) => setNewNote(e.target.value)} rows={2}
            placeholder="Tulis catatan baru..."
            className={cn(inputCls, "flex-1 resize-none")} />
          <button type="button" onClick={handleAddNote} disabled={pending || !newNote.trim()}
            className="cursor-pointer self-end rounded-md bg-yellow-400 px-4 py-2 text-xs font-semibold text-black hover:bg-yellow-300 disabled:opacity-50 transition">
            Kirim
          </button>
        </div>

        <div className="space-y-2">
          {notes.length === 0 ? (
            <p className="py-4 text-center text-xs text-white/30">Belum ada catatan</p>
          ) : (
            notes.map((n) => (
              <div key={n.id} className="group flex gap-3 rounded-lg border border-[#2D2D2D] bg-[#1C1C1C] p-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/80 whitespace-pre-wrap">{n.content}</p>
                  <p className="mt-1 text-[10px] text-white/30">
                    {new Date(n.created_at).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <button type="button" onClick={() => handleDeleteNote(n.id)}
                  className="cursor-pointer hidden shrink-0 text-white/20 hover:text-red-400 transition group-hover:block">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Edit modal */}
      <SponsorFormModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        orgId={orgId}
        editing={sponsor}
        onSaved={() => router.refresh()}
      />
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no output (no errors).

---

## Task 6: SponsorListClient

**Files:**
- Create: `features/sponsors/components/SponsorListClient.tsx`

- [ ] **Step 1: Write SponsorListClient**

```typescript
// features/sponsors/components/SponsorListClient.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";
import { SponsorCard } from "./SponsorCard";
import { SponsorFormModal } from "./SponsorFormModal";
import type { SponsorWithStats } from "../queries";

function formatCurrency(value: number | null, currency: string) {
  if (value === null) return null;
  return new Intl.NumberFormat("id-ID", { style: "currency", currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
}

interface SponsorListClientProps {
  sponsors: SponsorWithStats[];
  orgId: string;
  detailBasePath: string; // e.g. "/dashboard/sponsors" or "/manage/sponsors"
}

export function SponsorListClient({ sponsors, orgId, detailBasePath }: SponsorListClientProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);

  const active = sponsors.filter((s) => s.status === "active");
  const totalValue = active.reduce((sum, s) => sum + (s.deal_value ?? 0), 0);
  const pendingDl = sponsors.reduce((sum, s) => sum + (s.deliverableTotal - s.deliverableDone), 0);

  return (
    <div className="space-y-6 px-4 py-6 sm:px-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">Sponsor & Partner</h1>
          <p className="mt-1 text-sm text-white/50">Kelola kerja sama sponsor dan progress deliverable</p>
        </div>
        <button type="button" onClick={() => setModalOpen(true)}
          className="inline-flex cursor-pointer h-10 items-center gap-2 rounded-md bg-yellow-400 px-4 text-sm font-semibold text-black transition hover:bg-yellow-300">
          <Plus className="h-4 w-4" />
          Tambah Sponsor
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Total Sponsor", value: sponsors.length },
          { label: "Sponsor Aktif", value: active.length },
          { label: "Deliverable Pending", value: pendingDl },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-lg border border-[#2D2D2D] bg-[#1C1C1C] p-4">
            <p className="text-xs text-white/50">{label}</p>
            <p className="mt-1 text-2xl font-bold text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* Total active value */}
      {totalValue > 0 && (
        <p className="text-sm text-white/50">
          Total nilai deal aktif:{" "}
          <span className="font-semibold text-yellow-400">
            {formatCurrency(totalValue, "IDR")}
          </span>
        </p>
      )}

      {/* Sponsor grid */}
      {sponsors.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 bg-zinc-900/30 p-10 text-center">
          <p className="text-sm text-white/50">Belum ada sponsor. Tambah sponsor pertama.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sponsors.map((s) => (
            <SponsorCard
              key={s.id}
              sponsor={s}
              detailHref={`${detailBasePath}/${s.id}`}
            />
          ))}
        </div>
      )}

      <SponsorFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        orgId={orgId}
        onSaved={(id) => {
          setModalOpen(false);
          router.push(`${detailBasePath}/${id}`);
        }}
      />
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no output (no errors).

- [ ] **Step 3: Commit all feature components**

```bash
rtk git add features/sponsors/
rtk git commit -m "feat: sponsor list + detail client components"
```

---

## Task 7: Server Pages + Sidebar Wiring

**Files:**
- Create: `app/dashboard/(panel)/sponsors/page.tsx`
- Create: `app/dashboard/(panel)/sponsors/[id]/page.tsx`
- Create: `app/manage/sponsors/page.tsx`
- Create: `app/manage/sponsors/[id]/page.tsx`
- Modify: `app/dashboard/(panel)/layout.tsx`
- Modify: `components/layout/WorkspaceSidebar.tsx`

- [ ] **Step 1: Write dashboard sponsors list page**

```typescript
// app/dashboard/(panel)/sponsors/page.tsx
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSponsors } from "@/features/sponsors/queries";
import { SponsorListClient } from "@/features/sponsors/components/SponsorListClient";

export const dynamic = "force-dynamic";

export default async function DashboardSponsorsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();

  const admin = createAdminClient();
  const { data: orgs } = await admin
    .from("organizations")
    .select("id")
    .eq("owner_id", user.id);

  const orgIds = (orgs ?? []).map((o) => o.id);
  const sponsors = await getSponsors(orgIds);

  // Use the first org for create (owner typically has one org)
  const primaryOrgId = orgIds[0] ?? "";

  return (
    <SponsorListClient
      sponsors={sponsors}
      orgId={primaryOrgId}
      detailBasePath="/dashboard/sponsors"
    />
  );
}
```

- [ ] **Step 2: Write dashboard sponsor detail page**

```typescript
// app/dashboard/(panel)/sponsors/[id]/page.tsx
import { notFound } from "next/navigation";
import { getSponsorDetail } from "@/features/sponsors/queries";
import { SponsorDetailClient } from "@/features/sponsors/components/SponsorDetailClient";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function DashboardSponsorDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();

  const sponsor = await getSponsorDetail(id);
  if (!sponsor) notFound();

  const admin = createAdminClient();
  const { data: org } = await admin
    .from("organizations")
    .select("id")
    .eq("id", sponsor.organization_id)
    .maybeSingle();
  if (!org) notFound();

  return (
    <SponsorDetailClient
      sponsor={sponsor}
      orgId={org.id}
      backHref="/dashboard/sponsors"
      listHref="/dashboard/sponsors"
    />
  );
}
```

- [ ] **Step 3: Write manage sponsors list page**

```typescript
// app/manage/sponsors/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSponsors } from "@/features/sponsors/queries";
import { SponsorListClient } from "@/features/sponsors/components/SponsorListClient";

export const dynamic = "force-dynamic";

export default async function ManageSponsorsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: memberships } = await admin
    .from("team_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .in("role", ["manager", "owner"])
    .eq("is_active", true);

  const orgIds = [...new Set((memberships ?? []).map((m) => m.organization_id))];
  const sponsors = await getSponsors(orgIds);
  const primaryOrgId = orgIds[0] ?? "";

  return (
    <SponsorListClient
      sponsors={sponsors}
      orgId={primaryOrgId}
      detailBasePath="/manage/sponsors"
    />
  );
}
```

- [ ] **Step 4: Write manage sponsor detail page**

```typescript
// app/manage/sponsors/[id]/page.tsx
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSponsorDetail } from "@/features/sponsors/queries";
import { SponsorDetailClient } from "@/features/sponsors/components/SponsorDetailClient";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ManageSponsorDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const sponsor = await getSponsorDetail(id);
  if (!sponsor) notFound();

  const admin = createAdminClient();
  const { data: tm } = await admin
    .from("team_members")
    .select("role")
    .eq("user_id", user.id)
    .eq("organization_id", sponsor.organization_id)
    .eq("is_active", true)
    .maybeSingle();

  const ownerEmail = process.env.OWNER_EMAIL;
  const isOwner = user.email === ownerEmail;
  const isManager = isOwner || ["manager", "owner"].includes(tm?.role ?? "");
  if (!isManager) notFound();

  return (
    <SponsorDetailClient
      sponsor={sponsor}
      orgId={sponsor.organization_id}
      backHref="/manage/sponsors"
      listHref="/manage/sponsors"
    />
  );
}
```

- [ ] **Step 5: Add "Sponsor" to dashboard layout nav**

In `app/dashboard/(panel)/layout.tsx`, add `Handshake` to the icon imports and add a nav item under MANAJEMEN:

```typescript
// Change the lucide import line to add Handshake:
import {
  BarChart3, Building2, Calendar, DollarSign, Download,
  FileText, FolderOpen, Handshake, Home, ListChecks, LogOut,
  Shield, Trophy, Users,
} from "lucide-react";
```

Then in `NAV_GROUPS`, under MANAJEMEN, add after the Kas Tim item:

```typescript
{ href: "/dashboard/finances", Icon: DollarSign, label: "Kas Tim" },
{ href: "/dashboard/sponsors", Icon: Handshake, label: "Sponsor" },
```

- [ ] **Step 6: Add "Sponsor" to WorkspaceSidebar manage panel**

In `components/layout/WorkspaceSidebar.tsx`, add `Handshake` to the lucide import and add item to `MANAGER_NAV_GROUP`:

Add `Handshake` to the existing lucide import list (already has many icons, add it alphabetically):
```typescript
  Handshake,
```

In `MANAGER_NAV_GROUP.items`, add after "Kas Tim" item:
```typescript
{
  key: "manage-finances",
  href: "",
  absoluteHref: "/manage/finances",
  label: "Kas Tim",
  Icon: DollarSign,
},
{
  key: "manage-sponsors",
  href: "",
  absoluteHref: "/manage/sponsors",
  label: "Sponsor",
  Icon: Handshake,
},
```

- [ ] **Step 7: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no output (no errors).

- [ ] **Step 8: Commit all routes and nav wiring**

```bash
rtk git add "app/dashboard/(panel)/sponsors/" "app/manage/sponsors/" "app/dashboard/(panel)/layout.tsx" "components/layout/WorkspaceSidebar.tsx"
rtk git commit -m "feat: sponsor tracker pages for dashboard + manage, sidebar nav entries"
```
