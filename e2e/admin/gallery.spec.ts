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

test.describe("Admin — Gallery", () => {
  test.describe.configure({ mode: "serial" });
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

  test("form validation — empty required fields blocked", async ({ page }) => {
    await page.goto("/admin/gallery");
    await page.getByRole("button", { name: /tambah/i }).click();
    const titleInput = page.locator("form").getByRole("textbox").first();
    // Native `required` blocks submit before the JS toast fires — assert invalid state.
    await page.getByRole("button", { name: /^tambah$|^simpan$/i }).last().click();
    const invalid = await titleInput.evaluate(
      (el) => el instanceof HTMLInputElement && !el.validity.valid
    );
    expect(invalid).toBe(true);
  });

  test("create gallery entry", async ({ page }) => {
    await page.goto("/admin/gallery");
    await page.getByRole("button", { name: /tambah/i }).click();

    // Title (first textbox; auto-generates slug). Image upload is optional, so skip it
    // to avoid a hard dependency on Supabase storage in the test environment.
    await page.locator("form").getByRole("textbox").first().fill(`${E2E_PREFIX} E2E Gallery Entry`);
    await page.waitForTimeout(300); // let slug auto-fill
    // Description (required) — the only textarea in the form
    await page.locator("form textarea").fill("E2E test gallery description");

    await page.getByRole("button", { name: /^tambah$|^simpan$/i }).last().click();
    // Form reloads on success — verify the new row instead of the toast.
    await expect(page.getByText(`${E2E_PREFIX} E2E Gallery Entry`)).toBeVisible({ timeout: 12_000 });
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
    const row = rowByText(page, `${E2E_PREFIX} E2E Gallery Entry`);
    await row.locator("button").nth(-2).click();
    const titleInput = page.locator("form").getByRole("textbox").first();
    await titleInput.clear();
    await titleInput.fill(`${E2E_PREFIX} E2E Gallery Entry Updated`);
    await page.getByRole("button", { name: /^simpan$/i }).last().click();
    await expect(page.getByText(`${E2E_PREFIX} E2E Gallery Entry Updated`)).toBeVisible({ timeout: 10_000 });
  });

  test("delete gallery entry", async ({ page }) => {
    await page.goto("/admin/gallery");
    const row = rowByText(page, `${E2E_PREFIX} E2E Gallery Entry Updated`);
    await row.locator("button").last().click();
    await page.getByRole("textbox").last().fill("HAPUS");
    await page.getByRole("button", { name: /^hapus$/i }).last().click();
    await expect(page.getByText(/entry dihapus|berhasil/i)).toBeVisible({ timeout: 8_000 });
  });
});
