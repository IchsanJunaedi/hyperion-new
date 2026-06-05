import { test, expect } from "@playwright/test";
import { cleanupE2ERows, E2E_PREFIX } from "../../admin/helpers/cleanup";
import { CREDENTIALS } from "../helpers/auth";

test.describe.serial("Dashboard — Finances", () => {
  test.skip(!CREDENTIALS.owner.email, "Owner credentials not configured");

  test.beforeAll(async () => {
    await cleanupE2ERows("finances", "description");
  });
  test.afterAll(async () => {
    await cleanupE2ERows("finances", "description");
  });

  test("unauth → redirect to /dashboard/login", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/dashboard/finances");
    await expect(page).toHaveURL(/\/dashboard\/login/);
  });

  test("page loads with Kas Tim heading", async ({ page }) => {
    await page.goto("/dashboard/finances");
    await expect(page.getByRole("heading", { name: /kas tim/i })).toBeVisible();
  });

  test("open Tambah Transaksi form", async ({ page }) => {
    await page.goto("/dashboard/finances");
    await page.getByRole("button", { name: /^tambah$/i }).click();
    await expect(page.getByText(/tambah transaksi/i)).toBeVisible();
  });

  test("create income transaction", async ({ page }) => {
    await page.goto("/dashboard/finances");
    await page.getByRole("button", { name: /^tambah$/i }).click();
    // Select Pemasukan type
    await page.getByRole("button", { name: /pemasukan/i }).click();
    // Amount field — use placeholder "500000"
    await page.getByPlaceholder("500000").fill("100000");
    // Kategori is a native <select> — select the first non-empty option
    await page.locator("select").first().selectOption({ index: 1 });
    // Description — optional textarea/input
    await page.getByPlaceholder(/catatan singkat/i).fill(`${E2E_PREFIX} E2E Income`);
    await page.getByRole("button", { name: /^simpan$/i }).click();
    await expect(page.getByText(/transaksi berhasil disimpan/i).first()).toBeVisible({ timeout: 8_000 });
  });

  test("income row appears in table", async ({ page }) => {
    await page.goto("/dashboard/finances");
    await expect(page.getByText(`${E2E_PREFIX} E2E Income`).first()).toBeVisible({ timeout: 8_000 });
  });

  test("create expense transaction", async ({ page }) => {
    await page.goto("/dashboard/finances");
    await page.getByRole("button", { name: /^tambah$/i }).click();
    await page.getByRole("button", { name: /pengeluaran/i }).click();
    await page.getByPlaceholder("500000").fill("50000");
    await page.locator("select").first().selectOption({ index: 1 });
    await page.getByPlaceholder(/catatan singkat/i).fill(`${E2E_PREFIX} E2E Expense`);
    await page.getByRole("button", { name: /^simpan$/i }).click();
    await expect(page.getByText(/transaksi berhasil disimpan/i).first()).toBeVisible({ timeout: 8_000 });
  });

  test("delete transaction — direct confirm", async ({ page }) => {
    await page.goto("/dashboard/finances");
    const row = page.locator("div, tr").filter({ hasText: `${E2E_PREFIX} E2E Income` }).last();
    await row.getByRole("button", { name: /hapus|delete/i }).first().click();
    await page.getByRole("button", { name: /^hapus$/i }).last().click();
    await expect(page.getByText(/transaksi dihapus/i).first()).toBeVisible({ timeout: 8_000 });
  });
});
