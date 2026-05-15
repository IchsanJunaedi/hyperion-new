# CLAUDE.md — Project Instructions for Claude Code

## Project Overview
Hyperion Team — OS untuk Tim Esports. Next.js 15 (App Router) + Supabase + TypeScript strict.

## Tech Stack
- **Framework**: Next.js 15.5 App Router (Server Components + Server Actions)
- **Database**: Supabase (Postgres + RLS + Edge Functions)
- **Auth**: Supabase Auth (email/password, JWT hook for custom claims)
- **Styling**: Tailwind CSS v4, dark Notion-style theme
- **State**: TanStack Query v5 (server data), Zustand v5 (client state)
- **Validation**: Zod
- **Icons**: Lucide React (NEVER use emojis for icons)
- **Notifications**: Custom NotifyModal (centered popup with backdrop blur) — NOT Sonner toast
- **Font**: Inter (sans-serif)

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
5. **Middleware is minimal** — only blocks unauthenticated users from workspace sub-routes. All member/role checks happen at page/layout level via DB queries.

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
- Success/error feedback: NotifyModal (centered, backdrop blur, auto-close 2.5s)
- Tables: use CSS Grid (`grid-cols-[...]`) not `<table>` for alignment consistency
- No horizontal scroll — truncate text instead
- Role colors: owner=yellow, manager=green, coach=blue, captain=purple, member=gray

## File Structure
```
app/
  dashboard/          → Owner panel
  manage/             → Manager panel
  [team-slug]/        → Workspace (captain/member/coach)
    (workspace)/      → Protected workspace routes
features/
  dashboard/          → Owner/Manager actions, components, queries
  scrim/              → Scrim CRUD
  announcements/      → Announcements CRUD
  calendar/           → Calendar events
  strategy/           → Strategy notes
  notifications/      → Bell, realtime, WA delivery
  roster/             → Roster management
lib/
  supabase/           → Client configs (server, client, admin, middleware)
  validations/        → Zod schemas
  audit.ts            → Audit logging (await logAudit(...))
supabase/
  migrations/         → SQL migrations (push with `npx supabase db push`)
```

## Rules for Claude Code

### Token Efficiency
- Read files before editing — don't guess content
- Make targeted edits (str_replace) not full file rewrites when possible
- Don't repeat back large code blocks in explanations
- Batch related changes together

### Git Workflow
- ALWAYS commit and push after completing a task
- Use conventional commits: `feat:`, `fix:`, `chore:`, `refactor:`
- Push to `main` branch (this is a solo dev project)
- Stage specific files, not `git add .` blindly
- Check `git status` before committing
- Use RTK (git shorthand commands) for token efficiency:
  - `git add -A && git commit -m "msg" && git push` in one line when possible
  - Batch related files in one commit, don't commit file-by-file
  - Keep commit messages short and descriptive (max 72 chars)

### Code Quality
- Run `getDiagnostics` after every file change to verify no errors
- Never leave broken imports or unused variables
- Match existing patterns — look at similar files before creating new ones
- All server actions must validate auth and return `{ ok: true }` or `{ ok: false, message: string }`

### What NOT to Do
- Don't use emojis as icons (use Lucide React)
- Don't use Sonner toast (use NotifyModal via `useNotify()` hook)
- Don't check `team_members` for owner verification (use OWNER_EMAIL env)
- Don't use native `<select>` dropdowns (use CustomSelect component)
- Don't create "placeholder" or "pool" orgs as workarounds
- Don't add horizontal scroll to tables
- Don't modify files unrelated to the current task
- Don't use `font-[Inter]` class (font is already set globally)

### Database
- Migrations go in `supabase/migrations/` with timestamp prefix
- Push with: `npx supabase db push`
- If conflict: `npx supabase migration repair --status applied <version>`
- Always use `createAdminClient()` for cross-user operations
- Always use `createClient()` (server) for user-scoped operations
- RLS is enabled on all tables — admin client bypasses RLS

### Testing Changes
- After UI changes: verify the page loads without errors in browser
- After action changes: test the action works (create, update, delete)
- After migration: run `npx supabase db push` to apply

## Current State (as of 2026-05-15)
- Owner dashboard: fully functional with Notion-style UI
- Manager panel: functional with assign, divisions, captains
- Workspace: scrim CRUD, roster, calendar, announcements, strategy, files
- Auth: register, login, role-based redirect
- New features being added: finances, content calendar, invite system, team health score
