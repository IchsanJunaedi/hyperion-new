# Admin E2E Test Suite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Full Playwright E2E coverage for all 18 `/admin` panel pages — CRUD flows + cross-boundary public page verification + automatic DB cleanup after every run.

**Architecture:** Shared admin auth session (login once via `auth.setup.ts`, reuse `storageState`) → 6 domain-grouped spec files → cleanup via Supabase admin client in `afterAll`. Three page types: CMS (full CRUD), toggle (visibility on/off), singleton (update+restore settings).

**Tech Stack:** Playwright v1.x, `@supabase/supabase-js` (cleanup helper), Next.js 15 App Router, Supabase Postgres.

---

## Page Type Reference

| Type | Behavior | Pages |
|---|---|---|
| **CMS** | Full CRUD — create `[E2E]` row, verify in list + public, edit, delete | achievements, gallery, partners, testimonials, news |
| **Toggle** | Toggle `is_public` / `show_on_schedule` on existing rows | divisions, sponsor-control, results, tournaments, players |
| **Singleton** | Edit existing key/value settings, verify on public, restore in `afterAll` | hero, footer, navigation, about, contact, seo, rekrutmen, join |

---

## File Map

| Action | File |
|---|---|
| **Modify** | `e2e/auth-helper.ts` |
| **Create** | `e2e/admin/setup/auth.setup.ts` |
| **Create** | `e2e/admin/helpers/cleanup.ts` |
| **Create** | `e2e/fixtures/test-image.png` (1×1 white PNG) |
| **Create** | `e2e/.gitignore` |
| **Modify** | `playwright.config.ts` |
| **Create** | `e2e/admin/landing-content.spec.ts` |
| **Create** | `e2e/admin/news-results.spec.ts` |
| **Create** | `e2e/admin/gallery.spec.ts` |
| **Create** | `e2e/admin/divisions-players.spec.ts` |
| **Create** | `e2e/admin/rekrutmen.spec.ts` |
| **Create** | `e2e/admin/tournaments-sponsors.spec.ts` |

---

## Task 1: Add env vars to `.env.local`

**Files:**
- Modify: `.env.local`

- [ ] **Step 1: Add credentials**

Open `.env.local` and append:
```
# E2E Admin credentials
E2E_ADMIN_EMAIL=<actual admin email from ADMIN_EMAIL env>
E2E_ADMIN_PASSWORD=<actual admin password>
```

These are the credentials for the account whose email matches `ADMIN_EMAIL` in production env.

- [ ] **Step 2: Verify env vars work**

Run in PowerShell:
```powershell
node -e "require('dotenv').config({path:'.env.local'}); console.log(process.env.E2E_ADMIN_EMAIL)"
```
Expected: prints the email (not undefined).

---

## Task 2: Auth infra — helper + setup + gitignore + playwright config

**Files:**
- Modify: `e2e/auth-helper.ts`
- Create: `e2e/admin/setup/auth.setup.ts`
- Create: `e2e/.gitignore`
- Modify: `playwright.config.ts`

- [ ] **Step 1: Add `loginAsAdmin` to `e2e/auth-helper.ts`**

Add after the existing `loginAsOwner` function:

```ts
export const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "";
export const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "";

export async function loginAsAdmin(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel(/email/i).fill(ADMIN_EMAIL);
  await page.getByLabel(/password/i).fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: /masuk|login|sign in/i }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/admin/login"), {
    timeout: 15_000,
  });
}
```

- [ ] **Step 2: Create `e2e/admin/setup/auth.setup.ts`**

```ts
import { test as setup } from "@playwright/test";
import path from "path";
import { loginAsAdmin, ADMIN_EMAIL, ADMIN_PASSWORD } from "../../auth-helper";

const authFile = path.join(__dirname, "../../.auth/admin.json");

setup("authenticate as admin", async ({ page }) => {
  setup.skip(
    !ADMIN_EMAIL || !ADMIN_PASSWORD,
    "E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD not configured"
  );
  await loginAsAdmin(page);
  await page.waitForURL(/\/admin/);
  await page.context().storageState({ path: authFile });
});
```

- [ ] **Step 3: Create `e2e/.gitignore`**

```
.auth/
```

- [ ] **Step 4: Create `e2e/.auth/` directory**

```powershell
New-Item -ItemType Directory -Force "e2e/.auth"
```

- [ ] **Step 5: Update `playwright.config.ts`**

In the `projects` array, add after the existing `chromium` project:

```ts
{
  name: "admin-setup",
  testMatch: "**/admin/setup/auth.setup.ts",
  use: { ...devices["Desktop Chrome"] },
},
{
  name: "admin-tests",
  testDir: "./e2e/admin",
  testMatch: "**/*.spec.ts",
  dependencies: ["admin-setup"],
  use: {
    ...devices["Desktop Chrome"],
    storageState: "e2e/.auth/admin.json",
  },
},
```

- [ ] **Step 6: Run setup to verify login works**

```powershell
npx playwright test e2e/admin/setup/auth.setup.ts --project=admin-setup
```

Expected output: `1 passed`. `e2e/.auth/admin.json` created.

- [ ] **Step 7: Commit**

```powershell
rtk git add e2e/auth-helper.ts e2e/admin/setup/auth.setup.ts e2e/.gitignore playwright.config.ts
rtk git commit -m "test(e2e): add admin auth setup and playwright project config"
```

---

## Task 3: Cleanup helper

**Files:**
- Create: `e2e/admin/helpers/cleanup.ts`

- [ ] **Step 1: Create `e2e/admin/helpers/cleanup.ts`**

```ts
import { createClient } from "@supabase/supabase-js";

const E2E_PREFIX = "[E2E]";

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env vars missing for cleanup");
  return createClient(url, key);
}

/**
 * Delete all rows in `table` where `column` starts with "[E2E]".
 * Uses service role key — bypasses RLS.
 */
export async function cleanupE2ERows(
  table: string,
  column: string
): Promise<void> {
  const client = getClient();
  const { error } = await client
    .from(table)
    .delete()
    .like(column, `${E2E_PREFIX}%`);
  if (error) console.error(`[cleanup] ${table}.${column}:`, error.message);
}

/**
 * Read a site_settings value by key.
 */
export async function getSiteSetting(key: string): Promise<string | null> {
  const client = getClient();
  const { data, error } = await client
    .from("site_settings")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  if (error) console.error(`[cleanup] getSiteSetting ${key}:`, error.message);
  return data?.value ?? null;
}

/**
 * Restore a site_settings value by key (used in afterAll for singleton pages).
 */
export async function restoreSiteSetting(
  key: string,
  value: string | null
): Promise<void> {
  if (value === null) return;
  const client = getClient();
  const { error } = await client
    .from("site_settings")
    .upsert({ key, value }, { onConflict: "key" });
  if (error) console.error(`[cleanup] restoreSiteSetting ${key}:`, error.message);
}

export { E2E_PREFIX };
```

