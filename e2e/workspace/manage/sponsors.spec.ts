import { test, expect } from "@playwright/test";
import { cleanupE2ERows, E2E_PREFIX } from "../../admin/helpers/cleanup";
import { CREDENTIALS } from "../helpers/auth";

// Manage sponsors reuses SponsorListClient (detailBasePath="/manage/sponsors").
test.describe.serial("Manage — Sponsors", () => {
  test.skip(!CREDENTIALS.manager.email, "Manager credentials not configured");

  test.beforeAll(async () => {
    await cleanupE2ERows("sponsors", "name");
  });
  test.afterAll(async () => {
    await cleanupE2ERows("sponsors", "name");
  });

  test("unauth → redirect to login", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/manage/sponsors");
    await expect(page).toHaveURL(/\/login/);
  });

  test("page loads with Sponsor heading", async ({ page }) => {
    await page.goto("/manage/sponsors");
    await expect(page.getByRole("heading", { name: /sponsor/i })).toBeVisible();
  });

  test("create sponsor via modal", async ({ page }) => {
    await page.goto("/manage/sponsors");
    await page.getByRole("button", { name: /tambah sponsor/i }).first().click();
    await expect(page.getByText(/tambah sponsor/i).first()).toBeVisible();
    await page.locator("input[type='text'], input:not([type])").first().fill(`${E2E_PREFIX} E2E Sponsor`);
    await page.getByRole("button", { name: /tambahkan/i }).click();
    await expect(page.getByText(/sponsor ditambahkan/i).first()).toBeVisible({ timeout: 8_000 });
  });

  test("sponsor appears in list", async ({ page }) => {
    await page.goto("/manage/sponsors");
    await expect(page.getByText(`${E2E_PREFIX} E2E Sponsor`).first()).toBeVisible({ timeout: 8_000 });
  });

  test("open sponsor detail and edit name", async ({ page }) => {
    await page.goto("/manage/sponsors");
    const card = page
      .locator("div")
      .filter({ hasText: `${E2E_PREFIX} E2E Sponsor`, has: page.getByRole("link", { name: /lihat detail/i }) })
      .last();
    await card.getByRole("link", { name: /lihat detail/i }).click();
    await expect(page).toHaveURL(/\/manage\/sponsors\/[^/]+$/, { timeout: 8_000 });
    await page.getByRole("button", { name: /edit/i }).first().click();
    const nameInput = page.locator("input[type='text'], input:not([type])").first();
    await nameInput.clear();
    await nameInput.fill(`${E2E_PREFIX} E2E Sponsor Updated`);
    await page.getByRole("button", { name: /simpan/i }).click();
    await expect(page.getByText(/sponsor diperbarui/i).first()).toBeVisible({ timeout: 8_000 });
  });

  test("delete sponsor from detail page", async ({ page }) => {
    await page.goto("/manage/sponsors");
    const card = page
      .locator("div")
      .filter({ hasText: `${E2E_PREFIX} E2E Sponsor Updated`, has: page.getByRole("link", { name: /lihat detail/i }) })
      .last();
    await card.getByRole("link", { name: /lihat detail/i }).click();
    await expect(page).toHaveURL(/\/manage\/sponsors\/[^/]+$/, { timeout: 8_000 });
    await page.getByRole("button", { name: /^hapus$/i }).first().click();
    await page.getByRole("button", { name: /^hapus$/i }).last().click();
    await expect(page.getByText(/sponsor dihapus/i).first()).toBeVisible({ timeout: 8_000 });
  });
});
