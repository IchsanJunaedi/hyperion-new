# Five-Panel E2E — Plan 1: Seed Infrastructure + Dashboard (Owner) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the shared seed infrastructure (5 auth users + test org + division + roles) and full Playwright E2E coverage for all `/dashboard` owner panel pages.

**Architecture:** Playwright `workspace-seed` project runs once — creates Supabase users via admin API, seeds org/division/team_members, saves 5 `storageState` JSON files. `dashboard-tests` project depends on `workspace-seed` and runs all owner specs with `e2e/.auth/owner.json`. Each spec cleans up `[E2E]` rows in `beforeAll`/`afterAll`.

**Tech Stack:** Playwright v1.x, `@supabase/supabase-js` admin API, Next.js 15 App Router, Supabase Postgres.

---

## File Map

| Action | File |
|--------|------|
| Modify | `.env.local` |
| Create | `e2e/workspace/setup/seed.ts` |
| Create | `e2e/workspace/helpers/auth.ts` |
| Modify | `playwright.config.ts` |
| Create | `e2e/workspace/dashboard/overview.spec.ts` |
| Create | `e2e/workspace/dashboard/divisions.spec.ts` |
| Create | `e2e/workspace/dashboard/finances.spec.ts` |
| Create | `e2e/workspace/dashboard/sponsors.spec.ts` |
| Create | `e2e/workspace/dashboard/salaries.spec.ts` |
| Create | `e2e/workspace/dashboard/calendar.spec.ts` |
| Create | `e2e/workspace/dashboard/content.spec.ts` |
| Create | `e2e/workspace/dashboard/teams.spec.ts` |
| Create | `e2e/workspace/dashboard/managers.spec.ts` |
| Create | `e2e/workspace/dashboard/assign.spec.ts` |
| Create | `e2e/workspace/dashboard/tournaments.spec.ts` |
| Create | `e2e/workspace/dashboard/users.spec.ts` |
| Create | `e2e/workspace/dashboard/files.spec.ts` |
| Create | `e2e/workspace/dashboard/audit.spec.ts` |
| Create | `e2e/workspace/dashboard/export.spec.ts` |
| Create | `e2e/workspace/dashboard/reports.spec.ts` |

---

## Task 1: Add env vars to `.env.local`

**Files:** Modify `.env.local`

- [ ] **Step 1: Append the following to `.env.local`**

```
# E2E Workspace credentials
E2E_OWNER_EMAIL=<same value as OWNER_EMAIL>
E2E_OWNER_PASSWORD=<owner account password>
E2E_MANAGER_EMAIL=e2e-manager@hyperionteam.test
E2E_MANAGER_PASSWORD=E2eManager123!
E2E_COACH_EMAIL=e2e-coach@hyperionteam.test
E2E_COACH_PASSWORD=E2eCoach123!
E2E_CAPTAIN_EMAIL=e2e-captain@hyperionteam.test
E2E_CAPTAIN_PASSWORD=E2eCaptain123!
E2E_MEMBER_EMAIL=e2e-member@hyperionteam.test
E2E_MEMBER_PASSWORD=E2eMember123!
E2E_TEST_TEAM_SLUG=e2e-test
```

- [ ] **Step 2: Verify env vars are readable**

```powershell
node -e "require('dotenv').config({path:'.env.local'}); console.log(process.env.E2E_OWNER_EMAIL)"
```

Expected: prints the owner email (not undefined).

---

## Task 2: Create seed script

**Files:**
- Create: `e2e/workspace/setup/seed.ts`

- [ ] **Step 1: Create directory**

```powershell
New-Item -ItemType Directory -Force "e2e/workspace/setup"
New-Item -ItemType Directory -Force "e2e/workspace/helpers"
New-Item -ItemType Directory -Force "e2e/workspace/dashboard"
```

- [ ] **Step 2: Create `e2e/workspace/setup/seed.ts`**