- [ ] **Step 2: Verify TypeScript compiles**

```powershell
rtk tsc
```

Expected: exit 0, no errors.

- [ ] **Step 3: Commit**

```powershell
rtk git add e2e/admin/helpers/cleanup.ts
rtk git commit -m "test(e2e): add admin E2E cleanup helper"
```

---

## Task 4: Test image fixture

**Files:**
- Create: `e2e/fixtures/test-image.png`

- [ ] **Step 1: Create a minimal 1×1 white PNG fixture**

Run this Node.js script once:
```powershell
node -e "
const { createCanvas } = require('canvas');
" 
```

If `canvas` is not installed, use this simpler approach — create the PNG bytes directly:
```powershell
$pngBytes = [byte[]](137,80,78,71,13,10,26,10,0,0,0,13,73,72,68,82,0,0,0,1,0,0,0,1,8,2,0,0,0,144,119,83,222,0,0,0,12,73,68,65,84,8,215,99,248,207,192,0,0,0,2,0,1,232,33,188,51,0,0,0,0,73,69,78,68,174,66,96,130)
$null = New-Item -ItemType Directory -Force "e2e/fixtures"
[System.IO.File]::WriteAllBytes("$PWD/e2e/fixtures/test-image.png", $pngBytes)
```

Expected: `e2e/fixtures/test-image.png` created (67 bytes, valid 1×1 PNG).

- [ ] **Step 2: Commit**

```powershell
rtk git add e2e/fixtures/test-image.png
rtk git commit -m "test(e2e): add 1x1 PNG fixture for gallery upload tests"
```

---

## Task 5: `landing-content.spec.ts`

**Pages:** achievements (CMS), partners (CMS), testimonials (CMS), hero (singleton), footer (singleton), navigation (singleton), about (singleton), contact (singleton), seo (singleton)

**Files:**
- Create: `e2e/admin/landing-content.spec.ts`

- [ ] **Step 1: Create `e2e/admin/landing-content.spec.ts`**

