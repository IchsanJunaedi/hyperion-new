# Hyperion Progress — Status as of 2026-06-09

> Read this file first at the start of every session. It is the single source of truth for what's built, what's broken, and what's next.

---

## What's Live (Production-Ready)

### Owner Dashboard (`/dashboard`)
- Executive summary widget: win rate, attendance rate, active members, sponsor count/value, net balance
- Full org management: create org, manage members, view all stats
- Finance overview: income/expense CRUD, balance summary, org switcher (multi-org)
- Sponsor tracker: status badge, card, form modal (pending/active/inactive), ROI dashboard panel, media kit PDF export
- Content calendar: platform scheduling, approval flow
- Player development panel: set targets per player, update level, history chart
- Salary & contracts: player contracts with salary/bonus percentages + payment tracking
- To-Do (`/dashboard/todos`, `/manage/[orgSlug]/todos`): smart auto-todos (7 types: contract expiry, salary due, member unassigned, trial pending, scrim no result, sponsor stale, tournament no bracket) + manual assignable todos. Sidebar badge counts overdue+today items only.
- Public profile toggle (`is_public` on org): when enabled, `/p/[orgSlug]` shows org info, roster (no jersey number), tournament match W/L stats. Toggle in `/dashboard/teams`.

### Manager Panel (`/manage`)
- Roster: assign members to divisions, set roles (captain/coach/member)
- Divisions: create/edit/delete divisions
- Captains: assign/remove captain per division (1 max)
- Finances (`/manage/finances`): same finance CRUD as dashboard
- Sponsors (`/manage/sponsors`): same sponsor tracker + ROI dashboard
- Content (`/manage/content`): same content calendar
- Player Dev (`/manage/development`): set skill targets for each player
- Salaries (`/manage/salaries`): manage player contracts & salary payments

### Workspace (all roles under `/{slug}/`)
| Route | Feature | Status |
|-------|---------|--------|
| `/` | Team home: hero stats, personal player stats for member/captain | ✅ |
| `/scrim` | Scrim list (upcoming/ongoing/completed) | ✅ |
| `/scrim/[id]` | Detail: attendance RSVP, finish form, draft picks, review request, VOD link, linked files, scouting card | ✅ |
| `/scrim/[id]/results` | Per-game result detail with hero portraits (circular) | ✅ |
| `/scrim/new` | Create scrim (captain+) | ✅ |
| `/calendar` | Unified calendar (events + tournaments, visibility-gated) | ✅ |
| `/calendar/[id]` | Detail: RSVP buttons (hadir/tentative/tidak hadir) | ✅ |
| `/tournaments` | Tournament list with countdown | ✅ |
| `/tournaments/[id]` | Detail: stages + match tracking per stage (W/L/score), bracket link/file | ✅ |
| `/roster` | Member list with roles, jersey numbers, positions | ✅ |
| `/announcements` | List with pinned, auto-mark-read on view, read receipt X/Y | ✅ |
| `/announcements/[id]` | Detail: read count for managers | ✅ |
| `/strategy` | Strategy note bank with tags/visibility | ✅ |
| `/strategy/[id]` | Detail: threaded discussion/comments | ✅ |
| `/files` | File upload/download (coach+ only) | ✅ |
| `/polls` | Team polls (regular + availability grid type) with voting + close/archive | ✅ |
| `/analytics` | Overview, draft analytics, player stats, hero pool modal, PDF export | ✅ |
| `/development` | Member self-view of own skill targets | ✅ |
| `/meta` | MLBB meta tracker: hero picks, win rates, patch notes | ✅ |
| `/trials` | Open trials kanban pipeline (pending/accepted/rejected/waitlist) | ✅ |
| `/sponsors` | Active sponsors: name, logo, status, notes (read-only, all workspace roles) | ✅ |

### Public Pages (no auth)
| Route | Feature | Status |
|-------|---------|--------|
| `/p/[orgSlug]` | Public team profile: org info, roster, tournament W/L stats | ✅ |

