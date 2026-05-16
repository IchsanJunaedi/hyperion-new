# Calendar Permission System

Comprehensive role-based access control (RBAC) and permission management for the Hyperion calendar system.

## Architecture Overview

The calendar permission system consists of four layers:

```
┌─────────────────────────────────────────────────────────────┐
│ Server Actions / Route Handlers                              │
├─────────────────────────────────────────────────────────────┤
│ Permission Checks (calendar-access.ts)                       │
│ - checkCalendarVisibility()                                  │
│ - checkEventVisibility()                                     │
│ - checkCalendarPermission()                                  │
├─────────────────────────────────────────────────────────────┤
│ Permission Resolution (calendar-rules.ts)                    │
│ - resolvePermissions()                                       │
│ - hasPermission()                                            │
│ - isRoleHigherOrEqual()                                      │
├─────────────────────────────────────────────────────────────┤
│ Database Layer (RLS Policies)                                │
│ - calendar_configs                                           │
│ - calendar_visibility_rules                                  │
│ - calendar_member_permissions                               │
│ - event_visibility                                           │
│ - calendar_audit_logs                                        │
└─────────────────────────────────────────────────────────────┘
```

## Key Concepts

### Role Hierarchy

Five roles with clear hierarchy:

```
Owner (5)
  └─ Manager (4)
      └─ Coach (3)
          └─ Captain (2)
              └─ Member (1)
```

**Owner**: Determined by `OWNER_EMAIL` environment variable, not from database.

### Visibility Levels

Six visibility levels control calendar access:

| Visibility | Who Can View | Best For |
|---|---|---|
| **private** | Only creator | Personal/draft calendars |
| **management-only** | Owner, Manager, Coach | Team management operations |
| **captain-only** | Owner, Manager, Coach, Captain | Captain-specific schedules |
| **team-only** | All active team members | Team events, everyone participates |
| **selected-members** | Explicit list + creator | Limited access, special events |
| **public-workspace** | All organization members | Organization-wide announcements |

### Permissions

Six granular permissions control what actions are allowed:

- **view**: Can see calendar/event
- **create-event**: Can create new events
- **edit-event**: Can modify existing events
- **delete-event**: Can remove events
- **manage-permissions**: Can grant/revoke access to other users
- **manage-calendar**: Can edit calendar settings

## Files Reference

### 1. `calendar-types.ts`
Type definitions for the entire system.

**Key Types:**
```typescript
// Visibility levels
type CalendarVisibility = 
  | "private"
  | "management-only"
  | "captain-only"
  | "team-only"
  | "selected-members"
  | "public-workspace";

// Roles
type UserRole = "owner" | "manager" | "coach" | "captain" | "member";

// Permissions
type CalendarPermission = 
  | "view"
  | "create-event"
  | "edit-event"
  | "delete-event"
  | "manage-permissions"
  | "manage-calendar";
```

### 2. `calendar-access.ts`
Core permission checking functions.

**Primary Functions:**
```typescript
// Get user's role
async function getUserRoleInOrg(userId: string, orgId: string): Promise<UserRole | null>

// Check calendar visibility
async function checkCalendarVisibility(
  userId: string, 
  calendarId: string, 
  orgId: string
): Promise<PermissionCheckResult>

// Check event visibility
async function checkEventVisibility(
  userId: string, 
  eventId: string, 
  orgId: string
): Promise<PermissionCheckResult>

// Comprehensive permission check
async function checkCalendarPermission(
  userId: string, 
  calendarId: string, 
  permission: CalendarPermission, 
  orgId: string
): Promise<PermissionCheckResult>

// Get all accessible calendars for user
async function getAccessibleCalendars(
  userId: string, 
  orgId: string
): Promise<AccessibleCalendarResult[]>

// Get all accessible events within date range
async function getAccessibleEvents(
  userId: string, 
  orgId: string, 
  dateRange: { from: string; to: string }
): Promise<AccessibleEventResult[]>

// Check if user can manage calendars
async function userCanManageCalendars(userId: string, orgId: string): Promise<boolean>

// Get permission context for caching
async function getPermissionContext(
  userId: string, 
  orgId: string
): Promise<{role, orgId, canManage}>
```

### 3. `calendar-rules.ts`
Permission decision logic and resolution.

**Key Functions:**
```typescript
// Resolve all permissions for a user
function resolvePermissions(
  userRole: UserRole | null,
  visibility: CalendarVisibility,
  explicitPermission?: CalendarMemberPermission,
  isCreator?: boolean
): Set<CalendarPermission>

// Check specific permission
function hasPermission(
  permissions: Set<CalendarPermission>,
  permission: CalendarPermission
): boolean

// Role hierarchy check
function isRoleHigherOrEqual(
  userRole: UserRole | null,
  requiredRole: UserRole
): boolean

// Get visibility description
function getVisibilityDescription(visibility: CalendarVisibility): string

// Get allowed actions for role at visibility
function getAllowedActionsForRole(
  userRole: UserRole | null,
  visibility: CalendarVisibility
): CalendarPermission[]

// Specific permission checks
function canViewCalendar(permissions: Set<CalendarPermission>): boolean
function canCreateEvents(permissions: Set<CalendarPermission>): boolean
function canEditEvents(permissions: Set<CalendarPermission>): boolean
function canDeleteEvents(permissions: Set<CalendarPermission>): boolean
function canManageCalendar(permissions: Set<CalendarPermission>): boolean
function canManagePermissions(permissions: Set<CalendarPermission>): boolean
```