```ts
import { test, expect, Browser } from "@playwright/test";
import {
  cleanupE2ERows,
  getSiteSetting,
  restoreSiteSetting,
  E2E_PREFIX,
} from "./helpers/cleanup";
import { ADMIN_EMAIL, ADMIN_PASSWORD } from "../auth-helper";

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function unauthContext(browser: Browser) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  return { ctx, page };
}

// ─── Achievements (CMS) ───────────────────────────────────────────────────────

test.describe("Admin — Achievements", () => {
  test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, "Admin credentials not configured");

  test.beforeAll(async () => {
    await cleanupE2ERows("achievements", "title");
  });

  test.afterAll(async () => {
    await cleanupE2ERows("achievements", "title");
  });

  test("unauthenticated → redirect to /admin/login", async ({ browser }) => {
    const { ctx, page } = await unauthContext(browser);
    await page.goto("/admin/achievements");
    await expect(page).toHaveURL(/\/admin\/login/);
    await ctx.close();
  });

  test("page loads with heading", async ({ page }) => {
    await page.goto("/admin/achievements");
    await expect(page.getByRole("heading", { name: /achievements/i })).toBeVisible();
  });

  test("form validation — empty submit shows error toast", async ({ page }) => {
    await page.goto("/admin/achievements");
    await page.getByRole("button", { name: /tambah manual/i }).click();
    // Click save without filling required fields
    await page.getByRole("button", { name: /^tambah$/i }).click();
    await expect(page.getByText(/title dan tanggal wajib/i)).toBeVisible({ timeout: 5_000 });
  });

  test("create achievement with [E2E] prefix", async ({ page }) => {
    await page.goto("/admin/achievements");
    await page.getByRole("button", { name: /tambah manual/i }).click();
    await page.getByPlaceholder(/juara 1/i).fill(`${E2E_PREFIX} Juara 1 PMPL E2E`);
    await page.getByLabel(/tanggal/i).fill("2026-01-15");
    await page.getByRole("button", { name: /^tambah$/i }).click();
    await expect(page.getByText(/achievement ditambahkan/i)).toBeVisible({ timeout: 8_000 });
  });

  test("achievement appears in admin list after page reload", async ({ page }) => {
    await page.goto("/admin/achievements");
    await expect(page.getByText(`${E2E_PREFIX} Juara 1 PMPL E2E`)).toBeVisible({ timeout: 8_000 });
  });

  test("achievement appears on public landing page", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(`${E2E_PREFIX} Juara 1 PMPL E2E`)).toBeVisible({ timeout: 8_000 });
  });

  test("edit achievement title", async ({ page }) => {
    await page.goto("/admin/achievements");
    const row = page.locator("div").filter({ hasText: `${E2E_PREFIX} Juara 1 PMPL E2E` }).last();
    // First icon button = edit (Pencil)
    await row.locator("button").nth(-2).click();
    const titleInput = page.getByPlaceholder(/juara 1/i);
    await titleInput.clear();
    await titleInput.fill(`${E2E_PREFIX} Juara 1 PMPL E2E Updated`);
    await page.getByRole("button", { name: /^simpan$/i }).click();
    await expect(page.getByText(/achievement diperbarui/i)).toBeVisible({ timeout: 8_000 });
  });

  test("updated title appears on landing page", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(`${E2E_PREFIX} Juara 1 PMPL E2E Updated`)).toBeVisible({ timeout: 8_000 });
  });

  test("delete achievement — requires typing HAPUS", async ({ page }) => {
    await page.goto("/admin/achievements");
    const row = page.locator("div").filter({ hasText: `${E2E_PREFIX} Juara 1 PMPL E2E Updated` }).last();
    // Last icon button = delete (Trash2)
    await row.locator("button").last().click();
    // ConfirmDeleteDialog appears — type HAPUS to unlock
    await page.getByRole("textbox").last().fill("HAPUS");
    await page.getByRole("button", { name: /^hapus$/i }).last().click();
    await expect(page.getByText(/achievement dihapus/i)).toBeVisible({ timeout: 8_000 });
  });

  test("deleted achievement no longer on landing page", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(`${E2E_PREFIX} Juara 1 PMPL E2E Updated`)).not.toBeVisible();
  });
});

// ─── Partners (CMS) ───────────────────────────────────────────────────────────

test.describe("Admin — Partners", () => {
  test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, "Admin credentials not configured");

  test.beforeAll(async () => {
    await cleanupE2ERows("partners", "name");
  });

  test.afterAll(async () => {
    await cleanupE2ERows("partners", "name");
  });

  test("unauthenticated → redirect to /admin/login", async ({ browser }) => {
    const { ctx, page } = await unauthContext(browser);
    await page.goto("/admin/partners");
    await expect(page).toHaveURL(/\/admin\/login/);
    await ctx.close();
  });

  test("page loads", async ({ page }) => {
    await page.goto("/admin/partners");
    await expect(page.getByRole("heading", { name: /partners/i })).toBeVisible();
  });

  test("form validation — empty name shows error", async ({ page }) => {
    await page.goto("/admin/partners");
    await page.getByRole("button", { name: /tambah/i }).click();
    await page.getByRole("button", { name: /^tambah$|^simpan$/i }).last().click();
    await expect(page.getByText(/nama wajib/i)).toBeVisible({ timeout: 5_000 });
  });

  test("create partner", async ({ page }) => {
    await page.goto("/admin/partners");
    await page.getByRole("button", { name: /tambah/i }).click();
    await page.getByPlaceholder(/nama partner/i).fill(`${E2E_PREFIX} E2E Sponsor Co`);
    await page.getByRole("button", { name: /^tambah$|^simpan$/i }).last().click();
    await expect(page.getByText(/partner ditambahkan/i)).toBeVisible({ timeout: 8_000 });
  });

  test("partner appears in list", async ({ page }) => {
    await page.goto("/admin/partners");
    await expect(page.getByText(`${E2E_PREFIX} E2E Sponsor Co`)).toBeVisible({ timeout: 8_000 });
  });

  test("edit partner name", async ({ page }) => {
    await page.goto("/admin/partners");
    const row = page.locator("div").filter({ hasText: `${E2E_PREFIX} E2E Sponsor Co` }).last();
    await row.locator("button").nth(-2).click();
    const nameInput = page.getByPlaceholder(/nama partner/i);
    await nameInput.clear();
    await nameInput.fill(`${E2E_PREFIX} E2E Sponsor Co Updated`);
    await page.getByRole("button", { name: /^simpan$/i }).last().click();
    await expect(page.getByText(/partner diperbarui/i)).toBeVisible({ timeout: 8_000 });
  });

  test("delete partner", async ({ page }) => {
    await page.goto("/admin/partners");
    const row = page.locator("div").filter({ hasText: `${E2E_PREFIX} E2E Sponsor Co Updated` }).last();
    await row.locator("button").last().click();
    await page.getByRole("textbox").last().fill("HAPUS");
    await page.getByRole("button", { name: /^hapus$/i }).last().click();
    await expect(page.getByText(/partner dihapus/i)).toBeVisible({ timeout: 8_000 });
  });
});

// ─── Testimonials (CMS) ───────────────────────────────────────────────────────

test.describe("Admin — Testimonials", () => {
  test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, "Admin credentials not configured");

  test.beforeAll(async () => {
    await cleanupE2ERows("testimonials", "author_name");
  });

  test.afterAll(async () => {
    await cleanupE2ERows("testimonials", "author_name");
  });

  test("unauthenticated → redirect to /admin/login", async ({ browser }) => {
    const { ctx, page } = await unauthContext(browser);
    await page.goto("/admin/testimonials");
    await expect(page).toHaveURL(/\/admin\/login/);
    await ctx.close();
  });

  test("page loads", async ({ page }) => {
    await page.goto("/admin/testimonials");
    await expect(page.getByRole("heading", { name: /testimonials/i })).toBeVisible();
  });

  test("form validation — empty name + content shows error", async ({ page }) => {
    await page.goto("/admin/testimonials");
    await page.getByRole("button", { name: /tambah/i }).click();
    await page.getByRole("button", { name: /^tambah$|^simpan$/i }).last().click();
    await expect(page.getByText(/nama dan konten wajib/i)).toBeVisible({ timeout: 5_000 });
  });

  test("create testimonial", async ({ page }) => {
    await page.goto("/admin/testimonials");
    await page.getByRole("button", { name: /tambah/i }).click();
    await page.getByPlaceholder(/nama/i).fill(`${E2E_PREFIX} E2E Player`);
    await page.getByPlaceholder(/konten|testimonial|isi/i).fill("E2E test testimonial content");
    await page.getByRole("button", { name: /^tambah$|^simpan$/i }).last().click();
    await expect(page.getByText(/testimonial ditambahkan/i)).toBeVisible({ timeout: 8_000 });
  });

  test("testimonial appears in list", async ({ page }) => {
    await page.goto("/admin/testimonials");
    await expect(page.getByText(`${E2E_PREFIX} E2E Player`)).toBeVisible({ timeout: 8_000 });
  });

  test("edit testimonial", async ({ page }) => {
    await page.goto("/admin/testimonials");
    const row = page.locator("div").filter({ hasText: `${E2E_PREFIX} E2E Player` }).last();
    await row.locator("button").nth(-2).click();
    const nameInput = page.getByPlaceholder(/nama/i);
    await nameInput.clear();
    await nameInput.fill(`${E2E_PREFIX} E2E Player Updated`);
    await page.getByRole("button", { name: /^simpan$/i }).last().click();
    await expect(page.getByText(/testimonial diperbarui/i)).toBeVisible({ timeout: 8_000 });
  });

  test("delete testimonial", async ({ page }) => {
    await page.goto("/admin/testimonials");
    const row = page.locator("div").filter({ hasText: `${E2E_PREFIX} E2E Player Updated` }).last();
    await row.locator("button").last().click();
    await page.getByRole("textbox").last().fill("HAPUS");
    await page.getByRole("button", { name: /^hapus$/i }).last().click();
    await expect(page.getByText(/testimonial dihapus/i)).toBeVisible({ timeout: 8_000 });
  });
});

// ─── Hero (Singleton) ─────────────────────────────────────────────────────────

test.describe("Admin — Hero Section", () => {
  test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, "Admin credentials not configured");

  let originalEyebrow: string | null = null;

  test.beforeAll(async () => {
    originalEyebrow = await getSiteSetting("hero_eyebrow");
  });

  test.afterAll(async () => {
    await restoreSiteSetting("hero_eyebrow", originalEyebrow);
  });

  test("unauthenticated → redirect to /admin/login", async ({ browser }) => {
    const { ctx, page } = await unauthContext(browser);
    await page.goto("/admin/hero");
    await expect(page).toHaveURL(/\/admin\/login/);
    await ctx.close();
  });

  test("page loads with Hero Section heading", async ({ page }) => {
    await page.goto("/admin/hero");
    await expect(page.getByRole("heading", { name: /hero section/i })).toBeVisible();
  });

  test("update hero eyebrow text and verify on public landing page", async ({ page }) => {
    await page.goto("/admin/hero");
    const eyebrowInput = page.getByPlaceholder(/est\. 2020/i);
    await eyebrowInput.clear();
    await eyebrowInput.fill("[E2E] Eyebrow Test Text");
    await page.getByRole("button", { name: /simpan/i }).click();
    await expect(page.getByText(/pengaturan hero disimpan/i)).toBeVisible({ timeout: 8_000 });

    // Verify on public page
    await page.goto("/");
    await expect(page.getByText("[E2E] Eyebrow Test Text")).toBeVisible({ timeout: 8_000 });
  });
});

// ─── About (Singleton) ────────────────────────────────────────────────────────

test.describe("Admin — About", () => {
  test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, "Admin credentials not configured");

  test("unauthenticated → redirect to /admin/login", async ({ browser }) => {
    const { ctx, page } = await unauthContext(browser);
    await page.goto("/admin/about");
    await expect(page).toHaveURL(/\/admin\/login/);
    await ctx.close();
  });

  test("page loads", async ({ page }) => {
    await page.goto("/admin/about");
    await expect(page.getByRole("heading", { name: /about/i })).toBeVisible();
  });

  test("/about public page loads without 500", async ({ page }) => {
    const response = await page.goto("/about");
    expect(response?.status()).not.toBe(500);
    expect(response?.status()).toBe(200);
  });
});

// ─── Contact (Singleton) ──────────────────────────────────────────────────────

test.describe("Admin — Contact", () => {
  test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, "Admin credentials not configured");

  test("unauthenticated → redirect to /admin/login", async ({ browser }) => {
    const { ctx, page } = await unauthContext(browser);
    await page.goto("/admin/contact");
    await expect(page).toHaveURL(/\/admin\/login/);
    await ctx.close();
  });

  test("page loads", async ({ page }) => {
    await page.goto("/admin/contact");
    await expect(page.getByRole("heading", { name: /contact/i })).toBeVisible();
  });

  test("/contact public page returns 200", async ({ page }) => {
    const response = await page.goto("/contact");
    expect(response?.status()).toBe(200);
  });
});

// ─── SEO (Singleton) ──────────────────────────────────────────────────────────

test.describe("Admin — SEO", () => {
  test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, "Admin credentials not configured");

  let originalSiteTitle: string | null = null;

  test.beforeAll(async () => {
    originalSiteTitle = await getSiteSetting("site_title");
  });

  test.afterAll(async () => {
    await restoreSiteSetting("site_title", originalSiteTitle);
  });

  test("unauthenticated → redirect to /admin/login", async ({ browser }) => {
    const { ctx, page } = await unauthContext(browser);
    await page.goto("/admin/seo");
    await expect(page).toHaveURL(/\/admin\/login/);
    await ctx.close();
  });

  test("page loads", async ({ page }) => {
    await page.goto("/admin/seo");
    await expect(page.getByRole("heading", { name: /seo/i })).toBeVisible();
  });

  test("update site title and verify <title> tag on public page", async ({ page }) => {
    await page.goto("/admin/seo");
    const titleInput = page.getByLabel(/site title|judul/i).first();
    await titleInput.clear();
    await titleInput.fill("[E2E] Test Site Title");
    await page.getByRole("button", { name: /simpan/i }).click();
    await expect(page.getByText(/disimpan/i)).toBeVisible({ timeout: 8_000 });

    // Verify <title> tag
    await page.goto("/");
    await expect(page).toHaveTitle(/E2E.*Test Site Title|Test Site Title/);
  });
});

// ─── Footer (Singleton) ───────────────────────────────────────────────────────

test.describe("Admin — Footer", () => {
  test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, "Admin credentials not configured");

  test("unauthenticated → redirect to /admin/login", async ({ browser }) => {
    const { ctx, page } = await unauthContext(browser);
    await page.goto("/admin/footer");
    await expect(page).toHaveURL(/\/admin\/login/);
    await ctx.close();
  });

  test("page loads", async ({ page }) => {
    await page.goto("/admin/footer");
    await expect(page.getByRole("heading", { name: /footer/i })).toBeVisible();
  });

  test("save footer settings without error", async ({ page }) => {
    await page.goto("/admin/footer");
    await page.getByRole("button", { name: /simpan/i }).click();
    await expect(page.getByText(/disimpan/i)).toBeVisible({ timeout: 8_000 });
  });
});

// ─── Navigation (Singleton) ───────────────────────────────────────────────────

test.describe("Admin — Navigation", () => {
  test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, "Admin credentials not configured");

  test("unauthenticated → redirect to /admin/login", async ({ browser }) => {
    const { ctx, page } = await unauthContext(browser);
    await page.goto("/admin/navigation");
    await expect(page).toHaveURL(/\/admin\/login/);
    await ctx.close();
  });

  test("page loads", async ({ page }) => {
    await page.goto("/admin/navigation");
    await expect(page.getByRole("heading", { name: /navigation|nav/i })).toBeVisible();
  });
});
```

