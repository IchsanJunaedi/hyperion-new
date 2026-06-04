import { test, expect, Browser } from "@playwright/test";
import { ADMIN_EMAIL, ADMIN_PASSWORD } from "../auth-helper";

async function unauthContext(browser: Browser) {
  const ctx = await browser.newContext({ storageState: { cookies: [], origins: [] } });
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

  test("page loads with Divisions heading or empty state", async ({ page }) => {
    await page.goto("/admin/divisions");
    // When no workspace divisions exist, the client renders an empty state without the h1.
    const heading = page.getByRole("heading", { name: /divisions/i });
    const empty = page.getByText(/belum ada division/i);
    await expect(heading.or(empty)).toBeVisible();
  });

  test("/divisions public page returns 200", async ({ page }) => {
    const response = await page.goto("/divisions");
    expect(response?.status()).toBe(200);
  });

  test("toggle division public visibility — if divisions exist", async ({ page }) => {
    await page.goto("/admin/divisions");
    // Target the visibility toggle by its specific title (avoid the "Edit info publik" button).
    const toggleBtn = page.getByRole("button", { name: /tampilkan di public|sembunyikan dari public/i }).first();
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
