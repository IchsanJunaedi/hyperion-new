import { test, expect } from "@playwright/test";

test.describe("Authentication & Route Protection", () => {
  test("Register Form Validation and Error Handling", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByRole("heading", { name: "Daftar" })).toBeVisible();

    // Trigger validation
    await page.click("button[type='submit']");
    await expect(page.locator("text=Minimal 2 karakter")).toBeVisible(); // display name validation

    // Invalid email validation
    await page.fill("input[id='display_name']", "Test User");
    await page.fill("input[id='email']", "invalidemail");
    await page.fill("input[id='password']", "Short1!");
    await page.fill("input[id='phone_wa']", "081234567890");
    await page.click("button[type='submit']");

    await expect(page.locator("text=Format email tidak valid")).toBeVisible();
  });

  test("Registration and Onboarding Gating Redirects", async ({ page }) => {
    const uniqueEmail = `user-${Date.now()}@hyperion.com`;

    await page.goto("/register");
    await page.fill("input[id='display_name']", "Dynamic Tester");
    await page.fill("input[id='email']", uniqueEmail);
    await page.fill("input[id='password']", "StrongPassword123!");
    await page.fill("input[id='phone_wa']", "081234567890");
    await page.click("button[type='submit']");

    // After successful signup, should redirect to /onboarding/profile because username is not set
    await expect(page).toHaveURL(/\/onboarding\/profile/);
  });

  test("Login Gating and Unauthenticated Redirects", async ({ page }) => {
    // Attempting to access protected workspace sub-page
    await page.goto("/evos/scrim");
    // Should redirect to login with a next parameter
    await expect(page).toHaveURL(/\/login\?next=%2Fevos%2Fscrim/);

    // Attempting to access dashboard (protected owner route)
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard\/login/);

    // Attempting to access manage (protected manager route)
    await page.goto("/manage");
    await expect(page).toHaveURL(/\/login\?next=%2Fmanage/);
  });
});
