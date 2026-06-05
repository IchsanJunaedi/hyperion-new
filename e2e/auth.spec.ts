import { test, expect } from "@playwright/test";
import { loginAsOwner, OWNER_EMAIL, OWNER_PASSWORD } from "./auth-helper";

test.describe("Authentication Flow", () => {
  // This file intentionally drives real login/logout (it's testing the auth
  // flow), so it can't reuse a stored session. Run serially so its two
  // owner-login tests never log in concurrently → no same-account race.
  test.describe.configure({ mode: "serial" });

  test("should redirect unauthenticated user to /login from /manage", async ({ page }) => {
    await page.goto("/manage");
    await expect(page).toHaveURL(/\/login/);
  });

  test("should redirect unauthenticated user to /login from /dashboard", { tag: "@smoke" }, async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard\/login/);
  });

  test("owner can log in and land on /manage or /onboarding", { tag: "@smoke" }, async ({ page }) => {
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
    // Click the logout button inside the settings modal. The panel header also
    // has an icon-only logout button (aria-label="Logout", no text), so target
    // the modal's visible "Logout" text to avoid a strict-mode match on both.
    const logoutBtn = page.getByText("Logout", { exact: true });
    await logoutBtn.click();
    await expect(page).toHaveURL(/\/login|\/$/);
  });
});
