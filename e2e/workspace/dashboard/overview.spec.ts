import { test, expect } from "@playwright/test";
import { CREDENTIALS } from "../helpers/auth";

test.describe("Dashboard — Overview", () => {
  test.skip(!CREDENTIALS.owner.email, "Owner credentials not configured");

  test("unauth → redirect to /dashboard/login", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard\/login/);
  });

  test("page loads with Home heading", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: /^home$/i })).toBeVisible();
  });

  test("main content is visible", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.locator("main")).toBeVisible();
  });
});
