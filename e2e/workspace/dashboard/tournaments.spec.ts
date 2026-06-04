import { test, expect } from "@playwright/test";
import { CREDENTIALS } from "../helpers/auth";

test.describe("Dashboard — Tournaments", () => {
  test.skip(!CREDENTIALS.owner.email, "Owner credentials not configured");

  test("unauth → redirect to /dashboard/login", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/dashboard/tournaments");
    await expect(page).toHaveURL(/\/dashboard\/login/);
  });

  test("page loads with Info Turnamen heading", async ({ page }) => {
    await page.goto("/dashboard/tournaments");
    await expect(page.getByRole("heading", { name: /info turnamen/i })).toBeVisible();
  });

  test("Tambah button links to workspace tournaments/new", async ({ page }) => {
    await page.goto("/dashboard/tournaments");
    const addLink = page.getByRole("link", { name: /^tambah$/i });
    await expect(addLink).toBeVisible();
    const href = await addLink.getAttribute("href");
    expect(href).toContain("/tournaments/new");
  });

  test("tab filter is visible", async ({ page }) => {
    await page.goto("/dashboard/tournaments");
    await expect(page.getByRole("link", { name: /ongoing/i })).toBeVisible();
  });
});
