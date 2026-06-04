import { test, expect } from "@playwright/test";
import { CREDENTIALS } from "../helpers/auth";

// Manage divisions is a read-only view for managers (ManagerDivisionList).
// Division creation happens via dashboard / "Tambah Member" — not here.
test.describe("Manage — Divisions (view)", () => {
  test.skip(!CREDENTIALS.manager.email, "Manager credentials not configured");

  test("unauth → redirect to login", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/manage/divisions");
    await expect(page).toHaveURL(/\/login/);
  });

  test("page loads with Edit Divisi heading", async ({ page }) => {
    await page.goto("/manage/divisions");
    await expect(page.getByRole("heading", { name: /edit divisi/i })).toBeVisible();
  });

  test("seeded [E2E] Division is listed", async ({ page }) => {
    await page.goto("/manage/divisions");
    await expect(page.getByText(/\[E2E\] Division/).first()).toBeVisible({ timeout: 8_000 });
  });

  test("division row shows member count", async ({ page }) => {
    await page.goto("/manage/divisions");
    await expect(page.getByText(/member/i).first()).toBeVisible();
  });
});
