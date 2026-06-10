# AGENTS.md — Hyperion Team OS

> Esports team operating system. Next.js 15 App Router + Supabase + TypeScript strict.
> Read `progress.md` first at session start — single source of truth for current state.

---

## 1. Tech Stack (exact versions matter)

| Layer | Tool | Notes |
|-------|------|-------|
| Framework | Next.js 15.5 App Router | Server Components + Server Actions only |
| Database | Supabase (Postgres + RLS) | Edge Functions in `supabase/functions/` |
| Auth | Supabase Auth + JWT hook | Custom claims via hook, not `team_members` |
| Styling | Tailwind CSS v4 | Dark Notion theme — see color tokens below |
| Server state | TanStack Query v5 | Fetches from Server Actions |
| Client state | Zustand v5 | `stores/` directory |
| Forms | React Hook Form v7 + Zod v4 | `zod` v4 API: `z.object()`, `z.string()` |
| Icons | Lucide React | NEVER emojis as icons |
| Notifications | Dual — Sonner + NotifyModal | See §6 |
| Utilities | `cn()` from `@/lib/utils/cn` | Wraps `clsx` + `tailwind-merge` |

---

## 2. Role Hierarchy

### Application Roles (In-App Users)

```
Owner  → /dashboard   (OWNER_EMAIL env var — NOT stored in team_members)
Manager → /manage     (assigned by Owner)
Coach   → workspace   (evaluate scrims, VOD, notes)
Captain → workspace   (create scrims, attendance)
Member  → workspace   (view, RSVP, schedule)
```

### Development Roles (Out-of-App)

```
Software Engineer (Developer & AI Agent) → Codebase, DB, CI/CD, and shipping the OS
Frontend Developer                       → UI/UX, Tailwind CSS v4 styling, component structure, GSAP animations
QA / Tester                              → Unit tests, Playwright E2E testing, CI gate checks
Security Analyst                         → RLS policies, custom JWT claims, API route guards
```


### Owner Detection — CRITICAL

```typescript
// ✅ CORRECT
const isOwner = user.email === process.env.OWNER_EMAIL;

// ❌ WRONG — never check team_members for owner
const isOwner = member.role === 'owner'; // DO NOT DO THIS
```

Role colors: `owner=yellow`, `manager=green`, `coach=blue`, `captain=purple`, `member=gray`

---

## 3. Key Design Decisions

| Decision | Rule |
|----------|------|
| Divisions | `divisions.organization_id` is NULLABLE — divisions are standalone, linked to teams when assigned |
| Captain limit | 1 captain per team — enforced server-side |
| Login redirect | Based on DB role query, not JWT claims |
| Middleware auth | Only blocks unauthenticated users. Role checks happen at page/layout level via DB |
| Custom domains | Middleware maps hostname → org slug, rewrites paths internally |
| Owner salary | Owner NOT in salary contract dropdowns — shares revenue, not salaried |

---

## 4. Component Export Pattern — CRITICAL (HMR crash prevention)

Next.js 15 Webpack HMR crashes with inline-exported components.

```tsx
// ✅ ALWAYS use this pattern
const MyComponent = () => { ... };
export { MyComponent };

// ❌ NEVER — causes __webpack_modules__[moduleId] is not a function crash
export default function MyComponent() { ... }
export function MyComponent() { ... }
```

---

## 5. Supabase Query Rules — ENFORCE ON EVERY QUERY

1. **Always `.limit()`** — every `.select()` on a growing table needs a limit.
   - List pages: `50` | Analytics: `200` | Per-user/per-item: `30`

2. **Never `select("*")`** — always explicit columns.
   - Exception: small tables in detail pages (not list views)

3. **`count: "exact"` + `head: true`** — if you only need the count, add `head: true`. If you don't use `count` at all, remove `{ count: "exact" }`.

4. **`.maybeSingle()` not `.single()`** — use `.single()` only when 100% certain row exists. Otherwise `.maybeSingle()` + error check.

5. **Always handle errors** — destructure `{ data, error }`, `console.error` on error. Never swallow silently.

```typescript
// ✅ CORRECT query pattern
const { data, error } = await supabase
  .from("scrims")
  .select("id, title, status, created_at")
  .eq("team_id", teamId)
  .order("created_at", { ascending: false })
  .limit(50);
if (error) console.error("[listScrims]", error);
```

