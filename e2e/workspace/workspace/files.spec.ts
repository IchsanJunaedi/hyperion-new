import { test, expect } from "@playwright/test";
import { SLUG, WS_ROLES, storageFor } from "./_roles";

// Upload section gated by canUpload = owner/manager/coach.
// Coach sees the upload panel; captain + member do not.
for (const role of WS_ROLES) {
  test.describe(`Workspace — Files (${role})`, () => {
    test.use({ storageState: storageFor(role) });

    test("page loads with File Tim heading", async ({ page }) => {
      await page.goto(`/${SLUG}/files`);
      await expect(page.getByRole("heading", { name: /file tim/i })).toBeVisible({ timeout: 8_000 });
    });

    test(`upload panel visibility matches canUpload`, async ({ page }) => {
      await page.goto(`/${SLUG}/files`);
      const uploadHeading = page.getByRole("heading", { name: /upload file baru/i });
      if (role === "coach") {
        await expect(uploadHeading).toBeVisible();
      } else {
        await expect(uploadHeading).toHaveCount(0);
      }
    });
  });
}