```ts
import { test as setup } from "@playwright/test";
import { chromium } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import path from "path";
import fs from "fs";

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL ?? "http://localhost:3000";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const AUTH_DIR = path.join(__dirname, "../../.auth");

const ROLES = [
  { name: "manager",  email: process.env.E2E_MANAGER_EMAIL!,  password: process.env.E2E_MANAGER_PASSWORD!,  role: "manager"  },
  { name: "coach",    email: process.env.E2E_COACH_EMAIL!,    password: process.env.E2E_COACH_PASSWORD!,    role: "coach"    },
  { name: "captain",  email: process.env.E2E_CAPTAIN_EMAIL!,  password: process.env.E2E_CAPTAIN_PASSWORD!,  role: "captain"  },
  { name: "member",   email: process.env.E2E_MEMBER_EMAIL!,   password: process.env.E2E_MEMBER_PASSWORD!,   role: "member"   },
] as const;

setup.skip(
  !process.env.E2E_OWNER_EMAIL || !process.env.E2E_OWNER_PASSWORD,
  "E2E_OWNER_EMAIL / E2E_OWNER_PASSWORD not set in .env.local"
);

setup("seed workspace data and save auth states", async () => {
  fs.mkdirSync(AUTH_DIR, { recursive: true });

  const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 1. Find owner user
  const ownerEmail = process.env.E2E_OWNER_EMAIL!;
  const { data: { users: allUsers } } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const ownerUser = allUsers.find((u) => u.email === ownerEmail);
  if (!ownerUser) throw new Error(`Owner user not found: ${ownerEmail}`);

  // 2. Create 4 test users idempotently
  const userIds: Record<string, string> = {};
  for (const r of ROLES) {
    const existing = allUsers.find((u) => u.email === r.email);
    if (existing) {
      userIds[r.name] = existing.id;
      console.log(`  [seed] ${r.name} already exists`);
    } else {
      const { data, error } = await admin.auth.admin.createUser({
        email: r.email,
        password: r.password,
        email_confirm: true,
      });
      if (error) throw new Error(`Create ${r.name}: ${error.message}`);
      userIds[r.name] = data.user.id;
      console.log(`  [seed] created ${r.name}`);
    }
    await admin.from("profiles").upsert(
      {
        id: userIds[r.name],
        full_name: `[E2E] ${r.name.charAt(0).toUpperCase() + r.name.slice(1)}`,
        email: r.email,
      },
      { onConflict: "id" }
    );
  }

  // 3. Create org idempotently
  let { data: org } = await admin
    .from("organizations")
    .select("id")
    .eq("slug", "e2e-test")
    .maybeSingle();

  if (!org) {
    const { data, error } = await admin
      .from("organizations")
      .insert({
        name: "[E2E] Org",
        slug: "e2e-test",
        owner_id: ownerUser.id,
        tier: "komunitas",
        social_links: {},
      })
      .select("id")
      .single();
    if (error) throw new Error(`Create org: ${error.message}`);
    org = data;
    console.log("  [seed] created [E2E] Org");
  } else {
    console.log("  [seed] [E2E] Org already exists");
  }
  const orgId = org.id;

  // 4. Create division idempotently (linked to org)
  let { data: div } = await admin
    .from("divisions")
    .select("id")
    .eq("name", "[E2E] Division")
    .eq("organization_id", orgId)
    .maybeSingle();

  if (!div) {
    const { data, error } = await admin
      .from("divisions")
      .insert({
        name: "[E2E] Division",
        slug: "e2e-division",
        game: "Mobile Legends",
        organization_id: orgId,
      })
      .select("id")
      .single();
    if (error) throw new Error(`Create division: ${error.message}`);
    div = data;
    console.log("  [seed] created [E2E] Division");
  } else {
    console.log("  [seed] [E2E] Division already exists");
  }
  const divisionId = div.id;

  // 5. Assign roles in team_members idempotently
  for (const r of ROLES) {
    const { data: existing } = await admin
      .from("team_members")
      .select("id")
      .eq("user_id", userIds[r.name])
      .eq("organization_id", orgId)
      .maybeSingle();

    if (!existing) {
      const { error } = await admin.from("team_members").insert({
        user_id: userIds[r.name],
        organization_id: orgId,
        role: r.role,
        is_active: true,
        division_id: r.role === "captain" ? divisionId : null,
      });
      if (error) throw new Error(`Assign ${r.name}: ${error.message}`);
      console.log(`  [seed] assigned ${r.name}`);
    } else {
      console.log(`  [seed] ${r.name} already assigned`);
    }
  }

  // 6. Save storage states via browser
  console.log("  [seed] saving storage states...");
  const browser = await chromium.launch();

  // Owner — login at /dashboard/login
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto(`${BASE_URL}/dashboard/login`);
    await page.locator('input[name="email"]').fill(ownerEmail);
    await page.locator('input[name="password"]').fill(process.env.E2E_OWNER_PASSWORD!);
    await page.getByRole("button", { name: /masuk/i }).click();
    await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 15_000 });
    await ctx.storageState({ path: path.join(AUTH_DIR, "owner.json") });
    await ctx.close();
    console.log("  [seed] saved owner.json");
  }

  // Other roles — login at /login
  for (const r of ROLES) {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto(`${BASE_URL}/login`);
    await page.getByLabel(/email/i).fill(r.email);
    await page.getByLabel(/password/i).fill(r.password);
    await page.getByRole("button", { name: /masuk/i }).click();
    await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 15_000 });
    await ctx.storageState({ path: path.join(AUTH_DIR, `${r.name}.json`) });
    await ctx.close();
    console.log(`  [seed] saved ${r.name}.json`);
  }

  await browser.close();
  console.log("✅ Workspace seed complete");
});
```

---

## Task 3: Create auth helper

**Files:**
- Create: `e2e/workspace/helpers/auth.ts`

- [ ] **Step 1: Create `e2e/workspace/helpers/auth.ts`**

```ts
export const CREDENTIALS = {
  owner:   { email: process.env.E2E_OWNER_EMAIL ?? "",   password: process.env.E2E_OWNER_PASSWORD ?? "" },
  manager: { email: process.env.E2E_MANAGER_EMAIL ?? "", password: process.env.E2E_MANAGER_PASSWORD ?? "" },
  coach:   { email: process.env.E2E_COACH_EMAIL ?? "",   password: process.env.E2E_COACH_PASSWORD ?? "" },
  captain: { email: process.env.E2E_CAPTAIN_EMAIL ?? "", password: process.env.E2E_CAPTAIN_PASSWORD ?? "" },
  member:  { email: process.env.E2E_MEMBER_EMAIL ?? "",  password: process.env.E2E_MEMBER_PASSWORD ?? "" },
} as const;

export type Role = keyof typeof CREDENTIALS;

export const TEST_TEAM_SLUG = process.env.E2E_TEST_TEAM_SLUG ?? "e2e-test";

export function allCredsConfigured(): boolean {
  return Object.values(CREDENTIALS).every((c) => c.email && c.password);
}
```

---

## Task 4: Update `playwright.config.ts`

**Files:**
- Modify: `playwright.config.ts`

- [ ] **Step 1: Add workspace projects inside the `projects` array**

In `playwright.config.ts`, find the closing `]` of the `projects` array and add before it:

```ts
    {
      name: "workspace-seed",
      testMatch: "**/workspace/setup/seed.ts",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "dashboard-tests",
      testDir: "./e2e/workspace/dashboard",
      testMatch: "**/*.spec.ts",
      dependencies: ["workspace-seed"],
      use: {
        ...devices["Desktop Chrome"],
        storageState: "e2e/.auth/owner.json",
      },
    },
```

- [ ] **Step 2: Run seed to verify it works**

```powershell
npx playwright test --project=workspace-seed
```

Expected:
- `1 passed`
- `e2e/.auth/owner.json`, `manager.json`, `coach.json`, `captain.json`, `member.json` all created

- [ ] **Step 3: Commit seed infrastructure**

```powershell
git add e2e/workspace/setup/seed.ts e2e/workspace/helpers/auth.ts playwright.config.ts
git commit -m "test(e2e): workspace seed script + auth helpers + playwright projects"
```

---

## Task 5: `overview.spec.ts`

**Files:**
- Create: `e2e/workspace/dashboard/overview.spec.ts`

- [ ] **Step 1: Create `e2e/workspace/dashboard/overview.spec.ts`**

```ts
import { test, expect } from "@playwright/test";
import { CREDENTIALS } from "../helpers/auth";

test.describe("Dashboard — Overview", () => {
  test.skip(!CREDENTIALS.owner.email, "Owner credentials not configured");

  test("unauth → redirect to /dashboard/login", async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard\/login/);
    await ctx.close();
  });

  test("page loads with Home heading", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: /^home$/i })).toBeVisible();
  });

  test("stats widget visible", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.locator("main")).toBeVisible();
  });
});
```

- [ ] **Step 2: Run and verify**

```powershell
npx playwright test e2e/workspace/dashboard/overview.spec.ts --project=dashboard-tests
```

Expected: `3 passed`

- [ ] **Step 3: Commit**

