# Five-Panel E2E Test Suite — Design Spec

**Date:** 2026-06-04
**Scope:** Full Playwright E2E coverage for all 5 panels (owner/manager/coach/captain/member) — CRUD flows + access control + cross-panel integration.

---

## Goals

- Every form in `/dashboard` (owner) and `/manage` (manager) must be tested: create, validate, edit, delete
- Workspace (`/{slug}/`) tested for coach, captain, and member — positive AND negative access control
- Integration flows prove data created in one panel appears correctly in another
- All tests are self-cleaning: `[E2E]` prefix on created data, deleted in `afterAll`
- Suite is idempotent: safe to run multiple times against the same DB

---

## Architecture

### Phased Delivery (4 plans)

| Plan | Scope | Est. tests |
|------|-------|-----------|
| Plan 1 | Seed infra + Dashboard (owner) full CRUD | ~120 |
| Plan 2 | Manage (manager) full CRUD | ~80 |
| Plan 3 | Workspace ×3 role + access control | ~180 |
| Plan 4 | Integration flows lintas panel | ~40 |
| **Total** | | **~420** |

### Folder Structure

```
e2e/
  workspace/
    setup/
      seed.ts          ← create 4 users + org + team + division + roles + storage states
      teardown.ts      ← delete all [E2E] data + auth users
    helpers/
      auth.ts          ← loginAs(role, page) for 5 roles
    dashboard/         ← Plan 1 spec files (owner)
    manage/            ← Plan 2 spec files (manager)
    workspace/         ← Plan 3 spec files (coach/captain/member)
    integration/       ← Plan 4 spec files (cross-panel)
```

### Playwright Projects (added to `playwright.config.ts`)

```
workspace-seed
  ├── dashboard-tests   (depends: workspace-seed)
  ├── manage-tests      (depends: workspace-seed)
  ├── workspace-tests   (depends: workspace-seed)
  └── integration-tests (depends: workspace-seed)
```

---

## Seed Script (`e2e/workspace/setup/seed.ts`)

### What it creates

1. **4 Supabase auth users** via admin API (`SUPABASE_SERVICE_ROLE_KEY`):
   - manager: `E2E_MANAGER_EMAIL` / `E2E_MANAGER_PASSWORD`
   - coach: `E2E_COACH_EMAIL` / `E2E_COACH_PASSWORD`
   - captain: `E2E_CAPTAIN_EMAIL` / `E2E_CAPTAIN_PASSWORD`
   - member: `E2E_MEMBER_EMAIL` / `E2E_MEMBER_PASSWORD`
2. **1 test organization**: name `[E2E] Org`
3. **1 test team**: name `[E2E] Team`, slug `e2e-test`
4. **1 test division**: name `[E2E] Division`, linked to `[E2E] Team`
5. **Role assignments** in `team_members`:
   - manager → role `manager`
   - coach → role `coach`
   - captain → role `captain`, assigned to `[E2E] Division`
   - member → role `member`
6. **Storage states** saved to `e2e/.auth/`:
   - `owner.json`, `manager.json`, `coach.json`, `captain.json`, `member.json`

### Idempotency

Check existence before creating. If user/org/team already exists, skip creation and proceed to storage state generation.

### Required `.env.local` additions

```
E2E_OWNER_EMAIL=          # same as OWNER_EMAIL
E2E_OWNER_PASSWORD=
E2E_MANAGER_EMAIL=
E2E_MANAGER_PASSWORD=
E2E_COACH_EMAIL=
E2E_COACH_PASSWORD=
E2E_CAPTAIN_EMAIL=
E2E_CAPTAIN_PASSWORD=
E2E_MEMBER_EMAIL=
E2E_MEMBER_PASSWORD=
E2E_TEST_TEAM_SLUG=e2e-test
```

### Teardown (`teardown.ts`)

- Delete all rows with `[E2E]` in name/title across tables
- Delete `[E2E] Division`, `[E2E] Team`, `[E2E] Org`
- Delete 4 auth users via admin API
- Called manually or as globalTeardown in CI

