import { test, expect } from "@playwright/test";
import { CREDENTIALS } from "../helpers/auth";

test.describe("Dashboard — Files", () => {
  test.skip(!CREDENTIALS.owner.email, "Owner credentials not configured");

  test("unauth → redirect to /dashboard/login", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/dashboard/files");
    await expect(page).toHaveURL(/\/dashboard\/login/);
  });

  test("page loads", async ({ page }) => {
    await page.goto("/dashboard/files");
    await expect(page.locator("main")).toBeVisible();
  });

  test("file management page renders without error", async ({ page }) => {
    const response = await page.goto("/dashboard/files");
    expect(response?.status()).not.toBe(500);
    await expect(page.locator("main")).toBeVisible();
  });
});
