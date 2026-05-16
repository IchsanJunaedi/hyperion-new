# Calendar Permission Management Components

Comprehensive React components for managing calendar visibility and member permissions in Hyperion workspace.

## Overview

This directory contains 6 production-ready components for:
- Permission visibility control (6 levels: private, management-only, captain-only, team-only, selected-members, public-workspace)
- Member-level permission management (view, create, edit, delete, manage)
- Event-level visibility overrides
- Audit logging and history
- Permission guards and access control

All components integrate with the calendar permission system in `lib/permissions/` and use the Notion-style dark theme.

## Components

### 1. PermissionInfo.tsx

Displays current user's permissions for a calendar.

**Features:**
- Role display with color coding (owner=yellow, manager=green, coach=blue, captain=purple, member=gray)
- Permission badges (view, create, edit, delete, manage)
- Visibility level display
- Copy permission summary
- Request access button (future feature)
- Compact and full modes

**Usage:**
```tsx
import { PermissionInfo } from "@/features/calendar/components/permission";

export function CalendarHeader({ userRole, calendarVisibility, userPermissions, calendarTitle }) {
  return (
    <PermissionInfo
      userRole={userRole}
      calendarVisibility={calendarVisibility}
      userPermissions={userPermissions}
      calendarTitle={calendarTitle}
      canRequestAccess
      onRequestAccess={() => console.log("Request access")}
    />
  );
}
```

**Props:**
- `userRole: UserRole` - User's role in organization
- `calendarVisibility: CalendarVisibility` - Calendar's visibility level
- `userPermissions: Set<CalendarPermission>` - Set of user's permissions
- `calendarTitle: string` - Calendar name
- `canRequestAccess?: boolean` - Show request access button
- `onRequestAccess?: () => void` - Request access handler
- `compact?: boolean` - Compact display mode

---

### 2. PermissionGuard.tsx

Three permission guard components for access control.

#### PermissionGuard
Wrapper component that conditionally renders content based on permission.

```tsx
import { PermissionGuard } from "@/features/calendar/components/permission";

<PermissionGuard requiredPermission="edit-event" calendarId={calendarId}>
  <EditEventForm />
</PermissionGuard>
```

#### PermissionButton
Button that automatically disables if user lacks permission.

```tsx
import { PermissionButton } from "@/features/calendar/components/permission";

<PermissionButton
  requiredPermission="create-event"
  calendarId={calendarId}
  onClick={handleCreate}
>
  Create Event
</PermissionButton>
```

#### PermissionConfirmDialog
Dialog that shows confirmation only if user has permission.

```tsx
import { PermissionConfirmDialog } from "@/features/calendar/components/permission";

<PermissionConfirmDialog
  requiredPermission="manage-permissions"
  calendarId={calendarId}
  action="Grant Permission"
  onConfirm={handleGrant}
>
  <p>Grant access to member?</p>
</PermissionConfirmDialog>
```

**Features:**
- Automatic permission checking via API endpoint
- Loading states and error handling
- Accessible (ARIA labels, keyboard navigation)
- Supports single or multiple permissions
- Optional fallback UI

---

### 3. VisibilityManager.tsx

Control who can see and access a calendar.

**Features:**
- 6 visibility level options with descriptions
- Permission matrix preview (view, create, edit, manage by role)
- Member selector for "selected-members" visibility
- Search/filter members
- Change tracking and reset button
- Validation (at least 1 member for selected-members)
- Compact and full modes

**Usage:**
```tsx
import { VisibilityManager } from "@/features/calendar/components/permission";

export async function handleSaveVisibility(visibility, selectedMembers) {
  await updateCalendarVisibility(calendarId, visibility, selectedMembers);
}

<VisibilityManager
  calendarId={calendarId}
  currentVisibility="team-only"
  selectedMembers={selectedMembers}
  teamMembers={teamMembers}
  onSave={handleSaveVisibility}
/>
```

