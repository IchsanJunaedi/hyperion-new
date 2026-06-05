import { test, expect } from "@playwright/test";
import { CREDENTIALS } from "../helpers/auth";

test.describe("Dashboard — Users", () => {
  test.skip(!CREDENTIALS.owner.email, "Owner credentials not configured");

  test("unauth → redirect to /dashboard/login", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/dashboard/users");
    await expect(page).toHaveURL(/\/dashboard\/login/);
  });

  test("page loads", async ({ page }) => {
    await page.goto("/dashboard/users");
    await expect(page.locator("main")).toBeVisible();
  });

  test("seeded [E2E] users appear in list", async ({ page }) => {
    await page.goto("/dashboard/users");
    await expect(page.getByText(/\[E2E\]/i).first()).toBeVisible({ timeout: 8_000 });
  });
});
