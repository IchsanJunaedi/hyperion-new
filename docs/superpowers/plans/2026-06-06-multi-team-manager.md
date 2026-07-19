# Multi-Team Manager Support Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix `/manage` panel so a manager who manages multiple teams can switch between them, with all sub-pages scoped to the correct team.

**Architecture:** Move all `/manage/*` sub-pages to `/manage/[orgSlug]/*` so team context lives in the URL. The outer `/manage/layout.tsx` becomes a thin auth shell; the new `/manage/[orgSlug]/layout.tsx` handles team validation and renders the sidebar with a multi-team switcher. The `WorkspaceSidebar` gains a `managedTeams` prop and a `TeamSwitcher` dropdown. A cross-team calendar page at `/manage/calendar` aggregates events across all managed teams.

**Tech Stack:** Next.js 15 App Router (Server Components), Supabase (admin client), TypeScript strict, Tailwind CSS v4, Lucide React, Vitest for unit tests.

---

## Pre-work: Understand the Bug

The current `app/manage/layout.tsx` calls `.limit(1).maybeSingle()` on the manager's memberships, so it always picks the first DB row for `orgSlug`. All pages at `/manage/finances`, `/manage/salaries`, `/manage/sponsors`, `/manage/content`, `/manage/development`, `/manage/reports` have the same `.limit(1)` bug. The sidebar's `MANAGER_NAV_GROUP` has hardcoded absolute hrefs (`/manage/assign`, etc.) with no team context.

---

## File Map

### New files
| File | Responsibility |
|------|---------------|
| `app/manage/[orgSlug]/layout.tsx` | Validates manager access to org, fetches all managed teams, renders sidebar + breadcrumb |
| `app/manage/[orgSlug]/page.tsx` | Per-team manage overview (roster stats, quick actions) |
| `app/manage/[orgSlug]/assign/page.tsx` | Assign members scoped to this org |
| `app/manage/[orgSlug]/divisions/page.tsx` | Edit divisions scoped to this org |
| `app/manage/[orgSlug]/captains/page.tsx` | Edit captains scoped to this org |
| `app/manage/[orgSlug]/finances/page.tsx` | Finances scoped to this org (fix limit(1)) |
| `app/manage/[orgSlug]/sponsors/page.tsx` | Sponsors scoped to this org (fix limit(1)) |
| `app/manage/[orgSlug]/sponsors/[id]/page.tsx` | Sponsor detail scoped to this org (fix limit(1)) |
| `app/manage/[orgSlug]/content/page.tsx` | Content calendar scoped to this org (fix limit(1)) |
| `app/manage/[orgSlug]/development/page.tsx` | Player dev scoped to this org (fix limit(1)) |
| `app/manage/[orgSlug]/salaries/page.tsx` | Salaries scoped to this org (fix limit(1)) |
| `app/manage/[orgSlug]/reports/page.tsx` | Reports scoped to this org (fix limit(1)) |
| `app/manage/calendar/page.tsx` | Cross-team aggregated calendar/agenda view |
| `components/layout/TeamSwitcher.tsx` | Dropdown component for switching between managed teams |

### Modified files
| File | Change |
|------|--------|
| `app/manage/layout.tsx` | Strip to auth-only shell (remove sidebar, remove limit(1) query) |
| `app/manage/page.tsx` | Redirect to first managed team's slug |
| `components/layout/WorkspaceSidebar.tsx` | Add `managedTeams` prop, `getManagerNavGroup(orgSlug)` function, render TeamSwitcher |
| `components/layout/ManageBreadcrumb.tsx` | Update `ROUTE_LABELS` to match new dynamic slugged paths |
| `app/[team-slug]/(workspace)/layout.tsx` | Fetch `managedTeams` for manager users, pass to sidebar |
| `features/content/actions.ts` | Fix hardcoded `revalidatePath("/manage/content")` |
| `features/sponsors/actions.ts` | Fix hardcoded `revalidatePath("/manage/sponsors")` |
| `features/tournaments/actions.ts` | Fix hardcoded `/manage/finances` and `/manage/salaries` revalidation |

---

## Task 1: Strip outer `/manage` layout and redirect page

**Goal:** Remove the broken `limit(1)` and sidebar from the outer layout so it doesn't conflict with the new nested `[orgSlug]` layout. `/manage` redirects to the manager's first team.

**Files:**
- Modify: `app/manage/layout.tsx`
- Modify: `app/manage/page.tsx`

- [ ] **Step 1.1: Write test for redirect logic**

Create `__tests__/manage-redirect.test.ts` (vitest). We test the pure function that picks the first org slug from a list.

```typescript
// __tests__/manage-redirect.test.ts
import { describe, it, expect } from "vitest";

function pickFirstSlug(
  orgs: Array<{ id: string; slug: string }>
): string | null {
  return orgs[0]?.slug ?? null;
}

describe("pickFirstSlug", () => {
  it("returns null when no orgs", () => {
    expect(pickFirstSlug([])).toBeNull();
  });
  it("returns first org slug", () => {
    expect(
      pickFirstSlug([
        { id: "a", slug: "rrq" },
        { id: "b", slug: "evos" },
      ])
    ).toBe("rrq");
  });
});
```

- [ ] **Step 1.2: Run test to verify it fails (function not yet exported)**

```bash
npx vitest run __tests__/manage-redirect.test.ts
```
Expected: PASS (pure function defined inline in test — no import needed yet)

- [ ] **Step 1.3: Rewrite `app/manage/layout.tsx` to auth-only shell**

```tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const ManageLayout = async ({ children }: { children: React.ReactNode }) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/manage");

  const ownerEmail = process.env.OWNER_EMAIL;
  const isOwner = Boolean(ownerEmail && user.email === ownerEmail);
  if (isOwner) redirect("/dashboard");

  return <>{children}</>;
};
export default ManageLayout;
```

- [ ] **Step 1.4: Rewrite `app/manage/page.tsx` to redirect to first team**

```tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const ManagePage = async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/manage");

  const admin = createAdminClient();
  const { data: memberships } = await admin
    .from("team_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .eq("role", "manager")
    .eq("is_active", true)
    .limit(20);

  const orgIds = [
    ...new Set((memberships ?? []).map((m) => m.organization_id)),
  ];

  if (orgIds.length === 0) redirect("/");

  const { data: firstOrg } = await admin
    .from("organizations")
    .select("slug")
    .eq("id", orgIds[0])
    .maybeSingle();

  redirect(`/manage/${firstOrg?.slug ?? "/"}`);
};
export default ManagePage;
```

- [ ] **Step 1.5: Verify build types pass**

```bash
npx tsc --noEmit
```
Expected: exit 0

- [ ] **Step 1.6: Commit**

```bash
rtk git add app/manage/layout.tsx app/manage/page.tsx __tests__/manage-redirect.test.ts
rtk git commit -m "refactor(manage): strip outer layout to auth shell, redirect to first team"
```

---

## Task 2: Create `TeamSwitcher` component

**Goal:** Dropdown component shown in the sidebar when a manager manages 2+ teams. Navigates to `/manage/[slug]` when a team is selected.

**Files:**
- Create: `components/layout/TeamSwitcher.tsx`
- Create: `__tests__/TeamSwitcher.test.tsx`

- [ ] **Step 2.1: Write failing tests**

```tsx
// __tests__/TeamSwitcher.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TeamSwitcher } from "@/components/layout/TeamSwitcher";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/manage/rrq",
}));

const teams = [
  { id: "1", slug: "rrq", name: "RRQ Hoshi", logoUrl: null },
  { id: "2", slug: "evos", name: "EVOS Pride", logoUrl: null },
];

describe("TeamSwitcher", () => {
  it("renders current team name", () => {
    render(<TeamSwitcher teams={teams} currentSlug="rrq" />);
    expect(screen.getByText("RRQ Hoshi")).toBeInTheDocument();
  });

  it("shows chevron toggle button", () => {
    render(<TeamSwitcher teams={teams} currentSlug="rrq" />);
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
  });

  it("opens dropdown on click and shows all teams", () => {
    render(<TeamSwitcher teams={teams} currentSlug="rrq" />);
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText("RRQ Hoshi")).toBeInTheDocument();
    expect(screen.getByText("EVOS Pride")).toBeInTheDocument();
  });

  it("renders nothing when only 1 team", () => {
    const { container } = render(
      <TeamSwitcher teams={[teams[0]]} currentSlug="rrq" />
    );
    expect(container.firstChild).toBeNull();
  });
});
```

- [ ] **Step 2.2: Run tests to verify they fail**

```bash
npx vitest run __tests__/TeamSwitcher.test.tsx
```
Expected: FAIL — "Cannot find module '@/components/layout/TeamSwitcher'"