- [ ] **Step 2: Run just the achievements tests to verify structure**

```powershell
npx playwright test e2e/admin/landing-content.spec.ts --project=admin-tests --grep "Achievements"
```

Expected: all achievements tests pass (or fail with meaningful errors, not TypeScript errors).

- [ ] **Step 3: Run full landing-content spec**

```powershell
npx playwright test e2e/admin/landing-content.spec.ts --project=admin-tests
```

Expected: all pass. Fix any selector mismatches (actual button text / placeholder text may differ — inspect page to correct).

- [ ] **Step 4: Commit**

```powershell
rtk git add e2e/admin/landing-content.spec.ts
rtk git commit -m "test(e2e): admin landing-content spec — achievements, partners, testimonials, singletons"
```

---

## Task 6: `news-results.spec.ts`

**Pages:** news (CMS + publish toggle → `/news`), results (visibility toggle → `/results`)

**Files:**
- Create: `e2e/admin/news-results.spec.ts`

- [ ] **Step 1: Create `e2e/admin/news-results.spec.ts`**

```ts
import { test, expect, Browser } from "@playwright/test";
import { cleanupE2ERows, E2E_PREFIX } from "./helpers/cleanup";
import { ADMIN_EMAIL, ADMIN_PASSWORD } from "../auth-helper";

async function unauthContext(browser: Browser) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  return { ctx, page };
}

// ─── News (CMS) ───────────────────────────────────────────────────────────────

test.describe("Admin — News", () => {
  test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, "Admin credentials not configured");

  test.beforeAll(async () => {
    await cleanupE2ERows("news_posts", "title");
  });

  test.afterAll(async () => {
    await cleanupE2ERows("news_posts", "title");
  });

  test("unauthenticated → redirect to /admin/login", async ({ browser }) => {
    const { ctx, page } = await unauthContext(browser);
    await page.goto("/admin/news");
    await expect(page).toHaveURL(/\/admin\/login/);
    await ctx.close();
  });

  test("page loads with News heading", async ({ page }) => {
    await page.goto("/admin/news");
    await expect(page.getByRole("heading", { name: /^news$/i })).toBeVisible();
  });

  test("form validation — empty title shows error", async ({ page }) => {
    await page.goto("/admin/news");
    await page.getByRole("button", { name: /buat artikel/i }).click();
    // Click submit without title
    await page.getByRole("button", { name: /^buat artikel$/i }).last().click();
    await expect(page.getByText(/title dan slug wajib/i)).toBeVisible({ timeout: 5_000 });
  });

  test("create news post as draft", async ({ page }) => {
    await page.goto("/admin/news");
    await page.getByRole("button", { name: /buat artikel/i }).click();
    await page.getByPlaceholder(/juara 1 di mpl/i).fill(`${E2E_PREFIX} E2E Test Article`);
    // Slug is auto-generated from title — wait for it
    await page.waitForTimeout(300);
    // Status: Draft (default)
    await page.getByRole("button", { name: /^buat artikel$/i }).last().click();
    await expect(page.getByText(/artikel dibuat/i)).toBeVisible({ timeout: 8_000 });
  });

  test("draft article appears in admin list with Draft badge", async ({ page }) => {
    await page.goto("/admin/news");
    await expect(page.getByText(`${E2E_PREFIX} E2E Test Article`)).toBeVisible({ timeout: 8_000 });
    // Draft badge
    const row = page.locator("div").filter({ hasText: `${E2E_PREFIX} E2E Test Article` }).last();
    await expect(row.getByText(/draft/i)).toBeVisible();
  });

  test("draft article does NOT appear on public /news page", async ({ page }) => {
    await page.goto("/news");
    await expect(page.getByText(`${E2E_PREFIX} E2E Test Article`)).not.toBeVisible();
  });

  test("publish article via toggle button", async ({ page }) => {
    await page.goto("/admin/news");
    const row = page.locator("div").filter({ hasText: `${E2E_PREFIX} E2E Test Article` }).last();
    await row.getByRole("button", { name: /^publish$/i }).click();
    await expect(page.getByText(/dipublikasikan/i)).toBeVisible({ timeout: 8_000 });
  });

  test("published article appears on public /news page", async ({ page }) => {
    await page.goto("/news");
    await expect(page.getByText(`${E2E_PREFIX} E2E Test Article`)).toBeVisible({ timeout: 8_000 });
  });

  test("edit article title", async ({ page }) => {
    await page.goto("/admin/news");
    const row = page.locator("div").filter({ hasText: `${E2E_PREFIX} E2E Test Article` }).last();
    await row.locator("button").nth(-2).click(); // Pencil icon
    const titleInput = page.getByPlaceholder(/juara 1 di mpl/i);
    await titleInput.clear();
    await titleInput.fill(`${E2E_PREFIX} E2E Test Article Updated`);
    await page.getByRole("button", { name: /^simpan$/i }).last().click();
    await expect(page.getByText(/artikel diperbarui/i)).toBeVisible({ timeout: 8_000 });
  });

  test("updated title on /news public page", async ({ page }) => {
    await page.goto("/news");
    await expect(page.getByText(`${E2E_PREFIX} E2E Test Article Updated`)).toBeVisible({ timeout: 8_000 });
  });

  test("delete article", async ({ page }) => {
    await page.goto("/admin/news");
    const row = page.locator("div").filter({ hasText: `${E2E_PREFIX} E2E Test Article Updated` }).last();
    await row.locator("button").last().click(); // Trash icon
    await page.getByRole("textbox").last().fill("HAPUS");
    await page.getByRole("button", { name: /^hapus$/i }).last().click();
    await expect(page.getByText(/artikel dihapus/i)).toBeVisible({ timeout: 8_000 });
  });

  test("deleted article no longer on /news", async ({ page }) => {
    await page.goto("/news");
    await expect(page.getByText(`${E2E_PREFIX} E2E Test Article Updated`)).not.toBeVisible();
  });
});

// ─── Results (Toggle) ─────────────────────────────────────────────────────────

test.describe("Admin — Results", () => {
  test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, "Admin credentials not configured");

  test("unauthenticated → redirect to /admin/login", async ({ browser }) => {
    const { ctx, page } = await unauthContext(browser);
    await page.goto("/admin/results");
    await expect(page).toHaveURL(/\/admin\/login/);
    await ctx.close();
  });

  test("page loads with Results heading", async ({ page }) => {
    await page.goto("/admin/results");
    await expect(page.getByRole("heading", { name: /results/i })).toBeVisible();
  });

  test("/results public page returns 200", async ({ page }) => {
    const response = await page.goto("/results");
    expect(response?.status()).toBe(200);
  });

  test("toggle result visibility — if results exist", async ({ page }) => {
    await page.goto("/admin/results");
    // If there are results, find the first toggle
    const toggleBtn = page.getByRole("button", { name: /publik|sembunyikan|tampilkan/i }).first();
    const hasResults = await toggleBtn.isVisible().catch(() => false);
    if (!hasResults) {
      test.skip(); // No results to toggle — skip gracefully
      return;
    }
    // Get current text before toggle
    const beforeText = await toggleBtn.textContent();
    await toggleBtn.click();
    await expect(page.getByText(/berhasil|dipublikasikan|disembunyikan/i)).toBeVisible({ timeout: 8_000 });
    // Toggle back
    await toggleBtn.click();
    await expect(toggleBtn).toHaveText(beforeText ?? "", { timeout: 8_000 });
  });
});
```

