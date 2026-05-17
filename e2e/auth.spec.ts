import { test, expect, type Page } from "@playwright/test";

const OWNER_EMAIL = process.env.E2E_OWNER_EMAIL ?? "";
const OWNER_PASSWORD = process.env.E2E_OWNER_PASSWORD ?? "";

/**
 * Reusable login helper — can be imported into other spec files.
 */
export async function loginAsOwner(page: Page) {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(OWNER_EMAIL);
  await page.getByLabel(/password/i).fill(OWNER_PASSWORD);
  await page.getByRole("button", { name: /masuk|login|sign in/i }).click();
  // Wait for redirect away from /login
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), {
    timeout: 15_000,
  });
}

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
    // Find and click the logout button
    const logoutBtn = page.getByRole("button", { name: /logout|keluar/i });
    await logoutBtn.click();
    await expect(page).toHaveURL(/\/login/);
  });
});
