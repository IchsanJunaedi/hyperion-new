import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { E2E_PREFIX } from "../../admin/helpers/cleanup";
import { CREDENTIALS } from "../helpers/auth";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function cleanupTestDivisions() {
  await getAdminClient().from("divisions").delete().like("name", "[E2E] E2E%");
}

test.describe.serial("Dashboard — Divisions", () => {
  test.skip(!CREDENTIALS.owner.email, "Owner credentials not configured");

  test.beforeAll(async () => {
    await cleanupTestDivisions();
  });
  test.afterAll(async () => {
    await cleanupTestDivisions();
  });

  test("unauth → redirect to /dashboard/login", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/dashboard/divisions");
    await expect(page).toHaveURL(/\/dashboard\/login/);
  });

  test("page loads with Divisi heading", async ({ page }) => {
    await page.goto("/dashboard/divisions");
    await expect(page.getByRole("heading", { name: /^divisi$/i })).toBeVisible();
  });

  test("Buat button disabled when input is empty", async ({ page }) => {
    await page.goto("/dashboard/divisions");
    // Buat button is disabled until name is typed
    await expect(page.getByRole("button", { name: /^buat$/i })).toBeDisabled();
  });

  test("create division with [E2E] prefix", async ({ page }) => {
    await page.goto("/dashboard/divisions");
    await page.getByPlaceholder(/nama divisi baru/i).fill(`${E2E_PREFIX} E2E Division`);
    await page.getByRole("button", { name: /^buat$/i }).click();
    // Multiple text elements can match — use first()
    await expect(page.getByText(/divisi.*berhasil dibuat/i).first()).toBeVisible({ timeout: 8_000 });
  });

  test("division appears in list after reload", async ({ page }) => {
    await page.goto("/dashboard/divisions");
    await expect(page.getByText(`${E2E_PREFIX} E2E Division`)).toBeVisible({ timeout: 8_000 });
  });

  test("edit division name inline", async ({ page }) => {
    await page.goto("/dashboard/divisions");
    // Scope to the row that has BOTH the division text and the edit button
    const row = page
      .locator("div")
      .filter({ hasText: `${E2E_PREFIX} E2E Division`, has: page.getByRole("button", { name: /edit nama/i }) })
      .last();
    await row.getByRole("button", { name: /edit nama/i }).click();
    // The edit input auto-focuses on open. Type into the focused element directly
    // (avoids ambiguity with the separate "Nama divisi baru" create input).
    await page.locator("input:focus").waitFor({ timeout: 5_000 });
    await page.keyboard.press("ControlOrMeta+A");
    await page.keyboard.type(`${E2E_PREFIX} E2E Division Updated`);
    await page.keyboard.press("Enter");
    await expect(page.getByText(/divisi diubah/i).first()).toBeVisible({ timeout: 8_000 });
  });

  test("delete division — requires typing HAPUS", async ({ page }) => {
    await page.goto("/dashboard/divisions");
    const row = page
      .locator("div")
      .filter({ hasText: `${E2E_PREFIX} E2E Division Updated`, has: page.getByRole("button", { name: /hapus/i }) })
      .last();
    await row.getByRole("button", { name: /hapus/i }).click();
    // ConfirmDeleteDialog — type HAPUS to enable confirm
    await page.getByRole("textbox").last().fill("HAPUS");
    // The dialog confirm button uniquely has bg-red-500 (row trash buttons don't)
    await page.locator("button.bg-red-500").click();
    await expect(page.getByText(/divisi dihapus/i).first()).toBeVisible({ timeout: 8_000 });
  });

  test("deleted division no longer in list", async ({ page }) => {
    await page.goto("/dashboard/divisions");
    await expect(page.getByText(`${E2E_PREFIX} E2E Division Updated`)).not.toBeVisible();
  });
});
