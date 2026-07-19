# Audit Log — Comprehensive Coverage & Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the static 200-entry client-side audit viewer with a paginated server-side dashboard with activity chart, multi-level filters, saved presets, CSV export, and full CRUD coverage across all 6 missing modules.

**Architecture:** URL search params drive server-side Supabase queries. The `audit/page.tsx` Server Component reads params, calls server actions in parallel, and passes data down to client components. Filter changes update URL via `router.push()`, triggering server re-render. Audit coverage is added by importing `logAudit` into the 6 missing action files.

**Tech Stack:** Next.js 15 App Router, Supabase admin client, Recharts (bar chart), date-fns v4, lucide-react, Tailwind CSS v4, localStorage (saved presets)

---

## File Map

**Create:**
- `supabase/migrations/20260517120000_audit_gin_index.sql`
- `features/dashboard/actions/fetchAuditLogs.ts`
- `features/dashboard/actions/fetchAuditActivity.ts`
- `features/dashboard/actions/exportAuditLogs.ts`
- `features/dashboard/components/AuditDashboard.tsx`
- `features/dashboard/components/AuditActivityChart.tsx`
- `features/dashboard/components/AuditFilterPanel.tsx`
- `features/dashboard/components/AuditPagination.tsx`
- `features/dashboard/components/AuditExportButton.tsx`

**Modify:**
- `features/dashboard/components/AuditLogList.tsx` — update type, human-readable metadata, pattern-based colors
- `app/dashboard/(panel)/audit/page.tsx` — replace static fetch with URL param + parallel server actions
- `features/announcements/actions.ts` — add logAudit (create, update, delete)
- `features/strategy/actions.ts` — add logAudit (create, update, delete)
- `features/files/actions.ts` — add logAudit (upload, delete)
- `features/finances/actions.ts` — add logAudit (create, delete)
- `features/content/actions.ts` — add logAudit (create, update, delete, status_change)
- `features/scrim/actions.ts` — add logAudit (create, update, delete, cancel)
- `features/player-development/actions.ts` — add logAudit for delete gap

---

## Task 1: Install Recharts + DB Migration

**Files:**
- Create: `supabase/migrations/20260517120000_audit_gin_index.sql`

- [ ] **Step 1: Install recharts**

```bash
pnpm add recharts
```

Expected: recharts added to package.json dependencies.

- [ ] **Step 2: Create GIN index migration**

Write `supabase/migrations/20260517120000_audit_gin_index.sql`:

```sql
-- GIN index for fast full-text search on metadata JSONB column
CREATE INDEX IF NOT EXISTS idx_audit_logs_metadata_gin
  ON audit_logs USING GIN (metadata);
```

- [ ] **Step 3: Push migration**

```bash
npx supabase db push
```

Expected: "Applying migration 20260517120000_audit_gin_index" — no errors.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260517120000_audit_gin_index.sql package.json pnpm-lock.yaml
git commit -m "chore: install recharts, add audit_logs GIN index migration"
```

---

## Task 2: fetchAuditLogs Server Action

**Files:**
- Create: `features/dashboard/actions/fetchAuditLogs.ts`

- [ ] **Step 1: Create the file**

Write `features/dashboard/actions/fetchAuditLogs.ts`:

```typescript
"use server";

import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const ACTION_LABELS: Record<string, string> = {
  // Org / Team
  org_updated: "Tim diupdate",
  org_deleted: "Tim dihapus",
  team_created: "Tim dibuat",
  // Divisions
  division_created: "Divisi dibuat",
  division_renamed: "Divisi diubah nama",
  division_archived: "Divisi diarsipkan",
  division_deleted: "Divisi dihapus",
  // Members
  member_removed: "Member dihapus",
  member_added: "Member ditambahkan",
  member_kicked: "Member dikick",
  member_left: "Member keluar",
  member_joined: "Member bergabung",
  // Auth
  user_registered: "User mendaftar",
  // Role
  role_changed: "Role diubah",
  // Announcements
  "announcement.create": "Pengumuman dibuat",
  "announcement.update": "Pengumuman diupdate",
  "announcement.delete": "Pengumuman dihapus",
  // Strategy
  "strategy.create": "Catatan strategi dibuat",
  "strategy.update": "Catatan strategi diupdate",
  "strategy.delete": "Catatan strategi dihapus",
  // Files
  "file.upload": "File diupload",
  "file.delete": "File dihapus",
  // Finances
  "finance.create": "Keuangan dicatat",
  "finance.delete": "Keuangan dihapus",
  // Content Calendar
  "content.create": "Konten dibuat",
  "content.update": "Konten diupdate",
  "content.delete": "Konten dihapus",
  "content.status_change": "Status konten diubah",
  // Scrim
  "scrim.create": "Scrim dibuat",
  "scrim.update": "Scrim diupdate",
  "scrim.delete": "Scrim dihapus",
  "scrim.cancel": "Scrim dibatalkan",
  // Matchmaking
  "scrim_request.create": "Request scrim dikirim",
  "scrim_request.accepted": "Request scrim diterima",
  "scrim_request.declined": "Request scrim ditolak",
  // Player Development
  "player_target.create": "Target pemain dibuat",
  "player_target.update": "Target pemain diupdate",
  "player_target.delete": "Target pemain dihapus",
  // Scouting
  "opponent_profile.create": "Profil lawan dibuat",
  "opponent_profile.update": "Profil lawan diupdate",
  // Tournaments
  "tournament.create": "Turnamen dibuat",
  "tournament.update": "Turnamen diupdate",
  "tournament.delete": "Turnamen dihapus",
  "tournament.status.upcoming": "Turnamen status: upcoming",
  "tournament.status.ongoing": "Turnamen status: ongoing",
  "tournament.status.completed": "Turnamen selesai",
  "tournament.status.cancelled": "Turnamen dibatalkan",
  // Polls
  "poll.create": "Polling dibuat",
  // Calendar
  "create-event": "Event kalender dibuat",
  "update-event": "Event kalender diupdate",
  "update-permissions": "Izin kalender diupdate",
  "update-visibility": "Visibilitas kalender diupdate",
  // Notifications
  "wa.retry": "WA dikirim ulang",
};

