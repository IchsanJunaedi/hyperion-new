import { test, expect } from "@playwright/test";
import { SLUG, WS_ROLES, storageFor } from "./_roles";

// "Tambah event" gated by canCreate = owner/captain/manager/coach.
// Coach + captain see it; member does not (and sees an explanatory note).
for (const role of WS_ROLES) {
  test.describe(`Workspace — Calendar (${role})`, () => {
    test.use({ storageState: storageFor(role) });

    test("page loads with Kalender Tim heading", async ({ page }) => {
      await page.goto(`/${SLUG}/calendar`);
      await expect(page.getByRole("heading", { name: /kalender tim/i })).toBeVisible({ timeout: 8_000 });
    });

    test(`"Tambah event" visibility matches role`, async ({ page }) => {
      await page.goto(`/${SLUG}/calendar`);
      const createLink = page.getByRole("link", { name: /tambah event/i }).first();
      if (role === "member") {
        await expect(createLink).toHaveCount(0);
        await expect(page.getByText(/hanya captain atau manager/i)).toBeVisible();
      } else {
        await expect(createLink).toBeVisible();
      }
    });
  });
}