- [ ] **Step 2.3: Implement `TeamSwitcher`**

```tsx
// components/layout/TeamSwitcher.tsx
"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

interface ManagedTeam {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
}

interface TeamSwitcherProps {
  teams: ManagedTeam[];
  currentSlug: string;
}

const TeamSwitcher = ({ teams, currentSlug }: TeamSwitcherProps) => {
  const [open, setOpen] = useState(false);

  if (teams.length <= 1) return null;

  const current = teams.find((t) => t.slug === currentSlug) ?? teams[0];

  return (
    <div className="relative px-3 pt-3">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded px-3 py-2 text-left text-sm text-[#9B9A97] transition hover:bg-[#2C2C2C]"
      >
        <div className="flex min-w-0 items-center gap-2">
          {current.logoUrl ? (
            <Image
              src={current.logoUrl}
              alt={current.name}
              width={16}
              height={16}
              className="h-4 w-4 rounded object-cover"
            />
          ) : (
            <div className="grid h-4 w-4 shrink-0 place-items-center rounded bg-[#353434] text-[9px] font-bold text-[#D4D4D4]">
              {current.name.slice(0, 1).toUpperCase()}
            </div>
          )}
          <span className="truncate text-[#D4D4D4]">{current.name}</span>
        </div>
        <ChevronDown
          className={`h-4 w-4 shrink-0 transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <ul className="absolute left-3 right-3 z-50 mt-1 rounded border border-[#2D2D2D] bg-[#202020] p-1 text-sm shadow-lg">
          {teams.map((team) => (
            <li key={team.id}>
              <Link
                href={`/manage/${team.slug}`}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-2 rounded px-3 py-1.5 transition hover:bg-[#2C2C2C] ${
                  team.slug === currentSlug
                    ? "bg-[#2C2C2C] text-[#D4D4D4]"
                    : "text-[#9B9A97] hover:text-[#D4D4D4]"
                }`}
              >
                {team.logoUrl ? (
                  <Image
                    src={team.logoUrl}
                    alt={team.name}
                    width={14}
                    height={14}
                    className="h-3.5 w-3.5 rounded object-cover"
                  />
                ) : (
                  <div className="grid h-3.5 w-3.5 shrink-0 place-items-center rounded bg-[#353434] text-[8px] font-bold text-[#D4D4D4]">
                    {team.name.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <span className="truncate">{team.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
export { TeamSwitcher };
```

- [ ] **Step 2.4: Run tests to verify they pass**

```bash
npx vitest run __tests__/TeamSwitcher.test.tsx
```
Expected: 4 passed

- [ ] **Step 2.5: Commit**

```bash
rtk git add components/layout/TeamSwitcher.tsx __tests__/TeamSwitcher.test.tsx
rtk git commit -m "feat(manage): add TeamSwitcher dropdown component"
```

---

## Task 3: Update `WorkspaceSidebar` — managedTeams + dynamic manager nav

**Goal:** Add `managedTeams?: ManagedTeam[]` prop to sidebar. Convert `MANAGER_NAV_GROUP` constant into a `getManagerNavGroup(orgSlug)` function so links point to `/manage/[orgSlug]/...`. Render `TeamSwitcher` above the division switcher when `managedTeams` is present.

**Files:**
- Modify: `components/layout/WorkspaceSidebar.tsx`
- Create: `__tests__/WorkspaceSidebar.manager-nav.test.ts`

- [ ] **Step 3.1: Write tests for `getManagerNavGroup`**

```typescript
// __tests__/WorkspaceSidebar.manager-nav.test.ts
import { describe, it, expect } from "vitest";

interface NavItem {
  key: string;
  href: string;
  absoluteHref?: string;
  label: string;
  exactMatch?: boolean;
}

function getManagerNavGroup(orgSlug: string) {
  return {
    label: "MANAGER PANEL",
    items: [
      {
        key: "manage-overview",
        href: "",
        absoluteHref: `/manage/${orgSlug}`,
        label: "Overview",
        exactMatch: true,
      },
      {
        key: "manage-assign",
        href: "",
        absoluteHref: `/manage/${orgSlug}/assign`,
        label: "Tambah Member",
      },
      {
        key: "manage-finances",
        href: "",
        absoluteHref: `/manage/${orgSlug}/finances`,
        label: "Kas Tim",
      },
    ],
  };
}

describe("getManagerNavGroup", () => {
  it("uses orgSlug in overview href", () => {
    const group = getManagerNavGroup("rrq-hoshi");
    const overview = group.items.find((i: NavItem) => i.key === "manage-overview");
    expect(overview?.absoluteHref).toBe("/manage/rrq-hoshi");
  });

  it("uses orgSlug in assign href", () => {
    const group = getManagerNavGroup("evos");
    const assign = group.items.find((i: NavItem) => i.key === "manage-assign");
    expect(assign?.absoluteHref).toBe("/manage/evos/assign");
  });

  it("overview has exactMatch true", () => {
    const group = getManagerNavGroup("rrq");
    const overview = group.items.find((i: NavItem) => i.key === "manage-overview");
    expect(overview?.exactMatch).toBe(true);
  });
});
```

- [ ] **Step 3.2: Run tests — expect FAIL**

```bash
npx vitest run "__tests__/WorkspaceSidebar.manager-nav.test.ts"
```
Expected: FAIL — `getManagerNavGroup` not exported from sidebar yet

- [ ] **Step 3.3: Update `WorkspaceSidebar.tsx`**

Replace the `MANAGER_NAV_GROUP` constant with a function, add `managedTeams` prop, and render `TeamSwitcher`. Full diff:

**a) Add import at top:**
```tsx
import { TeamSwitcher } from "@/components/layout/TeamSwitcher";
```

**b) Add `ManagedTeam` interface and `managedTeams` prop:**
```tsx
interface ManagedTeam {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
}

export interface WorkspaceSidebarProps {
  orgSlug: string;
  orgId: string;
  orgName: string;
  orgLogoUrl: string | null;
  divisions: SidebarDivision[];
  managedTeams?: ManagedTeam[];   // ← new optional prop
  user: {
    displayName: string;
    avatarUrl: string | null;
    userId: string;
    email?: string;
    role?: string;
  };
}
```

**c) Replace `MANAGER_NAV_GROUP` constant with function:**
```tsx
const getManagerNavGroup = (orgSlug: string): NavGroup => ({
  label: "MANAGER PANEL",
  items: [
    {
      key: "manage-overview",
      href: "",
      absoluteHref: `/manage/${orgSlug}`,
      label: "Overview",
      Icon: LayoutDashboard,
      exactMatch: true,
    },
    {
      key: "manage-assign",
      href: "",
      absoluteHref: `/manage/${orgSlug}/assign`,
      label: "Tambah Member",
      Icon: UserPlus,
    },
    {
      key: "manage-divisions",
      href: "",
      absoluteHref: `/manage/${orgSlug}/divisions`,
      label: "Edit Divisi",
      Icon: Tags,
    },
    {
      key: "manage-captains",
      href: "",
      absoluteHref: `/manage/${orgSlug}/captains`,
      label: "Edit Captain",
      Icon: Shield,
    },
    {
      key: "manage-finances",
      href: "",
      absoluteHref: `/manage/${orgSlug}/finances`,
      label: "Kas Tim",
      Icon: DollarSign,
    },
    {
      key: "manage-sponsors",
      href: "",
      absoluteHref: `/manage/${orgSlug}/sponsors`,
      label: "Sponsor",
      Icon: Handshake,
    },
    {
      key: "manage-content",
      href: "",
      absoluteHref: `/manage/${orgSlug}/content`,
      label: "Konten",
      Icon: CalendarClock,
    },
    {
      key: "manage-development",
      href: "",
      absoluteHref: `/manage/${orgSlug}/development`,
      label: "Player Dev",
      Icon: TrendingUp,
    },
    {
      key: "manage-salaries",
      href: "",
      absoluteHref: `/manage/${orgSlug}/salaries`,
      label: "Salary Player",
      Icon: Banknote,
    },
    {
      key: "manage-reports",
      href: "",
      absoluteHref: `/manage/${orgSlug}/reports`,
      label: "Laporan",
      Icon: BarChart3,
    },
  ],
});
```

**d) Update component signature to accept `managedTeams`:**
```tsx
const WorkspaceSidebar = ({
  orgSlug,
  orgId,
  orgName,
  orgLogoUrl,
  divisions,
  managedTeams,
  user,
}: WorkspaceSidebarProps) => {
```

