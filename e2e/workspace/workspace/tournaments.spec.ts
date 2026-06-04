import { test, expect } from "@playwright/test";
import { SLUG, WS_ROLES, storageFor } from "./_roles";

// "Tambah" gated by canManage = captain/manager/owner. All roles can view.
for (const role of WS_ROLES) {
  test.describe(`Workspace — Tournaments (${role})`, () => {
    test.use({ storageState: storageFor(role) });

    test("page loads with Info Turnamen heading", async ({ page }) => {
      await page.goto(`/${SLUG}/tournaments`);
      await expect(page.getByRole("heading", { name: /info turnamen/i })).toBeVisible({ timeout: 8_000 });
    });

    test(`"Tambah" visibility matches role`, async ({ page }) => {
      await page.goto(`/${SLUG}/tournaments`);
      const createLink = page.getByRole("link", { name: /^tambah$/i }).first();
      if (role === "captain") {
        await expect(createLink).toBeVisible();
      } else {
        await expect(createLink).toHaveCount(0);
      }
    });
  });
}
