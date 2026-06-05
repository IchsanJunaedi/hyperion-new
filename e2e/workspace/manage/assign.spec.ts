import { test, expect } from "@playwright/test";
import { CREDENTIALS } from "../helpers/auth";

// Manage assign (ManagerAssignForm) — cascading native selects.
// The seeded [E2E] Org already has a captain, so the 1-captain-max rule
// is exercised here: selecting that org must offer ONLY the Member role.
// Tests are non-destructive — they never submit (avoid mutating roster).
test.describe.serial("Manage — Assign (Tambah Member)", () => {
  test.skip(!CREDENTIALS.manager.email, "Manager credentials not configured");

  test("unauth → redirect to login", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/manage/assign");
    await expect(page).toHaveURL(/\/login/);
  });

  test("page loads with Tambah Member heading", async ({ page }) => {
    await page.goto("/manage/assign");
    await expect(page.getByRole("heading", { name: /tambah member/i })).toBeVisible();
  });

  test("submit button disabled until selections made", async ({ page }) => {
    await page.goto("/manage/assign");
    await expect(page.getByRole("button", { name: /tambah member/i })).toBeDisabled();
  });

  test("cascading selects reveal org then role", async ({ page }) => {
    await page.goto("/manage/assign");
    // Step 1: pick a seeded test user
    await page.locator('select[name="user_id"]').selectOption({ label: "[E2E] Member" });
    // Step 2: org select appears
    const orgSelect = page.locator('select[name="organization_id"]');
    await expect(orgSelect).toBeVisible({ timeout: 5_000 });
    await orgSelect.selectOption({ label: "[E2E] Org" });
    // Step 3: role select appears
    await expect(page.locator('select[name="role"]')).toBeVisible({ timeout: 5_000 });
  });

  test("1-captain-max: org with captain offers only Member role", async ({ page }) => {
    await page.goto("/manage/assign");
    await page.locator('select[name="user_id"]').selectOption({ label: "[E2E] Member" });
    await page.locator('select[name="organization_id"]').selectOption({ label: "[E2E] Org" });
    const roleSelect = page.locator('select[name="role"]');
    await expect(roleSelect).toBeVisible({ timeout: 5_000 });
    // Captain must NOT be an option (org already has one)
    await expect(roleSelect.locator('option[value="captain"]')).toHaveCount(0);
    await expect(roleSelect.locator('option[value="member"]')).toHaveCount(1);
    // The explanatory note is shown
    await expect(page.getByText(/sudah punya captain/i)).toBeVisible();
  });
});
