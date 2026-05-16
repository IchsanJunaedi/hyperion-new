# Calendar Permission System - API Routes & Middleware

Dokumentasi lengkap untuk API routes dan middleware yang mendukung calendar permission system di Hyperion.

## Architecture Overview

```
├── lib/api/
│   ├── response.ts              # Standardized API responses
│   ├── permission-middleware.ts # Auth, permission checks, rate limiting
│   └── calendar-cascade.ts      # Cascading updates & cleanup
├── lib/supabase/
│   └── calendar-realtime.ts     # Real-time subscriptions
└── app/api/
    ├── calendar/
    │   ├── permissions/         # Permission management
    │   ├── visibility/          # Visibility settings
    │   ├── events/              # Event-specific overrides
    │   └── audit-logs/          # Audit trail
    └── organization/
        └── [orgSlug]/permission-context/  # User permission context
```

## Core Middleware

### `lib/api/response.ts`

Standardized response formatting untuk semua API routes.

**Functions:**
- `success<T>(data: T, statusCode?: number): Response` - Success response with data
- `error(message: string, statusCode?: number, details?: any): Response` - Error response
- `unauthorized(message?: string): Response` - 401 response
- `forbidden(message?: string): Response` - 403 response
- `notFound(message?: string): Response` - 404 response
- `badRequest(message?: string, errors?: any): Response` - 400 response
- `internalError(message?: string): Response` - 500 response
- `withErrorHandling<T>(handler: () => Promise<T>): Promise<Response>` - Error wrapper

### `lib/api/permission-middleware.ts`

Permission dan authentication middleware untuk API routes.

**Functions:**

#### `validateRequest(req: NextRequest)`
Validates user authentication and resolves organization context.

**Returns:**
```typescript
{
  valid: boolean
  user: { id: string; email: string } | null
  orgId: string | null
  error?: string
}
```

#### `isOwner(userEmail: string): boolean`
Checks if user is the organization owner (by OWNER_EMAIL env var).

#### `getUserRole(userId: string, orgId: string): Promise<MemberRole | null>`
Gets user's role in the organization.

#### `requireRole(userId: string, orgId: string, minRole: MemberRole)`
Checks if user meets minimum role requirement.

**Returns:**
```typescript
{
  allowed: boolean
  userRole?: MemberRole | null
  error?: string
}
```

#### `requireCalendarPermission(userId: string, calendarId: string, permission: CalendarPermission)`
Checks if user has specific permission on calendar (respects both explicit permissions and role-based access).

#### `applyRateLimit(userId: string, limit?: number): Promise<{ allowed: boolean; remaining?: number; resetAt?: number }>`
Rate limiting (100 requests/minute default).

### `lib/api/calendar-cascade.ts`

Handles cascading updates when permissions, visibility, or events change.

**Functions:**

- `invalidateCalendarEventCache(calendarId: string)` - Invalidate event cache
- `cascadePermissionChange(calendarId, memberId, oldPerms, newPerms)` - Cascade permission changes to audit log & notifications
- `invalidateUserCalendarCache(userId: string)` - Invalidate user's calendar cache
- `cleanupCalendarOnDelete(calendarId: string)` - Full cleanup when calendar deleted
- `cascadeVisibilityChange(calendarId, oldVisibility, newVisibility, actorId, selectedMemberIds?)` - Cascade visibility changes
- `updateCalendarMemberAccessOnVisibilityChange(calendarId, newVisibility)` - Update member access based on new visibility
- `auditEventCreation(eventId, calendarId, actorId, eventTitle)` - Log event creation
- `auditEventModification(eventId, calendarId, actorId, changes)` - Log event modifications

### `lib/supabase/calendar-realtime.ts`

Real-time subscription utilities untuk permission dan visibility changes.

**Functions:**

- `subscribeToCalendarPermissions(calendarId, callback)` - Listen to permission changes
- `subscribeToCalendarAuditLogs(calendarId, callback)` - Listen to audit logs
- `subscribeToEventVisibility(eventId, callback)` - Listen to event visibility changes
- `subscribeToCalendarConfig(calendarId, callback)` - Listen to calendar config changes
- `subscribeToMultipleCalendars(calendarIds, callback)` - Listen to multiple calendars
- `subscribeToOrganizationCalendars(organizationId, callback)` - Listen to all calendars in organization

