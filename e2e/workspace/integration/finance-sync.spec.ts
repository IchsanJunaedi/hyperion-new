import { test, expect } from "@playwright/test";
import { cleanupE2ERows, E2E_PREFIX } from "../../admin/helpers/cleanup";
import { getE2EOrg } from "../workspace/_roles";

// Manage → Dashboard: a finance row the manager creates in [E2E] Org must be
// visible to the owner via the dashboard finance panel's org switcher (?org=).
test.describe.configure({ mode: "serial" });

let orgId = "";

test.beforeAll(async () => {
  orgId = (await getE2EOrg()).orgId;
  await cleanupE2ERows("finances", "description");
});
test.afterAll(async () => {
  await cleanupE2ERows("finances", "description");
});

test.describe("Integration — Finance sync (manager creates)", () => {
  test.use({ storageState: "e2e/.auth/manager.json" });

  test("manager records an expense in [E2E] Org", async ({ page }) => {
    await page.goto("/manage/finances");
    await page.getByRole("button", { name: /^tambah$/i }).click();
    await page.getByRole("button", { name: /pengeluaran/i }).click();
    await page.getByPlaceholder("500000").fill("75000");
    await page.locator("select").first().selectOption({ index: 1 });
    await page.getByPlaceholder(/catatan singkat/i).fill(`${E2E_PREFIX} Sync Expense`);
    await page.getByRole("button", { name: /^simpan$/i }).click();
    await expect(page.getByText(/transaksi berhasil disimpan/i).first()).toBeVisible({ timeout: 8_000 });
  });
});

test.describe("Integration — Finance sync (owner sees)", () => {
  test.use({ storageState: "e2e/.auth/owner.json" });

  test("owner sees the same row in /dashboard/finances?org=[E2E]", async ({ page }) => {
    await page.goto(`/dashboard/finances?org=${orgId}`);
    await expect(page.getByText(`${E2E_PREFIX} Sync Expense`).first()).toBeVisible({ timeout: 8_000 });
  });
});