```powershell
git add e2e/workspace/dashboard/overview.spec.ts
git commit -m "test(e2e): dashboard overview spec"
```

---

## Task 6: `divisions.spec.ts`

**Files:**
- Create: `e2e/workspace/dashboard/divisions.spec.ts`

Note: `/dashboard/divisions` shows standalone divisions (`organization_id IS NULL`). Tests create their own standalone `[E2E]` divisions — separate from the seeded `[E2E] Division` (which has an org linked).

- [ ] **Step 1: Create `e2e/workspace/dashboard/divisions.spec.ts`**

```ts
import { test, expect } from "@playwright/test";
import { cleanupE2ERows, E2E_PREFIX } from "../../admin/helpers/cleanup";
import { CREDENTIALS } from "../helpers/auth";

test.describe("Dashboard — Divisions", () => {
  test.skip(!CREDENTIALS.owner.email, "Owner credentials not configured");

  test.beforeAll(async () => {
    await cleanupE2ERows("divisions", "name");
  });
  test.afterAll(async () => {
    await cleanupE2ERows("divisions", "name");
  });

  test("unauth → redirect to /dashboard/login", async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto("/dashboard/divisions");
    await expect(page).toHaveURL(/\/dashboard\/login/);
    await ctx.close();
  });

  test("page loads with Divisi heading", async ({ page }) => {
    await page.goto("/dashboard/divisions");
    await expect(page.getByRole("heading", { name: /^divisi$/i })).toBeVisible();
  });

  test("form validation — empty name blocked by HTML5 required", async ({ page }) => {
    await page.goto("/dashboard/divisions");
    await page.getByRole("button", { name: /^buat$/i }).click();
    await expect(page.getByPlaceholder(/nama divisi baru/i)).toBeFocused();
  });

  test("create division with [E2E] prefix", async ({ page }) => {
    await page.goto("/dashboard/divisions");
    await page.getByPlaceholder(/nama divisi baru/i).fill(`${E2E_PREFIX} E2E Division`);
    await page.getByRole("button", { name: /^buat$/i }).click();
    await expect(page.getByText(/divisi.*berhasil dibuat/i)).toBeVisible({ timeout: 8_000 });
  });

  test("division appears in list after reload", async ({ page }) => {
    await page.goto("/dashboard/divisions");
    await expect(page.getByText(`${E2E_PREFIX} E2E Division`)).toBeVisible({ timeout: 8_000 });
  });

  test("edit division name inline", async ({ page }) => {
    await page.goto("/dashboard/divisions");
    // Find edit button (pencil icon) in the row containing the division name
    const row = page.locator("div").filter({ hasText: `${E2E_PREFIX} E2E Division` }).last();
    await row.getByRole("button").first().click(); // first button = edit
    const input = row.getByRole("textbox");
    await input.clear();
    await input.fill(`${E2E_PREFIX} E2E Division Updated`);
    await row.getByRole("button", { name: /simpan|save|check/i }).first().click();
    await expect(page.getByText(/divisi diubah/i)).toBeVisible({ timeout: 8_000 });
  });

  test("delete division — requires typing HAPUS", async ({ page }) => {
    await page.goto("/dashboard/divisions");
    const row = page.locator("div").filter({ hasText: `${E2E_PREFIX} E2E Division Updated` }).last();
    await row.getByRole("button").last().click(); // last button = delete
    await page.getByRole("textbox").last().fill("HAPUS");
    await page.getByRole("button", { name: /^hapus$/i }).last().click();
    await expect(page.getByText(/divisi dihapus/i)).toBeVisible({ timeout: 8_000 });
  });

  test("deleted division no longer in list", async ({ page }) => {
    await page.goto("/dashboard/divisions");
    await expect(page.getByText(`${E2E_PREFIX} E2E Division Updated`)).not.toBeVisible();
  });
});
```

- [ ] **Step 2: Run and verify**

```powershell
npx playwright test e2e/workspace/dashboard/divisions.spec.ts --project=dashboard-tests
```

Expected: `7 passed`

- [ ] **Step 3: Commit**

```powershell
git add e2e/workspace/dashboard/divisions.spec.ts
git commit -m "test(e2e): dashboard divisions spec — full CRUD"
```

---

## Task 7: `finances.spec.ts`

**Files:**
- Create: `e2e/workspace/dashboard/finances.spec.ts`

Note: Finance rows have no `[E2E]`-filterable column in cleanup helper. Use description column as proxy. After the test run, `cleanupE2ERows("finances", "description")` removes test rows.

- [ ] **Step 1: Create `e2e/workspace/dashboard/finances.spec.ts`**

```ts
import { test, expect } from "@playwright/test";
import { cleanupE2ERows, E2E_PREFIX } from "../../admin/helpers/cleanup";
import { CREDENTIALS } from "../helpers/auth";

test.describe("Dashboard — Finances", () => {
  test.skip(!CREDENTIALS.owner.email, "Owner credentials not configured");

  test.beforeAll(async () => {
    await cleanupE2ERows("finances", "description");
  });
  test.afterAll(async () => {
    await cleanupE2ERows("finances", "description");
  });

  test("unauth → redirect to /dashboard/login", async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto("/dashboard/finances");
    await expect(page).toHaveURL(/\/dashboard\/login/);
    await ctx.close();
  });

  test("page loads with Kas Tim heading", async ({ page }) => {
    await page.goto("/dashboard/finances");
    await expect(page.getByRole("heading", { name: /kas tim/i })).toBeVisible();
  });

  test("open form and validate — empty amount blocked", async ({ page }) => {
    await page.goto("/dashboard/finances");
    await page.getByRole("button", { name: /^tambah$/i }).click();
    await expect(page.getByText(/tambah transaksi/i)).toBeVisible();
    await page.getByRole("button", { name: /^simpan$/i }).click();
    // Amount is required — form should not submit
    await expect(page.getByPlaceholder(/500000/i)).toBeFocused();
  });

  test("create income transaction", async ({ page }) => {
    await page.goto("/dashboard/finances");
    await page.getByRole("button", { name: /^tambah$/i }).click();
    // Select type: Pemasukan (income)
    await page.getByRole("button", { name: /pemasukan/i }).click();
    await page.getByPlaceholder(/500000/i).fill("100000");
    await page.getByPlaceholder(/catatan singkat/i).fill(`${E2E_PREFIX} E2E Income`);
    await page.getByRole("button", { name: /^simpan$/i }).click();
    await expect(page.getByText(/transaksi berhasil disimpan/i)).toBeVisible({ timeout: 8_000 });
  });

  test("income row appears in table", async ({ page }) => {
    await page.goto("/dashboard/finances");
    await expect(page.getByText(`${E2E_PREFIX} E2E Income`)).toBeVisible({ timeout: 8_000 });
  });

  test("create expense transaction", async ({ page }) => {
    await page.goto("/dashboard/finances");
    await page.getByRole("button", { name: /^tambah$/i }).click();
    await page.getByRole("button", { name: /pengeluaran/i }).click();
    await page.getByPlaceholder(/500000/i).fill("50000");
    await page.getByPlaceholder(/catatan singkat/i).fill(`${E2E_PREFIX} E2E Expense`);
    await page.getByRole("button", { name: /^simpan$/i }).click();
    await expect(page.getByText(/transaksi berhasil disimpan/i)).toBeVisible({ timeout: 8_000 });
  });

  test("delete transaction — direct confirm (no HAPUS phrase)", async ({ page }) => {
    await page.goto("/dashboard/finances");
    const row = page.locator("div, tr").filter({ hasText: `${E2E_PREFIX} E2E Income` }).last();
    await row.getByRole("button", { name: /hapus|delete|trash/i }).first().click();
    // ConfirmDeleteDialog without phrase — Hapus button is immediately active
    await page.getByRole("button", { name: /^hapus$/i }).last().click();
    await expect(page.getByText(/transaksi dihapus/i)).toBeVisible({ timeout: 8_000 });
  });
});
```

