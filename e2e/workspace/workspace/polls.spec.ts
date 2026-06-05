import { test, expect } from "@playwright/test";
import { SLUG, WS_ROLES, storageFor } from "./_roles";

// "Buat Poll" gated by canManage = captain/coach/manager/owner (member ✗).
// (Coach inclusion was the Plan 1 fix; this guards against regression.)
for (const role of WS_ROLES) {
  test.describe(`Workspace — Polls (${role})`, () => {
    test.use({ storageState: storageFor(role) });

    test("page loads with Polling Tim heading", async ({ page }) => {
      await page.goto(`/${SLUG}/polls`);
      await expect(page.getByRole("heading", { name: /polling tim/i })).toBeVisible({ timeout: 8_000 });
    });

    test(`"Buat Poll" visibility matches canManage`, async ({ page }) => {
      await page.goto(`/${SLUG}/polls`);
      const createBtn = page.getByRole("button", { name: /buat poll/i }).first();
      if (role === "member") {
        await expect(createBtn).toHaveCount(0);
      } else {
        await expect(createBtn).toBeVisible();
      }
    });
  });
}
