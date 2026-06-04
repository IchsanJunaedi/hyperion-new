import { test, expect, Browser, Page } from "@playwright/test";
import { cleanupE2ERows, E2E_PREFIX } from "./helpers/cleanup";
import { ADMIN_EMAIL, ADMIN_PASSWORD } from "../auth-helper";

async function unauthContext(browser: Browser) {
  const ctx = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const page = await ctx.newPage();
  return { ctx, page };
}

// Resolve a list-row by its visible title text: the nearest ancestor <div> that
// also contains the row's action buttons.
function rowByText(page: Page, text: string) {
  return page.getByText(text, { exact: true }).locator("xpath=ancestor::div[.//button][1]");
}

// ─── News (CMS) ───────────────────────────────────────────────────────────────

test.describe("Admin — News", () => {
  test.describe.configure({ mode: "serial" });
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

  test("form validation — empty title blocked by required field", async ({ page }) => {
    await page.goto("/admin/news");
    await page.getByRole("button", { name: /buat artikel/i }).click();
    const titleInput = page.getByPlaceholder(/juara 1 di mpl/i);
    // Native `required` blocks submit before the JS toast fires — assert invalid state.
    await page.getByRole("button", { name: /^buat artikel$/i }).last().click();
    const invalid = await titleInput.evaluate(
      (el) => el instanceof HTMLInputElement && !el.validity.valid
    );
    expect(invalid).toBe(true);
  });

  test("create news post as draft", async ({ page }) => {
    await page.goto("/admin/news");
    await page.getByRole("button", { name: /buat artikel/i }).click();
    await page.getByPlaceholder(/juara 1 di mpl/i).fill(`${E2E_PREFIX} E2E Test Article`);
    // Slug is auto-generated from title — wait for it
    await page.waitForTimeout(300);
    // Status: Draft (default)
    await page.getByRole("button", { name: /^buat artikel$/i }).last().click();
    // Form reloads on success — verify the new row instead of the toast.
    await expect(page.getByText(`${E2E_PREFIX} E2E Test Article`)).toBeVisible({ timeout: 10_000 });
  });

  test("draft article appears in admin list with Draft badge", async ({ page }) => {
    await page.goto("/admin/news");
    await expect(page.getByText(`${E2E_PREFIX} E2E Test Article`)).toBeVisible({ timeout: 8_000 });
    // Draft badge
    const row = rowByText(page, `${E2E_PREFIX} E2E Test Article`);
    await expect(row.getByText(/draft/i)).toBeVisible();
  });

  test("draft article does NOT appear on public /news page", async ({ page }) => {
    await page.goto("/news");
    await expect(page.getByText(`${E2E_PREFIX} E2E Test Article`)).not.toBeVisible();
  });

  test("publish article via toggle button", async ({ page }) => {
    await page.goto("/admin/news");
    const row = rowByText(page, `${E2E_PREFIX} E2E Test Article`);
    await row.getByRole("button", { name: /^publish$/i }).click();
    await expect(page.getByText(/dipublikasikan/i)).toBeVisible({ timeout: 8_000 });
  });

  test("published article appears on public /news page", async ({ page }) => {
    // /news is server-rendered, so re-navigate until the freshly-published row shows up.
    await expect(async () => {
      await page.goto("/news");
      await expect(page.getByText(`${E2E_PREFIX} E2E Test Article`)).toBeVisible({ timeout: 3_000 });
    }).toPass({ timeout: 15_000 });
  });

  test("edit article title", async ({ page }) => {
    await page.goto("/admin/news");
    const row = rowByText(page, `${E2E_PREFIX} E2E Test Article`);
    await row.locator("button").nth(-2).click(); // Pencil icon
    const titleInput = page.getByPlaceholder(/juara 1 di mpl/i);
    await titleInput.clear();
    await titleInput.fill(`${E2E_PREFIX} E2E Test Article Updated`);
    await page.getByRole("button", { name: /^simpan$/i }).last().click();
    await expect(page.getByText(`${E2E_PREFIX} E2E Test Article Updated`)).toBeVisible({ timeout: 10_000 });
  });

  test("updated title on /news public page", async ({ page }) => {
    await expect(async () => {
      await page.goto("/news");
      await expect(page.getByText(`${E2E_PREFIX} E2E Test Article Updated`)).toBeVisible({ timeout: 3_000 });
    }).toPass({ timeout: 15_000 });
  });

  test("delete article", async ({ page }) => {
    await page.goto("/admin/news");
    const row = rowByText(page, `${E2E_PREFIX} E2E Test Article Updated`);
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
