import { test, expect } from "@playwright/test";
import { SLUG, WS_ROLES, storageFor } from "./_roles";

// Trials: all members can VIEW (page only redirects non-members). "Buat Trial"
// is gated by canManage = manager/coach/owner — so among the three workspace
// roles only coach manages; captain + member view but cannot create.
for (const role of WS_ROLES) {
  test.describe(`Workspace — Trials (${role})`, () => {
    test.use({ storageState: storageFor(role) });

    test("page loads with Open Trial heading", async ({ page }) => {
      await page.goto(`/${SLUG}/trials`);
      await expect(page.getByRole("heading", { name: /open trial/i })).toBeVisible({ timeout: 8_000 });
    });

    test(`"Buat Trial" visibility matches canManage`, async ({ page }) => {
      await page.goto(`/${SLUG}/trials`);
      const createBtn = page.getByRole("button", { name: /buat trial/i }).first();
      if (role === "coach") {
        await expect(createBtn).toBeVisible();
      } else {
        await expect(createBtn).toHaveCount(0);
      }
    });
  });
}
