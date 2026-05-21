# CLAUDE.md — Project Instructions for Claude Code

## Project Overview
Hyperion Team — OS untuk Tim Esports. Next.js 15 (App Router) + Supabase + TypeScript strict.

## Tech Stack
- **Framework**: Next.js 15.5 App Router (Server Components + Server Actions)
- **Database**: Supabase (Postgres + RLS + Edge Functions)
- **Auth**: Supabase Auth (email/password, OAuth via Google, JWT hook for custom claims)
- **Styling**: Tailwind CSS v4, dark Notion-style theme
- **State**: TanStack Query v5 (server data), Zustand v5 (client state)
- **Forms**: React Hook Form v7 + @hookform/resolvers (Zod resolver)
- **Validation**: Zod v4 (note: v4 API differs from v3 — use `z.object()`, `z.string()` etc.)
- **Icons**: Lucide React (NEVER use emojis for icons)
- **Notifications**: Dual system — see "Notification Pattern" section below
- **Font**: Instrument Sans (sans-serif) + Geist Mono (monospace)
- **Utilities**: clsx, tailwind-merge (via `cn()` helper), class-variance-authority, date-fns v4

## Architecture & Role System
```
Owner (1 person, determined by OWNER_EMAIL env var)
  → /dashboard (full control, all access)
Manager (assigned by Owner)
  → /manage (roster, assign captain/member, view stats)
Coach (assigned by Owner)
  → workspace (evaluate scrims, write notes)
Captain (assigned by Manager)
  → workspace (create scrims, manage attendance)
Member (assigned by Manager)
  → workspace (view scrims, RSVP, view schedule)
```

## Owner Detection
Owner is determined by `OWNER_EMAIL` environment variable — NOT by `team_members` table.
```typescript
const ownerEmail = process.env.OWNER_EMAIL;
const isOwner = user.email === ownerEmail;
```
NEVER check `team_members` for owner role. Owner has access to everything by email check.

## Key Design Decisions
1. **Divisions are standalone** — `divisions.organization_id` is NULLABLE. Divisions exist independently and get linked to teams when assigned.
2. **1 Captain per team** — enforced server-side in assign actions.
3. **1 team max per creation** — but multiple teams can exist (created one at a time).
4. **Auto-redirect after login** — based on DB role query (not JWT claims).
5. **Middleware handles custom domains** — maps custom domain hostnames to org slugs, rewrites paths internally.
6. **Middleware is minimal for auth** — only blocks unauthenticated users from workspace sub-routes. All member/role checks happen at page/layout level via DB queries.

## Notification Pattern (IMPORTANT)
The project uses TWO notification systems — use the right one for the context:

1. **Sonner toast** (`import { toast } from "sonner"`) — for quick inline feedback in workspace/feature components. Toaster is mounted in root layout.
2. **NotifyModal** (`import { useNotify } from "@/features/dashboard/components/NotifyModal"`) — centered popup with backdrop blur, used in dashboard/manage panel components.

**Rule of thumb:**
- Workspace features (roster, calendar, files, announcements, etc.) → use `toast` from sonner
- Dashboard/manage panel components → use `useNotify()` hook (NotifyModal)
- Match the pattern of the file you're editing — look at existing imports

## UI Style Guide (Notion Dark Theme)
```
Background:     #191919
Sidebar:        #202020
Borders:        #2D2D2D
Text primary:   #E5E2E1
Text secondary: #9B9A97
Text muted:     #6B6A68
Hover:          #2C2C2C
Active item:    #2C2C2C with #D4D4D4 text
```
- All buttons: `cursor-pointer` on hover
- Delete actions: 2-step confirmation (ConfirmDeleteDialog, type "HAPUS")
- Tables: use CSS Grid (`grid-cols-[...]`) not `<table>` for alignment consistency
- No horizontal scroll — truncate text instead
- Role colors: owner=yellow, manager=green, coach=blue, captain=purple, member=gray
- Use `cn()` from `@/lib/utils/cn` for conditional class merging

## File Structure
```
app/
  (auth)/               → Login, register pages
  api/                  → API routes (calendar permissions, events, audit)
  auth/callback/        → OAuth callback handler
  dashboard/            → Owner panel
  invite/[token]/       → Invite acceptance flow
  manage/               → Manager panel
  onboarding/           → Org + profile setup
  [team-slug]/          → Workspace (captain/member/coach)
    (workspace)/        → Protected workspace routes
components/
  landing/              → Landing page components
  layout/               → Layout components (sidebar, nav)
  providers/            → React context providers (QueryProvider)
  team/                 → Team-related shared components
  ui/                   → Reusable UI primitives (button, card, input, label, alert)
features/
  announcements/        → Announcements CRUD
  auth/                 → Auth forms (login, register, OAuth)
  calendar/             → Calendar events + permissions
  content/              → Content calendar
  dashboard/            → Owner/Manager actions, components, queries
  files/                → File upload/management
  finances/             → Finance tracking
  invite/               → Invite system
  manage/               → Manager-specific actions
  matchmaking/          → Scrim matchmaking between orgs
  notifications/        → Bell, realtime, WA delivery
  onboarding/           → Onboarding forms
  player-development/   → Player targets & progress tracking
  polls/                → Team polls/voting
  reports/              → Reports & analytics
  roster/               → Roster management
  scouting/             → Player scouting
  scrim/                → Scrim CRUD
  strategy/             → Strategy notes
  teams/                → Team management
  tournaments/          → Tournament brackets & stages
lib/
  actions/              → Shared server action utilities
  api/                  → API helpers (permission-middleware, response utils)
  permissions/          → Calendar permission system (access, audit, rules, types)
  supabase/             → Client configs (server, client, admin, middleware)
  utils/                → Utility functions (cn, format, etc.)
  validations/          → Zod schemas
  audit.ts              → Audit logging (await logAudit(...))
stores/                 → Zustand stores (useWorkspaceStore, calendar-preferences)
types/                  → TypeScript types (database.ts, jwt.ts)
supabase/
  migrations/           → SQL migrations (push with `npx supabase db push`)
  functions/            → Edge Functions (process-wa-queue)
middleware.ts           → Auth gating + custom domain routing
```