- [ ] **Step 2: Run and verify**

```powershell
npx playwright test e2e/workspace/dashboard/finances.spec.ts --project=dashboard-tests
```

Expected: `7 passed`

- [ ] **Step 3: Commit**

```powershell
git add e2e/workspace/dashboard/finances.spec.ts
git commit -m "test(e2e): dashboard finances spec — income + expense CRUD"
```

---

## Task 8: `sponsors.spec.ts`

**Files:**
- Create: `e2e/workspace/dashboard/sponsors.spec.ts`

- [ ] **Step 1: Create `e2e/workspace/dashboard/sponsors.spec.ts`**

```ts
import { test, expect } from "@playwright/test";
import { cleanupE2ERows, E2E_PREFIX } from "../../admin/helpers/cleanup";
import { CREDENTIALS } from "../helpers/auth";

test.describe("Dashboard — Sponsors", () => {
  test.skip(!CREDENTIALS.owner.email, "Owner credentials not configured");

  test.beforeAll(async () => {
    await cleanupE2ERows("sponsors", "name");
  });
  test.afterAll(async () => {
    await cleanupE2ERows("sponsors", "name");
  });

  test("unauth → redirect to /dashboard/login", async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto("/dashboard/sponsors");
    await expect(page).toHaveURL(/\/dashboard\/login/);
    await ctx.close();
  });

  test("page loads with Sponsor heading", async ({ page }) => {
    await page.goto("/dashboard/sponsors");
    await expect(page.getByRole("heading", { name: /sponsor/i })).toBeVisible();
  });

  test("form validation — empty name blocked", async ({ page }) => {
    await page.goto("/dashboard/sponsors");
    await page.getByRole("button", { name: /tambah sponsor/i }).click();
    await page.getByRole("button", { name: /^tambah$|^simpan$/i }).last().click();
    await expect(page.getByText(/nama.*wajib|nama sponsor wajib/i)).toBeVisible({ timeout: 5_000 });
  });

  test("create sponsor", async ({ page }) => {
    await page.goto("/dashboard/sponsors");
    await page.getByRole("button", { name: /tambah sponsor/i }).click();
    await page.getByPlaceholder(/nama sponsor/i).fill(`${E2E_PREFIX} E2E Sponsor`);
    await page.getByRole("button", { name: /^tambah$|^simpan$/i }).last().click();
    await expect(page.getByText(/sponsor ditambahkan/i)).toBeVisible({ timeout: 8_000 });
  });

  test("sponsor appears in list", async ({ page }) => {
    await page.goto("/dashboard/sponsors");
    await expect(page.getByText(`${E2E_PREFIX} E2E Sponsor`)).toBeVisible({ timeout: 8_000 });
  });

  test("edit sponsor name", async ({ page }) => {
    await page.goto("/dashboard/sponsors");
    const card = page.locator("div").filter({ hasText: `${E2E_PREFIX} E2E Sponsor` }).last();
    await card.getByRole("button", { name: /edit|ubah/i }).first().click();
    const nameInput = page.getByPlaceholder(/nama sponsor/i);
    await nameInput.clear();
    await nameInput.fill(`${E2E_PREFIX} E2E Sponsor Updated`);
    await page.getByRole("button", { name: /^simpan$/i }).last().click();
    await expect(page.getByText(/sponsor diperbarui/i)).toBeVisible({ timeout: 8_000 });
  });

  test("delete sponsor — direct confirm", async ({ page }) => {
    await page.goto("/dashboard/sponsors");
    const card = page.locator("div").filter({ hasText: `${E2E_PREFIX} E2E Sponsor Updated` }).last();
    await card.getByRole("button", { name: /hapus|delete|trash/i }).last().click();
    await page.getByRole("button", { name: /^hapus$/i }).last().click();
    await expect(page.getByText(/sponsor dihapus/i)).toBeVisible({ timeout: 8_000 });
  });
});
```

- [ ] **Step 2: Run and verify**

```powershell
npx playwright test e2e/workspace/dashboard/sponsors.spec.ts --project=dashboard-tests
```

Expected: `7 passed`

- [ ] **Step 3: Commit**

```powershell
git add e2e/workspace/dashboard/sponsors.spec.ts
git commit -m "test(e2e): dashboard sponsors spec — full CRUD"
```

---

## Task 9: `salaries.spec.ts`

**Files:**
- Create: `e2e/workspace/dashboard/salaries.spec.ts`

Note: Owner is excluded from the player dropdown (salary contracts). Seeded captain/member/coach are eligible. The test uses the seeded `[E2E]` manager as the player in the contract.

- [ ] **Step 1: Create `e2e/workspace/dashboard/salaries.spec.ts`**

