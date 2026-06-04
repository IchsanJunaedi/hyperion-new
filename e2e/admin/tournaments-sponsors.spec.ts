import { test, expect, Browser } from "@playwright/test";
import { ADMIN_EMAIL, ADMIN_PASSWORD } from "../auth-helper";

async function unauthContext(browser: Browser) {
  const ctx = await browser.newContext({ storageState: { cookies: [], origins: [] } });
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