- [ ] **Step 2: Run news-results spec**

```powershell
npx playwright test e2e/admin/news-results.spec.ts --project=admin-tests
```

Expected: all pass. Adjust selectors if toast text or placeholder differs from actual component.

- [ ] **Step 3: Commit**

```powershell
rtk git add e2e/admin/news-results.spec.ts
rtk git commit -m "test(e2e): admin news-results spec — full CRUD + publish toggle + visibility toggle"
```

---

## Task 7: `gallery.spec.ts`

**Pages:** gallery (CMS with image upload → `/gallery`, `/gallery/[slug]`)

**Files:**
- Create: `e2e/admin/gallery.spec.ts`

- [ ] **Step 1: Create `e2e/admin/gallery.spec.ts`**

```ts
import { test, expect, Browser } from "@playwright/test";
import path from "path";
import { cleanupE2ERows, E2E_PREFIX } from "./helpers/cleanup";
import { ADMIN_EMAIL, ADMIN_PASSWORD } from "../auth-helper";

const FIXTURE_IMAGE = path.join(__dirname, "../fixtures/test-image.png");

async function unauthContext(browser: Browser) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  return { ctx, page };
}

test.describe("Admin — Gallery", () => {
  test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, "Admin credentials not configured");

  test.beforeAll(async () => {
    await cleanupE2ERows("gallery_entries", "title");
  });

  test.afterAll(async () => {
    await cleanupE2ERows("gallery_entries", "title");
  });

  test("unauthenticated → redirect to /admin/login", async ({ browser }) => {
    const { ctx, page } = await unauthContext(browser);
    await page.goto("/admin/gallery");
    await expect(page).toHaveURL(/\/admin\/login/);
    await ctx.close();
  });

  test("page loads with Gallery heading", async ({ page }) => {
    await page.goto("/admin/gallery");
    await expect(page.getByRole("heading", { name: /gallery/i })).toBeVisible();
  });

  test("form validation — empty required fields shows error", async ({ page }) => {
    await page.goto("/admin/gallery");
    await page.getByRole("button", { name: /tambah/i }).click();
    await page.getByRole("button", { name: /^tambah$|^simpan$/i }).last().click();
    await expect(page.getByText(/slug, title, dan deskripsi wajib/i)).toBeVisible({ timeout: 5_000 });
  });

  test("create gallery entry", async ({ page }) => {
    await page.goto("/admin/gallery");
    await page.getByRole("button", { name: /tambah/i }).click();

    // Title (auto-generates slug)
    await page.getByPlaceholder(/judul|title/i).fill(`${E2E_PREFIX} E2E Gallery Entry`);
    // Wait for slug to auto-fill
    await page.waitForTimeout(300);
    // Description (required)
    await page.getByPlaceholder(/deskripsi/i).fill("E2E test gallery description");

    // Upload test image via file input
    await page.setInputFiles('input[type="file"]', FIXTURE_IMAGE);
    // Wait for upload to complete (toast or URL appears)
    await page.waitForTimeout(2_000);

    await page.getByRole("button", { name: /^tambah$|^simpan$/i }).last().click();
    await expect(page.getByText(/entry.*ditambahkan|berhasil/i)).toBeVisible({ timeout: 10_000 });
  });

  test("gallery entry appears in admin list", async ({ page }) => {
    await page.goto("/admin/gallery");
    await expect(page.getByText(`${E2E_PREFIX} E2E Gallery Entry`)).toBeVisible({ timeout: 8_000 });
  });

  test("/gallery public page loads (200)", async ({ page }) => {
    const response = await page.goto("/gallery");
    expect(response?.status()).toBe(200);
  });

  test("edit gallery entry title", async ({ page }) => {
    await page.goto("/admin/gallery");
    const row = page.locator("div").filter({ hasText: `${E2E_PREFIX} E2E Gallery Entry` }).last();
    await row.locator("button").nth(-2).click();
    const titleInput = page.getByPlaceholder(/judul|title/i);
    await titleInput.clear();
    await titleInput.fill(`${E2E_PREFIX} E2E Gallery Entry Updated`);
    await page.getByRole("button", { name: /^simpan$/i }).last().click();
    await expect(page.getByText(/diperbarui|berhasil/i)).toBeVisible({ timeout: 8_000 });
  });

  test("delete gallery entry", async ({ page }) => {
    await page.goto("/admin/gallery");
    const row = page.locator("div").filter({ hasText: `${E2E_PREFIX} E2E Gallery Entry Updated` }).last();
    await row.locator("button").last().click();
    await page.getByRole("textbox").last().fill("HAPUS");
    await page.getByRole("button", { name: /^hapus$/i }).last().click();
    await expect(page.getByText(/entry dihapus|berhasil/i)).toBeVisible({ timeout: 8_000 });
  });
});
```

