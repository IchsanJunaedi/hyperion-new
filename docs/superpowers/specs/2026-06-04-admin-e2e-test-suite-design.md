# Admin Panel E2E Test Suite — Design Spec
**Date:** 2026-06-04  
**Scope:** `/admin` panel (CMS for public website) — NOT `/dashboard` (workspace ops)

---

## 1. Goal

Automated Playwright E2E tests that:
1. Cover every `/admin` page with full CRUD flows
2. Verify cross-boundary: data created in admin appears on the corresponding public page
3. Validate form validation (empty submit, invalid input → error shown, no save)
4. Leave the database clean after every run (no leftover `[E2E]` data)

---

## 2. Auth

The `/admin` panel uses `ADMIN_EMAIL` env var (separate from `OWNER_EMAIL`).

- New env vars required in `.env.local` (and CI secrets):
  ```
  E2E_ADMIN_EMAIL=
  E2E_ADMIN_PASSWORD=
  ```
- New helper added to `e2e/auth-helper.ts`:
  ```ts
  export async function loginAsAdmin(page: Page) { ... }
  ```
- Session saved once to `e2e/.auth/admin.json` via `auth.setup.ts`, reused by all admin specs via Playwright `storageState`.

---

## 3. Data Cleanup Strategy

**Prefix:** All test-created records use `[E2E]` as a name/title prefix  
(e.g., `[E2E] Juara 1 PMPL`, `[E2E] Gallery Item`, `[E2E] News Post`)

**Cleanup mechanism:** `afterAll` in each spec file calls Supabase REST API directly with `SUPABASE_SERVICE_ROLE_KEY` (bypasses RLS) to delete all rows containing the `[E2E]` prefix. This runs even if individual tests crash mid-flow.

**Pre-run guard:** `beforeAll` in each spec asserts no `[E2E]` rows exist (leftover from a crashed previous run) and deletes them if found.

---

## 4. Pages Covered (18 panel pages)

| Admin Page | Public Page Verified |
|---|---|
| `/admin/achievements` | Landing page — achievements section |
| `/admin/gallery` | `/gallery` + `/gallery/[slug]` |
| `/admin/partners` | Landing page — partners section |
| `/admin/testimonials` | Landing page — testimonials section |
| `/admin/hero` | Landing page — hero section |
| `/admin/footer` | Footer content visible on any public page |
| `/admin/navigation` | Navbar links on any public page |
| `/admin/about` | `/about` |
| `/admin/contact` | `/contact` |
| `/admin/seo` | `<meta>` / `<title>` tags in `<head>` |
| `/admin/news` | `/news` list + `/news/[slug]` detail |
| `/admin/results` | `/results` |
| `/admin/divisions` | `/divisions` + `/divisions/[slug]` |
| `/admin/players` | `/players/[username]` |
| `/admin/rekrutmen` | `/rekrutmen` |
| `/admin/join` | `/rekrutmen` join form fields |
| `/admin/tournaments` | `/schedule` |
| `/admin/sponsor-control` | Landing page — sponsors section |

---

## 5. Per-Page Test Layers (QA Standard)

Every page gets all 7 layers:

| # | Layer | What is tested |
|---|---|---|
| 1 | **Auth guard** | No session → redirect to `/admin/login` |
| 2 | **Page load** | Heading visible, no 500, no broken layout |
| 3 | **Form validation** | Submit empty/invalid → error message shown, data NOT saved |
| 4 | **Create** | Input `[E2E]` prefixed data, save → success feedback |
| 5 | **Cross-boundary read** | Navigate to public page → `[E2E]` item visible |
| 6 | **Update** | Edit the item, save → public page reflects change |
| 7 | **Delete** | Delete item → public page no longer shows it |

**Singleton pages** (hero, footer, navigation, seo, about, contact, join): no Create/Delete — only Load + Validation + Update + cross-boundary verify. No `[E2E]` prefix needed; values are restored to original after update test.

**Cleanup:** `afterAll` REST API sweep regardless of test outcome.

---

## 6. File Structure

```
e2e/
  admin/
    setup/
      auth.setup.ts             ← loginAsAdmin(), save storageState
    landing-content.spec.ts     ← hero, achievements, partners, testimonials,
                                   footer, navigation, about, contact, seo
    news-results.spec.ts        ← news (→ /news), results (→ /results)
    gallery.spec.ts             ← gallery with image upload (→ /gallery)
    divisions-players.spec.ts   ← divisions (→ /divisions), players (→ /players)
    rekrutmen.spec.ts           ← rekrutmen + join (→ /rekrutmen)
    tournaments-sponsors.spec.ts← tournaments (→ /schedule), sponsor-control
  .auth/
    admin.json                  ← gitignored, saved session
  auth-helper.ts                ← add loginAsAdmin() here
playwright.config.ts            ← add admin setup project + storageState
```

---

## 7. Playwright Config Changes

Add two new projects to `playwright.config.ts`:

```ts
{
  name: "admin-setup",
  testMatch: "e2e/admin/setup/auth.setup.ts",
},
{
  name: "admin-tests",
  testDir: "e2e/admin",
  testMatch: "**/*.spec.ts",
  dependencies: ["admin-setup"],
  use: { storageState: "e2e/.auth/admin.json" },
}
```

Existing projects (`chromium`, etc.) are untouched.

---

## 8. API Spec (Playwright `request` context)

For each public-facing endpoint touched by admin actions, verify:
- **200** with valid auth
- **401** without auth
- **400** with invalid params

Covered routes (subset most relevant to admin CMS):
- `GET /news` — list endpoint
- `GET /gallery` — gallery list
- `GET /divisions` — division list
- `GET /schedule` — tournament schedule
- `GET /rekrutmen` — recruitment page data
- `GET /results` — results list

These are tested in the relevant spec files using `request` context, not a separate api.spec.ts.

---

## 9. Env Vars Required

```bash
# Existing (already in .env.local)
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=    ← used by afterAll cleanup

# New (add to .env.local + CI secrets)
E2E_ADMIN_EMAIL=
E2E_ADMIN_PASSWORD=
```

---

## 10. Out of Scope

- `/dashboard` (owner panel) — separate test suite
- `/manage` (manager panel) — separate test suite  
- Workspace routes (`/[team-slug]/...`) — separate test suite
- Mobile viewports — desktop Chromium only (matches existing config)
- Visual regression (screenshot diff) — not in this iteration
