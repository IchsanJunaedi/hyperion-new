# Todo List Feature — Design Spec
**Date:** 2026-06-08  
**Scope:** Owner (`/dashboard/todos`) + Manager (`/manage/todos`)  
**Status:** Approved

---

## Overview

Unified todo list for Owner and Manager roles. Surfaces actionable items from system data (smart todos) and allows manual task creation. Each role has an isolated list. Owner can assign manual todos to Manager and track completion via "Assigned Out" tab.

---

## Decisions Log

| Decision | Choice | Reason |
|---|---|---|
| Placement | New nav item `/dashboard/todos` + `/manage/todos` | Full page, not widget |
| Smart todos | Auto-computed from DB on page load | Always accurate, no stale data |
| Auto-dismiss | Smart todos disappear when DB condition resolves | No manual cleanup needed |
| Manual todos | Text + due date + priority + assign to manager | Full featured |
| Notifications | None for assigned todos | Owner + Manager check their own list |
| Cross-visibility | Owner cannot see manager's personal todos | Privacy |
| Assigned Out tab | Owner sees only todos they assigned + completion status | Track delegation without violating privacy |
| Architecture | Approach C: server-side merge, unified response | Accurate + simple frontend |

---

## Data Layer

### New Tables

```sql
-- Manual todos (full CRUD)
CREATE TABLE manual_todos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  title text NOT NULL,
  due_date date,
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Smart todo dismissals
CREATE TABLE todo_dismissals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  smart_type text NOT NULL,
  entity_id uuid NOT NULL,
  dismissed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, smart_type, entity_id)
);
```

### Smart Todo Types

| `smart_type` | Source Table | Trigger Condition | `navigate_to` |
|---|---|---|---|
| `contract_expiry` | player_contracts | expires_at < now() + 30 days AND status = active | `/dashboard/salaries` |
| `salary_due` | salary_payments | due_date <= today AND status = unpaid | `/dashboard/salaries` |
| `member_unassigned` | team_members | division_id IS NULL AND role != 'owner' | `/dashboard/assign` |
| `trial_pending` | trial_applicants | status = 'pending' AND created_at < now() - 3 days | `/{slug}/trials` |
| `scrim_no_result` | scrims | status = 'completed' AND id NOT IN (SELECT scrim_id FROM scrim_results) | `/{slug}/scrim/{id}/results` |
| `sponsor_stale` | sponsors | status = 'pending' AND updated_at < now() - 7 days | `/dashboard/sponsors` |
| `tournament_no_bracket` | tournaments | starts_at < now() + 7 days AND bracket_link IS NULL AND bracket_file_path IS NULL | `/dashboard/tournaments/{id}` |

### RLS Policy

- `manual_todos`: user sees rows where `created_by = auth.uid()` OR `assigned_to = auth.uid()`
- `todo_dismissals`: user sees only their own rows (`user_id = auth.uid()`)

---

## Server Actions (`features/todos/actions.ts`)

```
getTodos(orgId, userId, role)
  → computeSmartTodos(orgId, userId)   // 7 parallel queries
  → fetchManualTodos(orgId, userId)    // created_by = userId, not assigned
  → merge + sort by urgency
  → return Todo[]

getAssignedOutTodos(orgId, ownerId)
  → manual_todos WHERE created_by = ownerId AND assigned_to IS NOT NULL
  → return ManualTodo[] with completion status

createManualTodo(orgId, userId, data)
  → validate: title required, due_date optional, priority default medium
  → if assigned_to: verify target user is manager in same org
  → insert manual_todos

completeManualTodo(id, userId)
  → verify ownership (created_by OR assigned_to = userId)
  → set completed_at = now()

deleteManualTodo(id, userId)
  → verify created_by = userId (cannot delete assigned todos)
  → delete row

dismissSmartTodo(orgId, userId, smartType, entityId)
  → insert todo_dismissals ON CONFLICT DO NOTHING

getTodoBadgeCount(orgId, userId, role)
  → computeSmartTodos (count overdue + today only)
  → count manual_todos WHERE completed_at IS NULL AND (due_date <= today OR due_date IS NULL)
  → return number (for sidebar badge)
```

### Source Page Auto-Resolve

When a source page action resolves a smart todo condition, insert into `todo_dismissals`:

| Action | Auto-dismisses |
|---|---|
| Mark salary payment paid | `salary_due:{payment_id}` |
| Extend/renew player contract | `contract_expiry:{contract_id}` |
| Assign member to division | `member_unassigned:{member_id}` |
| Update trial status (accept/reject) | `trial_pending:{application_id}` |
| Add scrim result | `scrim_no_result:{scrim_id}` |
| Update sponsor status | `sponsor_stale:{sponsor_id}` |
| Add bracket to tournament | `tournament_no_bracket:{tournament_id}` |

