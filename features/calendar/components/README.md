# Calendar Components

This directory contains React components for managing calendar events in the Hyperion Team OS.

## Components

### EventProperties

A property editor panel for calendar events with support for:
- Date/Time selection
- Location management
- Platform information
- Team assignment
- Status and priority dropdowns
- Person In Charge (PIC) selection
- Multi-tag input
- Visual content flag

**Location:** `EventProperties.tsx`

#### Props

```typescript
interface EventPropertiesProps {
  event: CalendarEvent;
  onPropertyChange: (field: string, value: any) => void;
  picProfiles?: Profile[];
  readOnly?: boolean;
}
```

#### Usage Example

```tsx
import { EventProperties } from "@/features/calendar/components/EventProperties";
import { useState } from "react";

export function EventDetailPage() {
  const [event, setEvent] = useState<CalendarEvent>(initialEvent);
  const profiles = [/* team members */];

  const handlePropertyChange = (field: string, value: any) => {
    // Update your event state or call a server action
    const updates = { [field]: value };
    updateEventAction(event.id, updates);
  };

  return (
    <EventProperties
      event={event}
      onPropertyChange={handlePropertyChange}
      picProfiles={profiles}
      readOnly={false}
    />
  );
}
```

#### Features

- **PropertyField Component**: Internal helper component that provides consistent layout for each property with icon, label, and input
- **Icon Support**: Uses Lucide React icons (Calendar, MapPin, Gamepad2, Users, CheckCircle, Zap, User, Tag, Camera)
- **Read-Only Mode**: Set `readOnly={true}` to disable all inputs
- **PIC Selection**: Shows selected person with avatar or initials
- **Tag Input**: Comma-separated tags with visual preview
- **Dark Theme**: Fully styled with Notion-style dark colors

#### Field Mapping

| Property | Icon | Type | Notes |
|----------|------|------|-------|
| Tanggal/Jam | Calendar | datetime-local | ISO format input |
| Area | MapPin | text | Location string |
| Platform | Gamepad2 | text | Game/platform name |
| Tim | Users | text | Team name |
| Status | CheckCircle | select | draft/confirmed/ongoing/completed/cancelled |
| Prioritas | Zap | select | low/medium/high/urgent |
| PIC | User | select | Profile selection with avatar |
| Tags | Tag | text | Comma-separated, comma-delimited |
| Visual | Camera | checkbox | Boolean flag |

---

### CommentSection

A complete comment management component with:
- Comment list with user avatars
- Relative timestamps (e.g., "2 hours ago")
- Delete button (visible on hover, only for own comments)
- Textarea comment input with auto-resize
- Loading states for async operations
- Comment counter in header

**Location:** `CommentSection.tsx`

#### Props

```typescript
interface CommentSectionProps {
  comments: (CalendarEventComment & { commenter?: Profile })[];
  onAddComment: (body: string) => Promise<void>;
  onDeleteComment: (commentId: string) => Promise<void>;
  currentUserId: string;
  readOnly?: boolean;
}
```

#### Usage Example

```tsx
import { CommentSection } from "@/features/calendar/components/CommentSection";
import { useState, useEffect } from "react";

export function EventDetailPage() {
  const [comments, setComments] = useState<CalendarEventComment[]>([]);
  const currentUser = useUser();

  const handleAddComment = async (body: string) => {
    const result = await addCommentAction(eventId, body);
    if (result.ok) {
      setComments([...comments, result.comment]);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    const result = await deleteCommentAction(commentId);
    if (result.ok) {
      setComments(comments.filter((c) => c.id !== commentId));
    }
  };

  return (
    <CommentSection
      comments={comments}
      onAddComment={handleAddComment}
      onDeleteComment={handleDeleteComment}
      currentUserId={currentUser.id}
      readOnly={false}
    />
  );
}
```

#### Features

- **Auto-Expanding Textarea**: Grows up to 120px height as user types
- **Delete Permission**: Only comment creators can delete (checked via `created_by`)
- **Hover Actions**: Delete button appears on hover
- **Relative Time**: Uses `formatRelative()` from `@/lib/utils/format` (e.g., "5 menit lalu")
- **Avatar Display**: Shows profile avatar or initial badge
- **Loading States**: Spinner on send/delete buttons
- **Scrollable List**: Fixed height with custom scrollbar styling
- **Empty State**: Shows "Belum ada komentar" when no comments exist

#### Comment Structure

Expected comment shape:
```typescript
interface CalendarEventComment {
  id: string;
  event_id: string;
  created_by: string;
  body: string;
  created_at: string;
  commenter?: Profile; // Optional, populated by parent
}
```

---

## Integration Notes

### Database Schema

These components assume the following database tables exist:

**calendar_events:**
- `id`, `organization_id`, `created_by`
- `title`, `description`, `event_type`
- `starts_at`, `ends_at`, `is_all_day`
- `location`, `tags` (JSON array)
- `status`, `priority`, `pic_id`, `visual_needed`
- `platform`, `team` (custom fields)

**calendar_event_comments:**
- `id`, `event_id`, `created_by`
- `body`, `created_at`

**profiles:**
- `id`, `username`, `display_name`
- `avatar_url`

### Server Actions Required

For `EventProperties`:
- `updateCalendarEventAction(eventId, updates)` - handles property changes

For `CommentSection`:
- `addCommentAction(eventId, body)` - creates new comment
- `deleteCommentAction(commentId)` - deletes comment

### Styling

Both components use:
- **Tailwind CSS v4** with dark theme colors
- **Notion-style palette**:
  - Background: `#191919`
  - Surface: `#202020`
  - Border: `#2D2D2D`
  - Text Primary: `#E5E2E1`
  - Text Secondary: `#9B9A97`
  - Text Muted: `#6B6A68`
  - Hover: `#2C2C2C`
- **No external UI libraries** - built with raw Tailwind and Lucide React

### Responsive Behavior

Both components are designed to be:
- Mobile-friendly with proper touch targets
- Responsive to container width changes
- No horizontal scrolling (text truncation where needed)

---

## Type Definitions

Both components use types from:
- `@/features/calendar/types` - `CalendarEvent`, `CalendarEventComment`, `EventStatus`, `EventPriority`
- `@/types/database` - `Database["public"]["Tables"]["profiles"]["Row"]`

---

## Common Patterns

### Managing Event Updates

```tsx
const handlePropertyChange = (field: string, value: any) => {
  startTransition(async () => {
    const result = await updateEventPropertyAction(eventId, field, value);
    if (result.ok) {
      success("Event updated");
    } else {
      error(result.message);
    }
  });
};
```

### Fetching Comments with Profiles

```tsx
// In a server component or action
const comments = await getEventCommentsWithProfiles(eventId);
// Ensures `commenter` field is populated

return (
  <CommentSection
    comments={comments}
    // ...
  />
);
```

### Read-Only Mode

Set both components to read-only when:
- User doesn't have edit permission
- Event is completed/archived
- Viewing historical event details

```tsx
<EventProperties event={event} readOnly={!canEdit} />
<CommentSection comments={comments} readOnly={!canComment} />
```

---

## Browser Support

Both components work in all modern browsers with:
- ES2020+ support
- CSS Grid and Flexbox
- CSS custom properties
- LocalStorage (via refs)

For IE11 support, consider using polyfills or transpilation.
