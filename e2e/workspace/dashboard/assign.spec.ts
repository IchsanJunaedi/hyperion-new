import { test, expect } from "@playwright/test";
import { CREDENTIALS } from "../helpers/auth";

test.describe("Dashboard — Assign Role", () => {
  test.skip(!CREDENTIALS.owner.email, "Owner credentials not configured");

  test("unauth → redirect to /dashboard/login", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/dashboard/assign");
    await expect(page).toHaveURL(/\/dashboard\/login/);
  });

  test("page loads with Assign Role heading", async ({ page }) => {
    await page.goto("/dashboard/assign");
    await expect(page.getByRole("heading", { name: /assign role/i })).toBeVisible();
  });

  test("user select step is visible initially", async ({ page }) => {
    await page.goto("/dashboard/assign");
    // Use first() to avoid strict mode violation (label + option both match)
    await expect(page.getByText(/pilih user/i).first()).toBeVisible();
  });

  test("submit button disabled when no selection made", async ({ page }) => {
    await page.goto("/dashboard/assign");
    const submitBtn = page.getByRole("button", { name: /assign role/i });
    await expect(submitBtn).toBeDisabled();
  });
});
