import { test, expect } from "@playwright/test";
import { CREDENTIALS } from "../helpers/auth";

// Manage captains is a read-only view (CaptainList). Captain assignment
// happens via /manage/assign — covered in assign.spec.ts (1-captain-max rule).
test.describe("Manage — Captains (view)", () => {
  test.skip(!CREDENTIALS.manager.email, "Manager credentials not configured");

  test("unauth → redirect to login", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/manage/captains");
    await expect(page).toHaveURL(/\/login/);
  });

  test("page loads with Edit Captain heading", async ({ page }) => {
    await page.goto("/manage/captains");
    await expect(page.getByRole("heading", { name: /edit captain/i })).toBeVisible();
  });

  test("seeded captain is listed in [E2E] Division", async ({ page }) => {
    await page.goto("/manage/captains");
    // The seeded captain (display_name "[E2E] Captain") sits in "[E2E] Division"
    await expect(page.getByText(/\[E2E\] Captain/).first()).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText(/\[E2E\] Division/).first()).toBeVisible();
  });
});