---

## Plan 1: Dashboard (Owner) — `e2e/workspace/dashboard/`

All specs run as owner via `storageState: "e2e/.auth/owner.json"`.

### Spec files

| File | Page | Coverage |
|------|------|----------|
| `overview.spec.ts` | `/dashboard` | Page loads, stats widget visible |
| `teams.spec.ts` | `/dashboard/teams` | Full CRUD + form validation |
| `divisions.spec.ts` | `/dashboard/divisions` | Full CRUD + form validation |
| `managers.spec.ts` | `/dashboard/managers` | Assign seeded user as manager, verify, remove |
| `users.spec.ts` | `/dashboard/users` | List loads, user detail visible |
| `finances.spec.ts` | `/dashboard/finances` | Create income + expense, edit, delete |
| `sponsors.spec.ts` | `/dashboard/sponsors` | Full CRUD, status cycle pending→active→inactive |
| `salaries.spec.ts` | `/dashboard/salaries` | Create contract (owner excluded from dropdown), add payment, delete |
| `tournaments.spec.ts` | `/dashboard/tournaments` | Full CRUD |
| `calendar.spec.ts` | `/dashboard/calendar` | Create event per visibility level (all/management/coach_up/private), edit, delete |
| `content.spec.ts` | `/dashboard/content` | Create scheduled post, edit status, delete |
| `files.spec.ts` | `/dashboard/files` | Upload test-image.png, verify listed, delete |
| `assign.spec.ts` | `/dashboard/assign` | Assign seeded member to seeded division, verify, unassign |
| `audit.spec.ts` | `/dashboard/audit` | Page loads, log entries visible — **must run last** (depends on other specs having created audit entries) |
| `export.spec.ts` | `/dashboard/export` | Trigger export, verify response is not 500 |
| `reports.spec.ts` | `/dashboard/reports` | Page loads without 500 |

### Standard CRUD test pattern (per form page)

```
1. unauth → redirect to login
2. page loads with heading
3. form validation — empty/invalid submit blocked
4. create [E2E] row → success toast
5. row appears in list
6. edit row → success toast
7. edited data visible in list
8. delete row (type HAPUS) → success toast
9. row gone from list
```

### Special cases

- `salaries.spec.ts`: verify owner is NOT in player dropdown
- `calendar.spec.ts`: test all 4 visibility levels separately
- `audit.spec.ts`: run after other specs have created audit entries
- `managers.spec.ts`: assign seeded user, verify `/manage` becomes accessible, then remove

---

## Plan 2: Manage (Manager) — `e2e/workspace/manage/`

All specs run as manager via `storageState: "e2e/.auth/manager.json"`.

### Access control (tested in `overview.spec.ts`)

| Role | `/manage` access |
|------|-----------------|
| owner | ✓ |
| manager | ✓ |
| coach | ✗ redirect |
| captain | ✗ redirect |
| member | ✗ redirect |

### Spec files

| File | Page | Coverage |
|------|------|----------|
| `overview.spec.ts` | `/manage` | Page loads as manager; coach/captain/member → redirect |
| `divisions.spec.ts` | `/manage/divisions` | Full CRUD + form validation |
| `assign.spec.ts` | `/manage/assign` | Assign member to division, verify, unassign |
| `captains.spec.ts` | `/manage/captains` | Assign captain to division, verify 1-max rule (assign second → blocked), remove |
| `development.spec.ts` | `/manage/development` | Set skill target per player, update level, verify history visible |
| `finances.spec.ts` | `/manage/finances` | Full CRUD income + expense |
| `sponsors.spec.ts` | `/manage/sponsors` | Full CRUD |
| `salaries.spec.ts` | `/manage/salaries` | Create contract, add payment, delete |
| `content.spec.ts` | `/manage/content` | Create post, edit status, delete |
| `reports.spec.ts` | `/manage/reports` | Page loads without 500 |

### Special cases

