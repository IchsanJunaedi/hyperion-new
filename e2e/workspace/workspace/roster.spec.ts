import { test, expect } from "@playwright/test";
import { SLUG, WS_ROLES, storageFor } from "./_roles";

// All members can view the roster.
for (const role of WS_ROLES) {
  test.describe(`Workspace — Roster (${role})`, () => {
    test.use({ storageState: storageFor(role) });

    test("page loads with Roster heading", async ({ page }) => {
      await page.goto(`/${SLUG}/roster`);
      await expect(page.getByRole("heading", { name: /^roster$/i })).toBeVisible({ timeout: 8_000 });
    });

    test("seeded members are listed", async ({ page }) => {
      await page.goto(`/${SLUG}/roster`);
      // The seeded captain ("[E2E] Captain") appears in the roster.
      await expect(page.getByText(/\[E2E\] (Captain|Coach|Member)/).first()).toBeVisible({ timeout: 8_000 });
    });
  });
}
