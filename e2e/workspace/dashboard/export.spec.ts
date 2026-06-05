import { test, expect } from "@playwright/test";
import { CREDENTIALS } from "../helpers/auth";

test.describe("Dashboard — Export", () => {
  test.skip(!CREDENTIALS.owner.email, "Owner credentials not configured");

  test("unauth → redirect to /dashboard/login", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/dashboard/export");
    await expect(page).toHaveURL(/\/dashboard\/login/);
  });

  test("page loads without 500", async ({ page }) => {
    const response = await page.goto("/dashboard/export");
    expect(response?.status()).not.toBe(500);
  });

  test("export page shows download cards", async ({ page }) => {
    await page.goto("/dashboard/export");
    await expect(page.getByRole("heading", { name: /export data tim/i })).toBeVisible();
    await expect(page.getByText(/profil user/i).first()).toBeVisible();
  });
});
