import { test, expect } from "@playwright/test";
import { SLUG, WS_ROLES, storageFor } from "./_roles";

// Each role sees only their OWN development targets (page queries by user.id).
for (const role of WS_ROLES) {
  test.describe(`Workspace — Development (${role})`, () => {
    test.use({ storageState: storageFor(role) });

    test("page loads with Development Kamu heading", async ({ page }) => {
      await page.goto(`/${SLUG}/development`);
      await expect(page.getByRole("heading", { name: /development kamu/i })).toBeVisible({ timeout: 8_000 });
    });
  });
}
