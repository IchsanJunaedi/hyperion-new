import { test, expect, Browser } from "@playwright/test";
import { ADMIN_EMAIL, ADMIN_PASSWORD } from "../auth-helper";

async function unauthContext(browser: Browser) {
  const ctx = await browser.newContext({ storageState: { cookies: [], origins: [] } });
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
