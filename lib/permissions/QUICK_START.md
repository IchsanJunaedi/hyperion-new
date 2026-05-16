# Calendar Permission System - Quick Start Guide

**TL;DR**: Three-layer permission system with RLS (database), permission checks (application), and audit logs.

## 5-Minute Setup

### 1. Apply Migration
```bash
npx supabase db push
```
This creates RLS policies and helper functions.

### 2. Check Permissions in Server Actions
```typescript
"use server";
import { checkCalendarPermission } from "@/lib/permissions/calendar-access";

export async function createEventAction(calendarId: string) {
  const userId = (await auth()).user?.id;
  
  // Check if user can create events
  const result = await checkCalendarPermission(
    userId,
    calendarId,
    "create-event",
    organizationId
  );

  if (!result.allowed) {
    return { ok: false, message: result.reason };
  }

  // Create event... RLS provides defense-in-depth
  return { ok: true };
}
```

### 3. Log the Action
```typescript
import { logEventCreated } from "@/lib/permissions/calendar-audit";

await logEventCreated(
  organizationId,
  eventId,
  calendarId,
  userId,
  { title: "Team Meeting", starts_at: "2026-05-20T10:00:00Z" }
);
```

Done! RLS policies enforce access at database level.

---

## Common Tasks

### Get All Calendars User Can Access
```typescript
import { getAccessibleCalendars } from "@/lib/permissions/calendar-access";

const calendars = await getAccessibleCalendars(userId, organizationId);
// Already filtered by visibility + permissions
```

### Check If User Can Manage Calendars
```typescript
import { userCanManageCalendars } from "@/lib/permissions/calendar-access";

if (await userCanManageCalendars(userId, organizationId)) {
  // Show calendar management UI
}
```

### Get User's Role
```typescript
import { getUserRoleInOrg } from "@/lib/permissions/calendar-access";

const role = await getUserRoleInOrg(userId, organizationId);
// Returns: "owner" | "manager" | "coach" | "captain" | "member" | null
```

### Resolve Permissions for a Calendar
```typescript
import { resolvePermissions } from "@/lib/permissions/calendar-rules";

const perms = resolvePermissions(
  role,                    // "captain"
  "team-only",            // visibility
  null,                   // no explicit grant
  false                   // not creator
);

if (perms.has("create-event")) {
  // Can create events
}
```

### View Audit Trail
```typescript
import { getCalendarChanges, getUserActivityLogs } from "@/lib/permissions/calendar-audit";

// What changed in a calendar?
const changes = await getCalendarChanges(organizationId, calendarId);

// What did a user do?
const activity = await getUserActivityLogs(organizationId, userId);
```

---

## Permission Matrix at a Glance

```
Owner:   Full access everywhere
Manager: Manage non-private calendars
Coach:   Create/edit team calendars (can't manage)
Captain: Full access to own calendars only
Member:  View-only (based on visibility)
```

**6 Visibility Levels**:
- `private` - Creator only
- `management-only` - Owner, Manager, Coach
- `captain-only` - + Captain
- `team-only` - All team members
- `selected-members` - Explicit list
- `public-workspace` - All org members

---

## RLS + App Logic = Defense in Depth

```
RLS blocks unauthorized queries at database
    ↓
Permission check returns detailed reason
    ↓
Audit log tracks what happened
```

**Owner detection**: Via `OWNER_EMAIL` env var (not database)

---

## Debugging

### Enable Verbose Error Reasons
```typescript
const result = await checkCalendarVisibility(userId, calendarId, orgId, {
  verbose: true
});
console.log(result.reason); // "Captain-only calendar - requires captain or higher role"
```

### Check Audit Logs
```typescript
const logs = await getCalendarAuditLogs(organizationId, {
  action: "permission_granted"
});
```

### Verify RLS is Active
```sql
-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename LIKE 'calendar%';
```

---

## Performance Tips

```typescript
// ✅ GOOD: Cache permission context
const ctx = await getPermissionContext(userId, orgId);
for (const cal of calendars) {
  const perms = resolvePermissions(ctx.role, cal.visibility);
  // Use perms...
}

// ❌ BAD: Fetch context repeatedly
for (const cal of calendars) {
  const ctx = await getPermissionContext(userId, orgId); // Don't!
}
```

---

## File Structure

```
lib/permissions/
├── calendar-types.ts      ← Type definitions
├── calendar-access.ts     ← Permission checks
├── calendar-rules.ts      ← Decision logic
├── calendar-audit.ts      ← Audit logging
├── README.md             ← Full documentation
└── QUICK_START.md        ← This file

supabase/migrations/
└── 20260516000002_calendar_rls_policies.sql ← RLS
```

---

## API Reference

**Check Functions**:
- `checkCalendarVisibility()` - Can user view calendar?
- `checkEventVisibility()` - Can user view event?
- `checkCalendarPermission()` - Can user perform action?

**Query Functions**:
- `getAccessibleCalendars()` - Get all viewable calendars
- `getAccessibleEvents()` - Get all viewable events
- `getUserRoleInOrg()` - Get user's role

**Resolution Functions**:
- `resolvePermissions()` - Get all permissions as Set
- `hasPermission()` - Check if permission is granted
- `isRoleHigherOrEqual()` - Check role hierarchy

**Audit Functions**:
- `logCalendarCreated()` / `logCalendarUpdated()` / `logCalendarDeleted()`
- `logEventCreated()` / `logEventUpdated()` / `logEventDeleted()`
- `logEventVisibilityChanged()`
- `logPermissionGranted()` / `logPermissionRevoked()` / `logPermissionUpdated()`
- `getCalendarAuditLogs()` / `getCalendarChanges()` / `getUserActivityLogs()`

See `README.md` for detailed documentation.

---

## Next: Integration

1. ✅ RLS policies applied
2. ⏭️ Add permission checks to calendar CRUD actions
3. ⏭️ Integrate audit logging with operations
4. ⏭️ Add permission UI in calendar management page
5. ⏭️ Test access control thoroughly

---

**Status**: Ready to use | **Type Safety**: ✅ Full TypeScript | **RLS**: ✅ Enabled