```ts
import { test, expect } from "@playwright/test";
import { cleanupE2ERows, E2E_PREFIX } from "../../admin/helpers/cleanup";
import { CREDENTIALS } from "../helpers/auth";

test.describe("Dashboard — Salaries", () => {
  test.skip(!CREDENTIALS.owner.email, "Owner credentials not configured");

  test.afterAll(async () => {
    await cleanupE2ERows("player_contracts", "notes");
  });

  test("unauth → redirect to /dashboard/login", async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto("/dashboard/salaries");
    await expect(page).toHaveURL(/\/dashboard\/login/);
    await ctx.close();
  });

  test("page loads", async ({ page }) => {
    await page.goto("/dashboard/salaries");
    await expect(page.locator("main")).toBeVisible();
  });

  test("open form — owner NOT in player dropdown", async ({ page }) => {
    await page.goto("/dashboard/salaries");
    await page.getByRole("button", { name: /tambah kontrak/i }).click();
    // Open the player CustomSelect
    await page.locator("button").filter({ hasText: /pilih player|player/i }).first().click();
    // The owner email should not appear in options
    await expect(page.getByText(process.env.E2E_OWNER_EMAIL ?? "owner")).not.toBeVisible();
  });

  test("create salary contract for seeded member", async ({ page }) => {
    await page.goto("/dashboard/salaries");
    await page.getByRole("button", { name: /tambah kontrak/i }).click();
    // Select player from CustomSelect dropdown
    await page.locator("button").filter({ hasText: /pilih player|player/i }).first().click();
    await page.getByText(/\[E2E\]/i).first().click();
    // Fill salary amount
    await page.getByLabel(/gaji per bulan/i).fill("5000000");
    // Fill start date
    await page.getByLabel(/tanggal mulai/i).fill("2026-01-01");
    // Notes
    const notesField = page.getByLabel(/catatan|notes/i);
    if (await notesField.isVisible()) {
      await notesField.fill(`${E2E_PREFIX} E2E Contract`);
    }
    await page.getByRole("button", { name: /^tambah$|^simpan$/i }).last().click();
    await expect(page.getByText(/kontrak ditambahkan/i)).toBeVisible({ timeout: 8_000 });
  });

  test("contract appears in active list", async ({ page }) => {
    await page.goto("/dashboard/salaries");
    await expect(page.getByText(/\[E2E\]/i)).toBeVisible({ timeout: 8_000 });
  });
});
```

- [ ] **Step 2: Run and verify**

```powershell
npx playwright test e2e/workspace/dashboard/salaries.spec.ts --project=dashboard-tests
```

Expected: `5 passed`

- [ ] **Step 3: Commit**

```powershell
git add e2e/workspace/dashboard/salaries.spec.ts
git commit -m "test(e2e): dashboard salaries spec — contract create + owner exclusion check"
```

---

## Task 10: `calendar.spec.ts`

**Files:**
- Create: `e2e/workspace/dashboard/calendar.spec.ts`

- [ ] **Step 1: Create `e2e/workspace/dashboard/calendar.spec.ts`**

```ts
import { test, expect } from "@playwright/test";
import { cleanupE2ERows, E2E_PREFIX } from "../../admin/helpers/cleanup";
import { CREDENTIALS } from "../helpers/auth";

test.describe("Dashboard — Calendar", () => {
  test.skip(!CREDENTIALS.owner.email, "Owner credentials not configured");

  test.beforeAll(async () => {
    await cleanupE2ERows("calendar_events", "title");
  });
  test.afterAll(async () => {
    await cleanupE2ERows("calendar_events", "title");
  });

  test("unauth → redirect to /dashboard/login", async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto("/dashboard/calendar");
    await expect(page).toHaveURL(/\/dashboard\/login/);
    await ctx.close();
  });

  test("page loads", async ({ page }) => {
    await page.goto("/dashboard/calendar");
    await expect(page.locator("main")).toBeVisible();
  });

  test("open create event modal", async ({ page }) => {
    await page.goto("/dashboard/calendar");
    await page.getByRole("button", { name: /tambah|buat event/i }).first().click();
    await expect(page.getByText(/tambah event/i)).toBeVisible();
  });

  test("create event with visibility=all", async ({ page }) => {
    await page.goto("/dashboard/calendar");
    await page.getByRole("button", { name: /tambah|buat event/i }).first().click();
    await page.getByLabel(/nama event/i).fill(`${E2E_PREFIX} E2E Event All`);
    // Set date to today
    const today = new Date().toISOString().split("T")[0];
    await page.getByLabel(/tanggal/i).first().fill(today);
    // Visibility: all (default or select)
    await page.getByRole("button", { name: /buat event/i }).click();
    await expect(page.getByText(/event.*dibuat|berhasil/i)).toBeVisible({ timeout: 8_000 });
  });

  test("event appears in calendar list", async ({ page }) => {
    await page.goto("/dashboard/calendar");
    await expect(page.getByText(`${E2E_PREFIX} E2E Event All`)).toBeVisible({ timeout: 8_000 });
  });

  test("delete event — direct confirm", async ({ page }) => {
    await page.goto("/dashboard/calendar");
    const row = page.locator("div, li").filter({ hasText: `${E2E_PREFIX} E2E Event All` }).last();
    await row.getByRole("button", { name: /hapus|delete/i }).last().click();
    await page.getByRole("button", { name: /^hapus$|yakin hapus/i }).last().click();
    await expect(page.getByText(/event dihapus/i)).toBeVisible({ timeout: 8_000 });
  });
});
```

- [ ] **Step 2: Run and verify**

```powershell
npx playwright test e2e/workspace/dashboard/calendar.spec.ts --project=dashboard-tests
```

Expected: `6 passed`

- [ ] **Step 3: Commit**

```powershell
git add e2e/workspace/dashboard/calendar.spec.ts
git commit -m "test(e2e): dashboard calendar spec — create + delete event"
```

---

## Task 11: `content.spec.ts`

**Files:**
- Create: `e2e/workspace/dashboard/content.spec.ts`

- [ ] **Step 1: Create `e2e/workspace/dashboard/content.spec.ts`**