### Client Selection

```typescript
createAdminClient()  // cross-user ops — BYPASSES RLS
createClient()       // user-scoped ops — RESPECTS RLS
```

---

## 6. Notification System — TWO CONTEXTS

| Context | System | Import |
|---------|--------|--------|
| Workspace features | Sonner toast | `import { toast } from "sonner"` |
| Dashboard/manage panel | NotifyModal | `import { useNotify } from "@/features/dashboard/components/NotifyModal"` |

Match the existing imports in the file you're editing. Exception: `PlayerTargetCard` uses `useNotify()` — don't change it.

---

## 7. Server Actions Pattern

```typescript
// All server actions must:
// 1. Validate auth first
// 2. Return { ok: true } or { ok: false, message: string }
// 3. Call logAudit() for any create/update/delete

"use server";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";

export async function myAction(input: MyInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Unauthorized" };

  // ... logic ...

  await logAudit({ actorId: user.id, action: "create", entityType: "scrims", entityId: record.id });
  return { ok: true };
}
```

### logAudit Signature (lib/audit.ts)

```typescript
await logAudit({
  actorId: user.id,        // required — who performed the action
  action: "create",        // required — "create" | "update" | "delete" | any string
  entityType: "scrims",    // required — table name snake_case
  entityId: record.id,     // optional — affected row ID
  metadata: { title },     // optional — arbitrary context object
});
```

### Error → UI Display Pattern

```typescript
// Client component consuming a server action
const result = await myAction(input);
if (!result.ok) {
  toast.error(result.message);      // workspace context
  // notify.error(result.message);  // dashboard/manage context (useNotify)
  return;
}
toast.success("Berhasil!");
```

### Public Actions (unauthenticated forms)

Rate limiting is MANDATORY. Use `login_rate_limits` table with `{prefix}:{email/phone}` as identifier.

Upload URL validation is MANDATORY — must originate from Supabase storage:
```typescript
const validPrefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/`;
if (!url.startsWith(validPrefix)) return { ok: false, message: "Invalid URL" };
```

---

## 8. React useEffect Rules

```typescript
// ✅ Async useEffect — mounted flag REQUIRED
useEffect(() => {
  let mounted = true;
  someAsyncFn().then((result) => {
    if (!mounted) return;
    setState(result);
  });
  return () => { mounted = false; };
}, [dep]);

// ✅ Realtime channel — cleanup REQUIRED
useEffect(() => {
  const channel = supabase.channel("...").subscribe();
  return () => { supabase.removeChannel(channel); };
}, []);
```

- No empty `startTransition(() => {})` — fill it or remove it
- No fire-and-forget `.then()` — can update state after unmount

---

## 9. UI Style Guide

```
Background:     #191919
Sidebar:        #202020
Borders:        #2D2D2D
Text primary:   #E5E2E1
Text secondary: #9B9A97
Text muted:     #6B6A68
Hover state:    #2C2C2C
Active item:    #2C2C2C + #D4D4D4 text
```

- All buttons: `cursor-pointer` on hover
- Tables: CSS Grid `grid-cols-[...]` NOT `<table>`
- No horizontal scroll — truncate text with `truncate`
- Delete actions: 2-step via `ConfirmDeleteDialog` with `confirmPhrase="HAPUS"`
- Modal overlay: `fixed inset-0 z-50 flex items-center justify-center bg-black/60`
  - Click backdrop closes: `onClick={onClose}` on overlay, `onClick={(e) => e.stopPropagation()}` on inner div
- Dropdown in card: parent must NOT have `overflow-hidden`. List: `absolute z-50 top-full`

---

## 10. Reusable Components — Check Before Creating

| Need | Component | Path |
|------|-----------|------|
| Select / dropdown | `CustomSelect` | `@/features/dashboard/components/CustomSelect` |
| Delete confirmation | `ConfirmDeleteDialog` | `@/features/dashboard/components/ConfirmDeleteDialog` |
| Dashboard/manage notification | `useNotify()` | `@/features/dashboard/components/NotifyModal` |
| Workspace notification | `toast` | `sonner` |
| Audit log write | `logAudit()` | `@/lib/audit` |
| Number input | `NumberInput` | `@/components/ui/number-input` |

**Never use:**
- Native `<select>` → use `CustomSelect`
- Native `<input type="number">` → use `NumberInput`
- Custom delete dialogs → use `ConfirmDeleteDialog`

---

## 11. Domain-Specific Constraints

### Calendar System
- Valid event types: `"tournament" | "practice" | "meeting" | "bootcamp" | "other"`
- `"scrim"` is NOT a calendar event type — scrims have their own module
- Visibility: `all | management | coach_up | private`
- `ends_at` must be `>= starts_at` when provided (enforced in Zod via `.refine()`)

### Scrim System
- Valid formats: `"bo1" | "bo2" | "bo3" | "bo5" | "bo7" | "4match"`
- `"scrimmage"` is NOT a valid format
- VOD is TWO separate concepts:
  - `scrims.vod_link` — one full-match link per scrim (sidebar)
  - `scrim_vod_timestamps` table — per-game coach timestamp annotations (results page)

### Hero Images
```tsx
import { getHeroImageUrl } from "@/features/scrim/data/mlbb-heroes";
// Circular portrait:
<div className="h-5 w-5 overflow-hidden rounded-full border border-white/10 bg-zinc-800">
  <img src={getHeroImageUrl(heroName)} className="h-full w-full object-cover" />
