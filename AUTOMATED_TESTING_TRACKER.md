# 🧪 Automated Testing Tracker — Hyperion

> **Single source of truth** untuk status coverage, test tasks, dan CI health.  
> Update file ini setelah setiap wave selesai.

---

## 📊 Coverage Dashboard

| Metric | Baseline | Current | Target |
|--------|----------|---------|--------|
| Statements | 16.61% | 20.68% | **80%** |
| Branches | 13.77% | 19.26% | **80%** |
| Functions | 26.50% | 35.98% | **80%** |
| Lines | 16.48% | 20.85% | **80%** |

> Last updated: **2026-05-21** · Run `npm run test:unit:coverage` to refresh.

---

## 🚦 CI Health

| Workflow | Status |
|----------|--------|
| Lint | ✅ Green |
| Typecheck | ✅ Green |
| Unit Tests + Coverage | ✅ Green |
| Coverage Gate (≥80%) | 🔴 Not Yet — at 20.68% |
| Codecov Upload | ✅ Configured |

> CI enforces coverage thresholds via `vitest.config.ts` → `thresholds`. **Fail fast** jika turun dari target wave.

---

## 🗂️ Test File Inventory

### ✅ Sudah Ada & Passing

| Test File | Tests | Coverage Contribution | Status |
|-----------|-------|-----------------------|--------|
| `lib/utils/__tests__/slug.test.ts` | 17 | `lib/utils/slug.ts` | ✅ |
| `lib/utils/__tests__/format.test.ts` | 13 | `lib/utils/format.ts` | ✅ |
| `lib/utils/__tests__/wa-templates.test.ts` | 11 | `lib/utils/wa-templates.ts` | ✅ |
| `lib/validations/__tests__/shared.test.ts` | 20 | `lib/validations/shared.ts` | ✅ |
| `lib/validations/__tests__/finance.test.ts` | 11 | `lib/validations/finance.ts` | ✅ |
| `lib/validations/__tests__/scrim.test.ts` | 21 | `lib/validations/scrim.ts` | ✅ |
| `lib/validations/__tests__/calendar.test.ts` | 11 | `lib/validations/calendar.ts` | ✅ |
| `lib/permissions/__tests__/calendar-rules.test.ts` | 25 | `lib/permissions/calendar-rules.ts` | ✅ |
| `features/analytics/__tests__/computations.test.ts` | 15 | `features/analytics/computations.ts` | ✅ |
| `features/finances/__tests__/queries.test.ts` | 28 | `features/finances/queries.ts` | ✅ |
| `lib/validations/__tests__/tournament.test.ts` | 17 | `lib/validations/tournament.ts` | ✅ |
| `lib/validations/__tests__/poll.test.ts` | 18 | `lib/validations/poll.ts` | ✅ |
| `lib/validations/__tests__/strategy.test.ts` | 17 | `lib/validations/strategy.ts` | ✅ |
| `lib/validations/__tests__/announcement.test.ts` | 14 | `lib/validations/announcement.ts` | ✅ |
| `lib/validations/__tests__/player-target.test.ts` | 16 | `lib/validations/player-target.ts` | ✅ |

**Total existing tests: ~253**

---

## 🚀 Roadmap Menuju 80%

### Prinsip Dasar
- **Quality over quantity** — setiap test harus meaningful
- **Batch ≥ 15 tests per commit** — jangan micro-commit per test
- **No flaky tests** — jika perlu network/DB → mock, bukan skip
- **CI selalu hijau** — threshold dinaikkan bertahap sesuai progress

---

## 📋 Wave Plan (Ordered by ROI)

### Wave A — Validations Expansion ✅ DONE
> Target: +4.07% coverage · 82 test cases baru
> Files tercover: `tournament.ts`, `poll.ts`, `strategy.ts`, `announcement.ts`, `player-target.ts`

**Tasks:**

- [x] **Task A-1: `lib/validations/__tests__/tournament.test.ts`** (17 tests)
  - `createTournamentSchema`: valid minimal, empty name → error, name > 200 char → error, invalid start_date → error, prize_pool negative → error, prize_pool float → error, registration_fee negative → error, optional fields transform ke null, `bracket_type` enum valid values, bracket_type invalid → error, `status` valid values (upcoming/ongoing/completed), update schema partial
  - `tournamentStageSchema`: valid stage, empty name → error, round_number ≤ 0 → error, best_of invalid → error
  - **Commit message:** `test: add tournament schema validation tests (15+ cases)`

