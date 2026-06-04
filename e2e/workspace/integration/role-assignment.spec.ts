import { test, expect } from "@playwright/test";
import { SLUG, storageFor } from "../workspace/_roles";
import { CREDENTIALS } from "../helpers/auth";

// Validates the assignment chain set up by the seed (Owner→Manager, Manager→
// Captain/Member) is effective across panels: manager reaches /manage, the
// workspace roles reach their workspace, and a non-manager is kept out of /manage.
test.describe("Integration — Role assignment chain (manager)", () => {
  test.use({ storageState: "e2e/.auth/manager.json" });
  test.skip(!CREDENTIALS.manager.email, "Manager credentials not configured");

  test("manager can access /manage", async ({ page }) => {
    await page.goto("/manage");
    await expect(page.getByRole("heading", { name: /manager panel/i })).toBeVisible({ timeout: 8_000 });
  });
});

test.describe("Integration — Role assignment chain (captain workspace)", () => {
  test.use({ storageState: storageFor("captain") });

  test("captain (assigned by manager) reaches the workspace", async ({ page }) => {
    await page.goto(`/${SLUG}/scrim`);
    await expect(page.getByRole("heading", { name: /daftar scrim/i })).toBeVisible({ timeout: 8_000 });
  });
});

test.describe("Integration — Role assignment chain (member isolation)", () => {
  test.use({ storageState: storageFor("member") });

  test("member reaches the workspace but is denied /manage", async ({ page }) => {
    await page.goto(`/${SLUG}/roster`);
    await expect(page.getByRole("heading", { name: /^roster$/i })).toBeVisible({ timeout: 8_000 });

    await page.goto("/manage");
    await expect(page).not.toHaveURL(/\/manage(\/|$)/);
  });
});