**e) Update `allGroups` to use function:**
```tsx
const allGroups: NavGroup[] = (isManager
  ? [getManagerNavGroup(orgSlug), ...WORKSPACE_NAV_GROUPS]
  : WORKSPACE_NAV_GROUPS)
  .map((group) => ({
    ...group,
    items: group.items.filter((item) => {
      if (item.key === "files") return hasFilesAccess;
      if (item.key === "scouting") return hasScoutingAccess;
      if (item.key === "trials") return hasTrialsAccess;
      return true;
    }),
  }));
```

**f) In the JSX, add `TeamSwitcher` before the division switcher, inside the `<aside>` after the org header `<div>`:**
```tsx
{/* Team switcher — only for managers with multiple teams */}
{managedTeams && managedTeams.length > 1 && (
  <TeamSwitcher teams={managedTeams} currentSlug={orgSlug} />
)}

{/* Division switcher */}
{divisions.length > 1 && (
  // ... existing division switcher code unchanged
)}
```

- [ ] **Step 3.4: Export `getManagerNavGroup` from the file for testing**

Add at bottom of `WorkspaceSidebar.tsx` (after the component export):
```tsx
export { WorkspaceSidebar, getManagerNavGroup };
```

Update the test import:
```typescript
// __tests__/WorkspaceSidebar.manager-nav.test.ts
import { getManagerNavGroup } from "@/components/layout/WorkspaceSidebar";

describe("getManagerNavGroup", () => {
  it("uses orgSlug in overview href", () => {
    const group = getManagerNavGroup("rrq-hoshi");
    const overview = group.items.find((i) => i.key === "manage-overview");
    expect(overview?.absoluteHref).toBe("/manage/rrq-hoshi");
  });

  it("uses orgSlug in assign href", () => {
    const group = getManagerNavGroup("evos");
    const assign = group.items.find((i) => i.key === "manage-assign");
    expect(assign?.absoluteHref).toBe("/manage/evos/assign");
  });

  it("overview has exactMatch true", () => {
    const group = getManagerNavGroup("rrq");
    const overview = group.items.find((i) => i.key === "manage-overview");
    expect(overview?.exactMatch).toBe(true);
  });
});
```

- [ ] **Step 3.5: Run tests to verify they pass**

```bash
npx vitest run "__tests__/WorkspaceSidebar.manager-nav.test.ts"
```
Expected: 3 passed

- [ ] **Step 3.6: Run full typecheck**

```bash
npx tsc --noEmit
```
Expected: exit 0

- [ ] **Step 3.7: Commit**

```bash
rtk git add components/layout/WorkspaceSidebar.tsx __tests__/WorkspaceSidebar.manager-nav.test.ts
rtk git commit -m "feat(manage): dynamic manager nav links + TeamSwitcher in sidebar"
```

---

## Task 4: Create `/manage/[orgSlug]/layout.tsx`

**Goal:** New inner layout that reads `orgSlug` from URL params, validates the manager actually has access to that org, fetches all managed teams for the switcher, and renders the full sidebar + breadcrumb.

**Files:**
- Create: `app/manage/[orgSlug]/layout.tsx`

- [ ] **Step 4.1: Create the layout**

```tsx
// app/manage/[orgSlug]/layout.tsx
import { notFound, redirect } from "next/navigation";

import { WorkspaceSidebar } from "@/components/layout/WorkspaceSidebar";
import { ManageBreadcrumb } from "@/components/layout/ManageBreadcrumb";
import { NotifyProvider } from "@/features/dashboard/components/NotifyModal";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

interface ManageTeamLayoutProps {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string }>;
}

const ManageTeamLayout = async ({ children, params }: ManageTeamLayoutProps) => {
  const { orgSlug } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/manage/${orgSlug}`);

  const ownerEmail = process.env.OWNER_EMAIL;
  const isOwner = Boolean(ownerEmail && user.email === ownerEmail);
  if (isOwner) redirect("/dashboard");

  const admin = createAdminClient();

  // Get ALL orgs this manager manages — used for team switcher + access check
  const { data: allMemberships } = await admin
    .from("team_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .eq("role", "manager")
    .eq("is_active", true)
    .limit(20);

  const allOrgIds = [
    ...new Set((allMemberships ?? []).map((m) => m.organization_id)),
  ];

  if (allOrgIds.length === 0) redirect("/");

  // Get target org by slug
  const { data: org } = await admin
    .from("organizations")
    .select("id, slug, name, logo_url")
    .eq("slug", orgSlug)
    .maybeSingle();

  if (!org) notFound();

  // Validate manager has access to this org
  if (!allOrgIds.includes(org.id)) redirect("/manage");

  // Parallel: all managed orgs details + divisions for this org + user profile
  const [allOrgsRes, divsRes, profileRes] = await Promise.all([
    admin
      .from("organizations")
      .select("id, slug, name, logo_url")
      .in("id", allOrgIds),
    admin
      .from("divisions")
      .select("id, name")
      .eq("organization_id", org.id)
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("profiles")
      .select("display_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  const managedTeams = (allOrgsRes.data ?? []).map((o) => ({
    id: o.id,
    slug: o.slug,
    name: o.name,
    logoUrl: o.logo_url,
  }));

  const divisions = (divsRes.data ?? []).map((d) => ({
    id: d.id,
    name: d.name,
  }));

  const profile = profileRes.data;
  const displayName =
    profile?.display_name ??
    (user.user_metadata?.["display_name"] as string | undefined) ??
    user.email ??
    "Akun saya";

  return (
    <NotifyProvider>
      <div className="flex min-h-screen bg-[#191919] text-[#E5E2E1]">
        <WorkspaceSidebar
          orgSlug={org.slug}
          orgId={org.id}
          orgName={org.name}
          orgLogoUrl={org.logo_url}
          divisions={divisions}
          managedTeams={managedTeams}
          user={{
            displayName,
            avatarUrl: profile?.avatar_url ?? null,
            userId: user.id,
            email: user.email ?? undefined,
            role: "manager",
          }}
        />
        <div className="flex min-h-screen flex-1 flex-col">
          <ManageBreadcrumb
            orgName={org.name}
            orgSlug={org.slug}
            userId={user.id}
          />
          <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-10">
            {children}
          </main>
        </div>
      </div>
    </NotifyProvider>
  );
};
export default ManageTeamLayout;
```

- [ ] **Step 4.2: Typecheck**

```bash
npx tsc --noEmit
```
Expected: exit 0

- [ ] **Step 4.3: Commit**

```bash
rtk git add "app/manage/[orgSlug]/layout.tsx"
rtk git commit -m "feat(manage): add /manage/[orgSlug]/layout with team validation"
```

---

## Task 5: Update `ManageBreadcrumb` for dynamic slugged routes

**Goal:** `ROUTE_LABELS` uses static paths like `/manage/assign`. After the migration, active path will be `/manage/rrq/assign`. Update the matching logic to strip the slug segment.

**Files:**
- Modify: `components/layout/ManageBreadcrumb.tsx`

- [ ] **Step 5.1: Write test**

```typescript
// __tests__/ManageBreadcrumb.labels.test.ts
import { describe, it, expect } from "vitest";

const SUB_ROUTE_LABELS: Record<string, string> = {
  "": "Overview",
  "/assign": "Tambah Member",
  "/divisions": "Edit Divisi",
  "/captains": "Edit Captain",
  "/finances": "Kas Tim",
  "/sponsors": "Sponsor",
  "/content": "Konten",
  "/development": "Player Dev",
  "/salaries": "Salary Player",
  "/reports": "Laporan",
};

function getManageLabel(pathname: string): string {
  // pathname = /manage/[orgSlug]/assign  OR  /manage/[orgSlug]
  const match = pathname.match(/^\/manage\/[^/]+(\/.*)?$/);
  if (!match) return "Manager Panel";
  const sub = match[1] ?? "";
  // strip any deeper segments (e.g. /sponsors/123 → /sponsors)
  const topSub = sub.replace(/^(\/[^/]+).*$/, "$1");
  return SUB_ROUTE_LABELS[topSub] ?? "Manager Panel";
}

describe("getManageLabel", () => {
  it("overview", () => {
    expect(getManageLabel("/manage/rrq")).toBe("Overview");
  });
  it("assign sub-route", () => {
    expect(getManageLabel("/manage/rrq/assign")).toBe("Tambah Member");
  });
  it("sponsors detail", () => {
    expect(getManageLabel("/manage/rrq/sponsors/abc-123")).toBe("Sponsor");
  });
  it("unknown route", () => {
    expect(getManageLabel("/manage/rrq/unknown")).toBe("Manager Panel");
  });
});
```

- [ ] **Step 5.2: Run tests — expect FAIL**

```bash
npx vitest run "__tests__/ManageBreadcrumb.labels.test.ts"
```
Expected: FAIL — `getManageLabel` not imported yet (defined inline in test for now)

- [ ] **Step 5.3: Run tests — they should pass (logic is inline)**

The test defines `getManageLabel` inline, so it should pass immediately. This confirms the logic is correct before we put it in the component.

```bash
npx vitest run "__tests__/ManageBreadcrumb.labels.test.ts"
```
Expected: 4 passed

- [ ] **Step 5.4: Update `ManageBreadcrumb.tsx`**

Replace the `ROUTE_LABELS` static map with the dynamic `getManageLabel` function:

```tsx
"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

