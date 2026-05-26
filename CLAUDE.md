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
  → workspace (evaluate scrims, write notes, manage VOD links)
Captain (assigned by Manager)
  → workspace (create scrims, manage attendance, manage VOD links)
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
- Exception: `PlayerTargetCard` uses `useNotify()` — don't change it.

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
    (panel)/
      assign/           → Assign members to divisions
      audit/            → Audit log viewer
      calendar/         → Calendar management
      content/          → Content calendar
      divisions/        → Division management
      export/           → Data export
      files/            → File management
      finances/         → Finance CRUD
      managers/         → Manager management
      reports/          → Reports (not public yet)
      salaries/         → Player contracts & salary
      sponsors/         → Sponsor tracker
      teams/            → Team management
      tournaments/      → Tournament management
      users/            → User management
  invite/[token]/       → Invite acceptance flow
  manage/               → Manager panel
    assign/             → Assign members
    captains/           → Captain management
    content/            → Content calendar
    development/        → Player skill targets
    divisions/          → Division management
    finances/           → Finance CRUD
    reports/            → Reports
    salaries/           → Salary management
    sponsors/           → Sponsor tracker
  onboarding/           → Org + profile setup
  [team-slug]/          → Workspace (captain/member/coach)
    (workspace)/        → Protected workspace routes
      analytics/        → Stats, draft analytics, PDF export
      announcements/    → Announcements + read receipts
      calendar/         → Unified calendar + RSVP
      development/      → Member self-view skill targets
      files/            → File upload/download
      meta/             → MLBB meta tracker
      polls/            → Polls (regular + availability grid)
      roster/           → Member list
      scrim/            → Scrim list + detail + results
      settings/         → Notification preferences
      strategy/         → Strategy notes + comments
      tournaments/      → Tournaments + bracket
      trials/           → Open trials pipeline
components/
  landing/              → Landing page components
  layout/               → Layout components (sidebar, nav)
  providers/            → React context providers (QueryProvider)
  team/                 → Team-related shared components
  ui/                   → Reusable UI primitives (button, card, input, label, alert, number-input)
features/
  analytics/            → Draft analytics, player stats, hero modal
  announcements/        → Announcements CRUD
  auth/                 → Auth forms (login, register, OAuth)
  calendar/             → Calendar events + permissions
  content/              → Content calendar
  dashboard/            → Owner/Manager actions, components, queries
  files/                → File upload/management
  finances/             → Finance tracking
  invite/               → Invite system
  manage/               → Manager-specific actions
  matchmaking/          → Scrim matchmaking (archived)
  meta/                 → MLBB meta tracker
  notifications/        → Bell, realtime, WA delivery
  onboarding/           → Onboarding forms
  player-development/   → Player targets & progress tracking
  polls/                → Team polls/voting (regular + availability)
  reports/              → Reports & analytics
  roster/               → Roster management
  salary/               → Player contracts & salary payments
  scouting/             → Opponent scouting (archived)
  scrim/                → Scrim CRUD + VOD review + draft picks
  settings/             → Notification preferences
  sponsors/             → Sponsor tracker + ROI dashboard
  strategy/             → Strategy notes + comments
  teams/                → Team management
  tournaments/          → Tournament brackets & stages
  trials/               → Open trials pipeline
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
  functions/            → Edge Functions (process-wa-queue, weekly-digest)
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

### HMR / Webpack Crash Prevention (CRITICAL)
Next.js 15 Webpack HMR crashes (`__webpack_modules__[moduleId] is not a function`) with inline-exported components.

**ALWAYS use this pattern:**
```tsx
// ✅ CORRECT
const MyComponent = () => { ... };
export { MyComponent };

// ❌ WRONG — causes HMR crash
export default function MyComponent() { ... }
export function MyComponent() { ... }
```

### What NOT to Do
- Don't use emojis as icons (use Lucide React)
- Don't check `team_members` for owner verification (use OWNER_EMAIL env)
- Don't use native `<select>` dropdowns (use CustomSelect component from `@/features/dashboard/components/CustomSelect`)
- Don't use native `<input type="number">` (use `NumberInput` from `@/components/ui/number-input`)
- Don't create "placeholder" or "pool" orgs as workarounds
- Don't add horizontal scroll to tables
- Don't modify files unrelated to the current task
- Don't use `font-[Inter]` or `font-[Instrument_Sans]` class (font is already set globally via CSS variable)
- Don't include Owner in salary contract dropdowns (they share business revenue, not salaried)

## Reusable Components (Jangan Buat Ulang)

Sebelum membuat komponen baru, cek apakah sudah ada:

