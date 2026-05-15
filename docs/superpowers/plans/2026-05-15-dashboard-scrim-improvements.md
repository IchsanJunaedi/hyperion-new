# Dashboard, Security & Scrim Improvements — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement 6 improvements: dashboard quick fixes, clickable team names with modal, guest route protection, scrim role-gating, captain CRUD for scrims with edit/cancel, and a countdown timer on the scrim detail page.

**Architecture:** Minimal targeted changes following existing patterns. Each new component mirrors its nearest existing sibling (`OrgDetailModal` mirrors `UserDetailModal`, `ScrimEditForm` mirrors `ScrimForm`, `CancelScrimButton` is a self-contained client island). Route-level role checks use `getCurrentUserRole` from `features/roster/queries` which is already used on the roster page.

**Tech Stack:** Next.js 15 App Router (server components + client islands), TypeScript, Supabase SSR, Tailwind CSS, Zod, Lucide icons, Sonner toasts (already installed).

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `app/dashboard/page.tsx` | Modify | Remove emoji; add `tier` to orgs query; swap `ManagerAssignments` for `ManagerAssignmentsTable` |
| `features/dashboard/components/CreateTeamForm.tsx` | Modify | Remove placeholder; add required-division validation |
| `features/dashboard/components/OrgDetailModal.tsx` | **Create** | Modal showing org detail (mirrors `UserDetailModal`) |
| `features/dashboard/components/ManagerAssignmentsTable.tsx` | **Create** | Client component with clickable team names + modal |
| `app/[team-slug]/page.tsx` | Modify | Guest redirect; pass `canManageScrims`; fix missing `userId` + `WorkspaceTopbar` |
| `components/team/TeamHome.tsx` | Modify | Accept `canManageScrims` prop; fix "Buat scrim" link to `/scrim/new` |
| `app/[team-slug]/(workspace)/scrim/page.tsx` | Modify | Role-gate "Buat scrim" button |
| `app/[team-slug]/(workspace)/scrim/new/page.tsx` | Modify | Redirect non-Captain+ to scrim list |
| `lib/validations/scrim.ts` | Modify | Add `updateScrimSchema` |
| `features/scrim/actions.ts` | Modify | Add `updateScrimAction` |
| `features/scrim/components/ScrimEditForm.tsx` | **Create** | Pre-filled form for editing a scrim |
| `app/[team-slug]/(workspace)/scrim/[id]/edit/page.tsx` | **Create** | Edit scrim page (Captain+ only) |
| `features/scrim/components/CancelScrimButton.tsx` | **Create** | Cancel button with inline confirmation dialog |
| `app/[team-slug]/(workspace)/scrim/[id]/page.tsx` | Modify | Add countdown; add Edit + Cancel buttons (Captain+ only) |

---

## Task 1: Dashboard Quick Fixes

**Files:**
- Modify: `app/dashboard/page.tsx`
- Modify: `features/dashboard/components/CreateTeamForm.tsx`

### Step 1a: Remove ⚡ emoji from header

- [ ] In `app/dashboard/page.tsx`, find line:
  ```tsx
  <span className="text-sm font-bold text-yellow-400">⚡ Owner Dashboard</span>
  ```
  Change to:
  ```tsx
  <span className="text-sm font-bold text-yellow-400">Owner Dashboard</span>
  ```

### Step 1b: Remove placeholder from CreateTeamForm name input

- [ ] In `features/dashboard/components/CreateTeamForm.tsx`, find the input for team name (around line 57–63). Remove the `placeholder` attribute:
  ```tsx
  // Before
  placeholder="mis. Hyperion Six"
  // After — delete the line entirely
  ```

### Step 1c: Require at least one division before submit

- [ ] In `features/dashboard/components/CreateTeamForm.tsx`, add a new state variable for division error. Replace the existing state declarations with:
  ```tsx
  const [error, setError] = useState<string | null>(null);
  const [divisionError, setDivisionError] = useState<string | null>(null);
  ```

- [ ] In `handleSubmit`, add a division guard after the `teamName.trim()` check:
  ```tsx
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    if (!teamName.trim()) {
      setError("Nama tim wajib diisi");
      return;
    }
    if (existingDivisions.length > 0 && selectedDivisionIds.length === 0) {
      setDivisionError("Pilih minimal satu divisi");
      return;
    }
    startTransition(async () => {
      setError(null);
      setDivisionError(null);
      // ... rest unchanged
    });
  }
  ```

- [ ] Display `divisionError` below the division toggle section. In the JSX, after the closing `</div>` of the `flex flex-wrap gap-2` div (that wraps the division buttons), add:
  ```tsx
  {divisionError && (
    <p className="text-xs text-rose-400">{divisionError}</p>
  )}
  ```

- [ ] Also reset `divisionError` when a division is toggled — in `toggleDivision`:
  ```tsx
  function toggleDivision(divId: string) {
    setDivisionError(null);
    setSelectedDivisionIds((prev) =>
      prev.includes(divId) ? prev.filter((d) => d !== divId) : [...prev, divId],
    );
  }
  ```

### Step 1d: Typecheck

- [ ] Run: `npx tsc --noEmit`
  Expected: no new errors

### Step 1e: Commit

- [ ] `git add app/dashboard/page.tsx features/dashboard/components/CreateTeamForm.tsx`
- [ ] `git commit -m "fix(dashboard): remove emoji, placeholder, require division on team create"`