- `captains.spec.ts`: test 1-captain-max enforcement — assign captain, try assign second → error shown
- `development.spec.ts`: targets set here verified in Plan 3 workspace `/development` tests

---

## Plan 3: Workspace — `e2e/workspace/workspace/`

Base URL: `http://localhost:3000/e2e-test/`

Each spec runs tests for multiple roles. Storage states: `coach.json`, `captain.json`, `member.json`.

### Access control matrix

| Feature | Coach | Captain | Member |
|---------|-------|---------|--------|
| Create scrim | ✗ | ✓ | ✗ |
| Create announcement | ✓ | ✓ | ✗ |
| Create strategy note | ✓ | ✓ | ✗ |
| Upload files | ✓ | ✓ | ✗ |
| Create poll | ✓ | ✓ | ✗ |
| Add VOD timestamp | ✓ | ✗ | ✗ |
| Manage trials | ✓ | ✓ | ✗ |
| Vote in poll | ✓ | ✓ | ✓ |
| RSVP calendar/scrim | ✓ | ✓ | ✓ |
| Comment on strategy | ✓ | ✓ | ✓ |
| View roster | ✓ | ✓ | ✓ |

### Spec files

| File | Route | Positive tests | Negative tests |
|------|-------|---------------|----------------|
| `home.spec.ts` | `/` | All 3 can view home, stats visible | — |
| `scrim.spec.ts` | `/scrim`, `/scrim/new` | Captain: create + view detail | Coach/Member: no "buat scrim" button |
| `scrim-results.spec.ts` | `/scrim/[id]/results` | Coach: add VOD timestamp | Captain/Member: no timestamp UI |
| `calendar.spec.ts` | `/calendar`, `/calendar/[id]` | Coach+: create event; All: RSVP | Member: no create button |
| `tournaments.spec.ts` | `/tournaments`, `/tournaments/[id]` | All 3: view list + detail | — |
| `announcements.spec.ts` | `/announcements`, `/announcements/[id]` | Coach+: create; All: read + auto-mark-read | Member: no create button |
| `strategy.spec.ts` | `/strategy`, `/strategy/[id]` | Coach+: create note; All: comment | Member: no create note button |
| `files.spec.ts` | `/files` | Coach+: upload + delete | Member: no upload button |
| `polls.spec.ts` | `/polls` | Coach+Captain: create poll; All: vote | Member: no create button |
| `roster.spec.ts` | `/roster` | All 3: view member list | — |
| `development.spec.ts` | `/development` | Each role sees own targets | Cannot see other member's targets |
| `analytics.spec.ts` | `/analytics` | All 3: view, no 500 | — |
| `meta.spec.ts` | `/meta` | All 3: view, no 500 | — |
| `trials.spec.ts` | `/trials` | Coach+Captain: manage kanban | Member: cannot access (redirect or 403) |

---

## Plan 4: Integration Flows — `e2e/workspace/integration/`

Each spec exercises a cross-panel or cross-role data flow.

### Spec files

| File | Flow | Roles / Panels |
|------|------|---------------|
| `role-assignment.spec.ts` | Owner assigns manager → manager accesses `/manage`; Manager assigns captain → captain accesses workspace | Dashboard → Manage → Workspace |
| `scrim-flow.spec.ts` | Captain creates scrim → Coach adds VOD timestamp → Member RSVPs | Workspace ×3 |
| `announcement-flow.spec.ts` | Coach creates announcement → Member reads → read receipt count increases | Workspace ×2 |
| `development-flow.spec.ts` | Manager sets skill target for captain → Captain sees target in `/development` | Manage → Workspace |
| `poll-flow.spec.ts` | Captain creates poll → Member votes → Captain sees updated result count | Workspace ×2 |
| `finance-sync.spec.ts` | Owner creates expense in `/dashboard/finances` → Manager sees same row in `/manage/finances` | Dashboard → Manage |
| `calendar-visibility.spec.ts` | Owner creates `visibility=management` event → Member cannot see it; Coach creates `visibility=all` → Member sees it | Dashboard → Workspace |
| `salary-visibility.spec.ts` | Owner creates salary contract → Manager sees it in `/manage/salaries`; Owner not in player dropdown | Dashboard → Manage |