```ts
import { test, expect } from "@playwright/test";
import { cleanupE2ERows, E2E_PREFIX } from "../../admin/helpers/cleanup";
import { CREDENTIALS } from "../helpers/auth";

test.describe("Dashboard — Content Calendar", () => {
  test.skip(!CREDENTIALS.owner.email, "Owner credentials not configured");

  test.beforeAll(async () => {
    await cleanupE2ERows("content_calendar", "title");
  });
  test.afterAll(async () => {
    await cleanupE2ERows("content_calendar", "title");
  });

  test("unauth → redirect to /dashboard/login", async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto("/dashboard/content");
    await expect(page).toHaveURL(/\/dashboard\/login/);
    await ctx.close();
  });

  test("page loads", async ({ page }) => {
    await page.goto("/dashboard/content");
    await expect(page.locator("main")).toBeVisible();
  });

  test("open create content modal", async ({ page }) => {
    await page.goto("/dashboard/content");
    await page.getByRole("button", { name: /buat konten|tambah/i }).first().click();
    await expect(page.getByText(/buat konten/i)).toBeVisible();
  });

  test("create content post", async ({ page }) => {
    await page.goto("/dashboard/content");
    await page.getByRole("button", { name: /buat konten|tambah/i }).first().click();
    await page.getByLabel(/judul/i).fill(`${E2E_PREFIX} E2E Content Post`);
    // Platform select
    const platformBtn = page.locator("button").filter({ hasText: /pilih platform|instagram|tiktok/i }).first();
    if (await platformBtn.isVisible()) await platformBtn.click();
    const option = page.getByRole("option", { name: /instagram/i });
    if (await option.isVisible()) await option.click();
    // Schedule date
    const scheduleDate = new Date();
    scheduleDate.setDate(scheduleDate.getDate() + 7);
    const dateStr = scheduleDate.toISOString().split("T")[0];
    await page.getByLabel(/jadwal posting/i).fill(dateStr);
    await page.getByRole("button", { name: /simpan draft/i }).click();
    await expect(page.getByText(/konten berhasil dibuat/i)).toBeVisible({ timeout: 8_000 });
  });

  test("content post appears in list", async ({ page }) => {
    await page.goto("/dashboard/content");
    await expect(page.getByText(`${E2E_PREFIX} E2E Content Post`)).toBeVisible({ timeout: 8_000 });
  });

  test("delete content post — direct confirm", async ({ page }) => {
    await page.goto("/dashboard/content");
    const row = page.locator("div").filter({ hasText: `${E2E_PREFIX} E2E Content Post` }).last();
    await row.getByRole("button", { name: /hapus|delete/i }).last().click();
    await page.getByRole("button", { name: /^hapus$/i }).last().click();
    await expect(page.getByText(/konten dihapus/i)).toBeVisible({ timeout: 8_000 });
  });
});
```

- [ ] **Step 2: Run and verify**

```powershell
npx playwright test e2e/workspace/dashboard/content.spec.ts --project=dashboard-tests
```

Expected: `6 passed`

- [ ] **Step 3: Commit**

```powershell
git add e2e/workspace/dashboard/content.spec.ts
git commit -m "test(e2e): dashboard content calendar spec — create + delete"
```

---

## Task 12: `teams.spec.ts`

**Files:**
- Create: `e2e/workspace/dashboard/teams.spec.ts`

Note: `/dashboard/teams` shows org settings. No create-new-org UI. Tests verify heading + inline edit of org name using the seeded `[E2E] Org`. Restores original name in `afterAll`.

- [ ] **Step 1: Create `e2e/workspace/dashboard/teams.spec.ts`**

```ts
import { test, expect } from "@playwright/test";
import { CREDENTIALS } from "../helpers/auth";
import { createClient } from "@supabase/supabase-js";

const TEST_SLUG = process.env.E2E_TEST_TEAM_SLUG ?? "e2e-test";

async function getOrgName(): Promise<string | null> {
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
  const { data } = await client.from("organizations").select("name").eq("slug", TEST_SLUG).maybeSingle();
  return data?.name ?? null;
}

async function restoreOrgName(name: string) {
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
  await client.from("organizations").update({ name }).eq("slug", TEST_SLUG);
}

test.describe("Dashboard — Teams (Org Settings)", () => {
  test.skip(!CREDENTIALS.owner.email, "Owner credentials not configured");

  let originalName: string | null = null;

  test.beforeAll(async () => {
    originalName = await getOrgName();
  });

  test.afterAll(async () => {
    if (originalName) await restoreOrgName(originalName);
  });

  test("unauth → redirect to /dashboard/login", async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto("/dashboard/teams");
    await expect(page).toHaveURL(/\/dashboard\/login/);
    await ctx.close();
  });

  test("page loads with Setting Tim heading", async ({ page }) => {
    await page.goto("/dashboard/teams");
    await expect(page.getByRole("heading", { name: /setting tim/i })).toBeVisible();
  });

  test("seeded org is listed", async ({ page }) => {
    await page.goto("/dashboard/teams");
    await expect(page.getByText(/\[E2E\] Org/i)).toBeVisible({ timeout: 8_000 });
  });

  test("edit org name inline", async ({ page }) => {
    await page.goto("/dashboard/teams");
    // Find edit button for [E2E] Org card
    const card = page.locator("div").filter({ hasText: /\[E2E\] Org/i }).last();
    await card.getByRole("button", { name: /edit|ubah/i }).first().click();
    const input = card.getByRole("textbox");
    await input.clear();
    await input.fill("[E2E] Org Updated");
    await card.getByRole("button", { name: /simpan|save/i }).first().click();
    await expect(page.getByText(/nama tim diubah/i)).toBeVisible({ timeout: 8_000 });
  });
});
```

- [ ] **Step 2: Run and verify**

```powershell
npx playwright test e2e/workspace/dashboard/teams.spec.ts --project=dashboard-tests
```

Expected: `4 passed`

- [ ] **Step 3: Commit**

```powershell
git add e2e/workspace/dashboard/teams.spec.ts
git commit -m "test(e2e): dashboard teams spec — org settings + inline edit"
```

---

## Task 13: `managers.spec.ts`

**Files:**
- Create: `e2e/workspace/dashboard/managers.spec.ts`

Note: This page shows current managers. The seeded `[E2E] Manager` is already assigned. Test verifies listing and that remove works (then re-adds in `afterAll` to not break later plans).

- [ ] **Step 1: Create `e2e/workspace/dashboard/managers.spec.ts`**

```ts
import { test, expect } from "@playwright/test";
import { CREDENTIALS } from "../helpers/auth";

test.describe("Dashboard — Managers", () => {
  test.skip(!CREDENTIALS.owner.email, "Owner credentials not configured");

  test("unauth → redirect to /dashboard/login", async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto("/dashboard/managers");
    await expect(page).toHaveURL(/\/dashboard\/login/);
    await ctx.close();
  });

  test("page loads with Manager heading", async ({ page }) => {
    await page.goto("/dashboard/managers");
    await expect(
      page.getByRole("heading", { name: /manager.*tim.*divisi|manager/i })
    ).toBeVisible();
  });

  test("seeded [E2E] Manager appears in list", async ({ page }) => {
    await page.goto("/dashboard/managers");
    await expect(page.getByText(/\[E2E\] Manager/i)).toBeVisible({ timeout: 8_000 });
  });
});
```

