import { test, expect } from "@playwright/test";
import { CREDENTIALS } from "../helpers/auth";

test.describe("Dashboard — Audit Log", () => {
  test.skip(!CREDENTIALS.owner.email, "Owner credentials not configured");

  test("unauth → redirect to /dashboard/login", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/dashboard/audit");
    await expect(page).toHaveURL(/\/dashboard\/login/);
  });

  test("page loads with Audit heading", async ({ page }) => {
    await page.goto("/dashboard/audit");
    await expect(page.getByRole("heading", { name: /audit/i })).toBeVisible();
  });

  test("audit log renders main content area", async ({ page }) => {
    await page.goto("/dashboard/audit");
    await expect(page.locator("main")).toBeVisible();
  });
});
