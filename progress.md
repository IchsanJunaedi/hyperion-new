# Hyperion Progress — Status as of 2026-05-21

> Read this file first at the start of every session. It replaces the "Current State" section in CLAUDE.md and is the single source of truth for what's built, what's broken, and what's next.

---

## What's Live (Production-Ready)

### Owner Dashboard (`/dashboard`)
- Full org management: create org, manage members, view all stats
- Finance overview: income/expense CRUD, balance summary
- Sponsor tracker: status badge, card, form modal (pending/active/inactive)
- Content calendar: platform scheduling, approval flow
- Player development panel: set targets per player, update level, history chart

### Manager Panel (`/manage`)
- Roster: assign members to divisions, set roles (captain/coach/member)
- Divisions: create/edit/delete divisions
- Captains: assign/remove captain per division (1 max)
- Finances (`/manage/finances`): same finance CRUD accessible from manager
- Sponsors (`/manage/sponsors`): same sponsor tracker as dashboard
- Content (`/manage/content`): same content calendar
- Player Dev (`/manage/development`): set skill targets for each player

### Workspace (all roles under `/{slug}/`)
| Route | Feature | Status |
|-------|---------|--------|
| `/` | Team home (hero stats, personal player stats for member/captain) | ✅ |
| `/scrim` | Scrim list (upcoming/ongoing/completed) | ✅ |
| `/scrim/[id]` | Detail: attendance RSVP, finish form, draft, review request | ✅ |
| `/scrim/new` | Create scrim (captain+) | ✅ |
| `/calendar` | Unified calendar (events + tournaments, visibility-gated) | ✅ |
| `/calendar/[id]` | Detail: RSVP buttons (hadir/tentative/tidak hadir) | ✅ |
| `/tournaments` | Tournament list with countdown | ✅ |
| `/tournaments/[id]` | Detail: stages + match tracking per stage (W/L/score) | ✅ |
| `/roster` | Member list with roles, jersey numbers, positions | ✅ |
| `/announcements` | List with pinned, auto-mark-read on view | ✅ |
| `/announcements/[id]` | Detail: read count for managers | ✅ |
| `/strategy` | Strategy note bank with tags/visibility | ✅ |
| `/strategy/[id]` | Detail: threaded discussion/comments | ✅ |
| `/files` | File upload/download (coach+ only) | ✅ |
| `/polls` | Team polls with voting + close/archive | ✅ |
| `/analytics` | Overview, draft analytics, player stats, PDF export | ✅ |
| `/development` | Member self-view of own skill targets | ✅ |
| `/meta` | Meta patch notes | ✅ |

### Infrastructure
- Auth: email/password + Google OAuth, role-based redirect
- Notifications: in-app bell (sidebar) + WhatsApp delivery via Fonnte
- Custom domain routing (middleware maps domain → org slug)
- Audit logging (`lib/audit.ts`) — all create/update/delete actions logged
- Calendar permission system (`lib/permissions/`) — visibility levels: all/management/coach_up/private
- RLS on all tables — `createAdminClient()` bypasses, `createClient()` respects

---

## New Tables Added (2026-05-21 — all migrations applied)

| Table | Purpose | Migration file |
|-------|---------|---------------|
| `calendar_event_rsvps` | RSVP per user per calendar event | `20260521220000_calendar_event_rsvps.sql` |
| `strategy_comments` | Discussion threads on strategy notes | `20260521230000_strategy_comments.sql` |
| `announcement_reads` | Track who read each announcement | `20260521240000_announcement_reads.sql` |
| `tournament_matches` | Match results per tournament stage | `20260521250000_tournament_matches.sql` |
| `scrim_review_requests` | Formal coach review requests per scrim | `20260521260000_scrim_review_requests.sql` |

All types are in `types/database.ts`. `npx supabase gen types` is broken (API error) — edit `types/database.ts` manually when adding tables.

---

## Key Technical Decisions & Gotchas

### Supabase type gen — FIXED (was broken due to wrong project ID)
The old project ID in CLAUDE.md was wrong (`tbuxtlbtjpoholcflmoy`). Correct ID is `pqzdukrlmbwjjgjyoqva`.
Run: `npx supabase gen types typescript --project-id pqzdukrlmbwjjgjyoqva --schema public > types/database.ts`
After running gen, also commit the updated `types/database.ts`. TypeScript will catch any `(supabase as any)` casts that can now be removed.

### Existing `(supabase as any)` casts
Some queries still use `as any` for tables that were added before the type gen was fixed. These are safe to remove once you verify the table type is now in `types/database.ts`.

### `markAnnouncementRead` is idempotent
Called on every render of announcement detail page. Uses `upsert` with `ignoreDuplicates: true`. Safe to call multiple times.

### `getMyRsvp` / RSVP buttons
`calendar_event_rsvps` PK is `(event_id, user_id)`. The `onConflict` string in upsert is `"event_id,user_id"`.

### Tournament match tracking
Matches live in `tournament_matches.stage_id → tournament_stages.id`. `getTournamentDetail` now returns `TournamentStageWithMatches[]` (extends `TournamentStage` with `matches: TournamentMatch[]`).

### Scrim review request
`UNIQUE(scrim_id)` — one review request per scrim. Error code `23505` = already requested. Coaches submit `review_notes` to mark `status = 'reviewed'`.

### Player dev workspace page
`/development` uses `createClient()` + existing `getPlayerTargets()`. RLS policy "Members can view targets in their org" allows all members to read. `canManage` includes `coach | captain | manager | owner` (not member) for UI edit controls.

