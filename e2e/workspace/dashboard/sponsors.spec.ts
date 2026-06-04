import { test, expect } from "@playwright/test";
import { cleanupE2ERows, E2E_PREFIX } from "../../admin/helpers/cleanup";
import { CREDENTIALS } from "../helpers/auth";

test.describe.serial("Dashboard — Sponsors", () => {
  test.skip(!CREDENTIALS.owner.email, "Owner credentials not configured");

  test.beforeAll(async () => {
    await cleanupE2ERows("sponsors", "name");
  });
  test.afterAll(async () => {
    await cleanupE2ERows("sponsors", "name");
  });

  test("unauth → redirect to /dashboard/login", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/dashboard/sponsors");
    await expect(page).toHaveURL(/\/dashboard\/login/);
  });

  test("page loads with Sponsor heading", async ({ page }) => {
    await page.goto("/dashboard/sponsors");
    await expect(page.getByRole("heading", { name: /sponsor/i })).toBeVisible();
  });

  test("create sponsor via modal", async ({ page }) => {
    await page.goto("/dashboard/sponsors");
    // Page-level "Tambah Sponsor" button opens the modal
    await page.getByRole("button", { name: /tambah sponsor/i }).first().click();
    await expect(page.getByText(/tambah sponsor/i).first()).toBeVisible();
    // Nama Sponsor input is the first text input in the modal
    await page.locator("input[type='text'], input:not([type])").first().fill(`${E2E_PREFIX} E2E Sponsor`);
    // Modal submit button is "Tambahkan"
    await page.getByRole("button", { name: /tambahkan/i }).click();
    await expect(page.getByText(/sponsor ditambahkan/i).first()).toBeVisible({ timeout: 8_000 });
  });

  test("sponsor appears in list", async ({ page }) => {
    await page.goto("/dashboard/sponsors");
    await expect(page.getByText(`${E2E_PREFIX} E2E Sponsor`).first()).toBeVisible({ timeout: 8_000 });
  });

  test("open sponsor detail and edit name", async ({ page }) => {
    await page.goto("/dashboard/sponsors");
    // Each card has a "Lihat Detail" link — scope to the card containing our sponsor
    const card = page
      .locator("div")
      .filter({ hasText: `${E2E_PREFIX} E2E Sponsor`, has: page.getByRole("link", { name: /lihat detail/i }) })
      .last();
    await card.getByRole("link", { name: /lihat detail/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/sponsors\/[^/]+$/, { timeout: 8_000 });
    // Detail page has Edit button that opens the form modal
    await page.getByRole("button", { name: /edit/i }).first().click();
    const nameInput = page.locator("input[type='text'], input:not([type])").first();
    await nameInput.clear();
    await nameInput.fill(`${E2E_PREFIX} E2E Sponsor Updated`);
    await page.getByRole("button", { name: /simpan/i }).click();
    await expect(page.getByText(/sponsor diperbarui/i).first()).toBeVisible({ timeout: 8_000 });
  });

  test("delete sponsor from detail page", async ({ page }) => {
    await page.goto("/dashboard/sponsors");
    const card = page
      .locator("div")
      .filter({ hasText: `${E2E_PREFIX} E2E Sponsor Updated`, has: page.getByRole("link", { name: /lihat detail/i }) })
      .last();
    await card.getByRole("link", { name: /lihat detail/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/sponsors\/[^/]+$/, { timeout: 8_000 });
    // Detail page Hapus button → ConfirmDeleteDialog (direct confirm)
    await page.getByRole("button", { name: /^hapus$/i }).first().click();
    await page.getByRole("button", { name: /^hapus$/i }).last().click();
    await expect(page.getByText(/sponsor dihapus/i).first()).toBeVisible({ timeout: 8_000 });
  });
});
