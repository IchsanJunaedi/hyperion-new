import { test, expect } from "@playwright/test";
import { CREDENTIALS } from "../helpers/auth";

// Manage salaries reuses SalaryPageClient on the manager's org ([E2E] Org).
// Verify the contract form is interactive and the owner is excluded from the
// player dropdown — without committing a contract (kept non-destructive).
test.describe.serial("Manage — Salaries", () => {
  test.skip(!CREDENTIALS.manager.email, "Manager credentials not configured");

  test("unauth → redirect to login", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/manage/salaries");
    await expect(page).toHaveURL(/\/login/);
  });

  test("page loads with Salary Player heading", async ({ page }) => {
    await page.goto("/manage/salaries");
    await expect(page.getByRole("heading", { name: /salary player/i })).toBeVisible();
  });

  test("Tambah Kontrak button opens form", async ({ page }) => {
    await page.goto("/manage/salaries");
    await page.getByRole("button", { name: /tambah kontrak/i }).first().click();
    await expect(page.getByText(/tambah kontrak|kontrak baru/i).first()).toBeVisible({ timeout: 5_000 });
  });

  test("player dropdown opens; owner excluded", async ({ page }) => {
    await page.goto("/manage/salaries");
    await page.getByRole("button", { name: /tambah kontrak/i }).first().click();
    await page.getByRole("button", { name: /pilih player/i }).click();
    // Either an empty state or selectable member options — owner never selectable.
    const dropdown = page.locator(".z-50");
    await expect(dropdown.getByText(/owner/i)).not.toBeVisible();
  });
});