export const ENTITY_TYPE_LABELS: Record<string, string> = {
  organization: "Tim / Org",
  division: "Divisi",
  team_member: "Member",
  announcement: "Pengumuman",
  strategy_note: "Strategi",
  file: "File",
  finance: "Keuangan",
  content_calendar: "Konten",
  scrim: "Scrim",
  scrim_request: "Request Scrim",
  player_target: "Target Pemain",
  opponent_profile: "Profil Lawan",
  tournament: "Turnamen",
  poll: "Polling",
  calendar_event: "Event Kalender",
  notification: "Notifikasi",
};

export type AuditLogItem = {
  id: string;
  action: string;
  actionLabel: string;
  actorName: string;
  actorId: string | null;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown>;
  time: string;
  rawTime: string;
};

const PAGE_SIZE = 50;

export async function fetchAuditLogs(params: {
  search?: string;
  entityType?: string;
  actorId?: string;
  from?: string;
  to?: string;
  page?: number;
}): Promise<{ items: AuditLogItem[]; total: number; pageCount: number }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/dashboard/login");

  const ownerEmail = process.env.OWNER_EMAIL;
  if (user.email !== ownerEmail) redirect("/");

  const admin = createAdminClient();
  const page = params.page ?? 1;
  const rangeFrom = (page - 1) * PAGE_SIZE;
  const rangeTo = page * PAGE_SIZE - 1;

  let query = admin
    .from("audit_logs")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(rangeFrom, rangeTo);

  if (params.search) {
    query = query.ilike("action", `%${params.search}%`);
  }
  if (params.entityType) {
    query = query.eq("entity_type", params.entityType);
  }
  if (params.actorId) {
    query = query.eq("actor_id", params.actorId);
  }
  if (params.from) {
    query = query.gte("created_at", new Date(params.from).toISOString());
  }
  if (params.to) {
    const toDate = new Date(params.to);
    toDate.setHours(23, 59, 59, 999);
    query = query.lte("created_at", toDate.toISOString());
  }

  const { data: logs, count } = await query;

  const actorIds = [
    ...new Set((logs ?? []).map((l) => l.actor_id).filter(Boolean)),
  ] as string[];

  const { data: profiles } =
    actorIds.length > 0
      ? await admin
          .from("profiles")
          .select("id, display_name, username")
          .in("id", actorIds)
      : { data: [] };

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  const items: AuditLogItem[] = (logs ?? []).map((log) => {
    const actor = log.actor_id ? profileMap.get(log.actor_id) : null;
    const meta = (log.metadata as Record<string, unknown>) ?? {};
    return {
      id: log.id,
      action: log.action,
      actionLabel: ACTION_LABELS[log.action] ?? log.action,
      actorName: actor?.display_name ?? actor?.username ?? "System",
      actorId: log.actor_id,
      entityType: log.entity_type,
      entityId: log.entity_id,
      metadata: meta,
      time: new Date(log.created_at).toLocaleString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Jakarta",
      }),
      rawTime: log.created_at,
    };
  });

  const total = count ?? 0;
  return { items, total, pageCount: Math.ceil(total / PAGE_SIZE) };
}

export async function fetchDistinctActors(): Promise<
  { id: string; name: string }[]
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const admin = createAdminClient();
  const { data: logs } = await admin
    .from("audit_logs")
    .select("actor_id")
    .not("actor_id", "is", null)
    .limit(1000);

  const actorIds = [...new Set((logs ?? []).map((l) => l.actor_id).filter(Boolean))] as string[];
  if (actorIds.length === 0) return [];

  const { data: profiles } = await admin
    .from("profiles")
    .select("id, display_name, username")
    .in("id", actorIds);

  return (profiles ?? []).map((p) => ({
    id: p.id,
    name: p.display_name ?? p.username ?? p.id,
  }));
}
```

- [ ] **Step 2: Commit**

```bash
git add features/dashboard/actions/fetchAuditLogs.ts
git commit -m "feat(audit): add fetchAuditLogs server action with pagination and filters"
```

---

## Task 3: fetchAuditActivity + exportAuditLogs Server Actions

**Files:**
- Create: `features/dashboard/actions/fetchAuditActivity.ts`
- Create: `features/dashboard/actions/exportAuditLogs.ts`

- [ ] **Step 1: Create fetchAuditActivity.ts**

Write `features/dashboard/actions/fetchAuditActivity.ts`:

```typescript
"use server";

import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type ActivityPoint = { day: string; count: number };

export async function fetchAuditActivity(
  daysBack: 7 | 30,
): Promise<ActivityPoint[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/dashboard/login");

  const ownerEmail = process.env.OWNER_EMAIL;
  if (user.email !== ownerEmail) redirect("/");

  const admin = createAdminClient();
  const since = new Date();
  since.setDate(since.getDate() - daysBack);

  const { data } = await admin
    .from("audit_logs")
    .select("created_at")
    .gte("created_at", since.toISOString());

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const day = new Date(row.created_at).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: "Asia/Jakarta",
    });
    counts.set(day, (counts.get(day) ?? 0) + 1);
  }

  const result: ActivityPoint[] = [];
  for (let i = daysBack - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dayStr = d.toLocaleDateString("id-ID", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: "Asia/Jakarta",
    });
    result.push({ day: dayStr, count: counts.get(dayStr) ?? 0 });
  }
  return result;
}
```

- [ ] **Step 2: Create exportAuditLogs.ts**

Write `features/dashboard/actions/exportAuditLogs.ts`:

```typescript
"use server";