### Infrastructure
- Auth: email/password + Google OAuth, role-based redirect
- Notifications: in-app bell (sidebar) + WhatsApp delivery via Fonnte
- Custom domain routing (middleware maps domain → org slug)
- Audit logging (`lib/audit.ts`) — all create/update/delete actions logged
- Calendar permission system (`lib/permissions/`) — visibility levels: all/management/coach_up/private
- RLS on all tables — `createAdminClient()` bypasses, `createClient()` respects
- Login rate limiting

### Automated Testing (last updated 2026-06-09)
- **775 unit tests** across 48 test files — all passing
- Coverage thresholds met: Statements 90.69% / Branches 78.64% / Functions 95.39% / Lines 90.91% (thresholds: 80%/75%/80%/80%)
- CI enforces coverage on every push via `test:unit:coverage` script

### E2E Test Architecture (Test God Mode)
- **`tests/`** — self-authenticating specs (auth + workspace full flow CRUD):
  - `tests/auth.spec.ts` — form validation, registration, onboarding redirects
  - `tests/workspace.spec.ts` — full CRUD: scrim, calendar, roster, announcements, polls, strategy, files (Fixed: select valid division for strategy notes)
  - `tests/global-setup.ts` — DB cleaner (hapus @hyperion.com users + test orgs sebelum run)
  - `tests/global-teardown.ts` — post-run cleanup untuk CI
  - Run: `npm run test:e2e:clean` — 100% PASS (5 passed) and can run repeatedly without data pollution.
- **`e2e/admin/`** — admin panel E2E (18 pages, requires `E2E_ADMIN_*` creds)
  - Run: `npm run test:e2e:admin`
- **`e2e/workspace/`** — 5-panel full suite (dashboard/manage/workspace/integration):
  - Plan 1: Dashboard owner (69 specs)
  - Plan 2: Manage manager (10 specs)
  - Plan 3: Workspace roles coach/captain/member (14 specs)
  - Plan 4: Cross-panel integration (8 flows, 20 specs)
  - Requires: `E2E_OWNER_*`, `E2E_MANAGER_*`, `E2E_COACH_*`, `E2E_CAPTAIN_*`, `E2E_MEMBER_*` in `.env.local`
  - Run: `npm run test:e2e:workspace`

### DB Migrations Pending (perlu `npx supabase db push` saat Docker jalan)
- `20260604150000_polls_coach_permission.sql` — coach bisa buat polls
- `20260605120000_announcements_coach_permission.sql` — coach bisa buat announcements

---

## New Tables (complete list, all migrations applied)

| Table | Purpose | Migration |
|-------|---------|-----------|
| `scrims` | Core scrim records | `init_schema` |
| `scrim_attendances` | Per-user RSVP per scrim | `init_schema` |
| `scrim_results` | Win/loss + score per scrim | `init_schema` |
| `scrim_game_results` | Per-game screenshot + notes | `20260516000001` |
| `scrim_draft_picks` | Hero picks per game per side | `20260521000000` |
| `scrim_review_requests` | Formal coach review requests | `20260521260000` |
| `scrim_vod_timestamps` | Coach timestamp annotations per VOD per game | `20260526120000` |
| `scrims.vod_link` | Single VOD/livestream URL per scrim | `20260527000002` |
| `calendar_events` | Unified calendar events | `init_schema` |
| `calendar_event_rsvps` | RSVP per user per event | `20260521220000` |
| `strategy_comments` | Threaded comments on strategy notes | `20260521230000` |
| `announcement_reads` | Track who read each announcement | `20260521240000` |
| `tournament_matches` | Match results per tournament stage | `20260521250000` |
| `poll_availability_votes` | Multi-slot availability votes | `20260525000002` |
| `sponsors` | Sponsor records with status/value/PIC | `20260521210000` |
| `finances` | Income/expense records | `20260515000003` |
| `player_targets` | Skill targets per player | `20260516000005` |
| `player_target_history` | History of target updates | `20260516000005` |
| `player_contracts` | Salary contracts per player | `20260523110000` |
| `salary_payments` | Payment records per contract | `20260523110000` |
| `bonus_distributions` | Bonus payouts per player | `20260526000001` |
| `open_trials` | Trial pipeline per org | `20260523120000` |
| `trial_applicants` | Individual applicant per trial | `20260523120000` |
| `meta_picks` | MLBB hero pick/ban meta tracking | `20260521200000` |
| `opponent_profiles` | Scouted opponent org data | `20260516000003` |
| `scrim_matchmaking_requests` | Scrim findmatch requests | `20260516000007` |
| `manual_todos` | Owner/manager created tasks, assignable to org members | todos feature |
| `todo_dismissals` | Per-user smart todo dismissal records | todos feature |
| `audit_logs` | All create/update/delete actions | `20260514000002` |
| `notification_preferences` | Per-user WA notification toggles | `20260516120000` |
| `content_calendar` | Social media content scheduling | `20260515000004` |