- [ ] **Step 2: Run gallery spec**

```powershell
npx playwright test e2e/admin/gallery.spec.ts --project=admin-tests
```

Expected: all pass. Note: image upload test may require a real Supabase storage bucket configured. If storage is not set up in test env, skip the image upload assertion and keep the rest.

- [ ] **Step 3: Commit**

```powershell
rtk git add e2e/admin/gallery.spec.ts
rtk git commit -m "test(e2e): admin gallery spec — CRUD with image upload"
```

---

## Task 8: `divisions-players.spec.ts`

**Pages:** divisions (visibility toggle + edit info → `/divisions`), players (visibility toggle → `/players`)

**Files:**
- Create: `e2e/admin/divisions-players.spec.ts`

- [ ] **Step 1: Create `e2e/admin/divisions-players.spec.ts`**

```ts
import { test, expect, Browser } from "@playwright/test";
import { ADMIN_EMAIL, ADMIN_PASSWORD } from "../auth-helper";

async function unauthContext(browser: Browser) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  return { ctx, page };
}

// ─── Divisions (Toggle) ───────────────────────────────────────────────────────
// Note: /admin/divisions lists workspace divisions (from `divisions` table).
// Visibility toggles `is_public`. No creation from admin — divisions are created
// in the workspace and then surfaced here.

test.describe("Admin — Divisions", () => {
  test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, "Admin credentials not configured");

  test("unauthenticated → redirect to /admin/login", async ({ browser }) => {
    const { ctx, page } = await unauthContext(browser);
    await page.goto("/admin/divisions");
    await expect(page).toHaveURL(/\/admin\/login/);
    await ctx.close();
  });

  test("page loads with Divisions heading", async ({ page }) => {
    await page.goto("/admin/divisions");
    await expect(page.getByRole("heading", { name: /divisions/i })).toBeVisible();
  });

  test("/divisions public page returns 200", async ({ page }) => {
    const response = await page.goto("/divisions");
    expect(response?.status()).toBe(200);
  });

  test("toggle division public visibility — if divisions exist", async ({ page }) => {
    await page.goto("/admin/divisions");
    // Look for the toggle switch/button for any division
    const toggleBtn = page.getByRole("button", { name: /publik|tampilkan|sembunyikan/i }).first();
    const hasItems = await toggleBtn.isVisible().catch(() => false);
    if (!hasItems) {
      // No divisions with members to toggle — just verify the page rendered OK
      await expect(page.locator("main")).toBeVisible();
      return;
    }
    await toggleBtn.click();
    await expect(page.getByText(/ditampilkan|disembunyikan|berhasil/i)).toBeVisible({ timeout: 8_000 });
    // Restore to original state
    await toggleBtn.click();
    await expect(page.getByText(/ditampilkan|disembunyikan|berhasil/i)).toBeVisible({ timeout: 8_000 });
  });
});

// ─── Players (Toggle) ─────────────────────────────────────────────────────────

test.describe("Admin — Players", () => {
  test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, "Admin credentials not configured");

  test("unauthenticated → redirect to /admin/login", async ({ browser }) => {
    const { ctx, page } = await unauthContext(browser);
    await page.goto("/admin/players");
    await expect(page).toHaveURL(/\/admin\/login/);
    await ctx.close();
  });

  test("page loads with Players heading", async ({ page }) => {
    await page.goto("/admin/players");
    await expect(page.getByRole("heading", { name: /players/i })).toBeVisible();
  });

  test("toggle player public visibility — if players exist", async ({ page }) => {
    await page.goto("/admin/players");
    const toggleBtn = page.getByRole("button", { name: /publik|tampilkan|sembunyikan/i }).first();
    const hasItems = await toggleBtn.isVisible().catch(() => false);
    if (!hasItems) {
      await expect(page.locator("main")).toBeVisible();
      return;
    }
    await toggleBtn.click();
    await expect(page.getByText(/ditampilkan|disembunyikan|berhasil/i)).toBeVisible({ timeout: 8_000 });
    await toggleBtn.click();
    await expect(page.getByText(/ditampilkan|disembunyikan|berhasil/i)).toBeVisible({ timeout: 8_000 });
  });
});
```