---

## Task 2: OrgDetailModal + ManagerAssignmentsTable

**Files:**
- Create: `features/dashboard/components/OrgDetailModal.tsx`
- Create: `features/dashboard/components/ManagerAssignmentsTable.tsx`
- Modify: `app/dashboard/page.tsx`

### Step 2a: Create OrgDetailModal

- [ ] Create `features/dashboard/components/OrgDetailModal.tsx`:

```tsx
"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

export interface OrgDetail {
  id: string;
  name: string;
  slug: string;
  tier: string | null;
  divisions: Array<{ id: string; name: string }>;
  memberCount: number;
}

interface OrgDetailModalProps {
  org: OrgDetail | null;
  onClose: () => void;
}

export function OrgDetailModal({ org, onClose }: OrgDetailModalProps) {
  useEffect(() => {
    if (!org) return;
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [org, onClose]);

  if (!org) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-xl border border-white/10 bg-zinc-900 p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">{org.name}</h3>
            <p className="text-xs text-white/50">/{org.slug}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-white/40 hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3 text-sm">
          <Row label="Tier" value={org.tier ?? "komunitas"} />
          <Row label="Jumlah Member Aktif" value={org.memberCount.toString()} />
          {org.divisions.length > 0 && (
            <div>
              <p className="text-xs text-white/50">Divisi</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {org.divisions.map((d) => (
                  <span
                    key={d.id}
                    className="inline-flex rounded-full bg-white/5 px-2.5 py-1 text-xs text-white/70"
                  >
                    {d.name}
                  </span>
                ))}
              </div>
            </div>
          )}
          {org.divisions.length === 0 && (
            <Row label="Divisi" value="Belum ada divisi" />
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-white/50">{label}</p>
      <p className="mt-0.5 text-white/80">{value}</p>
    </div>
  );
}
```

### Step 2b: Create ManagerAssignmentsTable

- [ ] Create `features/dashboard/components/ManagerAssignmentsTable.tsx`:

```tsx
"use client";

import { useState } from "react";

import { OrgDetailModal, type OrgDetail } from "./OrgDetailModal";

interface ManagerAssignmentsTableProps {
  members: Array<{
    id: string;
    user_id: string;
    organization_id: string;
    role: string;
    is_active: boolean;
  }>;
  profiles: Array<{
    id: string;
    full_name: string | null;
    username: string | null;
    display_name: string | null;
  }>;
  orgs: Array<{
    id: string;
    name: string;
    slug: string;
    tier: string | null;
  }>;
  allDivisions: Array<{ id: string; name: string; organization_id: string }>;
}

export function ManagerAssignmentsTable({
  members,
  profiles,
  orgs,
  allDivisions,
}: ManagerAssignmentsTableProps) {
  const [selectedOrg, setSelectedOrg] = useState<OrgDetail | null>(null);

  const managers = members.filter((m) => m.role === "manager" && m.is_active);
  const profileMap = new Map(profiles.map((p) => [p.id, p]));
  const orgMap = new Map(orgs.map((o) => [o.id, o]));

  function buildOrgDetail(orgId: string): OrgDetail | null {
    const org = orgMap.get(orgId);
    if (!org) return null;
    const divisions = allDivisions
      .filter((d) => d.organization_id === orgId)
      .map((d) => ({ id: d.id, name: d.name }));
    const memberCount = members.filter(
      (m) => m.organization_id === orgId,
    ).length;
    return { id: org.id, name: org.name, slug: org.slug, tier: org.tier, divisions, memberCount };
  }

  if (managers.length === 0) {
    return (
      <p className="rounded-lg border border-white/5 bg-white/[0.02] px-4 py-6 text-center text-sm text-white/40">
        Belum ada Manager yang di-assign. Gunakan "Assign Role" untuk menambahkan.
      </p>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-white/5">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 bg-white/[0.02]">
              <th className="px-4 py-3 text-left text-xs font-medium text-white/50">
                Manager
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white/50">
                Tim
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white/50">
                Divisi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {managers.map((m) => {
              const p = profileMap.get(m.user_id);
              const org = orgMap.get(m.organization_id);
              const orgDivisions = allDivisions.filter(
                (d) => d.organization_id === m.organization_id,
              );
              return (
                <tr key={m.id} className="transition hover:bg-white/[0.02]">
                  <td className="px-4 py-3 text-white/80">
                    {p?.full_name ?? p?.display_name ?? p?.username ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    {org ? (
                      <button
                        type="button"
                        onClick={() => setSelectedOrg(buildOrgDetail(org.id))}
                        className="text-yellow-400 hover:underline cursor-pointer"
                      >
                        {org.name}
                      </button>
                    ) : (
                      <span className="text-white/60">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-white/60">
                    {orgDivisions.length > 0
                      ? orgDivisions.map((d) => d.name).join(", ")
                      : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <OrgDetailModal
        org={selectedOrg}
        onClose={() => setSelectedOrg(null)}
      />
    </>
  );
}
```

### Step 2c: Update the orgs query in page to include `tier`, swap component

- [ ] In `app/dashboard/page.tsx`, find the orgs query:
  ```typescript
  const { data: orgs } = await admin
    .from("organizations")
    .select("id, name, slug, created_at")
    .order("created_at", { ascending: false });
  ```
  Change to:
  ```typescript
  const { data: orgs } = await admin
    .from("organizations")
    .select("id, name, slug, tier, created_at")
    .order("created_at", { ascending: false });
  ```

