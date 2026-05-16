# Calendar V2 — Quick Start Guide

## What's New?

✨ A **Notion-style, modern calendar system** with:
- Rich event properties (editable inline)
- Comment threads for collaboration
- Modern dark theme UI
- Autosaving functionality
- Mobile-friendly design

---

## 🎯 What's Ready to Use?

### ✅ Completed Components

| Component | File | Purpose |
|-----------|------|---------|
| **CalendarToolbar** | `features/calendar/components/CalendarToolbar.tsx` | Search, filter, navigate calendar |
| **PropertyField** | `features/calendar/components/PropertyField.tsx` | Single property editor (click to edit) |
| **EventProperties** | `features/calendar/components/EventProperties.tsx` | All event properties panel |
| **RichEditor** | `features/calendar/components/RichEditor.tsx` | Event notes/description editor |
| **CommentSection** | `features/calendar/components/CommentSection.tsx` | Event discussion threads |

### ✅ Completed Backend

| Type | File | What It Does |
|------|------|------------|
| **Database** | `supabase/migrations/20260517000001_calendar_v2_enhanced.sql` | New columns, tables, RLS policies |
| **Queries** | `features/calendar/queries.ts` | Fetch event details + relations |
| **Actions** | `features/calendar/actions.ts` | Create/update/delete events + comments |
| **Types** | `features/calendar/types.ts` | TypeScript interfaces |
| **Validation** | `lib/validations/calendar.ts` | Zod schemas |

---

## 🚀 Getting Started

### Step 1: Apply Database Changes

```bash
cd E:\hyperion-new
npx supabase db push
```

This creates new columns and tables for Calendar V2.

### Step 2: Use Components in Your Page

Example: Creating an event detail page with all components:

```typescript
// app/[team-slug]/(workspace)/calendar/[id]/page.tsx

import { CalendarToolbar } from "@/features/calendar/components/CalendarToolbar";
import { EventProperties } from "@/features/calendar/components/EventProperties";
import { RichEditor } from "@/features/calendar/components/RichEditor";
import { CommentSection } from "@/features/calendar/components/CommentSection";
import { getEventDetailWithRelations } from "@/features/calendar/queries";
import { updateEventPropertyAction, addEventCommentAction } from "@/features/calendar/actions";

export default async function EventDetailPage({ params }) {
  const { "team-slug": slug, id } = await params;
  const event = await getEventDetailWithRelations(id);

  if (!event) return <div>Event not found</div>;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1>{event.title}</h1>
        <span className="text-sm text-white/60">{event.status}</span>
      </header>

      <div className="grid grid-cols-3 gap-6">
        {/* Properties Panel */}
        <EventProperties
          event={event}
          onPropertyChange={async (field, value) => {
            await updateEventPropertyAction(slug, { id, field, value });
          }}
        />

        {/* Content + Comments */}
        <div className="col-span-2 space-y-6">
          <RichEditor
            value={event.content}
            onSave={async (content) => {
              await updateEventPropertyAction(slug, {
                id,
                field: "content",
                value: content,
              });
            }}
          />

          <CommentSection
            comments={event.comments || []}
            onAddComment={async (body) => {
              await addEventCommentAction(slug, id, body);
            }}
            onDeleteComment={async (commentId) => {
              // Call delete action
            }}
            currentUserId={user.id}
          />
        </div>
      </div>
    </div>
  );
}
```

---

## 📖 Component Examples

### CalendarToolbar

```typescript
<CalendarToolbar
  year={2025}
  month={0} // January (0-indexed)
  onNavigate={(year, month) => console.log(`Go to ${year}-${month}`)}
  onSearch={(query) => console.log(`Search: ${query}`)}
  onFilterType={(types) => console.log(`Types:`, types)}
  onFilterStatus={(statuses) => console.log(`Statuses:`, statuses)}
/>
```

**Features**: Search, filter by type, filter by status, today button, month nav

---

### EventProperties

```typescript
<EventProperties
  event={event}
  onPropertyChange={(field, value) => {
    // Handle property change
    console.log(`${field}: ${value}`);
  }}
  readOnly={false}
/>
```

**Properties shown**: Date, Area, Platform, Team, Status, Priority, PIC, Tags, Visual Needed

---

### PropertyField (Single Property)

```typescript
<PropertyField
  label="Prioritas"
  icon={<Zap className="h-4 w-4" />}
  value={event.priority}
  onChange={(value) => handleChange("priority", value)}
  fieldType="priority"
  editable={true}
/>
```

**Field types**: `text`, `select`, `tags`, `checkbox`, `status`, `priority`, `date-time`, `user`

---

### RichEditor

```typescript
<RichEditor
  value={event.content}
  onChange={(content) => setDraft(content)}
  onSave={(content) => {
    // Called on blur after 1000ms debounce
    updateEvent({ content });
  }}
  placeholder="Tulis catatan, checklist, atau daftar..."
  editable={true}
  minHeight="300px"
/>
```

**Features**: Autosave (1000ms debounce), formatting toolbar, tab indent

---

### CommentSection

