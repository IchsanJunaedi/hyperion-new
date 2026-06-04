import { test as setup } from "@playwright/test";
import path from "path";
import { loginAsAdmin, ADMIN_EMAIL, ADMIN_PASSWORD } from "../../auth-helper";

const authFile = path.join(__dirname, "../../.auth/admin.json");

setup("authenticate as admin", async ({ page }) => {
  setup.skip(
    !ADMIN_EMAIL || !ADMIN_PASSWORD,
    "E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD not configured"
  );
  await loginAsAdmin(page);
  await page.waitForURL(/\/admin(?!\/login)/);
  await page.context().storageState({ path: authFile });
});