- [x] **Task A-2: `lib/validations/__tests__/poll.test.ts`** (18 tests)  
  - `createPollSchema`: valid poll, empty question → error, question > 500 char → error, options < 2 → error, options > 10 → error, empty option string → error, duplicate options → error (if validated), `expires_at` optional, `is_anonymous` boolean, `allow_multiple_votes` boolean, valid options array dengan 2-10 items
  - `votePollSchema`: valid vote, invalid option_id format → error, missing option_id → error
  - **Commit message:** `test: add poll schema validation tests (15+ cases)`

- [x] **Task A-3: `lib/validations/__tests__/strategy.test.ts`** (17 tests)
  - `createStrategySchema`: valid entry, empty title → error, title > 200 char → error, content empty → error, content > 50000 char → error, `visibility` valid values, invalid visibility → error, tags array valid, tags item > 50 char → error, tags > 20 items → error, `game_map` optional → null transform
  - `createStrategyCommentSchema`: valid comment, empty content → error, content > 5000 char → error
  - **Commit message:** `test: add strategy schema validation tests (15+ cases)`

- [x] **Task A-4: `lib/validations/__tests__/announcement.test.ts`** (14 tests)
  - `createAnnouncementSchema`: valid, empty title → error, title > 200 char → error, content empty → error, content > 10000 char → error, `is_pinned` boolean default false, `visibility` valid values, invalid visibility → error, `division_ids` optional array, division_ids dengan invalid UUIDs → error
  - `updateAnnouncementSchema`: partial update, update only is_pinned
  - **Commit message:** `test: add announcement schema validation tests (12+ cases)`

- [x] **Task A-5: `lib/validations/__tests__/player-target.test.ts`** (16 tests)
  - `createPlayerTargetSchema`: valid, empty skill_name → error, skill_name > 100 char → error, target_level ≤ 0 → error, target_level > 100 → error, current_level < 0 → error, current_level > target_level valid, notes optional → null transform, `member_id` valid UUID, `member_id` invalid → error
  - **Commit message:** `test: add player-target schema validation tests (12+ cases)`

---

### Wave B — Features Logic (Pure Functions) ⬜ TODO
> Target: +20% coverage · Focus pada logic layer, bukan UI atau DB
> Expand coverage scope di `vitest.config.ts` ke lebih banyak features

**Tasks:**

- [ ] **Task B-1: `features/scrim/__tests__/queries.test.ts`** (≥15 tests)
  - Baca `features/scrim/queries.ts` → identifikasi pure functions (summarizeAttendance, calculateWinRate, dll)
  - `summarizeAttendance()`: all confirmed, all declined, mixed, empty, tentative handling
  - `buildScrimStatusLabel()`: upcoming → label, ongoing → label, completed win → label, completed loss → label
  - `filterScrimsByStatus()`: filter empty array, filter single status, filter multiple
  - Edge: all same status, null status handling
  - **Commit message:** `test: add scrim query logic unit tests (15+ cases)`

- [ ] **Task B-2: `features/finances/__tests__/calculations.test.ts`** (≥15 tests)
  - Expand dari queries.test.ts yang ada
  - `calculateBalance()`: income only, expense only, mixed, empty, large numbers, zero sum
  - `groupByCategory()`: single category, multiple categories, empty, same-category dedup
  - `groupByMonth()`: single month, cross-year grouping, empty input
  - Monthly trend calculation accuracy
  - **Commit message:** `test: add finance calculation unit tests (15+ cases)`

- [ ] **Task B-3: `features/analytics/__tests__/computations.test.ts`** (expand ≥15 new tests)
  - Expand file yang sudah ada
  - `computePlayerStats()`: single player all wins, mixed results, player with no scrims, multiple players ranking
  - `computeDraftStats()`: empty picks, most picked hero, win rate per hero, ban analysis
  - `computeMonthlyTrend()`: uptrend, downtrend, flat, single month
  - Boundary: zero matches, one match, 100 matches
  - **Commit message:** `test: expand analytics computation unit tests (15+ cases)`

- [ ] **Task B-4: `features/roster/__tests__/logic.test.ts`** (≥12 tests)
  - Identifikasi pure functions di `features/roster/`
  - `sortMembersByRole()`: role hierarchy ordering (owner > manager > coach > captain > member)
  - `filterMembersByDivision()`: empty division filter, multi-division filter, no matches
  - `getMemberDisplayName()`: with jersey, without jersey, null member
  - `canAssignRole()`: role permission matrix test
  - **Commit message:** `test: add roster logic unit tests (12+ cases)`

---

### Wave C — Permissions Deep Dive ⬜ TODO  
> Target: +15% coverage · `lib/permissions/` sudah partial, perlu complete

**Tasks:**

- [ ] **Task C-1: `lib/permissions/__tests__/calendar-access.test.ts`** (≥15 tests)
  - Baca `lib/permissions/calendar-access.ts` — identifikasi exported functions
  - Test setiap exported function: `canUserAccessCalendar()`, `getCalendarAccessLevel()`, dll
  - Edge: null user, null calendar, expired permissions
  - **Commit message:** `test: add calendar-access permission unit tests (15+ cases)`