```typescript
<CommentSection
  comments={event.comments || []}
  onAddComment={async (body) => {
    await addEventCommentAction(slug, event.id, body);
  }}
  onDeleteComment={async (commentId) => {
    await deleteEventCommentAction(slug, event.id, commentId);
  }}
  currentUserId={user.id}
  readOnly={false}
/>
```

**Features**: List comments, add new, delete own, relative timestamps

---

## 🔧 Available Actions

All return `{ ok: true/false, message?: string }`

### Update Event Properties (Autosave)

```typescript
await updateEventPropertyAction(orgSlug, {
  id: eventId,
  field: "status", // or any property name
  value: "completed",
});
```

### Update Full Event

```typescript
await updateCalendarEventAction(orgSlug, {
  id: eventId,
  title: "New title",
  status: "ongoing",
  priority: "high",
  // ... any properties
});
```

### Add Comment

```typescript
const result = await addEventCommentAction(orgSlug, eventId, "My comment");
// result = { ok: true, id: "comment-uuid" }
```

### Delete Comment

```typescript
await deleteEventCommentAction(orgSlug, eventId, commentId);
```

### Drag Reschedule

```typescript
await dragRescheduleEventAction(orgSlug, eventId, newStartDate);
// Automatically recalculates end time to preserve duration
```

---

## 🎨 Styling

All components use **Tailwind CSS v4** with dark Notion theme:

```
bg-zinc-950  (darkest background)
bg-zinc-900  (sidebar)
border-white/10  (subtle borders)
text-white  (primary text)
text-white/60  (secondary)
text-white/40  (muted)
hover:bg-white/10  (hover state)
focus:border-yellow-400  (focus state)
```

No component uses emojis. All icons from **Lucide React**.

---

## 📝 Database Schema

### New Columns in `calendar_events`

| Column | Type | Example |
|--------|------|---------|
| `area` | TEXT | "Discord", "LAN" |
| `platform` | TEXT | "Valorant" |
| `status` | TEXT | "confirmed", "draft" |
| `priority` | TEXT | "high", "low" |
| `pic_user_id` | UUID | User ID |
| `tags` | TEXT[] | ["scrim", "important"] |
| `visual_needed` | BOOLEAN | true/false |
| `content` | JSONB | `{ type: "doc", content: [...] }` |
| `updated_at` | TIMESTAMPTZ | Auto-updated |

### New Tables

**`calendar_event_comments`**:
```sql
id (UUID, PK)
event_id (UUID, FK → calendar_events)
user_id (UUID, FK → auth.users)
body (TEXT)
created_at (TIMESTAMPTZ)
updated_at (TIMESTAMPTZ)
```

**`calendar_event_relations`**:
```sql
id (UUID, PK)
event_id (UUID, FK → calendar_events)
rel_type (TEXT) — "team", "scrim", "tournament", "division"
rel_id (UUID)
created_at (TIMESTAMPTZ)
```

---

## ✨ Key Features

### Autosave

Properties save automatically after editing:
- Single property: 600ms debounce
- Rich editor: 1000ms debounce
- All with visual feedback (optional)

### Inline Editing

Click any property → edit → save on blur. No modal dialogs.

### Comment Threads

Real-time discussion on events. Users can:
- Add new comments
- Delete own comments
- See relative timestamps ("2 hours ago")

### Search & Filter

CalendarToolbar provides:
- Text search (debounced 300ms)
- Type filter (scrim, tournament, etc.)
- Status filter (draft, confirmed, etc.)
- Quick filters as removable pills

---

## 🚨 What's NOT Ready Yet

- ❌ Drag-and-drop rescheduling (needs @dnd-kit package)
- ❌ Full TipTap rich text editor (needs npm install)
- ❌ Recurring event generation
- ❌ File uploads to events
- ❌ Realtime subscriptions for comments
- ❌ Event detail page integrated into app

---

## 🐛 Troubleshooting

### Migration fails

```bash
# Check migration status
npx supabase migration list

# If conflict, repair with:
npx supabase migration repair --status applied <version>
```

### Component won't render

Check props match the interface. All are required unless marked optional (`?`).

### Autosave not working

- Check browser console for errors
- Verify `onChange` callback is wired
- Ensure `onSave` action is imported correctly

### RLS policy error

`42501` error = permission denied. Check:
- User is member of organization
- Organization ID matches event
- RLS policies applied (db push)

---

## 📚 Documentation

- Full details: `CALENDAR_V2_IMPLEMENTATION.md`
- All components: `features/calendar/components/*.tsx`
- Database: `supabase/migrations/20260517000001_calendar_v2_enhanced.sql`
- Actions: `features/calendar/actions.ts`
- Types: `features/calendar/types.ts`

---

## ✅ Checklist for Integration

- [ ] Run `npx supabase db push`
- [ ] Import components in your page
- [ ] Wire up action handlers
- [ ] Test property editing
- [ ] Test comment creation/deletion
- [ ] Verify RLS with different users
- [ ] Style the wrapper page/layout
- [ ] Add back button, menu, etc.

---

**Ready to use!** Start building with Calendar V2 components. 🚀
