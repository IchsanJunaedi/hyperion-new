# Design Spec: Dashboard, Security & Scrim Improvements

**Date:** 2026-05-15  
**Status:** Approved

---

## Overview

Six discrete improvements across the admin dashboard, route security, and team workspace scrim management.

---

## Section 1: Dashboard Quick Fixes

### 1a. Remove ⚡ emoji from Owner Dashboard header
- **File:** `app/dashboard/page.tsx` line 115
- **Change:** `"⚡ Owner Dashboard"` → `"Owner Dashboard"`

### 1b. Remove placeholder from CreateTeamForm name input
- **File:** `features/dashboard/components/CreateTeamForm.tsx`
- **Change:** Remove `placeholder="mis. Hyperion Six"` attribute from the team name `<input>`

### 1c. Division selection required in CreateTeamForm
- **File:** `features/dashboard/components/CreateTeamForm.tsx`
- **Change:** In `handleSubmit`, before calling the action, validate `selectedDivisionIds.length === 0` and set error `"Pilih minimal satu divisi"`. Cancel submit if invalid. Display error below the division toggle section (same pattern as the name field error).

---

## Section 2: Clickable Team Names in Manager Tim & Divisi

**Pattern:** Follows `UserActiveTable` + `UserDetailModal` already in the codebase.

### New file: `features/dashboard/components/OrgDetailModal.tsx`
- Modal overlay, same structure as `UserDetailModal`
- Props: `org: { id, name, slug, tier } | null`, `divisions: Array<{id, name}>`, `memberCount: number`, `onClose: () => void`
- Displays: org name, slug, tier, member count, list of associated divisions
- Close: click backdrop, X button, or Escape key
- No additional DB queries — uses data already fetched in the page

### Change: `app/dashboard/page.tsx` — `ManagerAssignments` component
- Convert to a client component (`"use client"`) since it needs `useState`
- Add `useState<{ id: string; name: string; slug: string } | null>` for `selectedOrg`
- "Tim" column cell changes from plain text → `<button>` with style `text-yellow-400 hover:underline cursor-pointer`
- Render `<OrgDetailModal>` below the table, passing relevant `allDivisions` filtered by org and member count from `members`

---

## Section 3: Route Protection for Guest Users

**Scope:** Only unauthenticated (guest) users are blocked. Logged-in non-members still see the public profile.

### Change: `app/[team-slug]/page.tsx`
In the `if (!member)` branch, add a redirect guard before rendering `PublicTeamProfile`:

```typescript
if (!member) {
  if (!user) {
    redirect(`/login?next=/${slug}`)
  }
  // logged-in non-member → public profile (unchanged)
  const publicData = await getPublicTeamData(organization)
  return <><Header /><PublicTeamProfile {...publicData} /></>
}
```

No changes to `middleware.ts`. The existing `?next=` handling in middleware already redirects back after login.

---

## Section 4: Captain CRUD Scrim + Countdown + Navigation Fix

### 4a. Fix "Buat scrim" link in TeamHome
- **File:** `components/team/TeamHome.tsx`
  - Add prop `canManageScrims: boolean`
  - "Buat scrim" button only renders when `canManageScrims === true`
  - Link target: `/${slug}/scrim/new` (was `/${slug}/scrim`)
- **File:** `app/[team-slug]/page.tsx`
  - Call `getCurrentUserRole(organization.id)` (already imported via roster queries)
  - Pass `canManageScrims={['captain','manager','owner'].includes(currentUserRole ?? '')}` to `<TeamHome>`

### 4b. Role-gate on scrim list & new pages
- **File:** `app/[team-slug]/(workspace)/scrim/page.tsx`
  - Fetch `currentUserRole` via `getCurrentUserRole`
  - "Buat scrim" button (Plus icon) only renders for Captain/Manager/Owner
- **File:** `app/[team-slug]/(workspace)/scrim/new/page.tsx`
  - Fetch `currentUserRole`
  - If role is not Captain/Manager/Owner → `redirect(/${slug}/scrim)`

