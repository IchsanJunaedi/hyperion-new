# CTO Technical Review — Hyperion

> **Context:** Pre-Series-A technical due-diligence review of Hyperion ("OS untuk Tim Esports").
> **Stack:** Next.js 15.5 (App Router) · Supabase (Postgres + RLS) · TypeScript strict · TanStack Query · Zustand.
> **Date of review:** 2026-06-13
> **Repository scale:** 628 TS/TSX source files · 97 SQL migrations · 817 unit tests · ~839 commits over ~33 days · **1 author.**

---

## TL;DR Verdict

Hyperion is a **genuinely impressive single-founder build**: broad feature surface (scrim ops, calendar, tournaments, finances, salary, sponsors, trials, analytics, public profiles), real test discipline (CI coverage gate, 817 unit tests, E2E suite), and documented conventions. For a one-person, one-month effort the product depth is well above the typical pre-seed prototype.

For **Series A**, the gating concerns are not features — they are **multi-tenancy correctness, security-in-depth, and operational maturity**. The architecture has two structural issues (single global owner via env var; auth enforced in app code rather than the database) and several scaling hotspots (N+1 calendar permission checks, a 12-query waterfall on every dashboard page render). The biggest organizational risk is **bus factor = 1**.

**Overall readiness grade: B− (fundable, conditional on a focused hardening sprint).**

| Dimension | Grade | One-line summary |
|---|---|---|
| Architecture | B− | Clean feature-sliced structure; multi-tenancy and security boundary are the weak points. |
| Maintainability | B | Strong docs + strict TS + CI gate; coverage % is inflated and several modules are 0%-tested. |
| Scalability | C+ | Query discipline is good, but two known hot paths (N+1, waterfall) will not survive load. |
| Hiring readiness | C | Excellent onboarding docs offset by bus-factor-1, no review process, idiosyncratic patterns. |
| Deployment | C | CI runs quality gates, but no IaC, no staging, manual DB migrations, no observability. |

---

## 1. Architecture

### Strengths
- **Modern, defensible stack.** Next.js 15 App Router with Server Components + Server Actions and Supabase is a productive, well-supported choice. TypeScript is in `strict` mode with `noUncheckedIndexedAccess` and `noImplicitOverride` — stronger than most startups bother with.
- **Feature-sliced layout.** `features/<domain>/{actions,queries,components}` is consistent and easy to navigate. Largest domains (calendar 404K, dashboard 337K, scrim 313K) are sized sensibly.
- **Defined permission model.** Calendar visibility levels (`all` / `management` / `coach_up` / `private`) and an audit-log subsystem show deliberate access-control design rather than ad-hoc checks.
- **Security headers configured.** `next.config.ts` ships HSTS, `X-Frame-Options: DENY`, `nosniff`, a Permissions-Policy, and a CSP. This is ahead of most pre-A codebases.

### Concerns (ranked)

**A1 — Single global "Owner" via `OWNER_EMAIL` env var. (CRITICAL for a multi-tenant SaaS thesis.)**
Owner identity is `user.email === process.env.OWNER_EMAIL`. The app already supports multiple organizations, but there is exactly **one** privileged owner across the whole deployment. This is fine for a single-team tool; it is incompatible with a multi-tenant SaaS where each customer org needs its own owner. If the Series A story is "sell this to many esports orgs," this is a foundational rework, not a config change. **Decide now** whether the product is single-tenant-per-deploy or true multi-tenant, because it changes the data model, auth, and billing.

**A2 — Authorization lives in application code, not the database.**
Server actions routinely use `createAdminClient()` (which bypasses RLS) and then hand-roll the membership/role check in the action body. The recently-fixed **SEC-03 IDOR** (any authenticated user could create todos in any org) and **SEC-01 invite hijacking** are both direct symptoms: when the DB is not the enforcement boundary, every new action is a fresh opportunity to forget a guard. RLS is enabled but routinely bypassed. **Recommendation:** treat RLS as the source of truth, use the admin client only for genuinely cross-tenant operations, and add a lint/test rule that flags `createAdminClient()` usage for review.

**A3 — Configuration drift signals environment ambiguity.**
`next.config.ts` whitelists **two** Supabase project hostnames (`tbuxtlbtjpoholcflmoy` and `pqzdukrlmbwjjgjyoqva`), and `package.json`'s `db:types` script pointed at the wrong project until last commit. Two project IDs floating through config is a sign there is no clean dev/staging/prod separation. This needs to be pinned down before a team touches it.

**A4 — Dead code carried in the live tree.**
Scouting, matchmaking, AI insights, and reports are documented as dead/archived, yet matchmaking is still imported and rendered in the scrim workspace page (ARC-01). Carrying archived features in the shipped bundle confuses new engineers and inflates the surface area an acquirer's diligence will scrutinize.