---

## Features & Fixes Completed (2026-06-10 session)

### Issue Triage & Tournament Match Opponent Name (GH #27-#30)
- **#27, #28, #29 — already fixed** (progress.md was stale): strategy comments display name, calendar RSVP grid count, and strategy comments realtime were all already implemented in code. Closed issues with explanation.
- **#30 — Tournament match opponent name** implemented:
  - Migration `20260610120000_tournament_match_opponent_name.sql` — adds `opponent_name TEXT` column to `tournament_matches`
  - `types/database.ts` — added `opponent_name: string | null` to Row/Insert/Update
  - `features/tournaments/queries.ts` — `TournamentMatch` interface updated
  - `features/tournaments/actions.ts` — `addTournamentMatchAction` + `updateTournamentMatchAction` accept `opponent_name`
  - `TournamentTimeline.tsx` — "Nama lawan (opsional)" input in both `AddMatchForm` and `MatchRow` edit form; display shows `{round_label} vs {opponent_name}` in match row

### Documentation Improvements
- `AGENTS.md` — fixed critical `logAudit` params bug (was `userId/table/recordId`, now correct `actorId/entityType/entityId`); added `logAudit` signature section, error→UI pattern, TanStack Query pattern, state management decision tree (§20-22), To-Do feature docs
- `CLAUDE.md` — added `todos/` to features list, updated Quick summary to 2026-06-09 with correct test counts, removed stale "B2 remaining" note
- `progress.md` — added To-Do feature to What's Live, added `manual_todos`/`todo_dismissals` tables, updated Known Limitations (all resolved), updated What's NOT Done with GH issue refs

---

## Features & Fixes Completed (2026-06-09 session)

### Refactoring & Polish (Salary & Contract UI)
- **Plain-Text Status Badges**: Removed pill backgrounds and borders for `active`, `expired`, and `terminated` badges in `SalaryCard.tsx`. Replaced with plain colored text using a clean red/green scheme (`active` in green, `expired`/`terminated` in red).
- **Payment Box Crowding Fix**: Changed the "Bulan ini" status row and "Bayar" button to stack vertically. This prevents text wrapping and overlap/crowding issues on narrow cards.
- **Financial Text Color Harmonization**: Changed the color of the player's monthly salary, bonus list amounts, and total paid amounts to green (`text-green-400`).
- **Pay Button Styling**: Styled the "Bayar" button with a green border (`border-green-500/30`), background (`bg-green-500/10`), and text color (`text-green-400`) to match the color theme.
- **Terminate Button Polish**: Muted the "Terminate Kontrak" button border and text by default, only highlighting it in red on hover to reduce visual noise.

### Agent Documentation (`AGENTS.md`)
- Added **Development Roles (Out-of-App)** to the Role Hierarchy section in `AGENTS.md` (Software Engineer, Frontend Developer with GSAP animations, QA / Tester, Security Analyst) to clarify team roles vs codebase development roles.

## Features & Fixes Completed (2026-06-03 session)

Audit issue #19–#24 (lihat folder `issues/`) — semua dikerjakan, CI gate hijau (typecheck + lint 0 error + 656 unit tests pass).

