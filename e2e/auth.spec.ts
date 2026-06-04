import { test, expect } from "@playwright/test";
import { loginAsOwner, OWNER_EMAIL, OWNER_PASSWORD } from "./auth-helper";

test.describe("Authentication Flow", () => {
  test("should redirect unauthenticated user to /login from /manage", async ({ page }) => {
    await page.goto("/manage");
    await expect(page).toHaveURL(/\/login/);
  });

  test("should redirect unauthenticated user to /login from /dashboard", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard\/login/);
  });

  test("owner can log in and land on /manage or /onboarding", async ({ page }) => {
    test.skip(!OWNER_EMAIL || !OWNER_PASSWORD, "E2E credentials not configured");
    await loginAsOwner(page);
    // After login the owner is redirected to /manage or /onboarding
    await expect(page).not.toHaveURL(/\/login/);
  });

  test("owner can log out", async ({ page }) => {
    test.skip(!OWNER_EMAIL || !OWNER_PASSWORD, "E2E credentials not configured");
    await loginAsOwner(page);
    // Open settings modal
    await page.getByRole("button", { name: /settings/i }).click();
    // Find and click the logout button inside the settings modal
    const logoutBtn = page.getByRole("button", { name: /logout/i });
    await logoutBtn.click();
    await expect(page).toHaveURL(/\/login|\/$/);
  });
});