**A5 — Framework-bug workaround spread across 168 files.**
Every component avoids `export default function` / `export function` to dodge a Next.js 15 HMR crash. It works, but it is a non-idiomatic, undocumented-at-call-site footgun that every new hire will trip over. Worth a single documented ESLint rule rather than tribal knowledge.

---

## 2. Maintainability

### Strengths
- **CI quality gate exists and is enforced.** Lint + typecheck + coverage thresholds (statements 80 / branches 75 / functions 80 / lines 80) fail the build on regression. Most pre-A startups have nothing here.
- **Real test volume.** 817 unit tests across 48 files, plus a layered Playwright E2E suite (self-authenticating specs, admin panel, five-panel role matrix).
- **Exceptional documentation for a solo project.** `CLAUDE.md`, `AGENTS.md`, `progress.md`, and `SYSTEM_OVERVIEW.md` encode conventions, gotchas, and a feature inventory. This materially lowers onboarding cost.
- **Conventions are written down** (notification system choice, query rules, useEffect rules, reusable-component table). This is the kind of thing that usually only lives in a senior engineer's head.

### Concerns

**M1 — Coverage percentage is misleading.** Headline is 90.7% statements, but **branch coverage is 78.6%** and entire feature modules have **0% unit coverage**: `calendar`, `sponsors`, `polls`, `strategy`, `announcements`, `notifications`, `invite`. The number is high because pure-logic helper files are well tested while the risky paths — server actions doing auth + DB writes — are not. The proof: **SEC-01 (a critical invite-hijacking bug) shipped while coverage read 90%.** Coverage is measuring the safe code. Reweight toward action/permission paths.

