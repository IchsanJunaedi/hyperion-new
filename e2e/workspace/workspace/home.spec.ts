import { test, expect } from "@playwright/test";
import { SLUG, WS_ROLES, storageFor } from "./_roles";

// All three roles are members → they see the workspace home (not the public
// profile). The workspace sidebar (member-only) exposes nav links.
for (const role of WS_ROLES) {
  test.describe(`Workspace — Home (${role})`, () => {
    test.use({ storageState: storageFor(role) });

    test("loads workspace home for member", { tag: "@smoke" }, async ({ page }) => {
      await page.goto(`/${SLUG}`);
      // Org name appears in the workspace sidebar/topbar
      await expect(page.getByText(/\[E2E\] Org/).first()).toBeVisible({ timeout: 8_000 });
    });

    test("member-only sidebar nav is present", async ({ page }) => {
      await page.goto(`/${SLUG}`);
      await expect(page.getByRole("link", { name: /roster/i }).first()).toBeVisible({ timeout: 8_000 });
    });
  });
}