import { NotificationBell } from "@/features/notifications/components/NotificationBell";

interface ManageBreadcrumbProps {
  orgName: string;
  orgSlug: string;
  userId: string;
}

const SUB_ROUTE_LABELS: Record<string, string> = {
  "": "Overview",
  "/assign": "Tambah Member",
  "/divisions": "Edit Divisi",
  "/captains": "Edit Captain",
  "/finances": "Kas Tim",
  "/sponsors": "Sponsor",
  "/content": "Konten",
  "/development": "Player Dev",
  "/salaries": "Salary Player",
  "/reports": "Laporan",
};

function getManageLabel(pathname: string): string {
  const match = pathname.match(/^\/manage\/[^/]+(\/.*)?$/);
  if (!match) return "Manager Panel";
  const sub = match[1] ?? "";
  const topSub = sub.replace(/^(\/[^/]+).*$/, "$1");
  return SUB_ROUTE_LABELS[topSub] ?? "Manager Panel";
}

const ManageBreadcrumb = ({ orgName, orgSlug, userId }: ManageBreadcrumbProps) => {
  const pathname = usePathname();
  const activeLabel = getManageLabel(pathname ?? "");

  return (
    <header className="sticky top-0 z-40 flex h-12 items-center justify-between border-b border-[#2D2D2D] bg-[#191919] px-6">
      <div className="flex items-center gap-2 text-sm text-[#9B9A97]">
        <Link
          href={`/${orgSlug}`}
          className="hover:text-[#D4D4D4] font-medium transition"
        >
          {orgName}
        </Link>
        <span className="text-[#6B6A68]">/</span>
        <span className="text-white font-medium">{activeLabel}</span>
      </div>
      <NotificationBell userId={userId} orgSlug={orgSlug} />
    </header>
  );
};
export { ManageBreadcrumb };
```

- [ ] **Step 5.5: Typecheck**

```bash
npx tsc --noEmit
```
Expected: exit 0

- [ ] **Step 5.6: Commit**

```bash
rtk git add components/layout/ManageBreadcrumb.tsx __tests__/ManageBreadcrumb.labels.test.ts
rtk git commit -m "fix(manage): breadcrumb labels work for /manage/[orgSlug]/... routes"
```

---

## Task 6: Create `/manage/[orgSlug]` sub-pages (Pattern A — already multi-team)

**Goal:** Move `assign`, `divisions`, `captains`, and overview to `[orgSlug]` context. These pages currently query ALL orgs — simplify them to query only the org from the URL (already validated in layout).

**Files:**
- Create: `app/manage/[orgSlug]/page.tsx`
- Create: `app/manage/[orgSlug]/assign/page.tsx`
- Create: `app/manage/[orgSlug]/divisions/page.tsx`
- Create: `app/manage/[orgSlug]/captains/page.tsx`

> Note: `params.orgSlug` is already validated by the layout — no need to re-check membership here.

- [ ] **Step 6.1: Create `app/manage/[orgSlug]/page.tsx`** (per-team overview)

```tsx
import { UserPlus } from "lucide-react";
import Link from "next/link";

import { createAdminClient } from "@/lib/supabase/admin";
import { ManageMemberTable } from "@/features/dashboard/components/ManageMemberTable";
import { InviteSection } from "@/features/manage/components/InviteSection";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ orgSlug: string }>;
}

const ManageTeamPage = async ({ params }: Props) => {
  const { orgSlug } = await params;
  const admin = createAdminClient();

  const { data: org } = await admin
    .from("organizations")
    .select("id, name, slug")
    .eq("slug", orgSlug)
    .maybeSingle();

  if (!org) return null;

  const [membersRes, divsRes, invitesRes, totalRes] = await Promise.all([
    admin
      .from("team_members")
      .select("id, user_id, organization_id, division_id, role, is_active, availability, main_role")
      .eq("organization_id", org.id)
      .eq("is_active", true)
      .order("role", { ascending: true })
      .limit(100),
    admin
      .from("divisions")
      .select("id, name")
      .eq("organization_id", org.id)
      .eq("is_active", true)
      .order("name"),
    admin
      .from("organization_invites")
      .select("id, organization_id, division_id, role, expires_at, created_at")
      .eq("organization_id", org.id)
      .eq("status", "pending")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(50),
    admin.from("profiles").select("id", { count: "exact", head: true }),
  ]);

  const members = membersRes.data ?? [];
  const divisions = divsRes.data ?? [];
  const invites = invitesRes.data ?? [];

  const memberUserIds = [...new Set(members.map((m) => m.user_id))];
  const { data: profiles } = memberUserIds.length > 0
    ? await admin
        .from("profiles")
        .select("id, full_name, username, display_name, phone_wa, date_of_birth, bio, social_links, game_ids")
        .in("id", memberUserIds)
    : { data: [] };

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
  const divisionMap = new Map(divisions.map((d) => [d.id, d]));

  const ROLE_ORDER: Record<string, number> = {
    owner: 0, manager: 1, coach: 2, captain: 3, member: 4,
  };

  const sortedMembers = [...members].sort((a, b) => {
    const roleA = ROLE_ORDER[a.role] ?? 99;
    const roleB = ROLE_ORDER[b.role] ?? 99;
    if (roleA !== roleB) return roleA - roleB;
    const pA = profileMap.get(a.user_id);
    const pB = profileMap.get(b.user_id);
    const nameA = (pA?.full_name ?? pA?.display_name ?? "").toLowerCase();
    const nameB = (pB?.full_name ?? pB?.display_name ?? "").toLowerCase();
    return nameA.localeCompare(nameB);
  });

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-white">Manager Panel</h1>
        <p className="mt-1 text-sm text-white/60">
          Kelola roster tim, assign Captain dan Member, lihat statistik.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Member" value={members.length} />
        <StatCard label="Divisi Aktif" value={divisions.length} />
        <StatCard label="User Terdaftar" value={totalRes.count ?? 0} />
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href={`/manage/${orgSlug}/assign`}
          className="inline-flex h-10 items-center gap-2 rounded-md bg-yellow-400 px-4 text-sm font-semibold text-black transition hover:bg-yellow-300"
        >
          <UserPlus className="h-4 w-4" />
          Tambah Member
        </Link>
        <Link
          href={`/manage/${orgSlug}/divisions`}
          className="inline-flex h-10 items-center gap-2 rounded-md bg-white/5 px-4 text-sm font-medium text-white transition hover:bg-white/10"
        >
          Edit Divisi
        </Link>
        <Link
          href={`/manage/${orgSlug}/captains`}
          className="inline-flex h-10 items-center gap-2 rounded-md bg-white/5 px-4 text-sm font-medium text-white transition hover:bg-white/10"
        >
          Edit Captain
        </Link>
      </div>

      <InviteSection
        orgId={org.id}
        orgSlug={org.slug}
        divisions={divisions}
        pendingInvites={invites.map((inv) => ({
          id: inv.id,
          role: inv.role,
          division: inv.division_id
            ? divisions.find((d) => d.id === inv.division_id)?.name ?? null
            : null,
          expiresAt: inv.expires_at,
          createdAt: inv.created_at,
        }))}
      />

      <ManageMemberTable
        orgName={org.name}
        members={sortedMembers.map((m) => {
          const p = profileMap.get(m.user_id);
          const div = m.division_id ? divisionMap.get(m.division_id) : null;
          return {
            id: m.id,
            userId: m.user_id,
            fullName: p?.full_name ?? p?.display_name ?? null,
            username: p?.username ?? null,
            email: null,
            phoneWa: p?.phone_wa ?? null,
            dateOfBirth: (p as { date_of_birth?: string } | undefined)?.date_of_birth ?? null,
            bio: (p as { bio?: string } | undefined)?.bio ?? null,
            socialLinks: (p as { social_links?: Record<string, string> } | undefined)?.social_links ?? null,
            gameIds: (p as { game_ids?: Record<string, string> } | undefined)?.game_ids ?? null,
            role: m.role,
            division: div?.name ?? null,
            orgName: org.name,
            orgSlug: org.slug,
            availability: m.availability ?? "active",
            mainRole: (m as { main_role?: string | null }).main_role ?? null,
          };
        })}
      />
    </div>
  );
};
export default ManageTeamPage;

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
      <p className="text-xs text-white/50">{label}</p>
      <p className="mt-1 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}