**#19 — `createAchievement` bug (org_id NOT NULL)** 🔴
- Achievement dari admin selalu gagal karena insert `""` ke `achievements.organization_id` (UUID NOT NULL).
- Keputusan: achievement admin = site-wide (form tak punya org picker). `organization_id` dibuat NULLABLE.
- Migration `20260603010000_achievements_org_nullable.sql` (sudah `db push` ke remote), `types/database.ts` (organization_id → `string | null`), action insert `?? null`.

**#20 — `listApplicants()` unbounded** — tambah `.limit(200)` + kolom eksplisit + `console.error` (`features/trials/queries.ts`).

**#21 — calendar RSVP/komentar unbounded** — `.limit()` + error check pada `getRsvpAttendees`, `getRsvpCounts`, `getEventComments`, dan komentar/relations di `getEventDetail` (`features/calendar/queries.ts`).

**#22 — `select("*")` di list view** — diganti kolom eksplisit: trials (semua fn), `listTournaments`, `listContent`+`listPendingApproval`, meta (patches + hero ratings), `listPolls` (+ poll_votes + availability_votes). Sisa yang sengaja dibiarkan: announcements list & scrims list (spread full-row, keputusan B2-2 sebelumnya), detail single-fetch tabel kecil (exception CLAUDE.md), dan calendar permission event-list (casted, date-bounded) — dicatat untuk ronde berikutnya.

**#23 — `.single()` → `.maybeSingle()`** — dikonversi pada read-path yang bisa 0-row + punya guard `!data`: `vodLinkAction` (2), `notifications/actions` (1), `permission-queries.ts` (8), `lib/permissions/calendar-access.ts` (9). Insert/update + `.select().single()` (error-handled, row dijamin ada) sengaja dibiarkan sesuai rule. Mock test `calendar-access.test.ts` di-alias `maybeSingle`→`single`.

**#24 — `generateMonthlyReport` waterfall** — lihat B2-9 di bawah.

## Features & Fixes Completed (2026-05-28 session)

### Bug & Performance Fixes (from audit-report-2026-05-28.md)

**H1 — TypeScript types regenerated**
- `types/database.ts` di-regenerate via Supabase MCP
- 11 tabel missing sekarang ada: `announcement_reads`, `calendar_event_rsvps`, `scrim_review_requests`, `tournament_matches`, `scrim_draft_bans`, `notification_preferences`, `login_rate_limits`, `strategy_comments`, `poll_availability_votes`, `scrim_vod_timestamps`, `bonus_distributions`
- 30+ `(supabase as any)` casts tidak lagi diperlukan secara teknis

**H2 — `getDraftAnalytics` unbounded query fixed**
- `features/analytics/queries.ts` — tambah `.order("scheduled_at", { ascending: false }).limit(200)` pada scrim fetch
- Sebelumnya fetch semua completed scrims tanpa batas → potensi lag saat org punya 500+ scrims

**H4 — Export function pattern fixed (168 file)**
- Seluruh komponen di `features/` diubah dari `export function X()` ke `const X = (); export { X }`
- Mencegah Next.js 15 Webpack HMR crash (`__webpack_modules__[moduleId] is not a function`)
- Scope: analytics, announcements, auth, calendar, content, dashboard, files, finances, invite, manage, matchmaking, meta, notifications, onboarding, player-development, polls, reports, roster, salary, scrim, settings, sponsors, strategy, tournaments, trials

**H5 — Silent error swallowing di analytics fixed**
- `getDraftAnalytics` + `getEnterprisePlayerStats` — semua parallel queries sekarang check `.error` dan log ke console
- User tidak lagi lihat dashboard kosong tanpa tahu ada error

**H6 — WA throw di `registerApplicantAction` fixed**
- `features/trials/actions.ts` — `sendWaMessage` dibungkus `try/catch`
- WA API failure tidak lagi cancel registrasi yang sudah berhasil di-insert ke DB