**Props:**
- `calendarId: string` - Calendar ID
- `currentVisibility: CalendarVisibility` - Current visibility
- `selectedMembers?: string[]` - Currently selected member IDs
- `teamMembers?: TeamMember[]` - Available team members
- `onSave: (visibility, selectedMembers?) => Promise<void>` - Save handler
- `isLoading?: boolean` - Loading state
- `compact?: boolean` - Compact display

---

### 4. MemberPermissionTable.tsx

Manage granular permissions for individual members.

**Features:**
- CSS Grid table layout (desktop) and mobile cards
- Columns: member, view, create, edit, delete, manage permissions, delete
- Toggle individual permissions with loading states
- Select member checkboxes
- Bulk actions (Grant All, Clear)
- Add/remove member buttons
- Empty state with action
- No horizontal scroll (truncated text)
- Responsive design (desktop/mobile)

**Usage:**
```tsx
import { MemberPermissionTable } from "@/features/calendar/components/permission";

<MemberPermissionTable
  members={membersWithPermissions}
  onUpdatePermission={updatePermission}
  onRemoveMember={removeMember}
  onAddMember={openAddMemberDialog}
/>
```

**Props:**
- `members: Array<MemberWithProfile & { permission? }>` - Members with permissions
- `onUpdatePermission: (memberId, permission, value) => Promise<void>` - Update handler
- `onRemoveMember: (memberId) => Promise<void>` - Remove handler
- `onAddMember: () => void` - Add member handler
- `isLoading?: boolean` - Loading state
- `compact?: boolean` - Compact display

---

### 5. EventVisibilityOverride.tsx

Set event-level visibility different from calendar default.

**Features:**
- Shows calendar default visibility
- 6 visibility override options
- Member selector for "selected-members"
- Visibility diff display (calendar vs event)
- Applied indicator
- Reset to calendar default button
- Confirmation dialog before apply
- Help text

**Usage:**
```tsx
import { EventVisibilityOverride } from "@/features/calendar/components/permission";

<EventVisibilityOverride
  eventId={eventId}
  eventTitle="Team Meeting"
  calendarVisibility="team-only"
  currentOverride={eventVisibility}
  currentOverrideMembers={overrideMembers}
  teamMembers={teamMembers}
  onSave={handleSaveOverride}
/>
```

**Props:**
- `eventId: string` - Event ID
- `eventTitle: string` - Event name
- `calendarVisibility: CalendarVisibility` - Calendar's default visibility
- `currentOverride?: CalendarVisibility` - Current event override
- `currentOverrideMembers?: string[]` - Current selected members
- `teamMembers?: TeamMember[]` - Available team members
- `onSave: (visibility, selectedMembers?) => Promise<void>` - Save handler
- `isLoading?: boolean` - Loading state

---

### 6. AuditLogViewer.tsx

View and analyze calendar permission and operation changes.

**Features:**
- Timeline view of permission changes
- Expandable entries with full details
- Filters: action type, date range, search
- Export as CSV button
- Change tracking (old → new values)
- Entity type and actor display
- Metadata and JSON visualization
- Compact mode (last 5 entries)
- No pagination (shows all filtered results)

**Usage:**
```tsx
import { AuditLogViewer } from "@/features/calendar/components/permission";

<AuditLogViewer
  logs={auditLogs}
  onExport={exportToCSV}
  onFilterChange={handleFilterChange}
/>
```

**Props:**
- `logs: CalendarAuditLog[]` - Audit log entries
- `onExport?: () => Promise<void>` - CSV export handler
- `onFilterChange?: (filters) => void` - Filter change handler
- `isLoading?: boolean` - Loading state
- `compact?: boolean` - Compact display (last 5 entries)

---

## Integration Guide

### With Server Actions

```tsx
// features/calendar/permission-actions.ts
import { checkCalendarPermission } from "@/lib/permissions/calendar-access";
import { logCalendarAudit } from "@/lib/permissions/calendar-audit";

export async function updateVisibilityAction(
  calendarId: string,
  visibility: CalendarVisibility,
  selectedMembers?: string[],
) {
  const check = await checkCalendarPermission(
    userId,
    calendarId,
    "manage-permissions",
    organizationId,
  );

  if (!check.allowed) {
    return { ok: false, message: check.reason };
  }

  // Update visibility
  const result = await supabase
    .from("calendar_configs")
    .update({ visibility })
    .eq("id", calendarId);

  // Log the change
  await logCalendarAudit(
    organizationId,
    "calendar_updated",
    "calendar",
    calendarId,
    userId,
    { visibility: { old_value: oldVisibility, new_value: visibility } },
  );

  return { ok: true };
}
```