</div>
```

---

## 12. Database Migrations

```bash
# Create migration
# File: supabase/migrations/YYYYMMDDHHmmSS_description.sql

# Apply
npx supabase db push

# Fix conflict
npx supabase migration repair --status reverted <version>
npx supabase migration repair --status applied <version>

# Regenerate types
npx supabase gen types typescript --project-id pqzdukrlmbwjjgjyoqva --schema public > types/database.ts
```

---

## 13. API Routes

```typescript
// Permission middleware: lib/api/permission-middleware.ts
validateRequest()  // verify auth
isOwner()         // check owner role
getUserRole()     // get user's role
requireRole()     // guard by minimum role

// Response helpers: lib/api/response.ts
success(data)     // 200
error(msg)        // 400
forbidden()       // 403
notFound()        // 404
internalError()   // 500
```

---

## 14. Pre-Commit CI Gate — MANDATORY BEFORE EVERY COMMIT

Run all three. All must pass. Fix failures before committing.

```bash
npm run lint                  # zero errors (warnings OK)
npm run typecheck             # exit 0
npm run test:unit:coverage    # all pass + thresholds met
```

**Use `test:unit:coverage` not `test:unit`** — CI enforces thresholds:
- Statements 80% / Branches 75% / Functions 80% / Lines 80%
- New logic files in `lib/` or `features/*/queries.ts` MUST have unit tests

---

## 15. Git Workflow

```bash
# Always use rtk prefix (token-optimized CLI proxy)
rtk git status
rtk git add <specific-files>
rtk git commit -m "feat: ..."
rtk git push

# Conventional commits
feat:     new feature
fix:      bug fix
chore:    tooling/deps
refactor: code restructure
test:     test changes

# Rules
# - Push to main (solo dev project)
# - Max 72 chars commit message
# - Stage specific files, never git add .
# - Batch related files in one commit
```

---

## 16. File Structure Quick Reference

```
app/
  (auth)/           → login, register
  dashboard/(panel) → owner panel routes
  manage/           → manager panel routes
  [team-slug]/(workspace) → workspace routes
  api/              → API routes
  auth/callback/    → OAuth handler
  invite/[token]/   → invite acceptance
  onboarding/       → org + profile setup

features/           → domain logic (actions, components, queries per feature)
  todos/            → To-Do: smart auto-todos + manual tasks (see §22)
  scrim/            → Scrim CRUD + VOD review + draft picks
  calendar/         → Calendar events + permissions
  salary/           → Player contracts + payments
  tournaments/      → Bracket + match tracking
  trials/           → Open trials pipeline
  sponsors/         → Sponsor tracker + ROI
  (see CLAUDE.md for full feature list)
components/ui/      → primitive UI (button, card, input, label, number-input)
components/layout/  → sidebar, nav
lib/
  supabase/         → createClient(), createAdminClient(), createMiddlewareClient()
  api/              → permission-middleware.ts, response.ts
  permissions/      → calendar visibility + audit
  validations/      → Zod schemas
  audit.ts          → logAudit()
stores/             → Zustand (useWorkspaceStore, calendar-preferences)
types/              → database.ts (generated), jwt.ts
supabase/
  migrations/       → SQL migrations
  functions/        → Edge Functions
middleware.ts       → auth gate + custom domain routing
```

---

## 17. Dead Features — Do NOT Revive

- `features/scouting/` — archived, do not use
- `features/matchmaking/` — archived, do not use
- AI insights — removed
- Reports route — not public, do not surface

---

## 18. Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_MAIN_DOMAIN=hyperionteam.id
OWNER_EMAIL=                    # who is the owner
FONNTE_API_TOKEN=               # WhatsApp delivery
FONNTE_WEBHOOK_SECRET=
```

---

## 19. Hard Rules (Never Violate)

1. No emojis as icons — Lucide React only
2. No `team_members` check for owner — use `OWNER_EMAIL` env
3. No inline component exports — causes HMR crash (see §4)
4. No `select("*")` on list queries — explicit columns only
5. No `.single()` unless row is guaranteed — use `.maybeSingle()`
6. No horizontal scroll on tables — truncate instead
7. No native `<select>` or `<input type="number">` — use CustomSelect/NumberInput
8. No commit without CI gate passing (lint + typecheck + test:unit:coverage)
9. No modifying files unrelated to current task
10. No `font-[Inter]` or `font-[Instrument_Sans]` class — font set globally via CSS var
11. Owner excluded from salary contract dropdowns
12. Public server actions must have rate limiting
13. Upload URLs must be validated against Supabase storage prefix

---

## 20. State Management Decision Tree

| Data type | Tool |
|-----------|------|
| Server data (lists, details fetched from DB) | TanStack Query `useQuery` / `useMutation` |
| Ephemeral UI state (open/close, selected tab) | `useState` / `useReducer` |
| Cross-component workspace state (active team, sidebar) | `useWorkspaceStore` (Zustand, `stores/`) |
| Form state | React Hook Form |

**Never** use `useEffect` + `fetch` to replace `useQuery`. **Never** put server-fetched data in Zustand.

---

## 21. TanStack Query + Server Action Integration

```typescript
// Read pattern
const { data, isPending } = useQuery({
  queryKey: ["scrims", teamId],
  queryFn: () => listScrims(teamId),
});

// Write pattern — wrap { ok, message } server action
const { mutateAsync, isPending } = useMutation({
  mutationFn: async (input: CreateScrimInput) => {
    const result = await createScrim(input);
    if (!result.ok) throw new Error(result.message);
    return result;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["scrims", teamId] });
    toast.success("Berhasil");
  },
  onError: (err) => toast.error(err instanceof Error ? err.message : "Gagal"),
});
```

---

## 22. To-Do Feature (features/todos/)

Routes: `/dashboard/todos` (owner) and `/manage/[orgSlug]/todos` (manager).

**Two todo types:**

Smart todos — auto-generated from DB state, each dismissible per-user:

| `smart_type` | Trigger | Navigate to |
|---|---|---|
| `contract_expiry` | Active contract ending in ≤30 days | `/dashboard/salaries` |
| `salary_due` | Pending payment overdue today | `/dashboard/salaries` |
| `member_unassigned` | Active member with no division | `/dashboard/assign` |
| `trial_pending` | Applicant pending >3 days | `#trials` |
| `scrim_no_result` | Completed scrim missing result entry | `#scrim-{id}` |
| `sponsor_stale` | Prospect sponsor not updated >7 days | `/dashboard/sponsors` |
| `tournament_no_bracket` | Tournament in ≤7 days, no bracket set | `/dashboard/tournaments/{id}` |

Manual todos — created by owner/manager, optionally assigned to another org member.

**DB tables:** `manual_todos`, `todo_dismissals`

**Urgency levels:** `overdue` → `today` → `this_week` → `later`

**Sidebar badge** (`getTodoBadgeCount`) — only counts `overdue` + `today` urgency items.

**Key files:**
- `features/todos/queries.ts` — `computeSmartTodos`, `getManualTodos`, `getTodoBadgeCount`
- `features/todos/actions.ts` — create/toggle/delete manual todos, dismiss smart todos
- `features/todos/types.ts` — `SmartTodo`, `ManualTodo`, `TodoUrgency`, `SmartTodoType`
- `features/todos/logic.ts` — `computeUrgency(date: Date | null): TodoUrgency`