### Analytics Overview — 10 Scrim Terakhir Clickable
- Row di list "10 Scrim Terakhir" sekarang bisa diklik → navigate ke `/[slug]/scrim/[id]`
- Hover effect: background berubah `#2C2C2C`, nama lawan jadi lebih terang, `ChevronRight` icon muncul
- `slug` prop diteruskan dari page → `AnalyticsDashboard` → `OverviewTab`

---

## Features Completed (2026-05-26 — 2026-05-27 session)

### NumberInput Premium Stepper Component
- New `components/ui/number-input.tsx` — replaces all native `<input type="number">` across the app
- Custom Lucide-based chevron up/down buttons (consistent with design system)
- Auto-trims leading zeros on change (e.g. `05` → `5`)
- Auto-selects full value on focus when current value is `0` (so typing a digit replaces it instantly)
- Hidden default browser spinners globally in `app/globals.css`
- Replaced in: `SalaryFormModal`, `FinanceForm`, `SponsorFormModal`, `TournamentTimeline`, `TournamentCompleteModal`, `PlayerTargetCard`, `AddTargetForm`, `FinishScrimSection`, `FinishScrimForm`, `JoinModal`

### Salary Form Player Dropdown
- Rewrote dropdown with Flexbox `justify-between` for name-left, role-right alignment
- Role displayed as flat colored badge (no border) with per-role bg/text colors
- Player names truncate cleanly with `truncate pr-2`
- **Owner excluded** from dropdown — they are not eligible for salary contracts

### Scrim Results Page — Hero Portraits
- Hero images (circular, 20×20px, from `/public/heroes/*.webp`) now shown next to each pick in Tim Kita and Lawan columns
- Uses shared `getHeroImageUrl()` from `features/scrim/data/mlbb-heroes.ts` — consistent with `/meta` and `/analytics`
- Rows without a pick show `—` placeholder

### Scrim VOD / Livestream Link
- New column `vod_link TEXT` on `scrims` table (migration `20260527000002`)
- Server action `updateScrimVodLinkAction` — validates role (coach/captain/manager/owner), updates DB, revalidates page
- `ScrimVodLinkSection` component:
  - Auto-detects platform from URL (YouTube 🔴, TikTok ⚫, Twitch 💜, Nimo 🟢, Generic 🔵)
  - Displays as premium card with platform icon + external link button
  - Inline edit form with URL input
  - Shown below "Detail Tambahan" section on scrim detail page
- Edit access: Coach, Captain, Manager, Owner
- View access: all active org members (RLS on `scrims` table already covers this)

---

## Features Completed (2026-05-25 session)

### Polls Availability Grid
- New poll type `availability` with multi-slot heatmap grid
- `poll_availability_votes` table, `voteAvailabilityAction`, `AvailabilityPollCard`

### Files Linked to Context
- `ContextFiles` component on scrim detail + strategy note detail pages
- Coach+ can upload, all members can view

### Notifications Weekly Digest
- Edge function sends WA summary every Monday 09:00 WIB to org owners

### Tournament Bracket Resources
- `bracket_link` + `bracket_file_path` columns on `tournaments`
- `TournamentBracketCard` — add link or upload file, role-gated editing

### Executive Summary Dashboard
- Owner dashboard home: key metrics widget

### Sponsor ROI Dashboard + Media Kit PDF

### Finance Org Switcher

### Trials Pipeline Notes + Grid Fix

### Salary & Contracts (2026-05-23)
- `player_contracts` + `salary_payments` + `bonus_distributions` tables
- Full CRUD in `/manage/salaries` + `/dashboard/salaries`
- Owner excluded from receiving salary contracts

---

## Key Technical Decisions & Gotchas

### Supabase type gen — correct project ID
```
npx supabase gen types typescript --project-id pqzdukrlmbwjjgjyoqva --schema public > types/database.ts
```
Sometimes returns "Resource has been removed" — in that case, edit `types/database.ts` manually.

### Supabase db push — migration repair
If push fails with "Remote migration versions not found in local":
```
npx supabase migration repair --status reverted <version1> <version2>
npx supabase migration repair --status applied <version>
npx supabase db push
```