**M2 — "Single source of truth" drifts.** `progress.md` is explicitly the canonical status doc, yet its own history repeatedly notes it was "stale" (issues #27–#29 were already fixed in code but still listed as open). A status doc that lags reality is a maintenance tax and a trap for new hires. An issue tracker (GitHub Issues / Linear) should own state; the markdown should link, not duplicate.

**M3 — No automated migration safety.** 97 SQL migrations applied manually via `supabase db push`. There is no migration dry-run, no rollback convention, and the documented recovery path is manual `migration repair`. This is survivable solo and dangerous with a team.

---

## 3. Scalability

### Strengths
- **Query discipline is genuinely good.** Documented and largely enforced: every growable `.select()` carries a `.limit()`, explicit columns over `select("*")`, `.maybeSingle()` over `.single()`. The `generateMonthlyReport` waterfall was already refactored into 3 parallel phases. This is mature instinct.
- **Async work is offloaded.** WhatsApp delivery runs through an edge-function queue (`process-wa-queue`) rather than blocking request paths; WA failures are wrapped so they don't roll back successful DB writes.

### Concerns

**S1 — N+1 in calendar permissions (HIGH).** `getAccessibleCalendars` and `getAccessibleEvents` loop over every calendar/event and issue a per-item visibility query. 50 events ≈ 100+ round-trips on a single grid load. This is the #1 thing that breaks when an org gets active. Fix: bulk-fetch roles/configs/permissions with `.in(...)` and match in memory.

**S2 — 12-query waterfall on every dashboard/manage page (HIGH).** `getTodoBadgeCount` → `computeSmartTodos` fires ~7–12 DB queries, and it runs **server-side inside the layout**, so it taxes the TTFB of *every* page under `/dashboard` and `/manage`. Move the badge to a client-side `useQuery` hitting a lightweight endpoint, or cache it.

**S3 — No caching / no observability of DB load.** No Redis/edge cache, no read replica strategy, and (see §5) no APM to even see where time goes. At a few hundred concurrent users on a single Supabase instance, S1+S2 become incidents you'll diagnose blind.

**S4 — Vision feature is an unfunded scaling dependency.** WA-photo scrim ingestion is deferred pending a VPS for the vision server. It's a separate, stateful, out-of-band service — fine to defer, but it's a known future ops surface, not a free feature.

**Verdict:** the *coding habits* scale; two specific hot paths and the absence of caching/observability do not. None are architectural rewrites — they are a focused week of work.

---

## 4. Hiring Readiness

### Strengths
- **Onboarding docs are a real asset.** A new engineer can read `AGENTS.md` + `progress.md` and be productive faster than on most codebases.
- **A test and CI culture already exists** to enforce on day one — you're hiring *into* a quality bar, not trying to retrofit one.
- Consistent structure means work is parallelizable across feature domains.

### Concerns

**H1 — Bus factor = 1. (The dominant org risk.)** ~839 commits, one author. All architectural context, all the "why," and all the undocumented judgment live in one head. The first hire's first job is de-risking this. Before the round closes, capture the non-obvious decisions as ADRs.
**H2 — No review process.** Solo merges straight to `main`. There's no `CODEOWNERS`, no required-review branch protection, no PR template. These need to exist *before* the second engineer, not after.
**H3 — Idiosyncratic local tooling** (RTK command wrapper, caveman mode, the export-pattern workaround, `OWNER_EMAIL` owner model) raises the "what is going on here" cost for hires. Each is defensible; together they need a documented "house style & why" page.
**H4 — Heavy AI-pair-programming fingerprint** (co-authored commits, generated plans/specs). Not a negative, but the team should agree on review standards so AI-generated code clears the same bar as human code — the SEC-01 miss shows that bar isn't automatic.

**Practical readiness:** you can onboard a mid/senior full-stack engineer quickly thanks to docs, but you must stand up review/branch-protection and write ADRs first.

---

## 5. Deployment Strategy

### Strengths
- **Two CI workflows.** `ci.yml` (lint, typecheck, coverage gate, Codecov upload) on all branches; `e2e.yml` (build + Playwright) on `main`. Secrets handled via GitHub Actions secrets.
- **Security headers + CSP in config**, applied to all routes.

### Concerns

**D1 — `next build` is not in the primary CI job.** The unit-CI workflow runs lint/typecheck/tests but **not** the production build; build is only validated by the E2E workflow. A build-breaking change on a feature branch can pass CI. Add `next build` to the main gate.

**D2 — No infrastructure-as-code, no staging.** No `vercel.json`, `Dockerfile`, or IaC in the repo; the deploy target is implicit (Vercel + managed Supabase, presumably). There's no evidence of a staging environment that mirrors prod. Migrations are applied by hand. For a funded company this means: **no safe place to test a release, and a manual, irreversible DB-change process.**

**D3 — No observability.** No error tracking or APM is wired (a Sentry integration is *available* but not connected). Post-launch you will be flying blind on errors, latency, and the exact hot paths flagged in §3. This is the single cheapest high-leverage fix.

**D4 — CSP is permissive.** The policy allows `'unsafe-inline'` and `'unsafe-eval'` on `script-src`, which substantially weakens its XSS value. Tighten with nonces/hashes when feasible.

**D5 — Migration pipeline is manual and unversioned in CI.** DB schema changes should run through CI/CD against staging with a rollback story before touching prod.

---

## Series-A Blocker Checklist

**Must-fix before/around the round (security & correctness):**
- [ ] Decide single-tenant vs. true multi-tenant and fix the `OWNER_EMAIL` owner model accordingly (A1).
- [ ] Make RLS the enforcement boundary; audit every `createAdminClient()` call site (A2). *(SEC-01/02/03 already patched — good, but the pattern that produced them remains.)*
- [ ] Add `next build` to the primary CI gate (D1).
- [ ] Wire error tracking + APM (Sentry) (D3).

**Should-fix in the first hardening sprint (scale & ops):**
- [ ] Kill the calendar-permissions N+1 (S1) and the smart-todos layout waterfall (S2).
- [ ] Stand up a staging environment + CI-driven, reversible migrations (D2/D5).
- [ ] Branch protection + required reviews + `CODEOWNERS` before hire #2 (H2).
- [ ] Backfill unit/integration tests on the 0%-coverage, write-path modules; reweight coverage toward actions/permissions (M1).

**Hygiene (low effort, do anytime):**
- [ ] Remove dead-feature imports from live pages (A4 / ARC-01).
- [ ] Resolve the dual-Supabase-project-ID config drift (A3).
- [ ] Write ADRs for the non-obvious decisions; let an issue tracker own status, not `progress.md` (H1/M2).
- [ ] Tighten CSP off `unsafe-inline`/`unsafe-eval` (D4).

---

## Investment Lens — Bottom Line

**What I'd tell the partners:** This is a strong technical founder who ships fast, tests, and documents — rare. The product breadth de-risks the "can they build" question. The risk is concentrated in **(1) a multi-tenancy/security model that was built for one team and needs to be built for many, and (2) bus-factor-1.** Neither is fatal; both are fundable. I'd want the first two engineering hires earmarked for the hardening checklist above, and I'd make the multi-tenancy decision (A1) a condition of the raise, because it's the one item that gets exponentially more expensive after the customer base grows.

**Recommendation: Proceed, with a defined 60-day hardening plan and the multi-tenancy decision resolved before close.**

---
*Prepared as a pre-Series-A engineering due-diligence summary. Findings cross-referenced with the repo's own `IMPROVEMENTS.md` audit (SEC/PRF/AUD/CFG/TST IDs) and `progress.md`.*