### With Page Components

```tsx
// app/[team-slug]/calendar/[id]/permissions/page.tsx
import { VisibilityManager, MemberPermissionTable } from "@/features/calendar/components/permission";

export default async function CalendarPermissionsPage({ params }) {
  // Check permission
  const allowed = await checkCalendarPermission(
    userId,
    params.id,
    "manage-permissions",
    orgId,
  );

  if (!allowed) {
    return notFound();
  }

  const calendar = await getCalendar(params.id);
  const members = await getCalendarMembers(params.id);

  return (
    <div className="space-y-6">
      <VisibilityManager
        calendarId={params.id}
        currentVisibility={calendar.visibility}
        teamMembers={teamMembers}
        onSave={updateVisibilityAction}
      />
      <MemberPermissionTable
        members={members}
        onUpdatePermission={updateMemberPermissionAction}
        onRemoveMember={removeMemberPermissionAction}
        onAddMember={openAddDialog}
      />
    </div>
  );
}
```

### Styling Notes

- **Dark Notion Theme**: All components use the Notion-style dark theme
  - Background: `#191919` (page)
  - Sidebar: `#202020`
  - Cards: `#2C2C2C`
  - Borders: `#2D2D2D`
  - Text primary: `#E5E2E1`
  - Text secondary: `#9B9A97`
  - Text muted: `#6B6A68`

- **Lucide Icons**: All icons use Lucide React (no emojis)
- **Tailwind Grid**: Tables use `grid-cols-[...]` for layout (no horizontal scroll)
- **Notifications**: Use `useNotify()` hook for toast messages
- **Responsive**: All components are mobile-friendly without horizontal scroll

## Type Definitions

All components are fully typed with TypeScript. Import types:

```tsx
import type {
  PermissionInfoProps,
  VisibilityManagerProps,
  MemberPermissionTableProps,
  EventVisibilityOverrideProps,
  AuditLogViewerProps,
  AuditFilterOptions,
} from "@/features/calendar/components/permission";
```

## Accessibility

- ✅ ARIA labels on all interactive elements
- ✅ Keyboard navigation (Tab, Enter, Escape)
- ✅ Color-accessible (not relying on color alone)
- ✅ Semantic HTML
- ✅ Loading states announced
- ✅ Error messages in accessible alerts

## Performance

- ✅ Memoized callbacks
- ✅ Lazy loading of expandable content
- ✅ Pagination-free (shows all results, client-side filtering)
- ✅ Optimized re-renders with useCallback/useMemo
- ✅ CSS Grid for efficient layout

## Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## Related Files

- `lib/permissions/calendar-access.ts` - Permission checking logic
- `lib/permissions/calendar-rules.ts` - Permission decision matrix
- `lib/permissions/calendar-audit.ts` - Audit logging
- `lib/permissions/calendar-types.ts` - Type definitions
- `features/calendar/permission-actions.ts` - Server actions
- `features/dashboard/components/NotifyModal.tsx` - Notification system

## Future Enhancements

1. **Real-time Updates**: Supabase subscriptions for live permission changes
2. **Permission Approval**: Request-grant workflow
3. **Time-based Access**: Schedule calendar access for specific periods
4. **Group Permissions**: Manage permissions for groups of users
5. **Bulk Operations**: Grant permissions to multiple users at once
6. **Permission Analytics**: Usage metrics and anomaly detection
7. **Conflict Detection**: Warn when permission rules conflict

## Contributing

When adding new features:
1. Keep components focused and single-responsibility
2. Use TypeScript strict mode
3. Add JSDoc comments for props
4. Test permission checks with RLS
5. Maintain Notion dark theme consistency
6. Ensure mobile responsiveness
7. Add loading states for async operations
8. Use `useNotify()` for user feedback