- [ ] At the top of `app/dashboard/page.tsx`, add the import:
  ```tsx
  import { ManagerAssignmentsTable } from "@/features/dashboard/components/ManagerAssignmentsTable";
  ```

- [ ] In the JSX, find the `ManagerAssignments` call in the "Manager — Tim & Divisi" section:
  ```tsx
  <ManagerAssignments members={members ?? []} profiles={profiles ?? []} orgs={orgs ?? []} allDivisions={allDivisions ?? []} />
  ```
  Replace with:
  ```tsx
  <ManagerAssignmentsTable
    members={members ?? []}
    profiles={profiles ?? []}
    orgs={(orgs ?? []).map((o) => ({ id: o.id, name: o.name, slug: o.slug, tier: o.tier }))}
    allDivisions={(allDivisions ?? []).map((d) => ({
      id: d.id,
      name: d.name,
      organization_id: d.organization_id,
    }))}
  />
  ```

- [ ] Delete the old `ManagerAssignments` function from `app/dashboard/page.tsx` (it's defined at the bottom of the file).

### Step 2d: Typecheck

- [ ] Run: `npx tsc --noEmit`
  Expected: no new errors

### Step 2e: Commit

- [ ] `git add features/dashboard/components/OrgDetailModal.tsx features/dashboard/components/ManagerAssignmentsTable.tsx app/dashboard/page.tsx`
- [ ] `git commit -m "feat(dashboard): clickable team names with org detail modal"`

---

## Task 3: Guest Route Protection

**Files:**
- Modify: `app/[team-slug]/page.tsx`

### Step 3a: Add redirect import

- [ ] In `app/[team-slug]/page.tsx`, change the import:
  ```typescript
  // Before
  import { notFound } from "next/navigation";
  // After
  import { notFound, redirect } from "next/navigation";
  ```

### Step 3b: Add guest guard before public profile

- [ ] Find the `if (!member)` block (around line 40):
  ```tsx
  if (!member) {
    const publicData = await getPublicTeamData(organization);
    return (
      <>
        <Header />
        <PublicTeamProfile {...publicData} />
      </>
    );
  }
  ```
  Replace with:
  ```tsx
  if (!member) {
    if (!user) {
      redirect(`/login?next=/${slug}`);
    }
    const publicData = await getPublicTeamData(organization);
    return (
      <>
        <Header />
        <PublicTeamProfile {...publicData} />
      </>
    );
  }
  ```

  **Note:** At this point in the file, `user` has not been fetched yet (it's fetched after the member check). We need to fetch user before the `isCurrentUserMember` call or restructure. The correct order is: **fetch user first**, then check membership, then branch.

  The full updated function should be:
  ```tsx
  export default async function TeamSlugPage({ params }: TeamSlugPageProps) {
    const { "team-slug": slug } = await params;
    const organization = await getOrgBySlug(slug);
    if (!organization) notFound();

    // Fetch user first so we can use it in both the guest guard and the member branch
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const member = await isCurrentUserMember(organization.id);

    if (!member) {
      if (!user) {
        redirect(`/login?next=/${slug}`);
      }
      const publicData = await getPublicTeamData(organization);
      return (
        <>
          <Header />
          <PublicTeamProfile {...publicData} />
        </>
      );
    }

    // user must be non-null here (member check passed)
    if (!user) notFound();

    const data = await getTeamHomeData(organization);

    return (
      <div className="flex min-h-screen flex-1">
        <WorkspaceSidebar
          orgSlug={organization.slug}
          orgName={organization.name}
          orgLogoUrl={organization.logo_url}
          divisions={data.divisions.map((d) => ({ id: d.id, name: d.name }))}
          user={{
            displayName:
              (user.user_metadata?.["display_name"] as string | undefined) ??
              user.email ??
              "Akun saya",
            avatarUrl: null,
            userId: user.id,
          }}
        />
        <div className="flex min-w-0 flex-1 flex-col pb-20 md:pb-0">
          <WorkspaceTopbar organization={organization} userId={user.id} />
          <main className="flex-1">
            <TeamHome data={data} canManageScrims={false} />
          </main>
          <MobileBottomNav orgSlug={organization.slug} />
        </div>
      </div>
    );
  }
  ```

  Note `canManageScrims={false}` is a placeholder — Task 4 wires up the real value. Also note `userId: user.id` is added to the sidebar user prop (fixes a pre-existing missing prop bug), and `WorkspaceTopbar` now receives `userId={user.id}`.

### Step 3c: Typecheck

- [ ] Run: `npx tsc --noEmit`
  Expected: TypeScript may complain that `TeamHome` doesn't have `canManageScrims` prop yet — that's expected and will be fixed in Task 4.

### Step 3d: Commit

- [ ] `git add app/[team-slug]/page.tsx`
- [ ] `git commit -m "fix(auth): redirect guest users to login before showing team profile"`

---

## Task 4: TeamHome canManageScrims + Fix Link

**Files:**
- Modify: `components/team/TeamHome.tsx`
- Modify: `app/[team-slug]/page.tsx`

### Step 4a: Add `canManageScrims` prop to TeamHome and fix the link

- [ ] In `components/team/TeamHome.tsx`, update the component signature:
  ```tsx
  // Before
  export function TeamHome({ data }: { data: TeamHomeData }) {
  // After
  export function TeamHome({ data, canManageScrims }: { data: TeamHomeData; canManageScrims: boolean }) {
  ```

- [ ] Find the "no next scrim" placeholder block (the article with `border-dashed`). It currently ends with a `<Link>` button labeled "Buat scrim". Wrap that link with a conditional and fix the href:
  ```tsx
  // Before
  <Link
    href={`/${slug}/scrim`}
    className="mt-3 inline-flex h-9 items-center rounded-md border border-white/10 px-3 text-sm font-medium text-white transition hover:bg-white/5"
  >
    Buat scrim
  </Link>

  // After
  {canManageScrims && (
    <Link
      href={`/${slug}/scrim/new`}
      className="mt-3 inline-flex h-9 items-center rounded-md border border-white/10 px-3 text-sm font-medium text-white transition hover:bg-white/5"
    >
      Buat scrim
    </Link>
  )}
  ```

### Step 4b: Wire `canManageScrims` in `app/[team-slug]/page.tsx`

- [ ] In `app/[team-slug]/page.tsx`, add the roster import:
  ```typescript
  import { getCurrentUserRole } from "@/features/roster/queries";
  ```

- [ ] In the member branch (after `if (!user) notFound()`), fetch the role and pass it:
  ```typescript
  const [data, currentUserRole] = await Promise.all([
    getTeamHomeData(organization),
    getCurrentUserRole(organization.id),
  ]);
  const canManageScrims = ["captain", "manager", "owner"].includes(
    currentUserRole ?? "",
  );
  ```

- [ ] Update the `<TeamHome>` call:
  ```tsx
  <TeamHome data={data} canManageScrims={canManageScrims} />
  ```

### Step 4c: Typecheck

- [ ] Run: `npx tsc --noEmit`
  Expected: no errors

### Step 4d: Commit

- [ ] `git add components/team/TeamHome.tsx app/[team-slug]/page.tsx`
- [ ] `git commit -m "feat(team-home): role-gate Buat Scrim button, fix link to /scrim/new"`

---

## Task 5: Role-Gate Scrim List & New Pages

**Files:**
- Modify: `app/[team-slug]/(workspace)/scrim/page.tsx`
- Modify: `app/[team-slug]/(workspace)/scrim/new/page.tsx`

### Step 5a: Role-gate "Buat scrim" button on scrim list

- [ ] In `app/[team-slug]/(workspace)/scrim/page.tsx`, add imports:
  ```typescript
  import { getCurrentUserRole } from "@/features/roster/queries";
  ```

- [ ] Update the function to fetch role and receive org:
  ```typescript
  export default async function ScrimListPage({ params, searchParams }: ScrimListPageProps) {
    const [{ "team-slug": slug }, sp] = await Promise.all([params, searchParams]);
    const organization = await getOrgBySlug(slug);
    if (!organization) notFound();

    const filter: ScrimListFilter =
      sp.tab === "ongoing" || sp.tab === "completed" || sp.tab === "all"
        ? sp.tab
        : "upcoming";

    const [scrims, currentUserRole] = await Promise.all([
      listScrims(organization.id, filter),
      getCurrentUserRole(organization.id),
    ]);
    const canManageScrims = ["captain", "manager", "owner"].includes(
      currentUserRole ?? "",
    );
    // ... rest of function
  ```

- [ ] In the JSX header, wrap the "Buat scrim" link:
  ```tsx
  // Before
  <Link
    href={`/${slug}/scrim/new`}
    className="inline-flex h-10 items-center gap-2 rounded-md bg-yellow-400 px-4 text-sm font-semibold text-black transition hover:bg-yellow-300"
  >
    <Plus className="h-4 w-4" />
    Buat scrim
  </Link>

  // After
  {canManageScrims ? (
    <Link
      href={`/${slug}/scrim/new`}
      className="inline-flex h-10 items-center gap-2 rounded-md bg-yellow-400 px-4 text-sm font-semibold text-black transition hover:bg-yellow-300"
    >
      <Plus className="h-4 w-4" />
      Buat scrim
    </Link>
  ) : (
    <div />
  )}
  ```

### Step 5b: Role-gate scrim new page

- [ ] In `app/[team-slug]/(workspace)/scrim/new/page.tsx`, add imports:
  ```typescript
  import { redirect } from "next/navigation";
  import { getCurrentUserRole } from "@/features/roster/queries";
  ```

- [ ] Add role check before rendering form:
  ```typescript
  export default async function NewScrimPage({ params }: NewScrimPageProps) {
    const { "team-slug": slug } = await params;
    const organization = await getOrgBySlug(slug);
    if (!organization) notFound();

    const [currentUserRole, { divisions }] = await Promise.all([
      getCurrentUserRole(organization.id),
      getPublicTeamData(organization),
    ]);

    const canManageScrims = ["captain", "manager", "owner"].includes(
      currentUserRole ?? "",
    );
    if (!canManageScrims) redirect(`/${slug}/scrim`);

    return (
      // ... rest unchanged
    );
  }
  ```

### Step 5c: Typecheck

- [ ] Run: `npx tsc --noEmit`
  Expected: no errors

### Step 5d: Commit

- [ ] `git add "app/[team-slug]/(workspace)/scrim/page.tsx" "app/[team-slug]/(workspace)/scrim/new/page.tsx"`
- [ ] `git commit -m "feat(scrim): role-gate create scrim to captain+ only"`

---

## Task 6: updateScrimSchema + updateScrimAction

**Files:**
- Modify: `lib/validations/scrim.ts`
- Modify: `features/scrim/actions.ts`

### Step 6a: Add updateScrimSchema

- [ ] In `lib/validations/scrim.ts`, add at the end:
  ```typescript
  export const updateScrimSchema = z.object({
    scrim_id: z.string().uuid("ID scrim tidak valid"),
    division_id: z.string().uuid("Divisi wajib dipilih"),
    opponent_name: z
      .string()
      .trim()
      .min(1, "Nama lawan wajib diisi")
      .max(120, "Nama lawan maksimal 120 karakter"),
    opponent_contact: z
      .string()
      .trim()
      .max(120)
      .optional()
      .transform((v) => (v && v.length > 0 ? v : null)),
    scheduled_at: z
      .string()
      .min(1, "Jadwal wajib diisi")
      .refine(
        (iso) => !Number.isNaN(new Date(iso).getTime()),
        "Jadwal tidak valid",
      ),
    format: matchFormatSchema,
    server_region: z
      .string()
      .trim()
      .max(60)
      .optional()
      .transform((v) => (v && v.length > 0 ? v : null)),
    room_info: z
      .string()
      .trim()
      .max(500)
      .optional()
      .transform((v) => (v && v.length > 0 ? v : null)),
    notes: z
      .string()
      .trim()
      .max(2000)
      .optional()
      .transform((v) => (v && v.length > 0 ? v : null)),
  });

  export type UpdateScrimInput = z.infer<typeof updateScrimSchema>;
  ```

### Step 6b: Add updateScrimAction

- [ ] In `features/scrim/actions.ts`, add the following after the `createScrimAction` function:

  First, add imports at the top (add `updateScrimSchema` to the existing import from validations):
  ```typescript
  import {
    cancelScrimSchema,
    createScrimSchema,
    submitResultSchema,
    updateAttendanceSchema,
    updateScrimSchema,
  } from "@/lib/validations/scrim";
  ```

  Then add the action after `createScrimAction`:
  ```typescript
  export interface UpdateScrimResult {
    ok: true;
    scrim: Scrim;
  }

  /**
   * Update an existing scrim's fields. Captain+ only (RLS enforced on UPDATE).
   */
  export async function updateScrimAction(
    orgSlug: string,
    raw: unknown,
  ): Promise<ActionError | UpdateScrimResult> {
    const parsed = updateScrimSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        ok: false,
        message: "Form belum lengkap",
        fieldErrors: z.flattenError(parsed.error).fieldErrors,
      };
    }
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, message: "Anda harus login" };

    const { data: scrim, error } = await supabase
      .from("scrims")
      .update({
        division_id: parsed.data.division_id,
        opponent_name: parsed.data.opponent_name,
        opponent_contact: parsed.data.opponent_contact,
        scheduled_at: new Date(parsed.data.scheduled_at).toISOString(),
        format: parsed.data.format,
        server_region: parsed.data.server_region,
        room_info: parsed.data.room_info,
        notes: parsed.data.notes,
      })
      .eq("id", parsed.data.scrim_id)
      .select("*")
      .single();

    if (error || !scrim) {
      return {
        ok: false,
        message:
          error?.code === "42501"
            ? "Hanya captain atau owner yang bisa mengubah scrim"
            : (error?.message ?? "Gagal mengubah scrim"),
      };
    }

    revalidatePath(`/${orgSlug}/scrim/${parsed.data.scrim_id}`);
    revalidatePath(`/${orgSlug}/scrim`);
    revalidatePath(`/${orgSlug}`);
    return { ok: true, scrim };
  }
  ```

### Step 6c: Typecheck

- [ ] Run: `npx tsc --noEmit`
  Expected: no errors

### Step 6d: Commit

- [ ] `git add lib/validations/scrim.ts features/scrim/actions.ts`
- [ ] `git commit -m "feat(scrim): add updateScrimSchema and updateScrimAction"`

---

## Task 7: ScrimEditForm + Edit Page

**Files:**
- Create: `features/scrim/components/ScrimEditForm.tsx`
- Create: `app/[team-slug]/(workspace)/scrim/[id]/edit/page.tsx`

### Step 7a: Create ScrimEditForm

- [ ] Create `features/scrim/components/ScrimEditForm.tsx`:

```tsx
"use client";

import { Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { updateScrimAction } from "@/features/scrim/actions";
import type { MatchFormat } from "@/types/database";

interface ScrimEditFormProps {
  scrimId: string;
  orgSlug: string;
  divisions: Array<{ id: string; name: string }>;
  initialValues: {
    division_id: string;
    opponent_name: string;
    opponent_contact: string | null;
    scheduled_at: string; // UTC ISO string from DB
    format: MatchFormat;
    server_region: string | null;
    room_info: string | null;
    notes: string | null;
  };
}

const FORMATS: Array<{ value: MatchFormat; label: string }> = [
  { value: "bo1", label: "BO1" },
  { value: "bo3", label: "BO3" },
  { value: "bo5", label: "BO5" },
  { value: "scrimmage", label: "Scrim" },
];

// Convert a UTC ISO string to a "YYYY-MM-DDTHH:mm" string in WIB (UTC+7)
// so the datetime-local input shows the time as the user originally entered it.
// Assumes the app is used by WIB-timezone users.
function toWibDatetimeLocal(utcIso: string): string {
  const utcMs = new Date(utcIso).getTime();
  const wibMs = utcMs + 7 * 60 * 60 * 1000;
  return new Date(wibMs).toISOString().slice(0, 16);
}

export function ScrimEditForm({
  scrimId,
  orgSlug,
  divisions,
  initialValues,
}: ScrimEditFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (pending) return;
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          setGlobalError(null);
          setFieldErrors({});
          const res = await updateScrimAction(orgSlug, {
            scrim_id: scrimId,
            division_id: fd.get("division_id"),
            opponent_name: fd.get("opponent_name"),
            opponent_contact: fd.get("opponent_contact"),
            scheduled_at: fd.get("scheduled_at"),
            format: fd.get("format"),
            server_region: fd.get("server_region"),
            room_info: fd.get("room_info"),
            notes: fd.get("notes"),
          });
          if (!res.ok) {
            setGlobalError(res.message);
            setFieldErrors(res.fieldErrors ?? {});
            return;
          }
          router.push(`/${orgSlug}/scrim/${scrimId}`);
        });
      }}
      className="space-y-4"
    >
      <Field label="Divisi" name="division_id" errors={fieldErrors["division_id"]}>
        <select
          name="division_id"
          required
          defaultValue={initialValues.division_id}
          className="h-10 w-full rounded-md border border-white/10 bg-zinc-900 px-3 text-sm text-white focus:border-yellow-400 focus:outline-none"
        >
          <option value="" disabled>
            Pilih divisi…
          </option>
          {divisions.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </Field>

      <Field
        label="Nama lawan"
        name="opponent_name"
        errors={fieldErrors["opponent_name"]}
      >
        <input
          name="opponent_name"
          required
          maxLength={120}
          defaultValue={initialValues.opponent_name}
          placeholder="mis. Team Spartan"
          className="h-10 w-full rounded-md border border-white/10 bg-zinc-900 px-3 text-sm text-white focus:border-yellow-400 focus:outline-none"
        />
      </Field>

      <Field
        label="Kontak lawan (opsional)"
        name="opponent_contact"
        errors={fieldErrors["opponent_contact"]}
      >
        <input
          name="opponent_contact"
          maxLength={120}
          defaultValue={initialValues.opponent_contact ?? ""}
          placeholder="WA / Discord captain lawan"
          className="h-10 w-full rounded-md border border-white/10 bg-zinc-900 px-3 text-sm text-white focus:border-yellow-400 focus:outline-none"
        />
      </Field>

      <Field
        label="Jadwal"
        name="scheduled_at"
        errors={fieldErrors["scheduled_at"]}
      >
        <input
          type="datetime-local"
          name="scheduled_at"
          required
          defaultValue={toWibDatetimeLocal(initialValues.scheduled_at)}
          className="h-10 w-full rounded-md border border-white/10 bg-zinc-900 px-3 text-sm text-white focus:border-yellow-400 focus:outline-none"
        />
      </Field>

      <Field label="Format" name="format" errors={fieldErrors["format"]}>
        <div className="flex flex-wrap gap-2">
          {FORMATS.map((f) => (
            <label
              key={f.value}
              className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-zinc-800 px-3 py-2 text-sm text-white/85 has-[input:checked]:bg-yellow-400 has-[input:checked]:text-black"
            >
              <input
                type="radio"
                name="format"
                value={f.value}
                defaultChecked={f.value === initialValues.format}
                className="sr-only"
              />
              {f.label}
            </label>
          ))}
        </div>
      </Field>

      <Field
        label="Server / region (opsional)"
        name="server_region"
        errors={fieldErrors["server_region"]}
      >
        <input
          name="server_region"
          maxLength={60}
          defaultValue={initialValues.server_region ?? ""}
          placeholder="mis. SEA, ID, Asia"
          className="h-10 w-full rounded-md border border-white/10 bg-zinc-900 px-3 text-sm text-white focus:border-yellow-400 focus:outline-none"
        />
      </Field>

      <Field
        label="Room info (opsional)"
        name="room_info"
        errors={fieldErrors["room_info"]}
      >
        <input
          name="room_info"
          maxLength={500}
          defaultValue={initialValues.room_info ?? ""}
          placeholder="ID room + password"
          className="h-10 w-full rounded-md border border-white/10 bg-zinc-900 px-3 text-sm text-white focus:border-yellow-400 focus:outline-none"
        />
      </Field>

      <Field label="Catatan (opsional)" name="notes" errors={fieldErrors["notes"]}>
        <textarea
          name="notes"
          rows={3}
          maxLength={2000}
          defaultValue={initialValues.notes ?? ""}
          placeholder="Catatan strategis, request map, dsb"
          className="w-full rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-yellow-400 focus:outline-none"
        />
      </Field>

      {globalError ? (
        <p className="rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
          {globalError}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-11 items-center gap-2 rounded-md bg-yellow-400 px-5 text-sm font-semibold text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Simpan Perubahan
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  errors,
  children,
}: {
  label: string;
  name: string;
  errors?: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={name} className="text-xs font-medium text-white/70">
        {label}
      </label>
      {children}
      {errors && errors.length > 0 ? (
        <p className="text-xs text-rose-400">{errors[0]}</p>
      ) : null}
    </div>
  );
}
```

### Step 7b: Create scrim edit page

- [ ] Create `app/[team-slug]/(workspace)/scrim/[id]/edit/page.tsx`:

```tsx
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ScrimEditForm } from "@/features/scrim/components/ScrimEditForm";
import { getScrimDetail } from "@/features/scrim/queries";
import { getCurrentUserRole } from "@/features/roster/queries";
import { getOrgBySlug, getPublicTeamData } from "@/features/teams/queries";

export const dynamic = "force-dynamic";

interface EditScrimPageProps {
  params: Promise<{ "team-slug": string; id: string }>;
}

const CAPTAIN_ROLES = ["captain", "manager", "owner"] as const;

export default async function EditScrimPage({ params }: EditScrimPageProps) {
  const { "team-slug": slug, id } = await params;
  const organization = await getOrgBySlug(slug);
  if (!organization) notFound();

  const currentUserRole = await getCurrentUserRole(organization.id);
  if (
    !currentUserRole ||
    !CAPTAIN_ROLES.includes(currentUserRole as (typeof CAPTAIN_ROLES)[number])
  ) {
    redirect(`/${slug}/scrim/${id}`);
  }

  const [detail, { divisions }] = await Promise.all([
    getScrimDetail(id),
    getPublicTeamData(organization),
  ]);
  if (!detail) notFound();

  const { scrim } = detail;
  if (scrim.status === "completed" || scrim.status === "cancelled") {
    redirect(`/${slug}/scrim/${id}`);
  }

  return (
    <div className="space-y-6 px-4 py-6 sm:px-8">
      <header className="space-y-1">
        <Link
          href={`/${slug}/scrim/${id}`}
          className="text-xs text-white/55 hover:text-white"
        >
          ← Kembali ke detail scrim
        </Link>
        <h1 className="text-2xl font-bold text-white sm:text-3xl">
          Edit scrim
        </h1>
        <p className="text-sm text-white/65">vs {scrim.opponent_name}</p>
      </header>

      <div className="max-w-2xl rounded-2xl border border-white/10 bg-zinc-900/40 p-5 sm:p-6">
        <ScrimEditForm
          scrimId={id}
          orgSlug={slug}
          divisions={divisions.map((d) => ({ id: d.id, name: d.name }))}
          initialValues={{
            division_id: scrim.division_id,
            opponent_name: scrim.opponent_name,
            opponent_contact: scrim.opponent_contact,
            scheduled_at: scrim.scheduled_at,
            format: scrim.format,
            server_region: scrim.server_region,
            room_info: scrim.room_info,
            notes: scrim.notes,
          }}
        />
      </div>
    </div>
  );
}
```

### Step 7c: Typecheck

- [ ] Run: `npx tsc --noEmit`
  Expected: no errors

### Step 7d: Commit

- [ ] `git add features/scrim/components/ScrimEditForm.tsx "app/[team-slug]/(workspace)/scrim/[id]/edit/page.tsx"`
- [ ] `git commit -m "feat(scrim): add edit scrim page and form for captain+"`

---

## Task 8: CancelScrimButton

**Files:**
- Create: `features/scrim/components/CancelScrimButton.tsx`

### Step 8a: Create CancelScrimButton

- [ ] Create `features/scrim/components/CancelScrimButton.tsx`:

```tsx
"use client";

import { Loader2, X } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { cancelScrimAction } from "@/features/scrim/actions";

interface CancelScrimButtonProps {
  scrimId: string;
  orgSlug: string;
}

export function CancelScrimButton({ scrimId, orgSlug }: CancelScrimButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showDialog, setShowDialog] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleConfirm() {
    startTransition(async () => {
      setError(null);
      const res = await cancelScrimAction(orgSlug, {
        scrim_id: scrimId,
        reason: reason.trim() || undefined,
      });
      if (!res.ok) {
        setError(res.message);
        return;
      }
      setShowDialog(false);
      router.refresh();
    });
  }

  if (!showDialog) {
    return (
      <button
        type="button"
        onClick={() => setShowDialog(true)}
        className="inline-flex h-9 items-center gap-2 rounded-md border border-rose-500/30 px-3 text-sm font-medium text-rose-400 transition hover:bg-rose-500/10"
      >
        <X className="h-4 w-4" />
        Batalkan Scrim
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 space-y-3">
      <p className="text-sm font-medium text-white">
        Yakin ingin membatalkan scrim ini?
      </p>
      <div className="space-y-1">
        <label className="text-xs text-white/60">
          Alasan pembatalan (opsional)
        </label>
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="mis. Lawan tidak hadir"
          maxLength={500}
          className="h-9 w-full rounded-md border border-white/10 bg-zinc-900 px-3 text-sm text-white focus:border-rose-400 focus:outline-none"
        />
      </div>
      {error && <p className="text-xs text-rose-400">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={pending}
          className="inline-flex h-9 items-center gap-2 rounded-md bg-rose-500 px-4 text-sm font-semibold text-white transition hover:bg-rose-400 disabled:opacity-60"
        >
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          Ya, batalkan
        </button>
        <button
          type="button"
          onClick={() => {
            setShowDialog(false);
            setError(null);
          }}
          disabled={pending}
          className="inline-flex h-9 items-center rounded-md border border-white/10 px-4 text-sm text-white/70 transition hover:bg-white/5"
        >
          Batal
        </button>
      </div>
    </div>
  );
}
```

### Step 8b: Typecheck

- [ ] Run: `npx tsc --noEmit`
  Expected: no errors

### Step 8c: Commit

- [ ] `git add features/scrim/components/CancelScrimButton.tsx`
- [ ] `git commit -m "feat(scrim): add CancelScrimButton client component"`

---

## Task 9: Wire Scrim Detail Page (Countdown + Edit + Cancel)

**Files:**
- Modify: `app/[team-slug]/(workspace)/scrim/[id]/page.tsx`

### Step 9a: Add imports

- [ ] In `app/[team-slug]/(workspace)/scrim/[id]/page.tsx`, update the imports block to add:
  ```typescript
  import { Pencil } from "lucide-react";
  import { ScrimCountdown } from "@/components/team/ScrimCountdown";
  import { CancelScrimButton } from "@/features/scrim/components/CancelScrimButton";
  import { getCurrentUserRole } from "@/features/roster/queries";
  ```

### Step 9b: Fetch role in the page function

- [ ] In the page function, add the role fetch after getting `detail`:
  ```typescript
  const detail = await getScrimDetail(id);
  if (!detail) notFound();
  const { scrim, attendances, result, divisionName, myAttendance } = detail;

  const currentUserRole = await getCurrentUserRole(scrim.organization_id);
  const canManageScrims = ["captain", "manager", "owner"].includes(
    currentUserRole ?? "",
  );
  ```

### Step 9c: Add countdown timer to the page header

- [ ] In the JSX, after the existing `<header>` block (after the `<dl>` closing tag), add the countdown for scheduled scrims:
  ```tsx
  {scrim.status === "scheduled" && (
    <div className="mt-4">
      <ScrimCountdown scrim={scrim} orgSlug={slug} />
    </div>
  )}
  ```

### Step 9d: Add Edit + Cancel action buttons

- [ ] Below the countdown block (still inside the page's main `<div>`), add a Captain-only action row. Place this **between** the `<header>` and the `<div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">` block:
  ```tsx
  {canManageScrims && (
    <div className="flex flex-wrap items-center gap-3">
      {!locked && (
        <Link
          href={`/${slug}/scrim/${scrim.id}/edit`}
          className="inline-flex h-9 items-center gap-2 rounded-md border border-white/10 px-3 text-sm font-medium text-white transition hover:bg-white/10"
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit Scrim
        </Link>
      )}
      {(scrim.status === "scheduled" || scrim.status === "ongoing") && (
        <CancelScrimButton scrimId={scrim.id} orgSlug={slug} />
      )}
    </div>
  )}
  ```

### Step 9e: Typecheck

- [ ] Run: `npx tsc --noEmit`
  Expected: no errors

### Step 9f: Commit

- [ ] `git add "app/[team-slug]/(workspace)/scrim/[id]/page.tsx"`
- [ ] `git commit -m "feat(scrim): add countdown timer, edit and cancel buttons for captain+"`

---

## Verification Checklist

After all tasks are complete, manually verify in the browser (`npm run dev`):

**Dashboard (`/dashboard`):**
- [ ] Header shows "Owner Dashboard" without the ⚡ emoji
- [ ] "Buat Tim Baru" form: no placeholder text in the name input
- [ ] "Buat Tim Baru" form: submitting without selecting a division shows "Pilih minimal satu divisi" error
- [ ] "Manager Tim & Divisi" table: clicking a team name opens the modal with org name, tier, member count, and divisions
- [ ] Modal closes on Escape, backdrop click, or X button

**Route Protection:**
- [ ] Visiting `/{slug}` while logged out redirects to `/login?next=/{slug}`
- [ ] After login, user is redirected back to `/{slug}`
- [ ] Visiting `/{slug}` while logged in but not a member shows the public profile

**Team Home (`/{slug}`):**
- [ ] Captain/Manager/Owner sees "Buat scrim" button linking to `/{slug}/scrim/new`
- [ ] Member/Coach does NOT see "Buat scrim" button
- [ ] Sidebar "Scrim" nav link navigates to `/{slug}/scrim`

**Scrim List (`/{slug}/scrim`):**
- [ ] Captain/Manager/Owner sees the yellow "Buat scrim" button
- [ ] Member/Coach does NOT see the "Buat scrim" button

**Scrim New (`/{slug}/scrim/new`):**
- [ ] Member/Coach visiting the URL directly is redirected to `/{slug}/scrim`
- [ ] Captain/Manager/Owner sees the form

**Scrim Edit (`/{slug}/scrim/{id}/edit`):**
- [ ] Captain/Manager/Owner can navigate here from the detail page
- [ ] Form pre-fills all scrim fields correctly (including time in WIB)
- [ ] Submitting saves changes and redirects to detail page
- [ ] Member/Coach visiting the URL directly is redirected to the detail page

**Scrim Detail (`/{slug}/scrim/{id}`):**
- [ ] Scheduled scrims show the countdown timer
- [ ] Captain/Manager/Owner sees "Edit Scrim" link and "Batalkan Scrim" button
- [ ] Member/Coach does NOT see edit or cancel controls
- [ ] Cancel flow: clicking opens the inline dialog, entering reason and confirming cancels the scrim and refreshes the page
- [ ] Completed/cancelled scrims do not show the "Edit Scrim" button
