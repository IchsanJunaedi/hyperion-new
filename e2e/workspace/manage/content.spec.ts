import { test, expect } from "@playwright/test";
import { cleanupE2ERows, E2E_PREFIX } from "../../admin/helpers/cleanup";
import { CREDENTIALS } from "../helpers/auth";

// Manage content reuses ContentList (canCreate=true) on the manager's org.
test.describe.serial("Manage — Content Calendar", () => {
  test.skip(!CREDENTIALS.manager.email, "Manager credentials not configured");

  test.beforeAll(async () => {
    await cleanupE2ERows("content_calendar", "title");
  });
  test.afterAll(async () => {
    await cleanupE2ERows("content_calendar", "title");
  });

  test("unauth → redirect to login", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/manage/content");
    await expect(page).toHaveURL(/\/login/);
  });

  test("page loads", async ({ page }) => {
    await page.goto("/manage/content");
    await expect(page.locator("main")).toBeVisible();
  });

  test("create content post", async ({ page }) => {
    await page.goto("/manage/content");
    await page.getByRole("button", { name: /buat konten/i }).click();
    await expect(page.getByText(/buat konten/i).first()).toBeVisible();
    await page.getByPlaceholder(/judul konten/i).fill(`${E2E_PREFIX} E2E Content Post`);
    const scheduleDate = new Date();
    scheduleDate.setDate(scheduleDate.getDate() + 7);
    const dateInput = page.locator('input[type="datetime-local"]');
    if (await dateInput.isVisible()) {
      await dateInput.fill(`${scheduleDate.toISOString().split("T")[0]}T10:00`);
    } else {
      await page.locator('input[type="date"]').fill(scheduleDate.toISOString().split("T")[0] ?? "");
    }
    await page.getByRole("button", { name: /simpan draft/i }).click();
    await expect(page.getByText(/konten berhasil dibuat/i).first()).toBeVisible({ timeout: 8_000 });
  });

  test("content post appears in list", async ({ page }) => {
    await page.goto("/manage/content");
    await expect(page.getByText(`${E2E_PREFIX} E2E Content Post`).first()).toBeVisible({ timeout: 8_000 });
  });

  test("delete content post — direct confirm", async ({ page }) => {
    await page.goto("/manage/content");
    const row = page
      .locator("div")
      .filter({ hasText: `${E2E_PREFIX} E2E Content Post`, has: page.getByRole("button", { name: /hapus konten/i }) })
      .last();
    await row.getByRole("button", { name: /hapus konten/i }).click();
    await page.getByRole("button", { name: /^hapus$/i }).last().click();
    await expect(page.getByText(/konten dihapus/i).first()).toBeVisible({ timeout: 8_000 });
  });
});
