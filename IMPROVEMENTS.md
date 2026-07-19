# Hyperion Codebase Audit Report & Improvements

This report documents findings from a thorough codebase audit of the Hyperion Esports Team Operating System (Next.js 15 App Router + Supabase + TypeScript). 

No code modifications were made. The findings below identify security issues, performance bottlenecks, compliance defects, architectural improvements, and test coverage gaps.

---

## Executive Summary Matrix

Findings are ranked first by **Impact** (value to security, performance, and stability) and then by **Effort** required to implement the fix.

| ID | Finding | Category | Severity | Impact | Effort | Recommendation |
|:---|:---|:---|:---|:---|:---|:---|
| **SEC-01** | Invite Hijacking (Email bypass in `acceptInviteAction`) | Security | **CRITICAL** | High | Low | Add email validation in acceptance check |
| **SEC-02** | Actor List Leak (Bypass in `fetchDistinctActors`) | Security | **MEDIUM** | Medium | Low | Add global owner verification check |
| **SEC-03** | IDOR in Manual Todo Creation (`createManualTodoAction`) | Security | **MEDIUM** | Medium | Low | Verify user membership in organization |
| **AUD-01** | Missing `logAudit` in 15+ Write Server Actions | Compliance | **MEDIUM** | High | Low-Med | Call `logAudit()` on all write operations |
| **PRF-01** | N+1 Database Query loop in Calendar Permissions | Performance | **HIGH** | High | Medium | Bulk query role/configs, check in-memory |
| **PRF-02** | Smart Todos Waterfall Queries on Page Layouts | Performance | **HIGH** | High | Medium | Fetch badge counts client-side (react-query) |
| **ARC-01** | Legacy Matchmaking Feature Active in Scrim Workspace | Architecture| **LOW** | Low | Low | Remove matchmaking imports and components |
| **CFG-01** | Supabase Project ID Mismatch in `package.json` | Tooling | **LOW** | Low | Low | Align project IDs with remote target |
| **CFG-02** | TypeScript Exclude Typo in `tsconfig.json` | Build | **LOW** | Low | Low | Fix mangled exclude path string |
| **TST-01** | Massive Test Gaps (Major features have 0% coverage) | Testing | **HIGH** | High | High | Implement unit tests for missing modules |

---

## 1. Security Issues