```

- [ ] **Step 6.2: Create `app/manage/[orgSlug]/assign/page.tsx`**

```tsx
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ManagerAssignForm } from "@/features/dashboard/components/ManagerAssignForm";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ orgSlug: string }>;
}

const ManageAssignPage = async ({ params }: Props) => {
  const { orgSlug } = await params;
  const admin = createAdminClient();

  const { data: org } = await admin
    .from("organizations")
    .select("id, name, slug")
    .eq("slug", orgSlug)
    .maybeSingle();

  if (!org) return null;

  const ownerEmail = process.env.OWNER_EMAIL;

  const [profilesRes, divsRes, captainsRes] = await Promise.all([
    admin
      .from("profiles")
      .select("id, full_name, username, display_name, email")
      .order("full_name", { ascending: true })
      .limit(500),
    admin
      .from("divisions")
      .select("id, name")
      .eq("organization_id", org.id)
      .eq("is_active", true)
      .order("name"),
    admin
      .from("team_members")
      .select("organization_id")
      .eq("organization_id", org.id)
      .eq("role", "captain")
      .eq("is_active", true)
      .limit(1),
  ]);

  const filteredProfiles = (profilesRes.data ?? []).filter(
    (p) => p.email !== ownerEmail
  );

  const orgHasCaptain: Record<string, boolean> = {};
  if ((captainsRes.data ?? []).length > 0) {
    orgHasCaptain[org.id] = true;
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-white">Tambah Member</h1>
        <p className="mt-1 text-sm text-white/60">
          Assign user sebagai Captain atau Member di {org.name}.
        </p>
      </header>

      <div className="max-w-2xl rounded-2xl border border-white/10 bg-zinc-900/40 p-5 sm:p-6">
        <ManagerAssignForm
          users={filteredProfiles.map((p) => ({
            id: p.id,
            label: p.full_name ?? p.display_name ?? p.username ?? p.id,
          }))}
          organizations={[{ id: org.id, name: org.name, slug: org.slug }]}
          divisions={(divsRes.data ?? []).map((d) => ({
            id: d.id,
            organizationId: org.id,
            name: d.name,
          }))}
          orgHasCaptain={orgHasCaptain}
        />
      </div>
    </div>
  );
};
export default ManageAssignPage;
```

- [ ] **Step 6.3: Create `app/manage/[orgSlug]/divisions/page.tsx`**

```tsx
import { createAdminClient } from "@/lib/supabase/admin";
import { ManagerDivisionList } from "@/features/dashboard/components/ManagerDivisionList";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ orgSlug: string }>;
}

const ManageDivisionsPage = async ({ params }: Props) => {
  const { orgSlug } = await params;
  const admin = createAdminClient();

  const { data: org } = await admin
    .from("organizations")
    .select("id")
    .eq("slug", orgSlug)
    .maybeSingle();

  if (!org) return null;

  const [divsRes, membersRes] = await Promise.all([
    admin
      .from("divisions")
      .select("id, name, organization_id, is_active")
      .eq("organization_id", org.id)
      .order("name", { ascending: true }),
    admin
      .from("team_members")
      .select("division_id")
      .eq("organization_id", org.id)
      .eq("is_active", true)
      .limit(200),
  ]);

  const divMemberCount = new Map<string, number>();
  for (const m of membersRes.data ?? []) {
    if (m.division_id) {
      divMemberCount.set(m.division_id, (divMemberCount.get(m.division_id) ?? 0) + 1);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-white">Edit Divisi</h1>
        <p className="mt-1 text-sm text-white/60">
          Lihat divisi dan jumlah member di masing-masing divisi.
        </p>
      </header>

      <ManagerDivisionList
        divisions={(divsRes.data ?? []).map((d) => ({
          id: d.id,
          name: d.name,
          isActive: d.is_active,
          memberCount: divMemberCount.get(d.id) ?? 0,
        }))}
      />
    </div>
  );
};
export default ManageDivisionsPage;
```

- [ ] **Step 6.4: Create `app/manage/[orgSlug]/captains/page.tsx`**

```tsx
import { createAdminClient } from "@/lib/supabase/admin";
import { CaptainList } from "@/features/dashboard/components/CaptainList";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ orgSlug: string }>;
}

const ManageCaptainsPage = async ({ params }: Props) => {
  const { orgSlug } = await params;
  const admin = createAdminClient();

  const { data: org } = await admin
    .from("organizations")
    .select("id")
    .eq("slug", orgSlug)
    .maybeSingle();

  if (!org) return null;

  const [captainsRes, divsRes] = await Promise.all([
    admin
      .from("team_members")
      .select("id, user_id, division_id, role")
      .eq("organization_id", org.id)
      .eq("role", "captain")
      .eq("is_active", true)
      .limit(50),
    admin
      .from("divisions")
      .select("id, name")
      .eq("organization_id", org.id)
      .eq("is_active", true),
  ]);

  const captains = captainsRes.data ?? [];
  const captainUserIds = [...new Set(captains.map((c) => c.user_id))];
  const { data: profiles } = captainUserIds.length > 0
    ? await admin
        .from("profiles")
        .select("id, full_name, username, display_name")
        .in("id", captainUserIds)
    : { data: [] };

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
  const divisionMap = new Map((divsRes.data ?? []).map((d) => [d.id, d]));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-white">Edit Captain</h1>
        <p className="mt-1 text-sm text-white/60">
          Lihat dan kelola captain di tim kamu.
        </p>
      </header>

      <CaptainList
        captains={captains.map((c) => {
          const p = profileMap.get(c.user_id);
          const div = c.division_id ? divisionMap.get(c.division_id) : null;
          return {
            memberId: c.id,
            name: p?.full_name ?? p?.display_name ?? p?.username ?? "—",
            division: div?.name ?? "—",
          };
        })}
      />
    </div>
  );
};
export default ManageCaptainsPage;
```

- [ ] **Step 6.5: Typecheck**

```bash
npx tsc --noEmit
```
Expected: exit 0

- [ ] **Step 6.6: Commit**

```bash
rtk git add "app/manage/[orgSlug]/page.tsx" "app/manage/[orgSlug]/assign/page.tsx" "app/manage/[orgSlug]/divisions/page.tsx" "app/manage/[orgSlug]/captains/page.tsx"
rtk git commit -m "feat(manage): per-team overview, assign, divisions, captains pages"
```

---

## Task 7: Create `/manage/[orgSlug]` sub-pages (Pattern B — fix `limit(1)` bugs)

**Goal:** Move finances, sponsors, sponsors/[id], content, development, salaries, reports. Each currently has `.limit(1).maybeSingle()` — replace with orgId from URL params (already validated in layout).

**Files:**
- Create: `app/manage/[orgSlug]/finances/page.tsx`
- Create: `app/manage/[orgSlug]/sponsors/page.tsx`
- Create: `app/manage/[orgSlug]/sponsors/[id]/page.tsx`
- Create: `app/manage/[orgSlug]/content/page.tsx`
- Create: `app/manage/[orgSlug]/development/page.tsx`
- Create: `app/manage/[orgSlug]/salaries/page.tsx`
- Create: `app/manage/[orgSlug]/reports/page.tsx`

- [ ] **Step 7.1: Create `app/manage/[orgSlug]/finances/page.tsx`**

```tsx
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { listFinances, getFinanceSummary } from "@/features/finances/queries";
import { FinancePageClient } from "@/features/finances/components/FinancePageClient";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<{ year?: string; month?: string }>;
}

const ManageFinancesPage = async ({ params, searchParams }: Props) => {
  const { orgSlug } = await params;
  const sp = await searchParams;
  const now = new Date();
  const year = Number(sp.year ?? now.getFullYear());
  const month = Number(sp.month ?? now.getMonth() + 1);

  const admin = createAdminClient();
  const { data: org } = await admin
    .from("organizations")
    .select("id")
    .eq("slug", orgSlug)
    .maybeSingle();

  if (!org) redirect("/manage");

  const rows = await listFinances(org.id, year, month);
  const summary = await getFinanceSummary(org.id, year, month, rows);

  return (
    <div className="space-y-6">
      <FinancePageClient
        orgId={org.id}
        rows={rows}
        summary={summary}
        year={year}
        month={month}
        canDelete={true}
        revalidatePaths={[
          `/manage/${orgSlug}/finances`,
          "/dashboard/finances",
        ]}
      />
    </div>
  );
};
export default ManageFinancesPage;
```

- [ ] **Step 7.2: Create `app/manage/[orgSlug]/sponsors/page.tsx`**

```tsx
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSponsors } from "@/features/sponsors/queries";
import { SponsorListClient } from "@/features/sponsors/components/SponsorListClient";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ orgSlug: string }>;
}