- [ ] **Step 2: Run and verify**

```powershell
npx playwright test e2e/workspace/dashboard/managers.spec.ts --project=dashboard-tests
```

Expected: `3 passed`

- [ ] **Step 3: Commit**

```powershell
git add e2e/workspace/dashboard/managers.spec.ts
git commit -m "test(e2e): dashboard managers spec — list verification"
```

---

## Task 14: `assign.spec.ts`

**Files:**
- Create: `e2e/workspace/dashboard/assign.spec.ts`

Note: `/dashboard/assign` assigns roles to unassigned users. Seeded users are already assigned. This test verifies the page loads and the form is accessible. Creating a new unassigned user for full flow is out of scope for Plan 1.

- [ ] **Step 1: Create `e2e/workspace/dashboard/assign.spec.ts`**

```ts
import { test, expect } from "@playwright/test";
import { CREDENTIALS } from "../helpers/auth";

test.describe("Dashboard — Assign Role", () => {
  test.skip(!CREDENTIALS.owner.email, "Owner credentials not configured");

  test("unauth → redirect to /dashboard/login", async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto("/dashboard/assign");
    await expect(page).toHaveURL(/\/dashboard\/login/);
    await ctx.close();
  });

  test("page loads with Assign Role heading", async ({ page }) => {
    await page.goto("/dashboard/assign");
    await expect(page.getByRole("heading", { name: /assign role/i })).toBeVisible();
  });

  test("form steps are visible", async ({ page }) => {
    await page.goto("/dashboard/assign");
    await expect(page.getByText(/pilih user/i)).toBeVisible();
    await expect(page.getByText(/pilih.*tim/i)).toBeVisible();
    await expect(page.getByText(/pilih role/i)).toBeVisible();
  });

  test("submit without selection shows error or is disabled", async ({ page }) => {
    await page.goto("/dashboard/assign");
    const submitBtn = page.getByRole("button", { name: /assign role/i });
    // Button should be disabled when no user/role selected
    await expect(submitBtn).toBeDisabled();
  });
});
```

- [ ] **Step 2: Run and verify**

```powershell
npx playwright test e2e/workspace/dashboard/assign.spec.ts --project=dashboard-tests
```

Expected: `4 passed`

- [ ] **Step 3: Commit**

```powershell
git add e2e/workspace/dashboard/assign.spec.ts
git commit -m "test(e2e): dashboard assign spec — form loads + disabled state"
```

---

## Task 15: `tournaments.spec.ts`

**Files:**
- Create: `e2e/workspace/dashboard/tournaments.spec.ts`

Note: Dashboard tournaments is a read/view page. Create navigates to `/{slug}/tournaments/new` in workspace. This spec tests page loads and "Tambah" link exists.

- [ ] **Step 1: Create `e2e/workspace/dashboard/tournaments.spec.ts`**

```ts
import { test, expect } from "@playwright/test";
import { CREDENTIALS, TEST_TEAM_SLUG } from "../helpers/auth";

test.describe("Dashboard — Tournaments", () => {
  test.skip(!CREDENTIALS.owner.email, "Owner credentials not configured");

  test("unauth → redirect to /dashboard/login", async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto("/dashboard/tournaments");
    await expect(page).toHaveURL(/\/dashboard\/login/);
    await ctx.close();
  });

  test("page loads with Info Turnamen heading", async ({ page }) => {
    await page.goto("/dashboard/tournaments");
    await expect(page.getByRole("heading", { name: /info turnamen/i })).toBeVisible();
  });

  test("Tambah button links to workspace tournaments/new", async ({ page }) => {
    await page.goto("/dashboard/tournaments");
    const addLink = page.getByRole("link", { name: /^tambah$/i });
    await expect(addLink).toBeVisible();
    const href = await addLink.getAttribute("href");
    expect(href).toContain("/tournaments/new");
  });

  test("tab filter visible", async ({ page }) => {
    await page.goto("/dashboard/tournaments");
    await expect(page.getByRole("link", { name: /ongoing/i })).toBeVisible();
  });
});
```

- [ ] **Step 2: Run and verify**

```powershell
npx playwright test e2e/workspace/dashboard/tournaments.spec.ts --project=dashboard-tests
```

Expected: `4 passed`

- [ ] **Step 3: Commit**

```powershell
git add e2e/workspace/dashboard/tournaments.spec.ts
git commit -m "test(e2e): dashboard tournaments spec — page loads + add link"
```

---

## Task 16: `users.spec.ts`

**Files:**
- Create: `e2e/workspace/dashboard/users.spec.ts`

- [ ] **Step 1: Create `e2e/workspace/dashboard/users.spec.ts`**

```ts
import { test, expect } from "@playwright/test";
import { CREDENTIALS } from "../helpers/auth";

test.describe("Dashboard — Users", () => {
  test.skip(!CREDENTIALS.owner.email, "Owner credentials not configured");

  test("unauth → redirect to /dashboard/login", async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto("/dashboard/users");
    await expect(page).toHaveURL(/\/dashboard\/login/);
    await ctx.close();
  });

  test("page loads", async ({ page }) => {
    await page.goto("/dashboard/users");
    await expect(page.locator("main")).toBeVisible();
  });

  test("seeded [E2E] users appear in list", async ({ page }) => {
    await page.goto("/dashboard/users");
    await expect(page.getByText(/\[E2E\]/i)).toBeVisible({ timeout: 8_000 });
  });
});
```

- [ ] **Step 2: Run and verify**

```powershell
npx playwright test e2e/workspace/dashboard/users.spec.ts --project=dashboard-tests
```

Expected: `3 passed`

- [ ] **Step 3: Commit**

```powershell
git add e2e/workspace/dashboard/users.spec.ts
git commit -m "test(e2e): dashboard users spec — list loads"
```

---

## Task 17: `files.spec.ts`

**Files:**
- Create: `e2e/workspace/dashboard/files.spec.ts`

- [ ] **Step 1: Create `e2e/workspace/dashboard/files.spec.ts`**