### 4. `calendar-audit.ts`
Audit logging for compliance and debugging.

**Key Functions:**
```typescript
// Main audit function (non-blocking)
async function logCalendarAudit(
  orgId: string,
  action: CalendarAuditAction,
  entityType: CalendarAuditEntityType,
  entityId: string,
  actor: string,
  changes?: AuditChanges,
  metadata?: Record<string, unknown>
): Promise<void>

// Specialized logging
async function logCalendarCreated(...): Promise<void>
async function logCalendarUpdated(...): Promise<void>
async function logCalendarDeleted(...): Promise<void>
async function logEventCreated(...): Promise<void>
async function logEventUpdated(...): Promise<void>
async function logEventDeleted(...): Promise<void>
async function logEventVisibilityChanged(...): Promise<void>
async function logPermissionGranted(...): Promise<void>
async function logPermissionRevoked(...): Promise<void>
async function logPermissionUpdated(...): Promise<void>

// Audit log retrieval
async function getCalendarAuditLogs(
  orgId: string,
  filters?: {...},
  limit?: number
): Promise<CalendarAuditLog[]>

async function getCalendarChanges(orgId: string, calendarId: string): Promise<CalendarAuditLog[]>
async function getEventChanges(orgId: string, eventId: string): Promise<CalendarAuditLog[]>
async function getCalendarPermissionHistory(orgId: string, calendarId: string): Promise<CalendarAuditLog[]>
async function getUserActivityLogs(orgId: string, userId: string): Promise<CalendarAuditLog[]>
```

## Usage Examples

### Example 1: Check if user can view a calendar

```typescript
import { checkCalendarVisibility } from "@/lib/permissions/calendar-access";

const result = await checkCalendarVisibility(
  userId,
  calendarId,
  organizationId
);

if (result.allowed) {
  // Show calendar
} else {
  // Show error: result.reason
}
```

### Example 2: Get all calendars a user can access

```typescript
import { getAccessibleCalendars } from "@/lib/permissions/calendar-access";

const calendars = await getAccessibleCalendars(userId, organizationId);

// calendars is already filtered by visibility and permissions
calendars.forEach(cal => {
  console.log(cal.title, cal.visibility);
});
```

### Example 3: Create a calendar (with audit logging)

```typescript
import { 
  checkCalendarPermission,
  logCalendarCreated 
} from "@/lib/permissions/calendar-audit";

// Check if user can create calendars
const canCreate = await checkCalendarPermission(
  userId,
  null, // no calendar yet
  "manage-calendar",
  organizationId
);

if (!canCreate.allowed) {
  throw new Error(canCreate.reason);
}

// Create calendar...
const calendarId = generateUUID();

// Log the action
await logCalendarCreated(organizationId, calendarId, userId, {
  title: "Team Schedule",
  visibility: "team-only"
});
```

### Example 4: Check multiple permissions efficiently

```typescript
import { 
  getUserRoleInOrg,
  getPermissionContext
} from "@/lib/permissions/calendar-access";
import { 
  resolvePermissions,
  hasPermission 
} from "@/lib/permissions/calendar-rules";

// Get context once
const context = await getPermissionContext(userId, organizationId);

// Resolve permissions for a calendar
const permissions = resolvePermissions(
  context.role,
  "team-only",
  null,
  false // isCreator
);

// Check multiple actions
if (hasPermission(permissions, "create-event")) {
  // Show create button
}

if (hasPermission(permissions, "manage-permissions")) {
  // Show settings button
}
```

### Example 5: Event with visibility override

```typescript
import { checkEventVisibility } from "@/lib/permissions/calendar-access";

// Check event visibility (may differ from calendar visibility)
const eventCheck = await checkEventVisibility(
  userId,
  eventId,
  organizationId
);

// Event might be private even if calendar is team-only
if (!eventCheck.allowed) {
  return { ok: false, message: "Event visibility denies access" };
}

// Now it's safe to return event details
```

### Example 6: Audit trail for compliance

```typescript
import { getCalendarAuditLogs } from "@/lib/permissions/calendar-audit";

// Get all changes to a calendar
const logs = await getCalendarAuditLogs(
  organizationId,
  { calendarId },
  100
);

logs.forEach(log => {
  console.log(`${log.action} by ${log.actor_id} at ${log.created_at}`);
  console.log(log.changes); // What changed
});
```

## Permission Matrix

### Owner

| Visibility | View | Create | Edit | Delete | Manage Perms | Manage Cal |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| private | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| management-only | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| captain-only | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| team-only | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| selected-members | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| public-workspace | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