### Webpack HMR crash — Next.js 15
`__webpack_modules__[moduleId] is not a function` happens with inline-exported function components.
Fix: always declare component as `const Comp = ...;` then `export { Comp };` at the end of the file. Never `export default function` or `export function` inline.

### Owner detection
```typescript
const isOwner = user.email === process.env.OWNER_EMAIL;
```
NEVER check `team_members` for owner role.

### `markAnnouncementRead` is idempotent
Called on every render of announcement detail. Uses `upsert` with `ignoreDuplicates: true`.

### `calendar_event_rsvps` PK
Composite PK `(event_id, user_id)`. `onConflict` string = `"event_id,user_id"`.

### Tournament match tracking
`tournament_matches.stage_id → tournament_stages.id`. `getTournamentDetail` returns `TournamentStageWithMatches[]`.

### Scrim review request
`UNIQUE(scrim_id)` — one review per scrim. Error code `23505` = already requested.

### Notification system — which to use
- **Workspace features** → `toast` from `sonner`
- **Dashboard/manage panel features** → `useNotify()` from `NotifyModal`
- Exception: `PlayerTargetCard` uses `useNotify()` — don't change it.

### Print/Export CSS
`print-hide` in `globals.css` → `@media print { display: none }`. Applied to: sidebar, topbar, mobile nav, analytics tab bar.

### NumberInput component
All `<input type="number">` must use `<NumberInput>` from `@/components/ui/number-input`. Never use native number inputs.

### VOD Review vs VOD Link
- `scrim_vod_timestamps` + `VodReviewSection` = per-game timestamp annotations (used inside game result cards)
- `scrims.vod_link` + `ScrimVodLinkSection` = one link per scrim for the full match recording/livestream (on scrim detail page)

---

## Dead Features (DO NOT implement or revive)
- **Scouting** — exists but archived, not linked in nav
- **AI Insights tab** — placeholder, no backend
- **Matchmaking** — exists but archived
- **Reports page** — built but not public-facing yet

---

## Known Limitations (not bugs, by design)
- *(none active — all prior limitations resolved)*

---