- [ ] **Task C-2: `lib/permissions/__tests__/calendar-audit.test.ts`** (≥12 tests)
  - `lib/permissions/calendar-audit.ts` exported functions
  - Audit log structure validation
  - Action categorization (create/update/delete/view)
  - **Commit message:** `test: add calendar-audit unit tests (12+ cases)`

- [ ] **Task C-3: expand `lib/permissions/__tests__/calendar-rules.test.ts`** (≥15 new tests)
  - `getVisibilityDescription()`: semua 6 visibility levels
  - `getAllowedActionsForRole()`: semua combinations role × visibility (5×6 = 30, pilih critical 15)
  - `canPerformAction()`, `canViewCalendar()`, `canCreateEvents()`, dll — semua helper functions
  - `getViewableByRoles()`: semua 6 visibility levels
  - `getCreationAllowedByRoles()`: semua visibility
  - `analyzeActionRequirements()`: test dengan beberapa actions
  - **Commit message:** `test: expand calendar-rules tests to cover all helpers (15+ cases)`

---

### Wave D — Validations Complete ⬜ TODO
> Target: +10% coverage · Tutup semua validation files yang belum tercover

**Tasks:**

- [ ] **Task D-1: `lib/validations/__tests__/auth.test.ts`** (≥15 tests)
  - `loginSchema`: valid, empty email → error, invalid email → error, empty password → error
  - `registerSchema`: valid, password mismatch → error, confirmPassword missing → error, username constraints, terms accepted required
  - `forgotPasswordSchema`: valid email, invalid email → error
  - `resetPasswordSchema`: valid, passwords don't match → error, weak password → error
  - `changePasswordSchema`: valid, current = new → error
  - **Commit message:** `test: add auth schema validation tests (15+ cases)`

- [ ] **Task D-2: `lib/validations/__tests__/onboarding.test.ts`** (≥12 tests)
  - Baca `lib/validations/onboarding.ts` → test all schemas
  - Org creation: name constraints, slug constraints, game selection required
  - Member invite: valid email list, duplicate detection, max invites
  - Division setup: valid, empty name → error
  - **Commit message:** `test: add onboarding schema validation tests (12+ cases)`

- [ ] **Task D-3: `lib/validations/__tests__/content.test.ts`** (≥12 tests)
  - `createContentSchema`: valid, empty title → error, empty platform → error, invalid status → error, `scheduled_at` validation, `platform` enum valid values
  - `updateContentSchema`: partial update, all fields
  - **Commit message:** `test: add content schema validation tests (12+ cases)`

---

### Wave E — Utils Complete ⬜ TODO
> Target: +5% coverage · Tutup `lib/utils/fonnte.ts` dan `lib/utils/cn.ts`

**Tasks:**

- [ ] **Task E-1: `lib/utils/__tests__/fonnte.test.ts`** (≥12 tests)
  - Mock fetch/HTTP client
  - `sendWhatsAppMessage()`: success response, network error, invalid token error, rate limit error
  - `buildBatchPayload()`: single recipient, multiple recipients, empty recipients
  - Request header validation (Authorization: token)
  - Response parsing: success true, success false with error message
  - **Commit message:** `test: add fonnte WhatsApp utility tests with mocked HTTP (12+ cases)`

- [ ] **Task E-2: `lib/utils/__tests__/cn.test.ts`** (≥10 tests)
  - `cn()`: single class, multiple classes, conditional (truthy/falsy), arrays, objects, merge conflicting Tailwind classes, empty string → ignored, null → ignored, undefined → ignored, number → not included
  - **Commit message:** `test: add cn utility (clsx + twMerge) tests (10+ cases)`

---

### Wave F — Integration-Style Tests ⬜ TODO
> Target: +14% → reach 80% total
> Expand coverage scope ke `features/` yang lebih luas

**Tasks:**

- [ ] **Task F-1: Expand `vitest.config.ts` coverage scope**
  - Add ke `include`: `features/calendar/**`, `features/tournaments/**`, `features/announcements/**`, `features/polls/**`, `features/strategy/**`
  - Ini akan reveal uncovered lines untuk planning berikutnya

- [ ] **Task F-2: Calendar feature pure logic** (≥15 tests)
  - `features/calendar/` — query transformers, date range helpers, event grouping

- [ ] **Task F-3: Tournament feature logic** (≥15 tests)  
  - Stage progression logic, match result calculation, standings calculation

- [ ] **Task F-4: Announcements feature logic** (≥12 tests)
  - Read status logic, pin ordering, visibility filtering

---

## 📈 Progress Tracking