### SEC-01: Invite Hijacking (Email verification bypass in `acceptInviteAction`)
*   **File**: [`app/invite/[token]/actions.ts` (Lines 12–156)](file:///e:/hyperion-new/app/invite/[token]/actions.ts#L12-L156)
*   **Severity**: **CRITICAL**
*   **Details**: When a manager creates an invite specifying a target email address (`invite.email`), the action [acceptInviteAction](file:///e:/hyperion-new/app/invite/[token]/actions.ts#L12) fails to check whether the currently logged-in user's email matches the invite's email. Anyone who gets hold of the invite link can accept the token and join the organization under the targeted role (e.g. Captain or Coach).
    *   *Note*: The corresponding [rejectInviteAction](file:///e:/hyperion-new/app/invite/[token]/actions.ts#L158-L203) does correctly validate this on line 189:
        ```typescript
        if (invite.email && invite.email !== user.email) {
          return { error: "Undangan ini bukan untuk akun Anda." };
        }
        ```
*   **Recommended Fix**: Insert the same email matching check inside `acceptInviteAction` before claiming the invite status.

---

### SEC-02: Actor List Leak (Role check bypass in `fetchDistinctActors`)
*   **File**: [`features/dashboard/actions/fetchAuditLogs.ts` (Lines 114–151)](file:///e:/hyperion-new/features/dashboard/actions/fetchAuditLogs.ts#L114-L151)
*   **Severity**: **MEDIUM**
*   **Details**: Unlike `fetchAuditLogs` and `fetchAuditActivity` which restrict access to the global owner, [fetchDistinctActors](file:///e:/hyperion-new/features/dashboard/actions/fetchAuditLogs.ts#L114) only verifies if the user is authenticated:
    ```typescript
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    
    const admin = createAdminClient(); // Bypasses RLS
    // Queries audit logs and retrieves all profiles...
    ```
    This allows any regular team member or applicant across any organization to retrieve the names and user IDs of all actors recorded in system-wide audit logs.
*   **Recommended Fix**: Gating the function with the owner email check:
    ```typescript
    const ownerEmail = process.env.OWNER_EMAIL;
    if (user.email !== ownerEmail) return [];
    ```

---

### SEC-03: IDOR in Manual Todo Creation (`createManualTodoAction`)
*   **File**: [`features/todos/actions.ts` (Lines 40–118)](file:///e:/hyperion-new/features/todos/actions.ts#L40-L118)
*   **Severity**: **MEDIUM**
*   **Details**: The [createManualTodoAction](file:///e:/hyperion-new/features/todos/actions.ts#L40) checks if the caller is logged in, but does not check if they are a member of the targeted `orgId` (since it uses `createAdminClient()` to perform the insert). Any authenticated user could create unassigned manual todos inside other organizations.
*   **Recommended Fix**: Add a membership/role verification gate:
    ```typescript
    const admin = createAdminClient();
    const { data: membership } = await admin
      .from("team_members")
      .select("id")
      .eq("organization_id", orgId)
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();
    if (!membership) return { ok: false, message: "Akses ditolak" };
    ```

---

## 2. Performance Bottlenecks

### PRF-01: N+1 Database Query loop in Calendar Permissions
*   **File**: [`lib/permissions/calendar-access.ts` (Lines 586–674 and 690–768)](file:///e:/hyperion-new/lib/permissions/calendar-access.ts#L586-L674)
*   **Severity**: **HIGH**
*   **Details**: 
    1.  [getAccessibleCalendars](file:///e:/hyperion-new/lib/permissions/calendar-access.ts#L586) iterates over all active calendars and queries the database inside the loop:
        ```typescript
        for (const calendar of calendars) {
          const visCheck = await checkCalendarVisibility(userId, calendar.id, organizationId);
          // checkCalendarVisibility queries getUserRoleInOrg + calendar configs
        }
        ```
    2.  [getAccessibleEvents](file:///e:/hyperion-new/lib/permissions/calendar-access.ts#L690) does a similar N+1 loop for *every event* within the queried date range to verify if the user can see it:
        ```typescript
        for (const event of events) {
          const visCheck = await checkEventVisibility(userId, event.id, organizationId);
        }
        ```
    This produces a massive database load (e.g. 50 events trigger 100+ database roundtrips) on every calendar grid request.
*   **Recommended Fix**:
    *   Query user role once at the beginning.
    *   Fetch calendar configurations, visibilities, and explicit member permissions in bulk using `.in("id", ...)` or `.in("calendar_id", ...)`.
    *   Perform permission matching in memory.

---

### PRF-02: Smart Todos Waterfall Queries on Page Layouts
*   **File**: [`features/todos/queries.ts` (Lines 268–294)](file:///e:/hyperion-new/features/todos/queries.ts#L268-L294)
*   **Severity**: **HIGH**
*   **Details**: Every time `getTodoBadgeCount` is called, it triggers `computeSmartTodos` which runs 7 database lookup functions in parallel using `Promise.all`. This causes up to 12 separate database queries to count expiring contracts, overdue payments, unassigned members, pending trials, scrims without results, stale sponsors, and tournaments without brackets.
    Since `getTodoBadgeCount` is rendered server-side inside BOTH `/manage/[orgSlug]` and `/dashboard` layout files, **every single page request bogs down the server response time** with this 12-query waterfall payload.
*   **Recommended Fix**: Remove the layout-blocking server-side count. Instead, write a client-side layout component that fetches the badge count asynchronously in the background using TanStack Query (`useQuery`) calling a lightweight API endpoint.

---

## 3. Compliance and Architectural Issues

### AUD-01: Missing `logAudit` in 15+ Write Server Actions
*   **Severity**: **MEDIUM**
*   **Details**: Section 7 of `AGENTS.md` mandates that all create/update/delete server actions must call `logAudit()`. However, the following key server actions write to the database but fail to log audits:
    *   **Calendar**: `createCalendarEventAction`, `updateCalendarEventAction`, `updateEventPropertyAction`, `deleteCalendarEventAction`, `dragRescheduleEventAction`
    *   **Trials**: `createTrialAction`, `updateTrialStatusAction`, `updateApplicantStatusAction`, `deleteApplicantAction`
    *   **Sponsors**: `createSponsorAction`, `updateSponsorAction`, `deleteSponsorAction`, `addDeliverableAction`, `updateDeliverableStatusAction`, `deleteDeliverableAction`, `addSponsorNoteAction`, `deleteSponsorNoteAction`
    *   **Roster**: `updateRoleAction`, `createInviteAction`
    *   **Polls**: `closePollAction`
*   **Recommended Fix**: Import `logAudit` and call it on successful database insertions, updates, or deletions, passing the correct `actorId`, `action`, `entityType`, and `entityId`.

---

### ARC-01: Legacy Matchmaking Feature Active in Scrim Workspace
*   **File**: [`app/[team-slug]/(workspace)/scrim/page.tsx` (Lines 10–12, 51–53, 66–71, 134–137)](file:///e:/hyperion-new/app/[team-slug]/(workspace)/scrim/page.tsx#L10)
*   **Severity**: **LOW**
*   **Details**: The workspace `/scrim` page imports and renders `<MatchmakingSection>` and `<FindOpponentButton>` directly. However, Section 17 of `AGENTS.md` explicitly lists `features/matchmaking/` as a "Dead Feature (archived, do not use)".
*   **Recommended Fix**: Clean up the legacy matchmaking imports and UI elements in `scrim/page.tsx` to prevent user confusion and reduce frontend bundle size.

---

### CFG-01: Supabase Project ID Mismatch in `package.json`
*   **File**: [`package.json` (Line 12)](file:///e:/hyperion-new/package.json#L12)
*   **Severity**: **LOW**
*   **Details**: The `db:types` script in `package.json` is hardcoded to `--project-id tbuxtlbtjpoholcflmoy`, whereas `AGENTS.md` and `progress.md` state that the correct project ID is `pqzdukrlmbwjjgjyoqva`. Running `npm run db:types` might fail or fetch types from a wrong environment.
*   **Recommended Fix**: Update the project ID in `package.json` to `pqzdukrlmbwjjgjyoqva`.

---

### CFG-02: TypeScript Exclude Typo in `tsconfig.json`
*   **File**: [`tsconfig.json` (Line 35)](file:///e:/hyperion-new/tsconfig.json#L35)
*   **Severity**: **LOW**
*   **Details**: The exclude list has a typo string `"Ehyperion-newtypesdatabase.ts"`. This means the compiled TS loader is not ignoring the massive autogenerated database type file properly during incremental checks.
*   **Recommended Fix**: Replace `"Ehyperion-newtypesdatabase.ts"` with `"types/database.ts"`.

---

## 4. Test Coverage Gaps

### TST-01: Massive Gaps in Unit Tests
*   **Severity**: **HIGH**
*   **Details**: The codebase CI gate enforces an 80% coverage threshold on statements, lines, and functions. While this is currently passing overall, several features have **0% unit test coverage** (completely missing `__tests__` directories):
    *   `features/calendar/` (Core visibility gating, CRUD, RSVPs)
    *   `features/sponsors/` (Sponsor tracking, notes, deliverables)
    *   `features/polls/` (Regular and availability grid type polls)
    *   `features/strategy/` (Strategy notes, threaded comments)
    *   `features/announcements/` (Announcements, read-receipts)
    *   `features/notifications/` (In-app and WA notification handlers)
    *   `features/invite/` (Link generation, accepting/rejecting invites)
    *   *Partial Coverage*: Both `features/todos/` and `features/salary/` only contain a logic test file, leaving their actions and queries entirely untested.
*   **Recommended Fix**: Develop vitest unit tests for actions, queries, and permissions in each of these feature modules to ensure compliance and avoid regressions during future updates.
