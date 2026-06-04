import { test, expect } from "@playwright/test";
import { SLUG, WS_ROLES, storageFor } from "./_roles";

// All roles can view the MLBB meta tracker; assert no 5xx and content renders.
for (const role of WS_ROLES) {
  test.describe(`Workspace — Meta (${role})`, () => {
    test.use({ storageState: storageFor(role) });

    test("page loads without server error", async ({ page }) => {
      const res = await page.goto(`/${SLUG}/meta`);
      expect(res?.status() ?? 200).toBeLessThan(500);
      await expect(page.locator("main")).toBeVisible({ timeout: 8_000 });
    });
  });
}