| Wave | Est. Coverage Gain | Tasks | Status |
|------|-------------------|-------|--------|
| Baseline (existing) | 16.61% | — | ✅ Done |
| Wave A — Validations Expansion | +4.07% → **20.68%** | A-1 to A-5 | ✅ Done |
| Wave B — Features Logic | +15% → ~35% | B-1 to B-4 | ⬜ TODO |
| Wave C — Permissions Deep Dive | +12% → ~47% | C-1 to C-3 | ⬜ TODO |
| Wave D — Validations Complete | +10% → ~57% | D-1 to D-3 | ⬜ TODO |
| Wave E — Utils Complete | +5% → ~62% | E-1 to E-2 | ⬜ TODO |
| Wave F — Integration-Style | +18% → **80%** | F-1 to F-4 | ⬜ TODO |

---

## ⚙️ Coverage Threshold Gates (CI Enforced)

Threshold dinaikkan bertahap sesuai progress wave. **Jangan push jika threshold tidak terpenuhi.**

| Phase | Statements | Branches | Functions | Lines | Enforced Since |
|-------|-----------|----------|-----------|-------|----------------|
| Phase 0 (current) | 15% | 12% | 25% | 15% | 2026-05-21 |
| Phase 1 (after Wave A) | 20% | 18% | 35% | 20% | 2026-05-21 |
| Phase 2 (after Wave B) | 35% | 30% | 50% | 35% | TBD |
| Phase 3 (after Wave C) | 47% | 40% | 62% | 47% | TBD |
| Phase 4 (after Wave D) | 57% | 50% | 72% | 57% | TBD |
| Phase 5 (after Wave E) | 62% | 55% | 78% | 62% | TBD |
| **FINAL (after Wave F)** | **80%** | **75%** | **85%** | **80%** | TBD |

> Update threshold di `vitest.config.ts` → `coverage.thresholds` setelah setiap wave **selesai dan merge**.

---

## 🔧 Commands Reference

```bash
# Run all unit tests
npm run test:unit

# Run with coverage report
npm run test:unit:coverage

# Run specific test file
npx vitest run lib/validations/__tests__/shared.test.ts

# Run watch mode (TDD)
npm run test:unit:watch

# Check coverage di console (quick)
npx vitest run --coverage 2>&1 | grep -E "All files|%"

# Run specific wave's new tests only (contoh Wave A)
npx vitest run lib/validations/__tests__/tournament.test.ts lib/validations/__tests__/poll.test.ts

# CI equivalent (sama persis dengan GitHub Actions)
npm run test:unit:coverage
```

---

## 📏 Naming & Style Conventions

Ikuti pola existing di `features/finances/__tests__/queries.test.ts`:

```typescript
// ✅ DO: Deskriptif, bahasa natural
it("rejects amount of 0 (must be positive)", () => { ... })
it("transforms empty string to null", () => { ... })
it("accepts valid ISO date string", () => { ... })

// ❌ DON'T: Terlalu teknis atau generic
it("test 1", () => { ... })
it("validates amount", () => { ... })
```

- `describe()` per function/schema name
- `it()` language: English, descriptive (subject → behavior)
- Untuk Zod schemas: gunakan `.safeParse()` dengan assert pada `.success` dan `.data`
- Minimal 1 happy path + 2 edge cases per function
- Batch test cases per commit: **minimum 10 test cases per commit**

---

## 🚩 Known Blockers / Risks

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Server actions butuh full HTTP mock | High effort | Skip — exclude dari coverage scope |
| React components butuh jsdom + act() | Medium effort | Wave F only, gunakan `@testing-library/react` |
| Supabase real DB calls | Breaks in CI | Global mock di `__tests__/setup.ts` sudah handle ini |
| `lib/validations/onboarding.ts` mungkin import server-only modules | CI fail | Check dulu, gunakan stub jika perlu |
| Zod v4 API differences | Test syntax salah | Selalu gunakan `.safeParse()`, bukan `.parse()` |

---

## 🔗 Related Files

- [`vitest.config.ts`](./vitest.config.ts) — test runner + coverage config
- [`__tests__/setup.ts`](./__tests__/setup.ts) — global mocks (Supabase, Next.js)
- [`__tests__/stubs/`](./__tests__/stubs/) — module stubs
- [`.github/workflows/ci.yml`](./.github/workflows/ci.yml) — CI pipeline
- [`TEST_COVERAGE_PLAN.md`](./TEST_COVERAGE_PLAN.md) — original design spec (archived)
- [`TEST_COVERAGE_IMPLEMENTATION.md`](./TEST_COVERAGE_IMPLEMENTATION.md) — original implementation tasks

---

*Maintained by: Engineering Team · Auto-updated via CI artifacts*