### Manager

| Visibility | View | Create | Edit | Delete | Manage Perms | Manage Cal |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| private | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| management-only | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| captain-only | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| team-only | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| selected-members | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| public-workspace | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

### Coach

| Visibility | View | Create | Edit | Delete | Manage Perms | Manage Cal |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| private | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| management-only | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| captain-only | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| team-only | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| selected-members | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| public-workspace | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |

### Captain

| Visibility | View | Create | Edit | Delete | Manage Perms | Manage Cal |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| private | ✅* | ✅* | ✅* | ✅* | ✅* | ✅* |
| management-only | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| captain-only | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| team-only | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| selected-members | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| public-workspace | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |

*Only if creator

### Member

| Visibility | View | Create | Edit | Delete | Manage Perms | Manage Cal |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| private | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| management-only | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| captain-only | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| team-only | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| selected-members | ✅** | ❌ | ❌ | ❌ | ❌ | ❌ |
| public-workspace | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

**If explicit permission granted

## RLS Policies

Database-level Row Level Security ensures no data leaks even if app logic is compromised.

### calendar_configs
- **SELECT**: User can view if `check_calendar_visibility()` returns true
- **INSERT**: Only owner/manager/coach/captain + `auth.uid() = created_by`
- **UPDATE**: Owner, or manager/coach with visibility, or creator (captain)
- **DELETE**: Owner, or manager/coach with visibility, or creator

### calendar_visibility_rules
- **SELECT**: Organization members
- **INSERT/UPDATE/DELETE**: Owner only

### calendar_member_permissions
- **SELECT**: Self, owner, or manager/coach/captain who can manage calendar
- **INSERT/UPDATE/DELETE**: Owner, or manager/coach/captain who can manage calendar

### event_visibility
- **SELECT**: Can view if user can access event
- **INSERT/UPDATE/DELETE**: Owner, manager, coach, or event creator

### calendar_audit_logs
- **SELECT**: Owner can see all; manager/coach can see accessible calendars/events
- **INSERT**: Owner, manager, coach
- **UPDATE/DELETE**: Blocked (immutable)

## Best Practices

### 1. Always Check Permissions Server-Side

```typescript
// ✅ Good: Server action
"use server";
import { checkCalendarPermission } from "@/lib/permissions/calendar-access";

export async function deleteCalendarAction(calendarId: string) {
  const userId = (await auth()).user?.id;
  const result = await checkCalendarPermission(
    userId,
    calendarId,
    "manage-calendar",
    orgId
  );
  
  if (!result.allowed) {
    return { ok: false, message: result.reason };
  }
  
  // Delete...
}

// ❌ Bad: Client-side check only
function DeleteButton() {
  const canDelete = userRole === "owner";
  if (!canDelete) return null;
  return <button>Delete</button>;
}
```

### 2. Log All Permission Changes

```typescript
// ✅ Good: Include audit trail
await logPermissionGranted(
  organizationId,
  calendarId,
  userId,
  memberUserId,
  { can_view: true, can_create_event: true },
  { reason: "User requested access" }
);
```

### 3. Use RLS as Defense in Depth

```typescript
// ✅ Good: RLS prevents data leaks
// Even if permission check fails, RLS blocks the query
const { data } = await supabase
  .from("calendar_configs")
  .select("*")
  .eq("id", calendarId);
// Only returns if RLS allows
```

### 4. Cache Permission Context

```typescript
// ✅ Good: Get context once, reuse
const context = await getPermissionContext(userId, organizationId);
// Use context.role for multiple checks
for (const calendar of calendars) {
  const perms = resolvePermissions(context.role, calendar.visibility);
  // ...
}
```

### 5. Handle Deleted Entities Gracefully

```typescript
// ✅ Good: Check for soft-deleted calendars
const result = await checkCalendarVisibility(
  userId,
  calendarId,
  organizationId,
  { includeDeleted: false } // Skip soft-deleted
);
```

## Debugging

### Enable Verbose Permission Checks

```typescript
const result = await checkCalendarVisibility(
  userId,
  calendarId,
  organizationId,
  { verbose: true }
);

console.log(result.reason); // Detailed denial reason
```

### Check Audit Logs

```typescript
import { getUserActivityLogs } from "@/lib/permissions/calendar-audit";

const logs = await getUserActivityLogs(organizationId, userId);
console.log("User actions:", logs);
```

### Verify RLS Policies

```sql
-- Check RLS policy definitions
SELECT schemaname, tablename, policyname, qual
FROM pg_policies
WHERE tablename LIKE 'calendar%';
```

## Future Enhancements

- [ ] Time-based access (scheduled calendar access)
- [ ] Delegation (temporary role elevation)
- [ ] Group permissions (role-based permission groups)
- [ ] Audit retention policies (auto-cleanup old logs)
- [ ] Permission approval workflows
- [ ] Bulk permission operations
- [ ] Permission conflict detection
- [ ] Analytics on permission usage
