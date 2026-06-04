import { test, expect } from "@playwright/test";
import { SLUG, WS_ROLES, storageFor } from "./_roles";

// "Buat scrim" is gated by canManageScrims = captain/manager/owner.
// Among coach/captain/member, only captain may create scrims.
for (const role of WS_ROLES) {
  test.describe(`Workspace — Scrim list (${role})`, () => {
    test.use({ storageState: storageFor(role) });

    test("page loads with Daftar scrim heading", async ({ page }) => {
      await page.goto(`/${SLUG}/scrim`);
      await expect(page.getByRole("heading", { name: /daftar scrim/i })).toBeVisible({ timeout: 8_000 });
    });

    test(`"Buat scrim" visibility matches role`, async ({ page }) => {
      await page.goto(`/${SLUG}/scrim`);
      const createLink = page.getByRole("link", { name: /buat scrim/i }).first();
      if (role === "captain") {
        await expect(createLink).toBeVisible();
      } else {
        await expect(createLink).toHaveCount(0);
      }
    });
  });
}

// Captain can open the create form.
test.describe("Workspace — Scrim create form (captain)", () => {
  test.use({ storageState: storageFor("captain") });

  test("captain reaches /scrim/new with opponent field", async ({ page }) => {
    await page.goto(`/${SLUG}/scrim/new`);
    await expect(page.locator('input[name="opponent_name"]')).toBeVisible({ timeout: 8_000 });
  });
});