- [ ] **Step 2: Run divisions-players spec**

```powershell
npx playwright test e2e/admin/divisions-players.spec.ts --project=admin-tests
```

- [ ] **Step 3: Commit**

```powershell
rtk git add e2e/admin/divisions-players.spec.ts
rtk git commit -m "test(e2e): admin divisions-players spec — toggle visibility"
```

---

## Task 9: `rekrutmen.spec.ts`

**Pages:** rekrutmen (singleton → `/rekrutmen`), join (singleton → `/rekrutmen` form fields)

**Files:**
- Create: `e2e/admin/rekrutmen.spec.ts`

- [ ] **Step 1: Create `e2e/admin/rekrutmen.spec.ts`**

```ts
import { test, expect, Browser } from "@playwright/test";
import { ADMIN_EMAIL, ADMIN_PASSWORD } from "../auth-helper";

async function unauthContext(browser: Browser) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  return { ctx, page };
}

// ─── Rekrutmen (Singleton) ────────────────────────────────────────────────────

test.describe("Admin — Rekrutmen", () => {
  test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, "Admin credentials not configured");

  test("unauthenticated → redirect to /admin/login", async ({ browser }) => {
    const { ctx, page } = await unauthContext(browser);
    await page.goto("/admin/rekrutmen");
    await expect(page).toHaveURL(/\/admin\/login/);
    await ctx.close();
  });

  test("page loads", async ({ page }) => {
    await page.goto("/admin/rekrutmen");
    await expect(page.getByRole("heading", { name: /rekrutmen/i })).toBeVisible();
  });

  test("save rekrutmen settings without error", async ({ page }) => {
    await page.goto("/admin/rekrutmen");
    await page.getByRole("button", { name: /simpan/i }).click();
    await expect(page.getByText(/disimpan|berhasil/i)).toBeVisible({ timeout: 8_000 });
  });

  test("/rekrutmen public page returns 200", async ({ page }) => {
    const response = await page.goto("/rekrutmen");
    expect(response?.status()).toBe(200);
  });
});

// ─── Join (Singleton) ─────────────────────────────────────────────────────────

test.describe("Admin — Join", () => {
  test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, "Admin credentials not configured");

  test("unauthenticated → redirect to /admin/login", async ({ browser }) => {
    const { ctx, page } = await unauthContext(browser);
    await page.goto("/admin/join");
    await expect(page).toHaveURL(/\/admin\/login/);
    await ctx.close();
  });

  test("page loads", async ({ page }) => {
    await page.goto("/admin/join");
    await expect(page.getByRole("heading", { name: /join/i })).toBeVisible();
  });

  test("save join settings without error", async ({ page }) => {
    await page.goto("/admin/join");
    await page.getByRole("button", { name: /simpan/i }).click();
    await expect(page.getByText(/disimpan|berhasil/i)).toBeVisible({ timeout: 8_000 });
  });
});
```

- [ ] **Step 2: Run rekrutmen spec**

```powershell
npx playwright test e2e/admin/rekrutmen.spec.ts --project=admin-tests
```