### Pattern per integration spec

```
Step 1: Login as Role A → perform action (create/assign/update)
Step 2: Login as Role B → verify data appears / access works
Step 3: (where applicable) Login as Role C → verify isolation / access denied
```

---

## Cleanup Strategy

- All created rows use `[E2E]` prefix in name/title
- `beforeAll`: `cleanupE2ERows(table, column)` — remove stale data from previous failed runs
- `afterAll`: same cleanup — leave DB clean
- Seed data (`[E2E] Org`, `[E2E] Team`, `[E2E] Division`, 4 auth users) persists across test runs; only removed by `teardown.ts`

---

## Known Bug Fixed During Design

- **polls — coach cannot create**: RLS policy and `canManage` UI check excluded `coach`. Fixed in migration `20260604150000_polls_coach_permission.sql`. Coach now correctly included in poll creation flow.

---

## Delivery Log

### Plan 1 — Dashboard (owner) ✅
16 specs, 70 tests. Seed infra (4 users + org + division + roles + 5 storage states). Bug fixed: polls coach permission.

### Plan 2 — Manage (manager) ✅ (2026-06-05)
10 specs, project `manage-tests`. Manager panel operates on `[E2E] Org` (manager's only org) → safe full CRUD for finances/sponsors/content; view-level for divisions/captains (those are read-only in `/manage`); form-interactive for assign/salaries; create+verify for development.
- **assign.spec** proves the 1-captain-max rule: the seeded org already has a captain, so the role dropdown offers only "Member".
- **Seed hardening**: `seed.ts` now self-heals drifted `team_members` rows (an older captain row had `division_id = null`); it corrects role/division on every run. Also bumped the seed test timeout (5 sequential logins exceed the 30s default on a cold dev server).

### Plan 3 — Workspace (coach/captain/member) ✅ (2026-06-05)
14 specs, project `workspace-tests`. Per-role storage states via `test.use()`.
- **Access control was grounded in the *actual* RLS + page gating, not the aspirational matrix** — several intended-vs-real mismatches were found and the tests assert reality:
  - Files upload: `owner/manager/coach` only — **captain cannot upload** (matrix said captain ✓).
  - Trials manage: `manager/coach/owner` — **captain cannot manage** (matrix said captain ✓); all members can *view*.
  - VOD "Tambah Timestamp": gated by `canEdit = manager/coach/captain` — **captain CAN add** (matrix said captain ✗); `isCoach` only governs delete.
  - Scrim create: `captain/manager/owner` (coach ✗). Calendar create: adds coach. Tournaments create: captain only.
- **Bug fixed — announcements coach permission**: INSERT/UPDATE/DELETE used `is_captain_or_above()` which excludes `coach`, yet the "Buat pengumuman" button is shown to all and the role model intends coach to manage announcements. Migration `20260605120000_announcements_coach_permission.sql` adds `coach` (same class as the polls fix). Member remains correctly blocked (security boundary verified).
- Strategy note create requires a division (the form coerces an unselected division to `""`, which is rejected by the uuid column).

### Plan 4 — Cross-panel integration ✅ (2026-06-05)
8 specs, 20 tests, project `integration-tests`. Flows: role-assignment chain, finance-sync (manage→dashboard via the org switcher `?org=`), development (manager→member workspace), announcement read-receipt, scrim VOD (coach→member), poll create/vote/count, strategy note→comment, calendar visibility (management event hidden from member).
- Where optimistic UI / textarea values would false-positive (`getByText` matching a retained textarea value), assertions verify persistence via a service-role **DB poll** instead.
- Create-and-navigate flows are serialized; timeouts are generous to absorb dev-server compile under parallel load.

### Running
Each plan is its own Playwright project depending on `workspace-seed`; run per project (e.g. `npx playwright test --project=workspace-tests`). The default `chromium` catch-all project has no storage state and is not used for these suites.