| Kebutuhan | Komponen | Path |
|-----------|----------|------|
| Dropdown / select | `CustomSelect` | `@/features/dashboard/components/CustomSelect` |
| Konfirmasi hapus | `ConfirmDeleteDialog` | `@/features/dashboard/components/ConfirmDeleteDialog` |
| Notifikasi dashboard/manage | `useNotify()` | `@/features/dashboard/components/NotifyModal` |
| Notifikasi workspace | `toast` | `sonner` |
| Audit log | `logAudit()` | `@/lib/audit` |
| Input angka / stepper | `NumberInput` | `@/components/ui/number-input` |

### Pola Dropdown di Dalam Card
Dropdown `absolute` di dalam card **WAJIB** ikuti aturan ini atau akan terpotong:
- Container parent: **JANGAN** pakai `overflow-hidden`
- List dropdown: gunakan `absolute`, `z-50`, `top-full`
- Referensi implementasi: `features/salary/components/SalaryCard.tsx` (bonus turnamen dropdown)

### Pola Konfirmasi Hapus
Selalu gunakan `ConfirmDeleteDialog` dengan `confirmPhrase="HAPUS"` untuk aksi destruktif. Jangan buat dialog konfirmasi custom.

### Pola Modal
- Modal overlay: `fixed inset-0 z-50 flex items-center justify-center bg-black/60`
- Klik backdrop menutup modal (pasang `onClick={onClose}` di overlay, `onClick={(e) => e.stopPropagation()}` di inner div)
- Referensi: `features/tournaments/components/TournamentCompleteModal.tsx`

### NumberInput Stepper
Gunakan `<NumberInput>` dari `@/components/ui/number-input` untuk semua input angka:
- Auto-trim leading zeros (05 → 5)
- Auto-select on focus when value is 0
- Custom chevron up/down buttons (tidak pakai browser default spinner)

### Salary Contract Rules
- Owner **tidak boleh** masuk dropdown player di form kontrak salary
- Filter: `eligibleMembers = members.filter(m => m.role !== 'owner')`

### Database
- Migrations go in `supabase/migrations/` with timestamp prefix (format: `YYYYMMDDHHmmSS_description.sql`)
- Push with: `npx supabase db push`
- If conflict: `npx supabase migration repair --status reverted <version>` then `npx supabase migration repair --status applied <version>`
- Always use `createAdminClient()` for cross-user operations (bypasses RLS)
- Always use `createClient()` (server) for user-scoped operations (respects RLS)
- RLS is enabled on all tables — admin client bypasses RLS
- Generate types: `npx supabase gen types typescript --project-id pqzdukrlmbwjjgjyoqva --schema public > types/database.ts`
- If gen fails ("Resource has been removed"): edit `types/database.ts` manually

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

## Scrim System (features/scrim/)

### Format Values
Valid formats: `"bo1" | "bo2" | "bo3" | "bo5" | "bo7" | "4match"`.
`"scrimmage"` is **NOT** a valid format.

### VOD System (Two Separate Concepts)
1. **`scrims.vod_link`** (column) + `ScrimVodLinkSection` — ONE link per scrim (full match recording/livestream), shown on scrim detail page sidebar area under "Detail Tambahan"
2. **`scrim_vod_timestamps`** (table) + `VodReviewSection` — per-game timestamp annotations (coach notes at specific video moments), shown inside each game result card on the results page

### Hero Images
Use `getHeroImageUrl(heroName)` from `@/features/scrim/data/mlbb-heroes` to get `/heroes/<slug>.webp` path.
Circular portrait: `<div className="h-5 w-5 overflow-hidden rounded-full border border-white/10 bg-zinc-800"><img ... className="h-full w-full object-cover" /></div>`

## Current State
See **`progress.md`** in the project root for the full, up-to-date feature inventory, new DB tables, technical gotchas, dead features, and what's not yet done.

**Always read `progress.md` at the start of a new session before making any changes.**

Quick summary (as of 2026-05-27):
- All workspace routes functional: scrim (+ VOD link + hero portraits in results), calendar (RSVP), tournaments (bracket + match tracking), announcements (read receipts + ack), strategy (comments), polls (regular + availability grid), analytics (PDF export), roster, files, development, meta, trials
- Premium `NumberInput` stepper component replaces all native `<input type="number">` app-wide
- Salary contracts: player contracts + payments + bonus distributions — Owner excluded from receiving salary
- 68 migrations applied
- Dead features (do not revive): scouting, AI insights, matchmaking, reports (not public)
- Performance Batch 2 items remaining: B2-1, B2-2, B2-7, B2-9 (see progress.md)