### Print/Export CSS
`print-hide` class defined in `globals.css` → `@media print { display: none }`. Applied to: sidebar `<aside>`, topbar `<header>`, mobile nav `<nav>`. The analytics tab bar also has `print-hide`. `print-main` class makes the content div `width: 100%`.

### Notification system — which to use
- **Workspace features** (scrim, calendar, strategy, announcements, polls, dev, tournaments) → `toast` from `sonner`
- **Dashboard/manage panel features** → `useNotify()` from `NotifyModal`
- Exception: `PlayerTargetCard` uses `useNotify()` because it was originally a manage panel component. Don't change it.

---

## Dead Features (DO NOT implement or revive)
- **Scouting** — exists but archived, not linked in nav
- **AI Insights tab** — placeholder, no backend
- **Matchmaking** — exists but archived
- **Reports page** — built but not public-facing yet
- **Public profile** — infrastructure ready, not activated

---

## Known Limitations (not bugs, by design)
- Strategy comments: optimistic display name shows `null` → "Member" until full page reload. Acceptable.
- `StrategyComments` state doesn't sync with server re-renders (RSC prop change doesn't re-init `useState`). Add `useEffect` if user complains.
- Calendar RSVP has no attendee count display — just personal status. Can be added later.
- Tournament match tracking has no opponent name field — `round_label` is free text (e.g. "Babak Grup vs TeamX"). By design.

---

## What's NOT Done (Future Work)
- Read receipt count display on announcement **list** (currently only on detail page)
- RSVP summary count per calendar event (how many hadir/tidak)
- Scrim review request notification to coach via WA/bell
- Strategy comments realtime subscription (currently requires page reload to see others' comments)
- Player dev: coach can only see own targets on `/development` — separate manager view at `/manage/development` for cross-player view
- Public profile activation
- Reports page activation

---

## Performance: Batch 2 — Pending Fixes (needs careful audit before implementing)

> Batch 1 (zero-risk) sudah selesai (2026-05-22). Batch 2 membutuhkan review per-komponen sebelum diimplementasi.

### B2-1: Tambah `.limit()` pada query unbounded (butuh cek UI dulu)
Beberapa query list tidak punya `.limit()` — data bisa grow unboundedly. Perlu audit dulu apakah halaman butuh pagination atau cukup slice.
- `features/teams/queries.ts` → `getPersonalPlayerStats`: scrims tanpa limit (semua completed scrims)
- `features/scrim/queries.ts` → `getScrimWinLossRecord`: semua completed scrims untuk hitung W/L → harusnya SQL COUNT/SUM via RPC
- `features/scrim/queries.ts` → `listScrims` filter `upcoming`/`ongoing`: tidak ada `.limit()`
- `features/analytics/queries.ts` → `getOverviewStats`, `getEnterprisePlayerStats`: semua completed scrims tanpa limit
- `features/player-development/queries.ts` → `player_target_history`: semua history tanpa limit (tambah `.limit(30)` per target)

### B2-2: Ganti `select("*")` dengan kolom spesifik (butuh cross-check field yang dipakai UI)
Perlu baca component yang consume data sebelum narrowing kolom.
- `features/calendar/unified.ts:44` + `features/calendar/queries.ts:21` → `select("*")` pada `calendar_events`
- `features/sponsors/queries.ts:27` → `select("*")` pada sponsors list (ada kolom `notes` teks panjang)
- `features/finances/queries.ts:26` → `select("*")` pada finances rows
- `features/notifications/queries.ts:47` → `select("*")` pada notifications + `count: "exact"` (mahal)

### B2-3: `WaDeliveryTable` refactor ke CSS Grid (ada perubahan tampilan)
`features/notifications/components/WaDeliveryTable.tsx` menggunakan `<table>` dengan `overflow-x-auto` — melanggar CLAUDE.md. Perlu rewrite ke CSS Grid. Ada perubahan visual minor.

### B2-4: Waterfall di `getScrimDetail` (5 fase serial)
`features/scrim/queries.ts:113–245` — scrim detail page punya 5 fase sequential. `auth.getUser()` bisa diparallelkan dengan fetch awal scrim row.

### B2-5: Waterfall di `listUnifiedCalendarEvents` + role fetch duplikat
`features/calendar/unified.ts` — fetches role lagi padahal calendar page sudah fetch role di atas. Role bisa di-pass sebagai parameter untuk skip query.

### B2-6: Waterfall di `getScrimDetail` — `auth.getUser()` sequential di akhir
`features/scrim/queries.ts:233` — `auth.getUser()` dipanggil di fase ke-4, padahal bisa diparallelkan di fase 1.

### B2-7: `admin.auth.admin.listUsers` — ganti dengan query dari tabel `profiles`
`app/dashboard/(panel)/users/page.tsx:50`, `app/dashboard/(panel)/assign/page.tsx:32` — panggilan Auth Admin API yang lambat + tidak di-cache. Simpan `email` di tabel `profiles` dan query dari sana. Butuh migration menambah kolom `email` ke `profiles`.

### B2-8: `fetchDistinctActors` — 1000 row fetch untuk JS dedup
`features/dashboard/actions/fetchAuditLogs.ts:114–142` — fetch 1000 baris untuk deduplikasi actor. Harusnya `SELECT DISTINCT actor_id` via RPC.

### B2-9: Waterfall di `generateMonthlyReport`
`features/reports/queries.ts:138–463` — 8+ serial awaits dalam satu fungsi. Bisa diparallelkan sebagian besar setelah scrim IDs diketahui.