## API Routes

### Calendar Permissions

#### `GET /api/calendar/permissions`

List all calendar permissions untuk user's organization.

**Query Params:**
- `calendarId?` - Filter by specific calendar (UUID)
- `limit?` - Results per page (default: 50, max: 100)
- `offset?` - Pagination offset (default: 0)

**Response:**
```typescript
{
  ok: true
  data: {
    permissions: Array<{
      id: string
      calendar_id: string
      member_user_id: string
      can_view: boolean
      can_create_event: boolean
      can_edit_event: boolean
      can_delete_event: boolean
      can_manage_permissions: boolean
      created_at: string
      updated_at: string
      profiles: { id, display_name, avatar_url }
    }>
    pagination: { limit, offset, total }
  }
}
```

#### `GET /api/calendar/permissions/[calendarId]`

Get calendar's member permissions.

**Response:** Same as GET /api/calendar/permissions (filtered to one calendar)

#### `PUT /api/calendar/permissions/[calendarId]`

Update calendar permissions (manager+ required).

**Request Body:**
```typescript
{
  permissions: {
    [memberId: string]: {
      can_view?: boolean
      can_create_event?: boolean
      can_edit_event?: boolean
      can_delete_event?: boolean
      can_manage_permissions?: boolean
    }
  }
}
```

**Response:**
```typescript
{
  ok: true
  data: {
    ok: true
    message: "Permissions updated"
  }
}
```

#### `POST /api/calendar/permissions/[calendarId]/members`

Grant or update member permission (manager+ required).

**Request Body:**
```typescript
{
  memberUserId: string  // UUID
  permissions: {
    can_view?: boolean
    can_create_event?: boolean
    can_edit_event?: boolean
    can_delete_event?: boolean
    can_manage_permissions?: boolean
  }
}
```

#### `DELETE /api/calendar/permissions/[calendarId]/members?memberId=...`

Revoke member permission (manager+ required).

**Query Params:**
- `memberId` - Member user ID (UUID)

### Calendar Visibility

#### `GET /api/calendar/visibility/[calendarId]`

Get calendar visibility settings.

**Response:**
```typescript
{
  ok: true
  data: {
    visibility: "private" | "management-only" | "captain-only" | "team-only" | "selected-members" | "public-workspace"
    selectedMembers: Array<{ member_user_id, profiles }>
    currentUserPermissions: { ... }
  }
}
```

#### `PUT /api/calendar/visibility/[calendarId]`

Update calendar visibility (captain+ required).

**Request Body:**
```typescript
{
  visibility: string
  selectedMemberIds?: string[]  // For "selected-members" visibility
}
```

#### `POST /api/calendar/visibility/[calendarId]/check`

Check if current user can access calendar with specific permission.

**Request Body:**
```typescript
{
  permission: "view" | "create-event" | "edit-event" | "delete-event" | "manage"
}
```

**Response:**
```typescript
{
  ok: true
  data: {
    allowed: boolean
    reason?: string
    calendar: { id, visibility }
  }
}
```

### Event Visibility

#### `GET /api/calendar/events/[eventId]/visibility`

Get event visibility (with override detection).

**Response:**
```typescript
{
  ok: true
  data: {
    eventId: string
    calendarVisibility: string
    override: { ... } | null
    effectiveVisibility: string
    allowedMembers: string[]
  }
}
```

#### `PUT /api/calendar/events/[eventId]/visibility`

Set event visibility override (captain+ required).

**Request Body:**
```typescript
{
  visibility: string
  allowedMemberIds?: string[]
}
```

#### `DELETE /api/calendar/events/[eventId]/visibility`

Reset event visibility to calendar default (captain+ required).

### Calendar Audit Logs

#### `GET /api/calendar/audit-logs`

List audit logs (manager+ required).

**Query Params:**
- `calendarId?` - Filter by calendar
- `eventId?` - Filter by event
- `action?` - Filter by action type
- `from?` - Start date (ISO 8601)
- `to?` - End date (ISO 8601)
- `limit?` - Results per page (default: 50, max: 100)
- `offset?` - Pagination offset (default: 0)

**Response:**
```typescript
{
  ok: true
  data: {
    logs: Array<{
      id: string
      organization_id: string
      calendar_id?: string
      event_id?: string
      actor_id?: string
      action: string
      entity_type: string
      changes: Record
      metadata: Record
      created_at: string
    }>
    pagination: { limit, offset, total }
  }
}
```

