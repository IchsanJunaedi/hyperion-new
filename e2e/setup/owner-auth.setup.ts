import { test as setup } from "@playwright/test";
import path from "path";
import { loginAsOwner, OWNER_EMAIL, OWNER_PASSWORD } from "../auth-helper";

// The single owner login for the whole suite. Both the legacy root specs
// (dashboard / announcement / vod-review, via test.use) and the dashboard-tests
// project reuse this one session (e2e/.auth/owner.json) instead of re-logging in
// per test — which raced under parallel workers. The workspace seed depends on
// this project and never logs the owner in again, so there is exactly one owner
// session and nothing invalidates it. Assumes the owner account's password is
// already E2E_OWNER_PASSWORD (no password mutation here → no prod side effects,
// and a mismatch fails loudly instead of silently breaking other sessions).
const authFile = path.join(__dirname, "../.auth/owner.json");

setup("authenticate as owner", async ({ page }) => {
  setup.skip(
    !OWNER_EMAIL || !OWNER_PASSWORD,
    "E2E_OWNER_EMAIL / E2E_OWNER_PASSWORD not configured"
  );
  await loginAsOwner(page);
  await page.context().storageState({ path: authFile });
});