const ManageSponsorsPage = async ({ params }: Props) => {
  const { orgSlug } = await params;
  const admin = createAdminClient();

  const { data: org } = await admin
    .from("organizations")
    .select("id, name")
    .eq("slug", orgSlug)
    .maybeSingle();

  if (!org) redirect("/manage");

  const sponsors = await getSponsors([org.id]);

  return (
    <SponsorListClient
      sponsors={sponsors}
      orgId={org.id}
      orgName={org.name}
      detailBasePath={`/manage/${orgSlug}/sponsors`}
    />
  );
};
export default ManageSponsorsPage;
```

- [ ] **Step 7.3: Create `app/manage/[orgSlug]/sponsors/[id]/page.tsx`**

```tsx
import { redirect, notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSponsorDetail } from "@/features/sponsors/queries";
import { SponsorDetailClient } from "@/features/sponsors/components/SponsorDetailClient";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ orgSlug: string; id: string }>;
}

const ManageSponsorDetailPage = async ({ params }: Props) => {
  const { orgSlug, id } = await params;
  const admin = createAdminClient();

  const { data: org } = await admin
    .from("organizations")
    .select("id")
    .eq("slug", orgSlug)
    .maybeSingle();

  if (!org) redirect("/manage");

  const sponsor = await getSponsorDetail(id);
  if (!sponsor) notFound();
  if (sponsor.organization_id !== org.id) notFound();

  return (
    <SponsorDetailClient
      sponsor={sponsor}
      orgId={org.id}
      backHref={`/manage/${orgSlug}/sponsors`}
      listHref={`/manage/${orgSlug}/sponsors`}
    />
  );
};
export default ManageSponsorDetailPage;
```

- [ ] **Step 7.4: Create `app/manage/[orgSlug]/content/page.tsx`**

```tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { listContent } from "@/features/content/queries";
import { ContentList } from "@/features/content/components/ContentList";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ orgSlug: string }>;
}

const ManageContentPage = async ({ params }: Props) => {
  const { orgSlug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/manage/${orgSlug}/content`);

  const admin = createAdminClient();
  const { data: org } = await admin
    .from("organizations")
    .select("id")
    .eq("slug", orgSlug)
    .maybeSingle();

  if (!org) redirect("/manage");

  const rows = await listContent(org.id);

  return (
    <div className="space-y-5">
      <ContentList
        rows={rows}
        orgId={org.id}
        currentUserId={user.id}
        isOwner={false}
        canCreate={true}
      />
    </div>
  );
};
export default ManageContentPage;
```

- [ ] **Step 7.5: Create `app/manage/[orgSlug]/development/page.tsx`**

```tsx
import { redirect } from "next/navigation";
import { TrendingUp } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { listPlayerTargets } from "@/features/player-development/queries";
import { PlayerDevelopmentClient } from "@/features/player-development/components/PlayerDevelopmentClient";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ orgSlug: string }>;
}

const ManagePlayerDevelopmentPage = async ({ params }: Props) => {
  const { orgSlug } = await params;
  const admin = createAdminClient();

  const { data: org } = await admin
    .from("organizations")
    .select("id")
    .eq("slug", orgSlug)
    .maybeSingle();

  if (!org) redirect("/manage");

  const [targets, membersRes] = await Promise.all([
    listPlayerTargets(org.id),
    admin
      .from("team_members")
      .select("user_id")
      .eq("organization_id", org.id)
      .eq("is_active", true)
      .limit(100),
  ]);

  const memberIds = (membersRes.data ?? []).map((m) => m.user_id);
  const { data: profiles } = memberIds.length > 0
    ? await admin
        .from("profiles")
        .select("id, display_name")
        .in("id", memberIds)
    : { data: [] };

  const memberList = (profiles ?? []).map((p) => ({
    user_id: p.id,
    display_name: p.display_name,
  }));

  const grouped = new Map<string, typeof targets>();
  for (const t of targets) {
    const arr = grouped.get(t.user_id) ?? [];
    arr.push(t);
    grouped.set(t.user_id, arr);
  }

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-400" />
          <h1 className="text-xl font-bold text-[#E5E2E1]">Player Development</h1>
        </div>
        <p className="text-sm text-[#9B9A97] mt-1">
          Track skill dan perkembangan setiap player.
        </p>
      </header>

      <PlayerDevelopmentClient
        targets={targets}
        orgSlug={orgSlug}
        members={memberList}
        grouped={Object.fromEntries(grouped)}
      />
    </div>
  );
};
export default ManagePlayerDevelopmentPage;
```

- [ ] **Step 7.6: Create `app/manage/[orgSlug]/salaries/page.tsx`**

```tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SalaryPageClient } from "@/features/salary/components/SalaryPageClient";
import { listContracts, getPayrollSummary } from "@/features/salary/queries";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ orgSlug: string }>;
}

const ManageSalariesPage = async ({ params }: Props) => {
  const { orgSlug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/manage/${orgSlug}/salaries`);

  const admin = createAdminClient();
  const { data: org } = await admin
    .from("organizations")
    .select("id")
    .eq("slug", orgSlug)
    .maybeSingle();

  if (!org) redirect("/manage");

  const [contracts, summary, membersRes] = await Promise.all([
    listContracts(org.id),
    getPayrollSummary(org.id),
    admin
      .from("team_members")
      .select("user_id, role")
      .eq("organization_id", org.id)
      .eq("is_active", true)
      .limit(100),
  ]);

  const memberRows = membersRes.data ?? [];
  const userIds = memberRows.map((m) => m.user_id);
  const { data: profileRows } = userIds.length > 0
    ? await admin
        .from("profiles")
        .select("id, display_name")
        .in("id", userIds)
    : { data: [] };

  const profileMap = new Map(
    (profileRows ?? []).map((p) => [p.id, p.display_name])
  );
  const members = memberRows
    .filter((m) => m.role !== "owner" && m.user_id !== user.id)
    .map((m) => ({
      user_id: m.user_id,
      display_name: profileMap.get(m.user_id) ?? null,
      role: m.role,
    }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Salary Player</h1>
        <p className="mt-1 text-sm text-[#9B9A97]">
          Kelola kontrak, gaji bulanan, dan riwayat pembayaran tiap player.
        </p>
      </div>

      <SalaryPageClient
        orgId={org.id}
        contracts={contracts}
        summary={summary}
        members={members}
        revalidatePaths={[
          `/manage/${orgSlug}/salaries`,
          "/dashboard/salaries",
        ]}
      />
    </div>
  );
};
export default ManageSalariesPage;
```

- [ ] **Step 7.7: Create `app/manage/[orgSlug]/reports/page.tsx`**

```tsx
import { redirect } from "next/navigation";
import { FileText } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateMonthlyReport } from "@/features/reports/queries";
import { ReportView } from "@/features/reports/components/ReportView";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<{ month?: string; year?: string }>;
}

