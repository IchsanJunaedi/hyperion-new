import { test, expect } from "@playwright/test";
import { CREDENTIALS } from "../helpers/auth";

// Manage reports (ReportView) — read-only monthly summary. Verify it renders
// without a 500 and the month navigation is present.
test.describe("Manage — Reports", () => {
  test.skip(!CREDENTIALS.manager.email, "Manager credentials not configured");

  test("unauth → redirect to login", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/manage/reports");
    await expect(page).toHaveURL(/\/login/);
  });

  test("page loads with Laporan Bulanan heading", async ({ page }) => {
    const res = await page.goto("/manage/reports");
    expect(res?.status()).toBeLessThan(500);
    await expect(page.getByRole("heading", { name: /laporan bulanan/i })).toBeVisible();
  });

  test("month navigation is visible", async ({ page }) => {
    await page.goto("/manage/reports");
    await expect(page.getByRole("link", { name: /^jan$/i })).toBeVisible();
  });
});