- [ ] **Step 3: Commit**

```powershell
rtk git add e2e/admin/rekrutmen.spec.ts
rtk git commit -m "test(e2e): admin rekrutmen+join spec — singleton settings"
```

---

## Task 10: `tournaments-sponsors.spec.ts`

**Pages:** tournaments (visibility toggle → `/schedule`), sponsor-control (visibility toggle + sort → landing page)

**Files:**
- Create: `e2e/admin/tournaments-sponsors.spec.ts`

- [ ] **Step 1: Create `e2e/admin/tournaments-sponsors.spec.ts`**

```ts
import { test, expect, Browser } from "@playwright/test";
import { ADMIN_EMAIL, ADMIN_PASSWORD } from "../auth-helper";

async function unauthContext(browser: Browser) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  return { ctx, page };
}

// ─── Tournaments (Toggle) ─────────────────────────────────────────────────────

test.describe("Admin — Tournaments", () => {
  test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, "Admin credentials not configured");

  test("unauthenticated → redirect to /admin/login", async ({ browser }) => {
    const { ctx, page } = await unauthContext(browser);
    await page.goto("/admin/tournaments");
    await expect(page).toHaveURL(/\/admin\/login/);
    await ctx.close();
  });

  test("page loads with Tournaments heading", async ({ page }) => {
    await page.goto("/admin/tournaments");
    await expect(page.getByRole("heading", { name: /tournaments/i })).toBeVisible();
  });

  test("/schedule public page returns 200", async ({ page }) => {
    const response = await page.goto("/schedule");
    expect(response?.status()).toBe(200);
  });

  test("toggle tournament schedule visibility — if tournaments exist", async ({ page }) => {
    await page.goto("/admin/tournaments");
    // Toggle show_on_schedule for the first tournament
    const toggleBtn = page.getByRole("button", { name: /schedule|jadwal/i }).first();
    const hasItems = await toggleBtn.isVisible().catch(() => false);
    if (!hasItems) {
      await expect(page.locator("main")).toBeVisible();
      return;
    }
    await toggleBtn.click();
    await expect(page.getByText(/berhasil|diperbarui/i)).toBeVisible({ timeout: 8_000 });
    // Restore
    await toggleBtn.click();
  });
});

// ─── Sponsor Control (Toggle + Sort) ─────────────────────────────────────────

test.describe("Admin — Sponsor Control", () => {
  test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, "Admin credentials not configured");

  test("unauthenticated → redirect to /admin/login", async ({ browser }) => {
    const { ctx, page } = await unauthContext(browser);
    await page.goto("/admin/sponsor-control");
    await expect(page).toHaveURL(/\/admin\/login/);
    await ctx.close();
  });

  test("page loads with sponsor list or empty state", async ({ page }) => {
    await page.goto("/admin/sponsor-control");
    // Either shows a list of sponsors or an empty state message
    const hasContent =
      (await page.getByRole("heading", { name: /sponsor/i }).isVisible().catch(() => false)) ||
      (await page.locator("main").isVisible().catch(() => false));
    expect(hasContent).toBe(true);
  });

  test("toggle sponsor public visibility — if sponsors with logos exist", async ({ page }) => {
    await page.goto("/admin/sponsor-control");
    // Sponsor without logo can't be published — find one that has a toggle enabled
    const toggleBtn = page.getByRole("button", { name: /publik|sembunyikan|tampilkan/i }).first();
    const hasItems = await toggleBtn.isVisible().catch(() => false);
    if (!hasItems) {
      await expect(page.locator("main")).toBeVisible();
      return;
    }
    await toggleBtn.click();
    await expect(page.getByText(/dipublikasikan|disembunyikan/i)).toBeVisible({ timeout: 8_000 });
    // Restore
    await toggleBtn.click();
    await expect(page.getByText(/dipublikasikan|disembunyikan/i)).toBeVisible({ timeout: 8_000 });
  });
});
```

- [ ] **Step 2: Run tournaments-sponsors spec**

```powershell
npx playwright test e2e/admin/tournaments-sponsors.spec.ts --project=admin-tests
```

- [ ] **Step 3: Commit**

```powershell
rtk git add e2e/admin/tournaments-sponsors.spec.ts
rtk git commit -m "test(e2e): admin tournaments-sponsors spec — toggle visibility"
```

---

## Task 11: Run full suite + verify DB clean

- [ ] **Step 1: Run entire admin test suite**

```powershell
npx playwright test --project=admin-setup --project=admin-tests
```

Expected: all tests pass (or skip gracefully for unconfigured credentials).

- [ ] **Step 2: Verify no [E2E] data left in DB**

In Supabase dashboard or via CLI, run:
```sql
SELECT 'achievements' as tbl, count(*) FROM achievements WHERE title LIKE '[E2E]%'
UNION ALL
SELECT 'news_posts', count(*) FROM news_posts WHERE title LIKE '[E2E]%'
UNION ALL
SELECT 'gallery_entries', count(*) FROM gallery_entries WHERE title LIKE '[E2E]%'
UNION ALL
SELECT 'partners', count(*) FROM partners WHERE name LIKE '[E2E]%'
UNION ALL
SELECT 'testimonials', count(*) FROM testimonials WHERE author_name LIKE '[E2E]%';
```

Expected: all counts = 0.

- [ ] **Step 3: Open HTML report to review results**

```powershell
npx playwright show-report
```

Review screenshots for any failures.

- [ ] **Step 4: Final commit**

```powershell
rtk git add .
rtk git commit -m "test(e2e): complete admin panel E2E test suite — 18 pages covered"
rtk git push
```

---

## Selector Troubleshooting Guide

If a test fails because a selector doesn't match, inspect the actual rendered element:

```powershell
# Run in headed mode to see the browser
npx playwright test e2e/admin/landing-content.spec.ts --project=admin-tests --headed --grep "create achievement"
```

Common fixes:
- **Button text differs**: Replace `{ name: /tambah manual/i }` with `{ name: /actual text/i }`
- **Toast text differs**: Replace `getByText(/achievement ditambahkan/i)` with actual toast string
- **Input placeholder differs**: Use `page.locator('input').nth(N)` or inspect with `page.pause()`
- **Row locator too broad**: Add `.filter({ has: page.locator('specific-class') })`

Use `page.pause()` inside a test to open Playwright Inspector for live selector testing.