const ManageReportsPage = async ({ params, searchParams }: Props) => {
  const { orgSlug } = await params;
  const sp = await searchParams;
  const admin = createAdminClient();

  const { data: org } = await admin
    .from("organizations")
    .select("id")
    .eq("slug", orgSlug)
    .maybeSingle();

  if (!org) redirect("/manage");

  const now = new Date();
  const year = sp.year ? parseInt(sp.year) : now.getFullYear();
  const month = sp.month ? parseInt(sp.month) : now.getMonth() + 1;

  const report = await generateMonthlyReport(org.id, year, month, "manager");

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"][i],
  }));

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-purple-400" />
          <h1 className="text-xl font-bold text-[#E5E2E1]">Laporan Bulanan</h1>
        </div>
        <p className="text-sm text-[#9B9A97] mt-1">
          Ringkasan performa tim per bulan.
        </p>
      </header>

      <nav className="flex flex-wrap gap-1">
        {months.map((m) => {
          const active = m.value === month;
          return (
            <a
              key={m.value}
              href={`/manage/${orgSlug}/reports?year=${year}&month=${m.value}`}
              className={`inline-flex h-8 items-center rounded-full px-3 text-xs font-medium transition ${
                active
                  ? "bg-white text-black"
                  : "bg-[#202020] text-[#9B9A97] hover:bg-[#2C2C2C] hover:text-[#E5E2E1]"
              }`}
            >
              {m.label}
            </a>
          );
        })}
      </nav>

      <ReportView report={report} />
    </div>
  );
};
export default ManageReportsPage;
```

- [ ] **Step 7.8: Typecheck everything**

```bash
npx tsc --noEmit
```
Expected: exit 0

- [ ] **Step 7.9: Commit**

```bash
rtk git add "app/manage/[orgSlug]/finances/page.tsx" "app/manage/[orgSlug]/sponsors/page.tsx" "app/manage/[orgSlug]/sponsors/[id]/page.tsx" "app/manage/[orgSlug]/content/page.tsx" "app/manage/[orgSlug]/development/page.tsx" "app/manage/[orgSlug]/salaries/page.tsx" "app/manage/[orgSlug]/reports/page.tsx"
rtk git commit -m "fix(manage): move all sub-pages to /manage/[orgSlug]/, fix limit(1) bugs"
```

---

## Task 8: Fix server action `revalidatePaths` for moved routes

**Goal:** Three action files call `revalidatePath` with the old static `/manage/...` paths. These need to revalidate `/manage` as a layout group instead, so the new `/manage/[orgSlug]/...` routes also get invalidated.

**Files:**
- Modify: `features/content/actions.ts` — lines with `revalidatePath("/manage/content")`
- Modify: `features/sponsors/actions.ts` — lines with `revalidatePath("/manage/sponsors")`
- Modify: `features/tournaments/actions.ts` — lines with `revalidatePath("/manage/finances")` and `revalidatePath("/manage/salaries")`

> Using `revalidatePath("/manage", "layout")` revalidates all pages sharing the `/manage` layout segment, covering all `/manage/[orgSlug]/...` routes.

- [ ] **Step 8.1: Fix `features/content/actions.ts`**

Find all 3 occurrences of `revalidatePath("/manage/content")` and replace each with:
```typescript
revalidatePath("/manage", "layout");
```

- [ ] **Step 8.2: Fix `features/sponsors/actions.ts`**

Find all 3 occurrences of `revalidatePath("/manage/sponsors")` and replace each with:
```typescript
revalidatePath("/manage", "layout");
```

- [ ] **Step 8.3: Fix `features/tournaments/actions.ts`**

Find the 2 occurrences:
```typescript
revalidatePath("/manage/finances");
// ...
revalidatePath("/manage/salaries");
```
Replace each with:
```typescript
revalidatePath("/manage", "layout");
```

- [ ] **Step 8.4: Typecheck**

```bash
npx tsc --noEmit
```
Expected: exit 0

- [ ] **Step 8.5: Commit**

```bash
rtk git add features/content/actions.ts features/sponsors/actions.ts features/tournaments/actions.ts
rtk git commit -m "fix(manage): update revalidatePaths for /manage/[orgSlug]/ route structure"
```

---

## Task 9: Update workspace layout to pass `managedTeams` for managers

**Goal:** When a manager is in their team workspace `/{slug}/...`, the sidebar should also show the TeamSwitcher. Update workspace layout to fetch all managed teams for manager users and pass to sidebar.

**Files:**
- Modify: `app/[team-slug]/(workspace)/layout.tsx`

- [ ] **Step 9.1: Add `managedTeams` fetch in workspace layout**

In `app/[team-slug]/(workspace)/layout.tsx`, after the existing parallel Phase 2 block, add a conditional fetch for manager's other orgs:

```tsx
// Phase 3: if manager, fetch all their managed teams for team switcher
const isManager = userRole === "manager";
let managedTeams: Array<{ id: string; slug: string; name: string; logoUrl: string | null }> = [];