## What's NOT Done (Future Work)
- WA Vision Upload (finish scrim via WhatsApp foto draft+scoreboard) — **DEFERRED, butuh biaya VPS** untuk hosting vision server. Desain lengkap: `docs/superpowers/specs/2026-06-11-wa-vision-upload-deferred.md`
- Reports page activation for managers (GH #32 — needs audit of manager-visible data)
- Light/dark mode CSS variable refactor (GH #33 — DO NOT START before palette finalized)
- *(all migrations applied — no pending migrations)*

### Light/Dark Mode Theming Refactor (future, before light mode launch)
- **Problem:** 146 file TSX hardcode hex design-system colors (`#191919`, `#2D2D2D`, dll) — akan salah di light mode
- **Root cause:** `globals.css` pakai `oklch()` generic, tidak ada CSS variable spesifik untuk Notion-dark palette
- **Fix needed:**
  1. Tentukan light mode color palette (padanan tiap token)
  2. Tambah CSS vars ke `globals.css` (`:root` light + `.dark`) + `@theme inline` untuk Tailwind utility
  3. Update 146 file: ganti `bg-[#191919]` → `bg-surface`, `text-[#9B9A97]` → `text-muted`, dll
- **Scope:** ~146 TSX files di `app/`, `features/`, `components/`
- **Do NOT start** sebelum light mode color palette diputuskan

---

## Performance: Batch 2 — Remaining Items

> Batch 1 (zero-risk) done (2026-05-22). B2-3 through B2-6 and B2-8 done in prior sessions.
> B2-7 confirmed resolved (2026-05-28 audit). See audit-report-2026-05-28.md for full detail.

### B2-1: Tambah `.limit()` pada query unbounded ✅ Done
- ✅ `getDraftAnalytics` — fixed `.limit(200)` (2026-05-28)
- ✅ `getOverviewStats` — sudah ada `.limit(200)`
- ✅ `getEnterprisePlayerStats` — sudah ada `.limit(100)`
- ✅ `getPersonalPlayerStats` — sudah ada `.limit(50)` pada scrims (verified 2026-05-28)
- ✅ `getScrimWinLossRecord` — sudah via `.rpc("get_scrim_win_loss")` (verified 2026-05-28)
- ✅ `player_target_history` — raised `.limit(200)` (2026-05-28)
- ✅ `listPlayerTargets` — added `.limit(100)` on player_targets (2026-05-28)
- ✅ `listCalendarEvents` — added safety `.limit(200)` (2026-05-28)

### B2-2: Ganti `select("*")` dengan kolom spesifik ✅ Done
- ✅ `features/sponsors/queries.ts` — list sudah pakai kolom spesifik
- ✅ `features/notifications/queries.ts` — sudah spesifik
- ✅ `features/finances/queries.ts` — sudah spesifik
- ✅ `features/calendar/queries.ts` — explicit cols on all queries (2026-05-28)
- ✅ `features/strategy/queries.ts` — explicit cols on all queries (2026-05-28)
- ✅ `features/salary/queries.ts` — explicit cols on player_contracts + salary_payments (2026-05-28)
- ✅ `features/player-development/queries.ts` — explicit cols on all queries (2026-05-28)
- Note: announcements & scrims skip `body`/spread type karena diperlukan di list view

### B2-7: `admin.auth.admin.listUsers` → query dari tabel `profiles`
- ✅ Sudah resolved — kedua page sudah query dari `profiles` table

### B2-9: Waterfall di `generateMonthlyReport` ✅ Done (2026-06-03)
- `features/reports/queries.ts` — direstrukturisasi jadi 3 fase paralel:
  - Phase A: 7 query independen (scrims bulan ini, member count, tournaments, finances, sponsors, trend scrims, trend finances) via `Promise.all`
  - Phase B: 7 query yang bergantung pada id dari Phase A (results, divisions, attendances, tournament divisions, stages, trend results, trend attendances) via `Promise.all`
  - Phase C: `tournament_matches` (bergantung pada stage ids)
  - Dari ~7+ round-trip serial → 3 fase. Output report identik (behavior-preserving).

---

## Audit Items Remaining (dari audit-report-2026-05-28.md)

### Medium Priority
- ✅ **M1** — fixed: `player_target_history` limit raised to `.limit(200)`, explicit cols (2026-05-28)
- ✅ **M2** — fixed: removed unused `count:exact` from calendar-access.ts; explicit cols on all audit routes (2026-05-28)
- ✅ **M3** — fixed: `generateMonthlyReport` diparalelkan jadi 3 fase (lihat B2-9) (2026-06-03)
- ✅ **M4** — fixed: mounted flag added to all 3 useEffects in PermissionGuard (2026-05-28)
- ✅ **M5** — fixed: `.single()` → `.maybeSingle()` + error log in `getScrimWinLossRecord` (2026-05-28)
- ✅ **M6** — fixed: screenshotUrl/cvUrl validated against Supabase storage prefix (2026-05-28)
- ✅ **M7** — fixed: deleted dead `subscribeToOrganizationCalendars` channel leak (2026-05-28)
- ✅ **M8** — fixed: email-based rate limit (3/hr) added to `registerApplicantAction` (2026-05-28)

### Low Priority
- ✅ **L1** — fixed: mounted flag in NotifSection useEffect .then() (2026-05-28)
- ✅ **L2** — fixed: `listPlayerTargets` added `.limit(100)` (2026-05-28)
- ✅ **L3** — fixed: `listCalendarEvents` added `.limit(200)` (2026-05-28)
- ✅ **L4** — fixed: error check added to `getAnnouncementReadCountsBatch` (2026-05-28)
- ✅ **L5** — fixed: error log added to `markAnnouncementRead` (2026-05-28)
- ✅ **L6** — fixed: `.limit(50)` added to `listTrials` (2026-05-28)
- ✅ **L7** — fixed: no-op startTransition removed from AttendanceTracker realtime handler (2026-05-28)
- ✅ **L8** — fixed: mounted flag added to StatisticsTab useEffect .then() (2026-05-28)
