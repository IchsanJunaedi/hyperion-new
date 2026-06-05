import { test, expect } from "@playwright/test";
import { CREDENTIALS } from "../helpers/auth";

test.describe("Dashboard — Managers", () => {
  test.skip(!CREDENTIALS.owner.email, "Owner credentials not configured");

  test("unauth → redirect to /dashboard/login", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/dashboard/managers");
    await expect(page).toHaveURL(/\/dashboard\/login/);
  });

  test("page loads with Manager heading", async ({ page }) => {
    await page.goto("/dashboard/managers");
    await expect(
      page.getByRole("heading", { name: /manager/i })
    ).toBeVisible();
  });

  test("seeded [E2E] Manager appears in list", async ({ page }) => {
    await page.goto("/dashboard/managers");
    await expect(page.getByText(/\[E2E\] Manager/i)).toBeVisible({ timeout: 8_000 });
  });
});
