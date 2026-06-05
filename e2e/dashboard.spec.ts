import { test, expect } from "@playwright/test";
import { OWNER_EMAIL, OWNER_PASSWORD } from "./auth-helper";

test.describe("Dashboard", () => {
  // Reuse the owner session captured once by the owner-setup project instead of
  // logging in per test (avoids concurrent-login races under parallel workers).
  test.use({ storageState: "e2e/.auth/owner.json" });
  test.skip(!OWNER_EMAIL || !OWNER_PASSWORD, "E2E credentials not configured");

  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    // Verify that we successfully land on the dashboard and are not redirected
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("dashboard home renders stat cards", async ({ page }) => {
    // Stat cards should be visible
    await expect(page.getByText(/total user/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/total tim/i)).toBeVisible();
  });

  test("sidebar navigation links are visible", async ({ page }) => {
    await expect(page.getByRole("link", { name: /home/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /kas tim/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /file tim/i })).toBeVisible();
  });

  test("can navigate to File Tim page", async ({ page }) => {
    await page.getByRole("link", { name: /file tim/i }).click();
    await page.waitForURL(/\/dashboard\/files/);
    await expect(page.getByRole("heading", { name: /file tim/i })).toBeVisible();
  });
});
