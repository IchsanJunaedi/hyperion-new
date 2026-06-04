import { test, expect } from "@playwright/test";
import { cleanupE2ERows, E2E_PREFIX } from "../../admin/helpers/cleanup";
import { CREDENTIALS } from "../helpers/auth";

test.describe.serial("Dashboard — Content Calendar", () => {
  test.skip(!CREDENTIALS.owner.email, "Owner credentials not configured");

  test.beforeAll(async () => {
    await cleanupE2ERows("content_calendar", "title");
  });
  test.afterAll(async () => {
    await cleanupE2ERows("content_calendar", "title");
  });

  test("unauth → redirect to /dashboard/login", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/dashboard/content");
    await expect(page).toHaveURL(/\/dashboard\/login/);
  });

  test("page loads", async ({ page }) => {
    await page.goto("/dashboard/content");
    await expect(page.locator("main")).toBeVisible();
  });

  test("open create content modal", async ({ page }) => {
    await page.goto("/dashboard/content");
    await page.getByRole("button", { name: /buat konten/i }).click();
    // Modal heading appears — multiple "Buat Konten" texts, use first (modal heading)
    await expect(page.getByText(/buat konten/i).first()).toBeVisible();
  });

  test("create content post", async ({ page }) => {
    await page.goto("/dashboard/content");
    await page.getByRole("button", { name: /buat konten/i }).click();
    await expect(page.getByText(/buat konten/i).first()).toBeVisible();
    // "Judul" label is not linked to input — use placeholder instead
    await page.getByPlaceholder(/judul konten/i).fill(`${E2E_PREFIX} E2E Content Post`);
    const scheduleDate = new Date();
    scheduleDate.setDate(scheduleDate.getDate() + 7);
    // Use the date-time input for scheduled_at (datetime-local type)
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
    await page.goto("/dashboard/content");
    await expect(page.getByText(`${E2E_PREFIX} E2E Content Post`).first()).toBeVisible({ timeout: 8_000 });
  });

  test("delete content post — direct confirm", async ({ page }) => {
    await page.goto("/dashboard/content");
    // Scope to the row containing the post title AND the delete button (title="Hapus konten")
    const row = page
      .locator("div")
      .filter({ hasText: `${E2E_PREFIX} E2E Content Post`, has: page.getByRole("button", { name: /hapus konten/i }) })
      .last();
    await row.getByRole("button", { name: /hapus konten/i }).click();
    // ConfirmDeleteDialog (direct confirm, no phrase)
    await page.getByRole("button", { name: /^hapus$/i }).last().click();
    await expect(page.getByText(/konten dihapus/i).first()).toBeVisible({ timeout: 8_000 });
  });
});
