import { test, expect } from "@playwright/test";
import { cleanupE2ERows, E2E_PREFIX } from "../../admin/helpers/cleanup";
import { CREDENTIALS } from "../helpers/auth";

// Manage finances reuses FinancePageClient and operates on the manager's org
// ([E2E] Org) — safe for full CRUD.
test.describe.serial("Manage — Finances", () => {
  test.skip(!CREDENTIALS.manager.email, "Manager credentials not configured");

  test.beforeAll(async () => {
    await cleanupE2ERows("finances", "description");
  });
  test.afterAll(async () => {
    await cleanupE2ERows("finances", "description");
  });

  test("unauth → redirect to login", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/manage/finances");
    await expect(page).toHaveURL(/\/login/);
  });

  test("page loads with Kas Tim heading", async ({ page }) => {
    await page.goto("/manage/finances");
    await expect(page.getByRole("heading", { name: /kas tim/i })).toBeVisible();
  });

  test("create income transaction", async ({ page }) => {
    await page.goto("/manage/finances");
    await page.getByRole("button", { name: /^tambah$/i }).click();
    await page.getByRole("button", { name: /pemasukan/i }).click();
    await page.getByPlaceholder("500000").fill("100000");
    await page.locator("select").first().selectOption({ index: 1 });
    await page.getByPlaceholder(/catatan singkat/i).fill(`${E2E_PREFIX} E2E Income`);
    await page.getByRole("button", { name: /^simpan$/i }).click();
    await expect(page.getByText(/transaksi berhasil disimpan/i).first()).toBeVisible({ timeout: 8_000 });
  });

  test("income row appears in table", async ({ page }) => {
    await page.goto("/manage/finances");
    await expect(page.getByText(`${E2E_PREFIX} E2E Income`).first()).toBeVisible({ timeout: 8_000 });
  });

  test("create expense transaction", async ({ page }) => {
    await page.goto("/manage/finances");
    await page.getByRole("button", { name: /^tambah$/i }).click();
    await page.getByRole("button", { name: /pengeluaran/i }).click();
    await page.getByPlaceholder("500000").fill("50000");
    await page.locator("select").first().selectOption({ index: 1 });
    await page.getByPlaceholder(/catatan singkat/i).fill(`${E2E_PREFIX} E2E Expense`);
    await page.getByRole("button", { name: /^simpan$/i }).click();
    await expect(page.getByText(/transaksi berhasil disimpan/i).first()).toBeVisible({ timeout: 8_000 });
  });

  test("delete transaction — direct confirm", async ({ page }) => {
    await page.goto("/manage/finances");
    const row = page.locator("div, tr").filter({ hasText: `${E2E_PREFIX} E2E Income` }).last();
    await row.getByRole("button", { name: /hapus|delete/i }).first().click();
    await page.getByRole("button", { name: /^hapus$/i }).last().click();
    await expect(page.getByText(/transaksi dihapus/i).first()).toBeVisible({ timeout: 8_000 });
  });
});