import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { ACTION_LABELS } from "./fetchAuditLogs";

export type ExportRow = {
  timestamp: string;
  actor: string;
  action: string;
  actionLabel: string;
  entityType: string;
  entityId: string;
  metadata: string;
};

export async function exportAuditLogs(params: {
  search?: string;
  entityType?: string;
  actorId?: string;
  from?: string;
  to?: string;
}): Promise<{ rows: ExportRow[] }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/dashboard/login");

  const ownerEmail = process.env.OWNER_EMAIL;
  if (user.email !== ownerEmail) redirect("/");

  const admin = createAdminClient();

  let query = admin
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10000);

  if (params.search) {
    query = query.ilike("action", `%${params.search}%`);
  }
  if (params.entityType) {
    query = query.eq("entity_type", params.entityType);
  }
  if (params.actorId) {
    query = query.eq("actor_id", params.actorId);
  }
  if (params.from) {
    query = query.gte("created_at", new Date(params.from).toISOString());
  }
  if (params.to) {
    const toDate = new Date(params.to);
    toDate.setHours(23, 59, 59, 999);
    query = query.lte("created_at", toDate.toISOString());
  }

  const { data: logs } = await query;

  const actorIds = [
    ...new Set((logs ?? []).map((l) => l.actor_id).filter(Boolean)),
  ] as string[];

  const { data: profiles } =
    actorIds.length > 0
      ? await admin
          .from("profiles")
          .select("id, display_name, username")
          .in("id", actorIds)
      : { data: [] };

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  const rows: ExportRow[] = (logs ?? []).map((log) => {
    const actor = log.actor_id ? profileMap.get(log.actor_id) : null;
    const meta = (log.metadata as Record<string, unknown>) ?? {};
    return {
      timestamp: new Date(log.created_at).toLocaleString("id-ID", {
        timeZone: "Asia/Jakarta",
      }),
      actor: actor?.display_name ?? actor?.username ?? "System",
      action: log.action,
      actionLabel: ACTION_LABELS[log.action] ?? log.action,
      entityType: log.entity_type ?? "",
      entityId: log.entity_id ?? "",
      metadata: JSON.stringify(meta),
    };
  });

  return { rows };
}
```

- [ ] **Step 3: Commit**

```bash
git add features/dashboard/actions/fetchAuditActivity.ts features/dashboard/actions/exportAuditLogs.ts
git commit -m "feat(audit): add fetchAuditActivity and exportAuditLogs server actions"
```

---

## Task 4: AuditLogList — Update Type + Human-Readable Metadata

**Files:**
- Modify: `features/dashboard/components/AuditLogList.tsx`

The `AuditLogItem` type changes: `metaText: string` → `metadata: Record<string, unknown>`. The component gets a `formatMetadata()` helper and pattern-based color function.

- [ ] **Step 1: Rewrite AuditLogList.tsx**

Replace the entire file content with:

```typescript
"use client";

import { Search } from "lucide-react";
import { useState } from "react";

import { Input } from "@/components/ui/input";
import type { AuditLogItem } from "@/features/dashboard/actions/fetchAuditLogs";

export type { AuditLogItem };

function getActionColor(action: string): string {
  if (
    action.endsWith(".delete") ||
    ["member_removed", "member_kicked", "division_deleted", "org_deleted"].includes(action)
  ) return "text-red-400";
  if (
    action.endsWith(".create") ||
    action.endsWith(".upload") ||
    ["member_joined", "user_registered", "team_created", "division_created"].includes(action)
  ) return "text-green-400";
  if (action.endsWith(".update") || action.endsWith(".status_change") || action === "org_updated")
    return "text-blue-400";
  if (action.includes("archived")) return "text-amber-400";
  if (action === "role_changed") return "text-purple-400";
  if (action.includes("accepted")) return "text-green-400";
  if (action.includes("declined")) return "text-red-400";
  return "text-white/60";
}

function formatMetadata(action: string, meta: Record<string, unknown>): string {
  if (!meta || Object.keys(meta).length === 0) return "";

  if (
    action.endsWith(".create") ||
    action.endsWith(".upload") ||
    ["team_created", "division_created", "user_registered", "member_joined"].includes(action)
  ) {
    const label = meta.title ?? meta.name ?? meta.email ?? meta.displayName;
    if (label) return String(label);
  }

  if (
    action.endsWith(".delete") ||
    ["member_removed", "member_kicked", "division_deleted", "org_deleted"].includes(action)
  ) {
    const label = meta.title ?? meta.name ?? meta.target_name;
    if (label) return `Dihapus: ${label}`;
  }

  if (action.endsWith(".update") || action === "org_updated") {
    const changes = meta.changes as Record<string, [unknown, unknown]> | undefined;
    if (changes) {
      return Object.entries(changes)
        .map(([k, v]) => `${k}: ${Array.isArray(v) ? `${v[0]} → ${v[1]}` : v}`)
        .join(", ");
    }
    const name = meta.newName ?? meta.name;
    if (name) return String(name);
  }

  if (action.endsWith(".status_change") || action.includes("status")) {
    if (meta.from && meta.to) return `${meta.from} → ${meta.to}`;
  }

  if (action === "role_changed") {
    if (meta.from && meta.to) return `${meta.from} → ${meta.to}`;
  }

  return Object.entries(meta)
    .slice(0, 3)
    .map(([k, v]) => `${k}: ${v}`)
    .join(" · ");
}

interface AuditLogListProps {
  logs: AuditLogItem[];
  showSearch?: boolean;
}

