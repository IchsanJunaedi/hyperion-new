import { test, expect } from "@playwright/test";
import { CREDENTIALS } from "../helpers/auth";

test.describe("Manage — Overview (manager)", () => {
  test.skip(!CREDENTIALS.manager.email, "Manager credentials not configured");

  test("unauth → redirect to login", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/manage");
    await expect(page).toHaveURL(/\/login/);
  });

  test("page loads with Manager Panel heading", { tag: "@smoke" }, async ({ page }) => {
    await page.goto("/manage");
    await expect(page.getByRole("heading", { name: /manager panel/i })).toBeVisible();
  });

  test("manager sees the [E2E] Org member table", async ({ page }) => {
    await page.goto("/manage");
    await expect(page.getByText(/\[E2E\] Org/).first()).toBeVisible({ timeout: 8_000 });
  });
});

// Access control — non-manager roles must be redirected away from /manage.
test.describe("Manage — Access control (coach)", () => {
  test.use({ storageState: "e2e/.auth/coach.json" });
  test.skip(!CREDENTIALS.coach.email, "Coach credentials not configured");

  test("coach cannot access /manage", { tag: "@smoke" }, async ({ page }) => {
    await page.goto("/manage");
    await expect(page).not.toHaveURL(/\/manage(\/|$)/);
  });
});

test.describe("Manage — Access control (captain)", () => {
  test.use({ storageState: "e2e/.auth/captain.json" });
  test.skip(!CREDENTIALS.captain.email, "Captain credentials not configured");

  test("captain cannot access /manage", async ({ page }) => {
    await page.goto("/manage");
    await expect(page).not.toHaveURL(/\/manage(\/|$)/);
  });
});

test.describe("Manage — Access control (member)", () => {
  test.use({ storageState: "e2e/.auth/member.json" });
  test.skip(!CREDENTIALS.member.email, "Member credentials not configured");

  test("member cannot access /manage", async ({ page }) => {
    await page.goto("/manage");
    await expect(page).not.toHaveURL(/\/manage(\/|$)/);
  });
});