---

## Types (`features/todos/types.ts`)

```ts
export type SmartTodoType =
  | 'contract_expiry'
  | 'salary_due'
  | 'member_unassigned'
  | 'trial_pending'
  | 'scrim_no_result'
  | 'sponsor_stale'
  | 'tournament_no_bracket'

export type TodoUrgency = 'overdue' | 'today' | 'this_week' | 'later'
export type TodoPriority = 'low' | 'medium' | 'high'

export interface SmartTodo {
  id: string            // `${smart_type}:${entity_id}`
  source: 'smart'
  smart_type: SmartTodoType
  title: string
  urgency: TodoUrgency
  entity_id: string
  navigate_to: string
}

export interface ManualTodo {
  id: string
  source: 'manual'
  title: string
  due_date: Date | null
  priority: TodoPriority
  urgency: TodoUrgency
  assigned_to: { id: string; name: string; avatar_url: string | null } | null
  completed_at: Date | null
  created_by: string
}

export type Todo = SmartTodo | ManualTodo

export interface TodoGroup {
  urgency: TodoUrgency
  label: string         // 'TERLAMBAT' | 'HARI INI' | 'MINGGU INI' | 'NANTI'
  todos: Todo[]
}
```

---

## Frontend

### Page Layout

```
/dashboard/todos (Server Component)
  → fetch getTodos() server-side
  → pass to TodosPage (Client Component)

Layout:
┌─────────────────────────────────────────────────────────┐
│  Todos                                   [+ Tambah]     │
│  ● 3 terlambat  ◑ 5 hari ini  ○ 18 total               │
├───────────────┬─────────────────────────────────────────┤
│ FILTER        │ [Semua] [Smart] [Manual] [Assigned Out] │
│               │                                         │
│ Kategori      │ ▬ TERLAMBAT (3) ────────────────────── │
│ checkboxes    │   SmartTodoCard / ManualTodoCard         │
│               │                                         │
│ Prioritas     │ ▬ HARI INI (2) ─────────────────────── │
│ checkboxes    │   ...                                   │
│               │                                         │
│ Status        │ ▬ MINGGU INI (5) ───────────────────── │
│ radio         │   ...                                   │
│               │                                         │
│               │ ▬ NANTI (8) ────────────────────────── │
└───────────────┴─────────────────────────────────────────┘
```

### Components

| Component | Description |
|---|---|
| `TodosPage.tsx` | Client container, holds filter state + tab state |
| `TodoStatsBar.tsx` | Header: overdue / today / total counts with colored dots |
| `TodoFilterPanel.tsx` | Left sidebar: category checkboxes, priority checkboxes, status radio |
| `TodoTabBar.tsx` | Tabs: Semua / Smart / Manual / Assigned Out (owner only) |
| `TodoGroupSection.tsx` | Collapsible section with label + count badge, collapses if empty |
| `SmartTodoCard.tsx` | Left colored border by urgency, category icon, title, "Buka →" button, dismiss (×) |
| `ManualTodoCard.tsx` | Checkbox with strikethrough+fade animation, priority badge, due date relative, assigned avatar |
| `AssignedOutCard.tsx` | Title, assigned-to name, status badge (Pending/Selesai), due date |
| `CreateTodoModal.tsx` | Form: title (required) + due date + priority select + assign-to select (owner only) |

### Visual System

**Left border color by urgency:**
- Overdue: `border-red-500`
- Today: `border-orange-400`
- This week: `border-yellow-400`
- Later: `border-zinc-600`

**Priority badge colors:**
- High: red badge
- Medium: orange badge
- Low: zinc badge

**Due date display:**
- Overdue: "Terlambat 3 hari" in red
- Today: "Hari ini" in orange
- Future: "3 hari lagi" in muted

**Complete animation:** checkbox checked → title strikethrough → card fades out after 600ms

### Sidebar Badge

- Dashboard layout: fetch `getTodoBadgeCount()` server-side
- Pass count to nav item component
- Red badge `<span>` visible if count > 0
- Count = overdue + due today (urgent only)

---

## Manager Mirror (`/manage/todos`)

Identical to owner's page except:
- No "Assigned Out" tab
- No assign-to field in CreateTodoModal
- Smart todos computed with manager-relevant types only (same 7 for now — manager has access to salary/sponsor/roster in `/manage`)
- Cannot see owner's todos

---

## What's Out of Scope

- Push notifications / WhatsApp for todo assignments
- Todo comments or attachments
- Recurring todos
- Coach / Captain / Member access to todos
- Sorting by drag-and-drop