### 4c. Countdown timer on scrim detail page
- **File:** `app/[team-slug]/(workspace)/scrim/[id]/page.tsx`
  - Import `ScrimCountdown` (already exists at `components/team/ScrimCountdown.tsx`)
  - For scrims with `status === 'scheduled'`, render `<ScrimCountdown scrim={scrim} orgSlug={slug} />` in the page header area, above the attendance section
  - The component already handles live countdown + locale formatting

### 4d. Cancel scrim button for Captain+
- **New file:** `features/scrim/components/CancelScrimButton.tsx`
  - Client component (`"use client"`)
  - Props: `scrimId: string`, `orgSlug: string`
  - State: `showDialog: boolean`, `reason: string`, `pending`
  - Renders: "Batalkan Scrim" button → opens inline confirmation with optional reason input → calls `cancelScrimAction`
  - Shows toast/error on failure
- **File:** `app/[team-slug]/(workspace)/scrim/[id]/page.tsx`
  - Fetch `currentUserRole`
  - For Captain/Manager/Owner, render `<CancelScrimButton>` when `scrim.status` is `scheduled` or `ongoing`

### 4e. Edit scrim for Captain+

#### Validation
- **File:** `lib/validations/scrim.ts`
- Add `updateScrimSchema`: same fields as `createScrimSchema` but `scrim_id: z.string().uuid()` added, all other fields stay the same (required fields remain required)

#### Server action
- **File:** `features/scrim/actions.ts`
- Add `updateScrimAction(orgSlug: string, raw: unknown)`: validates with `updateScrimSchema`, updates `scrims` row, revalidates paths. RLS on the table already gates to Captain+.

#### New page
- **File:** `app/[team-slug]/(workspace)/scrim/[id]/edit/page.tsx`
  - Fetch scrim detail + role check (redirect non-Captain+)
  - Render `<ScrimEditForm>` with initial values from existing scrim

#### New component
- **File:** `features/scrim/components/ScrimEditForm.tsx`
  - Same structure as `ScrimForm` but accepts `initialValues` prop and `scrimId`
  - Submit calls `updateScrimAction`
  - On success, redirect to `/${orgSlug}/scrim/${scrimId}`
  - Submit button label: "Simpan Perubahan"

#### Edit button on detail page
- **File:** `app/[team-slug]/(workspace)/scrim/[id]/page.tsx`
  - For Captain/Manager/Owner, render a `<Link href="edit">` button when scrim is not completed/cancelled

---

## Files Changed Summary

| File | Change Type |
|------|-------------|
| `app/dashboard/page.tsx` | Modify — remove emoji, add OrgDetailModal integration |
| `features/dashboard/components/CreateTeamForm.tsx` | Modify — remove placeholder, add division validation |
| `features/dashboard/components/OrgDetailModal.tsx` | **New** |
| `app/[team-slug]/page.tsx` | Modify — guest redirect + pass canManageScrims |
| `components/team/TeamHome.tsx` | Modify — add canManageScrims prop, fix link |
| `app/[team-slug]/(workspace)/scrim/page.tsx` | Modify — role-gate Buat scrim button |
| `app/[team-slug]/(workspace)/scrim/new/page.tsx` | Modify — role redirect |
| `app/[team-slug]/(workspace)/scrim/[id]/page.tsx` | Modify — countdown, cancel btn, edit btn |
| `app/[team-slug]/(workspace)/scrim/[id]/edit/page.tsx` | **New** |
| `features/scrim/components/CancelScrimButton.tsx` | **New** |
| `features/scrim/components/ScrimEditForm.tsx` | **New** |
| `features/scrim/actions.ts` | Modify — add updateScrimAction |
| `lib/validations/scrim.ts` | Modify — add updateScrimSchema |

---

## Constraints & Assumptions

- No database schema changes required — existing RLS already gates scrims to Captain+
- `MatchFormat` enum (`bo1/bo3/bo5/scrimmage`) unchanged
- Only unauthenticated users blocked from team profile (Pilihan A)
- `getCurrentUserRole` from `features/roster/queries` is reused across all new role checks