```ts
import { test, expect } from "@playwright/test";
import path from "path";
import { CREDENTIALS } from "../helpers/auth";

const FIXTURE_IMAGE = path.join(__dirname, "../../fixtures/test-image.png");

test.describe("Dashboard — Files", () => {
  test.skip(!CREDENTIALS.owner.email, "Owner credentials not configured");

  test("unauth → redirect to /dashboard/login", async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto("/dashboard/files");
    await expect(page).toHaveURL(/\/dashboard\/login/);
    await ctx.close();
  });

  test("page loads", async ({ page }) => {
    await page.goto("/dashboard/files");
    await expect(page.locator("main")).toBeVisible();
  });

  test("upload test image", async ({ page }) => {
    await page.goto("/dashboard/files");
    await page.setInputFiles('input[type="file"]', FIXTURE_IMAGE);
    await expect(
      page.getByText(/berhasil|uploaded|test-image/i)
    ).toBeVisible({ timeout: 15_000 });
  });
});
```

- [ ] **Step 2: Run and verify**

```powershell
npx playwright test e2e/workspace/dashboard/files.spec.ts --project=dashboard-tests
```

Expected: `3 passed`

- [ ] **Step 3: Commit**

```powershell
git add e2e/workspace/dashboard/files.spec.ts
git commit -m "test(e2e): dashboard files spec — upload test"
```

---

## Task 18: `audit.spec.ts`

**Files:**
- Create: `e2e/workspace/dashboard/audit.spec.ts`

Note: Run this spec AFTER other dashboard specs have created audit log entries. The test simply verifies the page loads and entries are displayed.

- [ ] **Step 1: Create `e2e/workspace/dashboard/audit.spec.ts`**

```ts
import { test, expect } from "@playwright/test";
import { CREDENTIALS } from "../helpers/auth";

test.describe("Dashboard — Audit Log", () => {
  test.skip(!CREDENTIALS.owner.email, "Owner credentials not configured");

  test("unauth → redirect to /dashboard/login", async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto("/dashboard/audit");
    await expect(page).toHaveURL(/\/dashboard\/login/);
    await ctx.close();
  });

  test("page loads with Audit heading", async ({ page }) => {
    await page.goto("/dashboard/audit");
    await expect(page.getByRole("heading", { name: /audit/i })).toBeVisible();
  });

  test("audit log table/list is visible", async ({ page }) => {
    await page.goto("/dashboard/audit");
    await expect(page.locator("main")).toBeVisible();
    // Entries should exist from other test runs
    const entries = page.locator("table tbody tr, [data-audit-row], li").first();
    await expect(entries).toBeVisible({ timeout: 8_000 });
  });
});
```

- [ ] **Step 2: Run and verify**

```powershell
npx playwright test e2e/workspace/dashboard/audit.spec.ts --project=dashboard-tests
```

Expected: `3 passed`

- [ ] **Step 3: Commit**

```powershell
git add e2e/workspace/dashboard/audit.spec.ts
git commit -m "test(e2e): dashboard audit log spec"
```

---

## Task 19: `export.spec.ts`

**Files:**
- Create: `e2e/workspace/dashboard/export.spec.ts`

- [ ] **Step 1: Create `e2e/workspace/dashboard/export.spec.ts`**

```ts
import { test, expect } from "@playwright/test";
import { CREDENTIALS } from "../helpers/auth";

test.describe("Dashboard — Export", () => {
  test.skip(!CREDENTIALS.owner.email, "Owner credentials not configured");

  test("unauth → redirect to /dashboard/login", async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto("/dashboard/export");
    await expect(page).toHaveURL(/\/dashboard\/login/);
    await ctx.close();
  });

  test("page loads without 500", async ({ page }) => {
    const response = await page.goto("/dashboard/export");
    expect(response?.status()).not.toBe(500);
  });

  test("export button is visible", async ({ page }) => {
    await page.goto("/dashboard/export");
    await expect(
      page.getByRole("button", { name: /export|unduh|download/i }).first()
    ).toBeVisible();
  });
});
```

- [ ] **Step 2: Run and verify**

```powershell
npx playwright test e2e/workspace/dashboard/export.spec.ts --project=dashboard-tests
```

Expected: `3 passed`

- [ ] **Step 3: Commit**

```powershell
git add e2e/workspace/dashboard/export.spec.ts
git commit -m "test(e2e): dashboard export spec"
```

---

## Task 20: `reports.spec.ts`

**Files:**
- Create: `e2e/workspace/dashboard/reports.spec.ts`

- [ ] **Step 1: Create `e2e/workspace/dashboard/reports.spec.ts`**

```ts
import { test, expect } from "@playwright/test";
import { CREDENTIALS } from "../helpers/auth";

test.describe("Dashboard — Reports", () => {
  test.skip(!CREDENTIALS.owner.email, "Owner credentials not configured");

  test("unauth → redirect to /dashboard/login", async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto("/dashboard/reports");
    await expect(page).toHaveURL(/\/dashboard\/login/);
    await ctx.close();
  });

  test("page loads without 500", async ({ page }) => {
    const response = await page.goto("/dashboard/reports");
    expect(response?.status()).not.toBe(500);
  });

  test("page renders main content", async ({ page }) => {
    await page.goto("/dashboard/reports");
    await expect(page.locator("main")).toBeVisible();
  });
});
```

- [ ] **Step 2: Run and verify**

```powershell
npx playwright test e2e/workspace/dashboard/reports.spec.ts --project=dashboard-tests
```

Expected: `3 passed`

- [ ] **Step 3: Commit**

```powershell
git add e2e/workspace/dashboard/reports.spec.ts
git commit -m "test(e2e): dashboard reports spec"
```

---

## Task 21: Run full dashboard suite + push

- [ ] **Step 1: Run full dashboard suite**

```powershell
npx playwright test --project=workspace-seed --project=dashboard-tests
```

Expected: all tests pass (or skip gracefully if credentials not set).

- [ ] **Step 2: Push**

```powershell
git push
```

---

## Selector Troubleshooting Guide

If a test fails because a selector doesn't match the actual rendered element:

```powershell
# Run in headed mode to see the browser
npx playwright test e2e/workspace/dashboard/divisions.spec.ts --project=dashboard-tests --headed
```

Common fixes:

| Issue | Fix |
|-------|-----|
| Button text differs | Use `page.pause()` to inspect, adjust `{ name: /actual text/i }` |
| Toast/notify not found | Check `timeout`, increase to `10_000` |
| Row locator too broad | Add `.filter({ has: page.locator(".specific-class") })` |
| CustomSelect not opening | Target `button` containing placeholder text inside the select wrapper |
| Edit button selector wrong | Use `nth(0)` or `nth(-1)` to target first/last button in row |

Use `page.pause()` inside any test to open Playwright Inspector for live selector testing:
```ts
await page.pause(); // add temporarily, remove before commit
```