export function AuditLogList({ logs, showSearch = false }: AuditLogListProps) {
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? logs.filter((log) => {
        const q = query.toLowerCase();
        return (
          log.actionLabel.toLowerCase().includes(q) ||
          log.actorName.toLowerCase().includes(q) ||
          JSON.stringify(log.metadata).toLowerCase().includes(q)
        );
      })
    : logs;

  // Group by date
  const groups = new Map<string, AuditLogItem[]>();
  for (const log of filtered) {
    const day = new Date(log.rawTime).toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Asia/Jakarta",
    });
    if (!groups.has(day)) groups.set(day, []);
    groups.get(day)!.push(log);
  }

  return (
    <div className="space-y-4">
      {showSearch && (
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#6B6A68] pointer-events-none" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari aksi, aktor..."
            className="pl-8 h-8 text-sm bg-[#202020] border-[#2D2D2D] text-[#E5E2E1] placeholder:text-[#6B6A68] focus-visible:ring-0 focus-visible:border-[#9B9A97]"
          />
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-white/5 bg-white/[0.02] px-4 py-8 text-center text-sm text-white/40">
          {query ? "Tidak ada hasil yang cocok." : "Belum ada aktivitas tercatat."}
        </div>
      ) : (
        <div className="space-y-6">
          {[...groups.entries()].map(([day, dayLogs]) => (
            <div key={day}>
              <div className="mb-2 text-xs font-medium text-[#6B6A68] uppercase tracking-wider">
                {day}
              </div>
              <div className="space-y-1">
                {dayLogs.map((log) => {
                  const color = getActionColor(log.action);
                  const metaDisplay = formatMetadata(log.action, log.metadata);
                  return (
                    <div
                      key={log.id}
                      className="flex items-start gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs font-medium ${color}`}>
                            {log.actionLabel}
                          </span>
                          <span className="text-xs text-white/30">oleh</span>
                          <span className="text-xs font-medium text-white/70">
                            {log.actorName}
                          </span>
                        </div>
                        {metaDisplay && (
                          <p className="mt-0.5 text-xs text-white/40 truncate">
                            {metaDisplay}
                          </p>
                        )}
                      </div>
                      <span className="shrink-0 text-xs text-white/30">{log.time}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add features/dashboard/components/AuditLogList.tsx
git commit -m "feat(audit): update AuditLogList with date grouping, human-readable metadata, pattern-based colors"
```

---

## Task 5: AuditActivityChart Component

**Files:**
- Create: `features/dashboard/components/AuditActivityChart.tsx`

- [ ] **Step 1: Create AuditActivityChart.tsx**

Write `features/dashboard/components/AuditActivityChart.tsx`:

```typescript
"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { ActivityPoint } from "@/features/dashboard/actions/fetchAuditActivity";

interface AuditActivityChartProps {
  data7: ActivityPoint[];
  data30: ActivityPoint[];
}

export function AuditActivityChart({ data7, data30 }: AuditActivityChartProps) {
  const [range, setRange] = useState<7 | 30>(7);
  const data = range === 7 ? data7 : data30;

  // Show only day/month on x-axis label
  const formatDay = (day: string) => {
    const parts = day.split("/");
    if (parts.length < 2) return day;
    return `${parts[0]}/${parts[1]}`;
  };

  return (
    <div className="rounded-lg border border-[#2D2D2D] bg-[#202020] p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-[#E5E2E1]">Aktivitas</h2>
        <div className="flex items-center gap-1">
          {([7, 30] as const).map((d) => (
            <button
              key={d}
              onClick={() => setRange(d)}
              className={`px-3 py-1 rounded text-xs cursor-pointer transition-colors ${
                range === d
                  ? "bg-white/10 text-[#E5E2E1]"
                  : "text-[#6B6A68] hover:text-[#9B9A97]"
              }`}
            >
              {d} Hari
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={120}>
        <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <XAxis
            dataKey="day"
            tickFormatter={formatDay}
            tick={{ fontSize: 10, fill: "#6B6A68" }}
            tickLine={false}
            axisLine={false}
            interval={range === 7 ? 0 : 4}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#6B6A68" }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              background: "#202020",
              border: "1px solid #2D2D2D",
              borderRadius: 6,
              fontSize: 12,
              color: "#E5E2E1",
            }}
            formatter={(value: number) => [value, "Aktivitas"]}
            labelFormatter={(label) => `Tanggal: ${label}`}
          />
          <Bar dataKey="count" fill="#4B5563" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add features/dashboard/components/AuditActivityChart.tsx
git commit -m "feat(audit): add AuditActivityChart recharts bar chart component"
```

---

## Task 6: AuditFilterPanel Component

**Files:**
- Create: `features/dashboard/components/AuditFilterPanel.tsx`

- [ ] **Step 1: Create AuditFilterPanel.tsx**

Write `features/dashboard/components/AuditFilterPanel.tsx`:

```typescript
"use client";

import { Search, SlidersHorizontal, X, BookmarkPlus } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { Input } from "@/components/ui/input";
import { ENTITY_TYPE_LABELS } from "@/features/dashboard/actions/fetchAuditLogs";

const PRESETS_KEY = "audit_filter_presets";
const MAX_PRESETS = 5;

type Filters = {
  search: string;
  module: string;
  actor: string;
  from: string;
  to: string;
};

type Preset = { name: string; filters: Filters };

interface AuditFilterPanelProps {
  filters: Filters;
  actors: { id: string; name: string }[];
}

function loadPresets(): Preset[] {
  try {
    return JSON.parse(localStorage.getItem(PRESETS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function savePresets(presets: Preset[]) {
  localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
}

export function AuditFilterPanel({ filters, actors }: AuditFilterPanelProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState(filters.search);
  const [presets, setPresets] = useState<Preset[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setPresets(loadPresets());
  }, []);

  const pushFilters = useCallback(
    (updated: Partial<Filters>) => {
      const merged = { ...filters, search, ...updated };
      const params = new URLSearchParams();
      if (merged.search) params.set("search", merged.search);
      if (merged.module) params.set("module", merged.module);
      if (merged.actor) params.set("actor", merged.actor);
      if (merged.from) params.set("from", merged.from);
      if (merged.to) params.set("to", merged.to);
      router.push(`${pathname}?${params.toString()}`);
    },
    [filters, search, router, pathname],
  );

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      pushFilters({ search: value });
    }, 300);
  };

  const handleSavePreset = () => {
    const name = window.prompt("Nama preset (maks 30 karakter):");
    if (!name?.trim()) return;
    const current: Filters = { search, ...filters };
    const updated = [
      { name: name.trim().slice(0, 30), filters: current },
      ...presets,
    ].slice(0, MAX_PRESETS);
    setPresets(updated);
    savePresets(updated);
  };

  const handleApplyPreset = (preset: Preset) => {
    setSearch(preset.filters.search);
    pushFilters(preset.filters);
  };

  const handleDeletePreset = (index: number) => {
    const updated = presets.filter((_, i) => i !== index);
    setPresets(updated);
    savePresets(updated);
  };

  const hasActiveFilters =
    filters.search || filters.module || filters.actor || filters.from || filters.to;

  return (
    <div className="space-y-3">
      {/* Main filter row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#6B6A68] pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Cari aksi..."
            className="pl-8 h-8 w-52 text-sm bg-[#202020] border-[#2D2D2D] text-[#E5E2E1] placeholder:text-[#6B6A68] focus-visible:ring-0 focus-visible:border-[#9B9A97]"
          />
        </div>

        {/* Module dropdown */}
        <select
          value={filters.module}
          onChange={(e) => pushFilters({ module: e.target.value })}
          className="h-8 rounded-md border border-[#2D2D2D] bg-[#202020] px-2 text-xs text-[#E5E2E1] cursor-pointer focus:outline-none focus:border-[#9B9A97]"
        >
          <option value="">Semua Modul</option>
          {Object.entries(ENTITY_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        {/* Actor dropdown */}
        <select
          value={filters.actor}
          onChange={(e) => pushFilters({ actor: e.target.value })}
          className="h-8 rounded-md border border-[#2D2D2D] bg-[#202020] px-2 text-xs text-[#E5E2E1] cursor-pointer focus:outline-none focus:border-[#9B9A97]"
        >
          <option value="">Semua Aktor</option>
          {actors.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>

        {/* Date range */}
        <input
          type="date"
          value={filters.from}
          onChange={(e) => pushFilters({ from: e.target.value })}
          className="h-8 rounded-md border border-[#2D2D2D] bg-[#202020] px-2 text-xs text-[#E5E2E1] cursor-pointer focus:outline-none focus:border-[#9B9A97]"
        />
        <span className="text-xs text-[#6B6A68]">s/d</span>
        <input
          type="date"
          value={filters.to}
          onChange={(e) => pushFilters({ to: e.target.value })}
          className="h-8 rounded-md border border-[#2D2D2D] bg-[#202020] px-2 text-xs text-[#E5E2E1] cursor-pointer focus:outline-none focus:border-[#9B9A97]"
        />

        {/* Save preset */}
        <button
          onClick={handleSavePreset}
          title="Simpan filter sebagai preset"
          className="h-8 w-8 flex items-center justify-center rounded-md border border-[#2D2D2D] bg-[#202020] text-[#6B6A68] hover:text-[#E5E2E1] cursor-pointer transition-colors"
        >
          <BookmarkPlus className="h-3.5 w-3.5" />
        </button>

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            onClick={() => {
              setSearch("");
              router.push(pathname);
            }}
            className="flex items-center gap-1 text-xs text-[#6B6A68] hover:text-[#E5E2E1] cursor-pointer transition-colors"
          >
            <X className="h-3 w-3" />
            Reset
          </button>
        )}
      </div>

      {/* Saved presets */}
      {presets.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-[#6B6A68] flex items-center gap-1">
            <SlidersHorizontal className="h-3 w-3" />
            Preset:
          </span>
          {presets.map((preset, i) => (
            <div key={i} className="flex items-center gap-0.5">
              <button
                onClick={() => handleApplyPreset(preset)}
                className="px-2 py-0.5 rounded-full border border-[#2D2D2D] bg-[#202020] text-xs text-[#9B9A97] hover:text-[#E5E2E1] hover:border-[#9B9A97] cursor-pointer transition-colors"
              >
                {preset.name}
              </button>
              <button
                onClick={() => handleDeletePreset(i)}
                className="text-[#6B6A68] hover:text-red-400 cursor-pointer transition-colors"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add features/dashboard/components/AuditFilterPanel.tsx
git commit -m "feat(audit): add AuditFilterPanel with URL-driven filters and localStorage presets"
```

---

## Task 7: AuditPagination + AuditExportButton Components

**Files:**
- Create: `features/dashboard/components/AuditPagination.tsx`
- Create: `features/dashboard/components/AuditExportButton.tsx`

- [ ] **Step 1: Create AuditPagination.tsx**

Write `features/dashboard/components/AuditPagination.tsx`:

```typescript
"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface AuditPaginationProps {
  page: number;
  pageCount: number;
  total: number;
}

export function AuditPagination({ page, pageCount, total }: AuditPaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const goTo = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`${pathname}?${params.toString()}`);
  };

  if (pageCount <= 1) return null;

  return (
    <div className="flex items-center justify-between pt-2">
      <span className="text-xs text-[#6B6A68]">{total} aktivitas total</span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => goTo(page - 1)}
          disabled={page <= 1}
          className="h-7 w-7 flex items-center justify-center rounded border border-[#2D2D2D] bg-[#202020] text-[#9B9A97] hover:text-[#E5E2E1] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <span className="text-xs text-[#9B9A97]">
          {page} / {pageCount}
        </span>
        <button
          onClick={() => goTo(page + 1)}
          disabled={page >= pageCount}
          className="h-7 w-7 flex items-center justify-center rounded border border-[#2D2D2D] bg-[#202020] text-[#9B9A97] hover:text-[#E5E2E1] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create AuditExportButton.tsx**

Write `features/dashboard/components/AuditExportButton.tsx`:

```typescript
"use client";

import { Download, Loader2 } from "lucide-react";
import { useState } from "react";

import { exportAuditLogs } from "@/features/dashboard/actions/exportAuditLogs";

interface AuditExportButtonProps {
  filters: {
    search: string;
    module: string;
    actor: string;
    from: string;
    to: string;
  };
}

function rowsToCsv(rows: { timestamp: string; actor: string; action: string; actionLabel: string; entityType: string; entityId: string; metadata: string }[]): string {
  const headers = ["Waktu", "Aktor", "Aksi", "Label", "Modul", "Entity ID", "Metadata"];
  const lines = [
    headers.join(","),
    ...rows.map((r) =>
      [r.timestamp, r.actor, r.action, r.actionLabel, r.entityType, r.entityId, r.metadata]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    ),
  ];
  return lines.join("\n");
}

export function AuditExportButton({ filters }: AuditExportButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const { rows } = await exportAuditLogs({
        search: filters.search || undefined,
        entityType: filters.module || undefined,
        actorId: filters.actor || undefined,
        from: filters.from || undefined,
        to: filters.to || undefined,
      });

      const csv = rowsToCsv(rows);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const date = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `audit-${date}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="flex items-center gap-1.5 px-3 h-8 rounded-md border border-[#2D2D2D] bg-[#202020] text-xs text-[#9B9A97] hover:text-[#E5E2E1] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Download className="h-3.5 w-3.5" />
      )}
      Export CSV
    </button>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add features/dashboard/components/AuditPagination.tsx features/dashboard/components/AuditExportButton.tsx
git commit -m "feat(audit): add AuditPagination and AuditExportButton components"
```

---

## Task 8: AuditDashboard — Main Client Component

**Files:**
- Create: `features/dashboard/components/AuditDashboard.tsx`

- [ ] **Step 1: Create AuditDashboard.tsx**

Write `features/dashboard/components/AuditDashboard.tsx`:

```typescript
"use client";

import type { ActivityPoint } from "@/features/dashboard/actions/fetchAuditActivity";
import type { AuditLogItem } from "@/features/dashboard/actions/fetchAuditLogs";
import { AuditActivityChart } from "./AuditActivityChart";
import { AuditExportButton } from "./AuditExportButton";
import { AuditFilterPanel } from "./AuditFilterPanel";
import { AuditLogList } from "./AuditLogList";
import { AuditPagination } from "./AuditPagination";

export type CurrentFilters = {
  search: string;
  module: string;
  actor: string;
  from: string;
  to: string;
  page: number;
};

interface AuditDashboardProps {
  items: AuditLogItem[];
  total: number;
  pageCount: number;
  activityData7: ActivityPoint[];
  activityData30: ActivityPoint[];
  actors: { id: string; name: string }[];
  currentFilters: CurrentFilters;
}

export function AuditDashboard({
  items,
  total,
  pageCount,
  activityData7,
  activityData30,
  actors,
  currentFilters,
}: AuditDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Audit Log</h1>
        <p className="mt-1 text-sm text-white/60">
          Riwayat semua aktivitas penting di seluruh tim dan modul.
        </p>
      </div>

      {/* Activity chart */}
      <AuditActivityChart data7={activityData7} data30={activityData30} />

      {/* Filter panel */}
      <AuditFilterPanel
        filters={{
          search: currentFilters.search,
          module: currentFilters.module,
          actor: currentFilters.actor,
          from: currentFilters.from,
          to: currentFilters.to,
        }}
        actors={actors}
      />

      {/* Results header */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-[#9B9A97]">{total} aktivitas ditemukan</span>
        <AuditExportButton
          filters={{
            search: currentFilters.search,
            module: currentFilters.module,
            actor: currentFilters.actor,
            from: currentFilters.from,
            to: currentFilters.to,
          }}
        />
      </div>

      {/* Log list */}
      <AuditLogList logs={items} />

      {/* Pagination */}
      <AuditPagination
        page={currentFilters.page}
        pageCount={pageCount}
        total={total}
      />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add features/dashboard/components/AuditDashboard.tsx
git commit -m "feat(audit): add AuditDashboard client component"
```

---

## Task 9: Update audit/page.tsx (Server Component Shell)

**Files:**
- Modify: `app/dashboard/(panel)/audit/page.tsx`

- [ ] **Step 1: Replace page.tsx**

Replace the entire content of `app/dashboard/(panel)/audit/page.tsx` with:

```typescript
import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { fetchAuditActivity } from "@/features/dashboard/actions/fetchAuditActivity";
import {
  fetchAuditLogs,
  fetchDistinctActors,
} from "@/features/dashboard/actions/fetchAuditLogs";
import { AuditDashboard } from "@/features/dashboard/components/AuditDashboard";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{
    search?: string;
    module?: string;
    actor?: string;
    from?: string;
    to?: string;
    page?: string;
  }>;
}

export default async function DashboardAuditPage({ searchParams }: Props) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/dashboard/login");

  const ownerEmail = process.env.OWNER_EMAIL;
  if (user.email !== ownerEmail) redirect("/");

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1"));

  const [{ items, total, pageCount }, activityData7, activityData30, actors] =
    await Promise.all([
      fetchAuditLogs({
        search: params.search,
        entityType: params.module,
        actorId: params.actor,
        from: params.from,
        to: params.to,
        page,
      }),
      fetchAuditActivity(7),
      fetchAuditActivity(30),
      fetchDistinctActors(),
    ]);

  return (
    <>
      <header className="h-12 flex items-center px-6 sticky top-0 bg-[#191919] z-40 border-b border-[#2D2D2D]">
        <div className="flex items-center gap-2 text-[#9B9A97] text-sm">
          <Link href="/dashboard" className="hover:text-[#D4D4D4]">
            Home
          </Link>
          <span className="text-[#6B6A68]">/</span>
          <span className="text-[#D4D4D4]">Audit Log</span>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">
        <AuditDashboard
          items={items}
          total={total}
          pageCount={pageCount}
          activityData7={activityData7}
          activityData30={activityData30}
          actors={actors}
          currentFilters={{
            search: params.search ?? "",
            module: params.module ?? "",
            actor: params.actor ?? "",
            from: params.from ?? "",
            to: params.to ?? "",
            page,
          }}
        />
      </main>
    </>
  );
}
```

- [ ] **Step 2: Verify no TypeScript errors**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors related to audit files.

- [ ] **Step 3: Commit**

```bash
git add app/dashboard/(panel)/audit/page.tsx
git commit -m "feat(audit): revamp audit page with server-side pagination, filters, chart, export"
```

---

## Task 10: Audit Coverage — Announcements + Strategy

**Files:**
- Modify: `features/announcements/actions.ts`
- Modify: `features/strategy/actions.ts`

- [ ] **Step 1: Add logAudit import to announcements/actions.ts**

Add to the imports at the top of `features/announcements/actions.ts` (after existing imports):

```typescript
import { logAudit } from "@/lib/audit";
```

- [ ] **Step 2: Add logAudit call in createAnnouncementAction**

In `createAnnouncementAction`, after the successful announcement insert (after `if (error || !announcement) { ... }`), before the WA blast block, add:

```typescript
  await logAudit({
    actorId: user.id,
    action: "announcement.create",
    entityType: "announcement",
    entityId: announcement.id,
    metadata: { title: announcement.title, orgId: org.id },
  });
```

- [ ] **Step 3: Add logAudit call in updateAnnouncementAction**

In `updateAnnouncementAction`, after the successful update (after `if (error) { ... }`), before `revalidatePath`, add:

```typescript
  await logAudit({
    actorId: user.id,
    action: "announcement.update",
    entityType: "announcement",
    entityId: parsed.data.id,
    metadata: { title: parsed.data.title },
  });
```

- [ ] **Step 4: Add logAudit call in deleteAnnouncementAction**

In `deleteAnnouncementAction`, after the successful delete (after `if (error) { ... }`), before `revalidatePath`, add:

```typescript
  await logAudit({
    actorId: user.id,
    action: "announcement.delete",
    entityType: "announcement",
    entityId: announcementId,
  });
```

- [ ] **Step 5: Add logAudit import to strategy/actions.ts**

Add to the imports in `features/strategy/actions.ts`:

```typescript
import { logAudit } from "@/lib/audit";
```

- [ ] **Step 6: Add logAudit calls in strategy actions**

In `createStrategyNoteAction`, after `if (error || !note) { ... }`, before `revalidatePath`, add:

```typescript
  await logAudit({
    actorId: user.id,
    action: "strategy.create",
    entityType: "strategy_note",
    entityId: note.id,
    metadata: { title: note.title },
  });
```

In `updateStrategyNoteAction`, after `if (error) { ... }`, before `revalidatePath`, add:

```typescript
  await logAudit({
    actorId: user.id,
    action: "strategy.update",
    entityType: "strategy_note",
    entityId: parsed.data.id,
    metadata: { title: parsed.data.title },
  });
```

In `deleteStrategyNoteAction`, after `if (error) { ... }`, before `revalidatePath`, add:

```typescript
  await logAudit({
    actorId: user.id,
    action: "strategy.delete",
    entityType: "strategy_note",
    entityId: noteId,
  });
```

- [ ] **Step 7: Commit**

```bash
git add features/announcements/actions.ts features/strategy/actions.ts
git commit -m "feat(audit): add logAudit to announcements and strategy actions"
```

---

## Task 11: Audit Coverage — Files + Finances

**Files:**
- Modify: `features/files/actions.ts`
- Modify: `features/finances/actions.ts`

- [ ] **Step 1: Add logAudit to files/actions.ts**

Add import at top of `features/files/actions.ts`:

```typescript
import { logAudit } from "@/lib/audit";
```

In `recordFileUploadAction`, after `if (error || !data) { ... }`, before `revalidatePath`, add:

```typescript
  await logAudit({
    actorId: user.id,
    action: "file.upload",
    entityType: "file",
    entityId: data.id,
    metadata: { name: payload.file_name, size: payload.file_size, type: payload.file_type },
  });
```

- [ ] **Step 2: Add deleteFileAction with logAudit (if it exists)**

Check if `features/files/actions.ts` has a delete action. If yes, add logAudit after successful delete:

```typescript
  await logAudit({
    actorId: user.id,
    action: "file.delete",
    entityType: "file",
    entityId: fileId,
    metadata: { name: fileName },
  });
```

If no delete action exists, skip this step.

- [ ] **Step 3: Add logAudit to finances/actions.ts**

Add import at top of `features/finances/actions.ts`:

```typescript
import { logAudit } from "@/lib/audit";
```

In `createFinanceAction`, after `if (error) return { ok: false, message: error.message };`, before the `for` revalidate loop, add:

```typescript
  await logAudit({
    actorId: user.id,
    action: "finance.create",
    entityType: "finance",
    metadata: {
      type: parsed.data.type,
      amount: parsed.data.amount,
      category: parsed.data.category,
    },
  });
```

In `deleteFinanceAction`, after `if (error) return { ok: false, message: error.message };`, before the revalidate loop, add:

```typescript
  await logAudit({
    actorId: user.id,
    action: "finance.delete",
    entityType: "finance",
    entityId: financeId,
  });
```

- [ ] **Step 4: Commit**

```bash
git add features/files/actions.ts features/finances/actions.ts
git commit -m "feat(audit): add logAudit to files and finances actions"
```

---

## Task 12: Audit Coverage — Content + Scrim

**Files:**
- Modify: `features/content/actions.ts`
- Modify: `features/scrim/actions.ts`

- [ ] **Step 1: Add logAudit to content/actions.ts**

Add import at top of `features/content/actions.ts`:

```typescript
import { logAudit } from "@/lib/audit";
```

In `createContentAction`, after `if (error) return { ok: false, message: error.message };`, before revalidatePath calls, add:

```typescript
  await logAudit({
    actorId: user.id,
    action: "content.create",
    entityType: "content_calendar",
    metadata: { title: parsed.data.title, platform: parsed.data.platform },
  });
```

In `updateContentStatusAction`, after `if (error) return { ok: false, message: error.message };`, before revalidatePath calls, add:

```typescript
  await logAudit({
    actorId: user.id,
    action: "content.status_change",
    entityType: "content_calendar",
    entityId: contentId,
    metadata: { to: newStatus },
  });
```

In `deleteContentAction`, after `if (error) return { ok: false, message: error.message };`, before revalidatePath calls, add:

```typescript
  await logAudit({
    actorId: user.id,
    action: "content.delete",
    entityType: "content_calendar",
    entityId: contentId,
  });
```

- [ ] **Step 2: Check scrim/actions.ts for all CRUD functions**

Read `features/scrim/actions.ts` (full file) to identify: `createScrimAction`, `updateScrimAction` (if exists), `deleteScrimAction` (if exists), `cancelScrimAction` (if exists).

- [ ] **Step 3: Add logAudit import to scrim/actions.ts**

Add import at top of `features/scrim/actions.ts`:

```typescript
import { logAudit } from "@/lib/audit";
```

- [ ] **Step 4: Add logAudit in createScrimAction**

In `createScrimAction`, after `if (error || !scrim) { ... }`, before `fanOutScrimNotifications`, add:

```typescript
  await logAudit({
    actorId: user.id,
    action: "scrim.create",
    entityType: "scrim",
    entityId: scrim.id,
    metadata: { opponent: scrim.opponent_name, format: scrim.format },
  });
```

- [ ] **Step 5: Add logAudit in updateScrimAction (if it exists)**

If `updateScrimAction` exists, add after successful update:

```typescript
  await logAudit({
    actorId: user.id,
    action: "scrim.update",
    entityType: "scrim",
    entityId: scrimId,
  });
```

- [ ] **Step 6: Add logAudit in deleteScrimAction / cancelScrimAction (if they exist)**

For delete:
```typescript
  await logAudit({
    actorId: user.id,
    action: "scrim.delete",
    entityType: "scrim",
    entityId: scrimId,
  });
```

For cancel:
```typescript
  await logAudit({
    actorId: user.id,
    action: "scrim.cancel",
    entityType: "scrim",
    entityId: scrimId,
  });
```

- [ ] **Step 7: Commit**

```bash
git add features/content/actions.ts features/scrim/actions.ts
git commit -m "feat(audit): add logAudit to content and scrim actions"
```

---

## Task 13: Audit Coverage — Player Development Gap Fix

**Files:**
- Modify: `features/player-development/actions.ts`

- [ ] **Step 1: Add logAudit to deletePlayerTargetAction**

The `deletePlayerTargetAction` in `features/player-development/actions.ts` exists at line ~130. The `logAudit` import is already there. After `if (error) return { ok: false, message: error.message };`, before `revalidatePath`, add:

```typescript
  await logAudit({
    actorId: user.id,
    action: "player_target.delete",
    entityType: "player_target",
    entityId: targetId,
  });
```

Note: `user` is available from `supabase.auth.getUser()` earlier in the same function. Verify the variable name matches.

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add features/player-development/actions.ts
git commit -m "feat(audit): add missing player_target.delete audit log"
```

---

## Task 14: Final Build Check + Push

- [ ] **Step 1: Run build to catch any import/type errors**

```bash
npx next build 2>&1 | tail -20
```

Expected: build succeeds (or only pre-existing errors, none new).

- [ ] **Step 2: Open audit page in browser**

Navigate to `http://localhost:3000/dashboard/audit`. Verify:
- Activity chart renders (bar chart visible)
- Filter panel shows: search, module dropdown, actor dropdown, date inputs, save preset button
- Log list shows entries grouped by date
- Pagination shows if more than 50 entries exist
- Export CSV button present

- [ ] **Step 3: Test a filter**

Type something in the search box. After 300ms, the page reloads with `?search=...` in the URL and results update.

- [ ] **Step 4: Test a new audit entry**

Create an announcement from the workspace. Then go back to audit log and verify `announcement.create` appears with the announcement title in the metadata display.

- [ ] **Step 5: Push to remote**

```bash
git push
```

---

## Self-Review Checklist

- [x] All 6 missing modules covered: announcements, strategy, files, finances, content, scrim
- [x] Gap fix: player_target.delete
- [x] No TDB or placeholders in plan
- [x] TYPE: `AuditLogItem.metaText` renamed to `metadata: Record<string, unknown>` — consistent across all tasks
- [x] `fetchAuditLogs` and `AuditLogList` use same `AuditLogItem` type (imported from actions file)
- [x] `fetchDistinctActors` defined in Task 2, used in Task 9 (page.tsx) — consistent
- [x] `AuditDashboard` props `activityData7` / `activityData30` match Task 8 and Task 9
- [x] `ACTION_LABELS` exported from `fetchAuditLogs.ts`, re-used in `exportAuditLogs.ts`
- [x] Recharts dynamic import not needed — used in a Client Component, Next.js handles it
