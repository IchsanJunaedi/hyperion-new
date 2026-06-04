import { test, expect } from "@playwright/test";
import { CREDENTIALS } from "../helpers/auth";

test.describe("Dashboard — Reports", () => {
  test.skip(!CREDENTIALS.owner.email, "Owner credentials not configured");

  test("unauth → redirect to /dashboard/login", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/dashboard/reports");
    await expect(page).toHaveURL(/\/dashboard\/login/);
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