## Environment Variables
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_MAIN_DOMAIN=hyperionteam.id
OWNER_EMAIL=                    # Determines who is the owner

# WhatsApp (Fonnte)
FONNTE_API_TOKEN=
FONNTE_WEBHOOK_SECRET=
```

## Rules for Claude Code

### Token Efficiency
- Read files before editing — don't guess content
- Make targeted edits (str_replace) not full file rewrites when possible
- Don't repeat back large code blocks in explanations
- Batch related changes together

### Git Workflow
- ALWAYS commit and push after completing a task — **always use `rtk commit`** (never run `git commit` or push manually)
- Use conventional commits: `feat:`, `fix:`, `chore:`, `refactor:`
- Push to `main` branch (this is a solo dev project)
- Stage specific files, not `git add .` blindly
- Check `git status` before committing
- Batch related files in one commit, don't commit file-by-file
- Keep commit messages short and descriptive (max 72 chars)

### Code Quality
- Run `getDiagnostics` after every file change to verify no errors
- Never leave broken imports or unused variables
- Match existing patterns — look at similar files before creating new ones
- All server actions must validate auth and return `{ ok: true }` or `{ ok: false, message: string }`
- Use `cn()` for conditional Tailwind classes, not string concatenation

### What NOT to Do
- Don't use emojis as icons (use Lucide React)
- Don't check `team_members` for owner verification (use OWNER_EMAIL env)
- Don't use native `<select>` dropdowns (use CustomSelect component from `@/features/dashboard/components/CustomSelect`)
- Don't create "placeholder" or "pool" orgs as workarounds
- Don't add horizontal scroll to tables
- Don't modify files unrelated to the current task
- Don't use `font-[Inter]` or `font-[Instrument_Sans]` class (font is already set globally via CSS variable)

### Database
- Migrations go in `supabase/migrations/` with timestamp prefix (format: `YYYYMMDDHHMMSS_description.sql`)
- Push with: `npx supabase db push`
- If conflict: `npx supabase migration repair --status applied <version>`
- Always use `createAdminClient()` for cross-user operations (bypasses RLS)
- Always use `createClient()` (server) for user-scoped operations (respects RLS)
- RLS is enabled on all tables — admin client bypasses RLS
- Generate types: `npx supabase gen types typescript --project-id tbuxtlbtjpoholcflmoy --schema public > types/database.ts`

### API Routes
- Permission middleware at `lib/api/permission-middleware.ts` — use `validateRequest()`, `isOwner()`, `getUserRole()`, `requireRole()`
- Response helpers at `lib/api/response.ts` — use `success()`, `error()`, `forbidden()`, `notFound()`, `internalError()`
- Calendar permission system at `lib/permissions/` — handles visibility levels, member permissions, audit logging

### Testing Changes
- After UI changes: verify the page loads without errors in browser
- After action changes: test the action works (create, update, delete)
- After migration: run `npx supabase db push` to apply

## Calendar System (features/calendar/)
The calendar is a unified system that merges manual events + tournaments (scrims removed from calendar view):

### Event Types
Valid types: `"tournament" | "practice" | "meeting" | "bootcamp" | "other"`.
`"scrim"` is **NOT** a valid event type in the calendar. Scrims have their own separate module (`features/scrim/`).

### Visibility Levels
- `all` — All team members
- `management` — Owner + Manager only
- `coach_up` — Coach, Manager, Owner
- `private` — Only the creator

### Calendar Permissions (lib/permissions/)
Permission system determines who can create/view/edit events based on role. Visibility is stored on the event itself, not a separate permission table.

### Date Validation Rule
`ends_at` must be >= `starts_at` when both are provided. `ends_at` is optional.
Applied in Zod schema (`lib/validations/calendar.ts`) via `.refine()` on both create and update schemas.

### QuickAddEventModal (features/calendar/components/QuickAddEventModal.tsx)
- Stacked grid layout for datetime inputs (responsive, no overflow)
- Custom switch toggle for "Event Seharian" (not a native checkbox)
- Client-side + server-side date validation
- `startsAt` state drives the `min` attribute on `ends_at` input

## Scrim Format Values
Valid formats: `"bo1" | "bo2" | "bo3" | "bo5" | "bo7" | "4match"`.
`"scrimmage"` is **NOT** a valid format — removed from `ScrimForm.tsx` and `ScrimEditForm.tsx`.

## Current State
See **`progress.md`** in the project root for the full, up-to-date feature inventory, new DB tables, technical gotchas, dead features, and what's not yet done.

**Always read `progress.md` at the start of a new session before making any changes.**

Quick summary (as of 2026-05-21):
- All workspace routes functional: scrim, calendar (RSVP), tournaments (match tracking), announcements (read receipts), strategy (comments), polls, analytics (PDF export), roster, files, development (member self-view)
- 5 new tables applied: calendar_event_rsvps, strategy_comments, announcement_reads, tournament_matches, scrim_review_requests
- `npx supabase gen types` is broken — edit `types/database.ts` manually for new tables
- Dead features (do not revive): scouting, AI insights, matchmaking, reports (not public)