if (isManager) {
  const { data: allMemberships } = await supabase
    .from("team_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .eq("role", "manager")
    .eq("is_active", true)
    .limit(20);

  const otherOrgIds = [
    ...new Set((allMemberships ?? []).map((m) => m.organization_id)),
  ].filter((id) => id !== organization.id);

  // Include current org too
  const allOrgIds = [organization.id, ...otherOrgIds];

  if (allOrgIds.length > 1) {
    const { data: orgsData } = await supabase
      .from("organizations")
      .select("id, slug, name, logo_url")
      .in("id", allOrgIds)
      .limit(20);

    managedTeams = (orgsData ?? []).map((o) => ({
      id: o.id,
      slug: o.slug,
      name: o.name,
      logoUrl: o.logo_url,
    }));
  }
}
```

Then pass `managedTeams` to `WorkspaceSidebar`:
```tsx
<WorkspaceSidebar
  orgSlug={organization.slug}
  orgId={organization.id}
  orgName={organization.name}
  orgLogoUrl={organization.logo_url}
  divisions={divisions.map((d) => ({ id: d.id, name: d.name }))}
  managedTeams={managedTeams.length > 1 ? managedTeams : undefined}
  user={{
    displayName: ...,
    // ... rest unchanged
  }}
/>
```

- [ ] **Step 9.2: Typecheck**

```bash
npx tsc --noEmit
```
Expected: exit 0

- [ ] **Step 9.3: Commit**

```bash
rtk git add "app/[team-slug]/(workspace)/layout.tsx"
rtk git commit -m "feat(workspace): pass managedTeams to sidebar for manager team switcher"
```

---

## Task 10: Cross-team calendar — `/manage/calendar`

**Goal:** New page at `/manage/calendar` that shows an aggregated agenda list of all upcoming events across all teams the manager manages. Shows team name + color badge per event.

**Files:**
- Create: `app/manage/calendar/page.tsx`
- Create: `app/manage/calendar/layout.tsx`

> This is an agenda/list view — NOT a full calendar grid (too complex for scope). Events sorted by date, paginated by month, with team label.

- [ ] **Step 10.1: Create `app/manage/calendar/layout.tsx`** (minimal — outer manage layout handles auth)

```tsx
// app/manage/calendar/layout.tsx
// This route sits outside /manage/[orgSlug]/ so needs its own sidebar
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { WorkspaceSidebar } from "@/components/layout/WorkspaceSidebar";
import { NotifyProvider } from "@/features/dashboard/components/NotifyModal";

export const dynamic = "force-dynamic";

const ManageCalendarLayout = async ({ children }: { children: React.ReactNode }) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/manage/calendar");

  const ownerEmail = process.env.OWNER_EMAIL;
  if (Boolean(ownerEmail && user.email === ownerEmail)) redirect("/dashboard");

  const admin = createAdminClient();

  const { data: memberships } = await admin
    .from("team_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .eq("role", "manager")
    .eq("is_active", true)
    .limit(20);

  const orgIds = [
    ...new Set((memberships ?? []).map((m) => m.organization_id)),
  ];

  if (orgIds.length === 0) redirect("/");

  const [orgsRes, profileRes] = await Promise.all([
    admin
      .from("organizations")
      .select("id, slug, name, logo_url")
      .in("id", orgIds),
    supabase
      .from("profiles")
      .select("display_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  const orgs = orgsRes.data ?? [];
  const firstOrg = orgs[0];
  if (!firstOrg) redirect("/");

  const profile = profileRes.data;
  const displayName =
    profile?.display_name ??
    (user.user_metadata?.["display_name"] as string | undefined) ??
    user.email ??
    "Akun saya";

  const managedTeams = orgs.map((o) => ({
    id: o.id,
    slug: o.slug,
    name: o.name,
    logoUrl: o.logo_url,
  }));

  return (
    <NotifyProvider>
      <div className="flex min-h-screen bg-[#191919] text-[#E5E2E1]">
        <WorkspaceSidebar
          orgSlug={firstOrg.slug}
          orgId={firstOrg.id}
          orgName={firstOrg.name}
          orgLogoUrl={firstOrg.logo_url}
          divisions={[]}
          managedTeams={managedTeams}
          user={{
            displayName,
            avatarUrl: profile?.avatar_url ?? null,
            userId: user.id,
            email: user.email ?? undefined,
            role: "manager",
          }}
        />
        <div className="flex min-h-screen flex-1 flex-col">
          <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-10">
            {children}
          </main>
        </div>
      </div>
    </NotifyProvider>
  );
};
export default ManageCalendarLayout;
```

- [ ] **Step 10.2: Create `app/manage/calendar/page.tsx`**

```tsx
import { Calendar } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { format, startOfMonth, endOfMonth, addMonths } from "date-fns";
import { id as localeId } from "date-fns/locale";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ month?: string; year?: string }>;
}

// Team color palette (cycles through for each managed team)
const TEAM_COLORS = [
  "bg-blue-500/20 text-blue-300 border-blue-500/30",
  "bg-purple-500/20 text-purple-300 border-purple-500/30",
  "bg-green-500/20 text-green-300 border-green-500/30",
  "bg-orange-500/20 text-orange-300 border-orange-500/30",
  "bg-pink-500/20 text-pink-300 border-pink-500/30",
];

const ManageCalendarPage = async ({ searchParams }: Props) => {
  const sp = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/manage/calendar");

  const now = new Date();
  const year = sp.year ? parseInt(sp.year) : now.getFullYear();
  const month = sp.month ? parseInt(sp.month) : now.getMonth() + 1;
  const targetDate = new Date(year, month - 1, 1);

  const admin = createAdminClient();

  const { data: memberships } = await admin
    .from("team_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .eq("role", "manager")
    .eq("is_active", true)
    .limit(20);

  const orgIds = [
    ...new Set((memberships ?? []).map((m) => m.organization_id)),
  ];

  if (orgIds.length === 0) {
    return (
      <div className="text-center py-20 text-[#9B9A97] text-sm">
        Kamu belum di-assign ke tim manapun.
      </div>
    );
  }

  const [orgsRes, eventsRes] = await Promise.all([
    admin
      .from("organizations")
      .select("id, slug, name")
      .in("id", orgIds),
    admin
      .from("calendar_events")
      .select("id, title, starts_at, ends_at, type, organization_id")
      .in("organization_id", orgIds)
      .gte("starts_at", startOfMonth(targetDate).toISOString())
      .lte("starts_at", endOfMonth(targetDate).toISOString())
      .order("starts_at", { ascending: true })
      .limit(200),
  ]);

  const orgs = orgsRes.data ?? [];
  const events = eventsRes.data ?? [];

  const orgMap = new Map(orgs.map((o, i) => [o.id, { ...o, colorClass: TEAM_COLORS[i % TEAM_COLORS.length] }]));

  const prevMonth = addMonths(targetDate, -1);
  const nextMonth = addMonths(targetDate, 1);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-400" />
          <h1 className="text-xl font-bold text-[#E5E2E1]">
            Kalender Semua Tim
          </h1>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Link
            href={`/manage/calendar?year=${prevMonth.getFullYear()}&month=${prevMonth.getMonth() + 1}`}
            className="rounded px-3 py-1.5 text-[#9B9A97] hover:bg-[#2C2C2C] hover:text-[#D4D4D4] transition"
          >
            ← Prev
          </Link>
          <span className="font-medium text-[#D4D4D4] min-w-[120px] text-center">
            {format(targetDate, "MMMM yyyy", { locale: localeId })}
          </span>
          <Link
            href={`/manage/calendar?year=${nextMonth.getFullYear()}&month=${nextMonth.getMonth() + 1}`}
            className="rounded px-3 py-1.5 text-[#9B9A97] hover:bg-[#2C2C2C] hover:text-[#D4D4D4] transition"
          >
            Next →
          </Link>
        </div>
      </header>

      {/* Team legend */}
      <div className="flex flex-wrap gap-2">
        {orgs.map((org, i) => (
          <span
            key={org.id}
            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${TEAM_COLORS[i % TEAM_COLORS.length]}`}
          >
            {org.name}
          </span>
        ))}
      </div>

      {events.length === 0 ? (
        <div className="rounded-lg border border-[#2D2D2D] bg-[#202020] py-12 text-center text-sm text-[#6B6A68]">
          Tidak ada event di bulan ini.
        </div>
      ) : (
        <div className="space-y-2">
          {events.map((event) => {
            const org = orgMap.get(event.organization_id);
            return (
              <div
                key={event.id}
                className="flex items-center gap-4 rounded-lg border border-[#2D2D2D] bg-[#202020] px-4 py-3"
              >
                <div className="w-16 shrink-0 text-center">
                  <p className="text-lg font-bold text-[#D4D4D4]">
                    {format(new Date(event.starts_at), "d")}
                  </p>
                  <p className="text-[10px] uppercase text-[#6B6A68]">
                    {format(new Date(event.starts_at), "EEE", { locale: localeId })}
                  </p>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-[#E5E2E1]">
                    {event.title}
                  </p>
                  <p className="text-xs text-[#9B9A97]">
                    {format(new Date(event.starts_at), "HH:mm")}
                    {event.ends_at &&
                      ` – ${format(new Date(event.ends_at), "HH:mm")}`}
                  </p>
                </div>
                {org && (
                  <span
                    className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${org.colorClass}`}
                  >
                    {org.name}
                  </span>
                )}
                <Link
                  href={`/${org?.slug}/calendar/${event.id}`}
                  className="shrink-0 text-xs text-[#9B9A97] hover:text-[#D4D4D4] transition"
                >
                  Detail →
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
export default ManageCalendarPage;
```

- [ ] **Step 10.3: Add "Kalender" link to manager nav in `getManagerNavGroup`**

In `components/layout/WorkspaceSidebar.tsx`, add to `getManagerNavGroup`:
```tsx
{
  key: "manage-calendar",
  href: "",
  absoluteHref: "/manage/calendar",
  label: "Kalender Semua Tim",
  Icon: Calendar,
},
```
Place it after the "Overview" item.

- [ ] **Step 10.4: Typecheck**

```bash
npx tsc --noEmit
```
Expected: exit 0

- [ ] **Step 10.5: Run all unit tests**

```bash
npm run test:unit:coverage
```
Expected: all pass, coverage thresholds met

- [ ] **Step 10.6: Commit**

```bash
rtk git add "app/manage/calendar/page.tsx" "app/manage/calendar/layout.tsx" components/layout/WorkspaceSidebar.tsx
rtk git commit -m "feat(manage): cross-team calendar at /manage/calendar"
```

---

## Task 11: Add redirects from old `/manage/*` routes

**Goal:** Old routes (`/manage/assign`, `/manage/finances`, etc.) still exist as files and will still be reachable. Convert them to redirect pages so any bookmarked links work. They redirect to `/manage` which then redirects to the first team's equivalent page.

**Files:**
- Modify: `app/manage/assign/page.tsx`
- Modify: `app/manage/divisions/page.tsx`
- Modify: `app/manage/captains/page.tsx`
- Modify: `app/manage/finances/page.tsx`
- Modify: `app/manage/sponsors/page.tsx`
- Modify: `app/manage/sponsors/[id]/page.tsx`
- Modify: `app/manage/content/page.tsx`
- Modify: `app/manage/development/page.tsx`
- Modify: `app/manage/salaries/page.tsx`
- Modify: `app/manage/reports/page.tsx`

- [ ] **Step 11.1: Replace each old sub-page with a redirect**

For each file listed above, replace the entire content with:

```tsx
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// Redirect to /manage which redirects to /manage/[firstOrgSlug]
export default function OldManageRoute() {
  redirect("/manage");
}
```

Exception — `app/manage/sponsors/[id]/page.tsx` redirects to `/manage` (user can navigate from there since we can't know the org slug from just the id).

- [ ] **Step 11.2: Typecheck**

```bash
npx tsc --noEmit
```
Expected: exit 0

- [ ] **Step 11.3: Run full CI gate**

```bash
npm run lint && npm run typecheck && npm run test:unit:coverage
```
Expected: all pass

- [ ] **Step 11.4: Final commit**

```bash
rtk git add app/manage/assign/page.tsx app/manage/divisions/page.tsx app/manage/captains/page.tsx app/manage/finances/page.tsx app/manage/sponsors/page.tsx "app/manage/sponsors/[id]/page.tsx" app/manage/content/page.tsx app/manage/development/page.tsx app/manage/salaries/page.tsx app/manage/reports/page.tsx
rtk git commit -m "chore(manage): redirect old /manage/* routes to /manage"
```

---

## Self-Review

### Spec Coverage Check

| Requirement | Task |
|-------------|------|
| Manager with multiple teams can switch teams | Task 2 (TeamSwitcher) + Task 3 (sidebar) + Task 4 (layout) |
| `/manage` panel has team context in URL | Task 1 (outer shell) + Task 4 (new layout) |
| Sidebar shows current team + can switch | Task 2 + Task 3 |
| KOMPETISI/TIM nav links correct per team | Task 3 (getManagerNavGroup dynamic) |
| Finances/sponsors/etc scoped to correct team | Task 7 (fix limit(1)) |
| Manager in workspace also has team switcher | Task 9 |
| Cross-team calendar aggregated view | Task 10 |
| Old routes don't 404 (graceful redirect) | Task 11 |
| Server action cache invalidation fixed | Task 8 |
| ManageBreadcrumb shows correct labels | Task 5 |

### No Placeholders Found ✓

### Type Consistency Check

- `ManagedTeam` interface defined in Task 2 (`TeamSwitcher.tsx`) and Task 3 (`WorkspaceSidebar.tsx`) — must match. Both use `{ id: string; slug: string; name: string; logoUrl: string | null }`. ✓
- `getManagerNavGroup(orgSlug)` defined in Task 3, tested in Task 3, used in Task 10. ✓
- All pages use `params: Promise<{ orgSlug: string }>` consistently. ✓
