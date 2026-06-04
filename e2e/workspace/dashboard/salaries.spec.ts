import { test, expect } from "@playwright/test";
import { CREDENTIALS } from "../helpers/auth";

test.describe.serial("Dashboard — Salaries", () => {
  test.skip(!CREDENTIALS.owner.email, "Owner credentials not configured");

  test("unauth → redirect to /dashboard/login", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/dashboard/salaries");
    await expect(page).toHaveURL(/\/dashboard\/login/);
  });

  test("page loads", async ({ page }) => {
    await page.goto("/dashboard/salaries");
    await expect(page.locator("main")).toBeVisible();
  });

  test("Tambah Kontrak button opens form", async ({ page }) => {
    await page.goto("/dashboard/salaries");
    await page.getByRole("button", { name: /tambah kontrak/i }).click();
    await expect(page.getByText(/tambah kontrak|kontrak baru/i).first()).toBeVisible({ timeout: 5_000 });
  });

  test("contract form — player dropdown populates with eligible members", async ({ page }) => {
    // Note: dashboard salary page operates on the owner's primary org, so we verify
    // the form is interactive (dropdown opens with options) without committing a
    // real contract — avoids polluting real member data.
    await page.goto("/dashboard/salaries");
    await page.getByRole("button", { name: /tambah kontrak/i }).first().click();
    await expect(page.getByText(/tambah kontrak player/i).first()).toBeVisible();
    // Open the player dropdown
    await page.getByRole("button", { name: /pilih player/i }).click();
    // Dropdown shows eligible members OR an empty-state message — either is valid
    const hasOptions = await page
      .getByText(/tidak ada member tersedia/i)
      .isVisible()
      .catch(() => false);
    if (!hasOptions) {
      // At least one selectable member option button is present
      await expect(page.locator(".z-50 button").first()).toBeVisible({ timeout: 5_000 });
    }
  });

  test("owner is excluded from player dropdown", async ({ page }) => {
    await page.goto("/dashboard/salaries");
    await page.getByRole("button", { name: /tambah kontrak/i }).first().click();
    await page.getByRole("button", { name: /pilih player/i }).click();
    // Owner must never be a selectable option. Scope to the dropdown (.z-50) — the
    // owner email also appears in the sidebar footer, so a page-wide check is wrong.
    const dropdown = page.locator(".z-50");
    await expect(dropdown.getByText(/owner/i)).not.toBeVisible();
  });
});