#### `GET /api/calendar/audit-logs/[calendarId]`

Get audit logs for specific calendar (manager+ required).

**Query Params:** Same as GET /api/calendar/audit-logs (minus calendarId filter)

### Organization Permission Context

#### `GET /api/organization/[orgSlug]/permission-context`

Get user's permission context for the organization.

**Response:**
```typescript
{
  ok: true
  data: {
    role: "owner" | "manager" | "captain" | "coach" | "member" | "guest"
    isOwner: boolean
    isManager: boolean
    isCaptain: boolean
    canCreateCalendars: boolean      // captain+
    canManageCalendars: boolean      // manager+
    organizationId: string
    divisions: Division[]
    userLevel: number
  }
}
```

## Permission Hierarchy

```
owner (5)       - Full access, determined by OWNER_EMAIL env var
  ├─ manager (4) - Manage calendars, assign permissions
  │   ├─ coach (3)   - Evaluate events, write notes
  │   └─ captain (2) - Create events, manage attendance
  └─ member (1)  - View events, RSVP
```

## Visibility Levels

- **private** - Only explicit permissions, no role-based access
- **management-only** - Owner + Manager
- **captain-only** - Owner + Manager + Captain
- **team-only** - Owner + Manager + Captain + Member
- **selected-members** - Custom member list
- **public-workspace** - All team members

## Error Handling

All API routes return standardized error responses:

```typescript
{
  ok: false
  message: string
  details?: {
    code: string
    [key: string]: any
  }
}
```

**Status Codes:**
- 200 - Success
- 400 - Bad request (validation error)
- 401 - Unauthorized (not authenticated)
- 403 - Forbidden (insufficient permissions)
- 404 - Not found
- 429 - Rate limited
- 500 - Internal server error

## Rate Limiting

- Default: 100 requests/minute per user
- Returns 429 status when exceeded
- Response includes `resetAt` timestamp

## Best Practices

1. **Always validate requests** using `validateRequest()`
2. **Check permissions** early using `requireRole()` or `requireCalendarPermission()`
3. **Cascade updates** when permissions change using cascade functions
4. **Invalidate caches** after modifications
5. **Log audit trails** for compliance
6. **Use real-time subscriptions** to keep UI in sync
7. **Implement proper error handling** with standardized responses

## Example Usage

### Granting Permission

```typescript
// POST /api/calendar/permissions/[calendarId]/members
const response = await fetch(
  `/api/calendar/permissions/${calendarId}/members`,
  {
    method: "POST",
    body: JSON.stringify({
      memberUserId: memberId,
      permissions: {
        can_view: true,
        can_create_event: true,
        can_edit_event: false,
        can_delete_event: false,
        can_manage_permissions: false,
      },
    }),
  }
);

const { ok, data, message } = await response.json();
```

### Checking Permission

```typescript
// POST /api/calendar/visibility/[calendarId]/check
const response = await fetch(
  `/api/calendar/visibility/${calendarId}/check`,
  {
    method: "POST",
    body: JSON.stringify({ permission: "create-event" }),
  }
);

const { ok, data } = await response.json();
if (data.allowed) {
  // User can create events
}
```

### Subscribing to Changes

```typescript
import { subscribeToCalendarPermissions } from "@/lib/supabase/calendar-realtime";

const unsubscribe = await subscribeToCalendarPermissions(
  calendarId,
  (change) => {
    console.log("Permissions changed:", change);
    // Refresh UI
  }
);

// Later: clean up
unsubscribe?.();
```

## Database Schema

See `types/database.ts` for:
- `CalendarConfigRow` - Calendar settings
- `CalendarMemberPermissionRow` - Member-level permissions
- `EventVisibilityRow` - Event-specific visibility overrides
- `CalendarAuditLogRow` - Audit trail
- `CalendarVisibilityRuleRow` - Visibility rule templates

## Related Files

- `CLAUDE.md` - Project instructions
- `CALENDAR_PERMISSIONS_SUMMARY.md` - Design overview
- `CALENDAR_PERMISSIONS_MANAGEMENT.md` - Management UI components
- `IMPLEMENTATION_COMPLETE.md` - Migration guide
