import { test, expect } from "@playwright/test";
import { cleanupE2ERows } from "../../admin/helpers/cleanup";
import { CREDENTIALS } from "../helpers/auth";

test.describe("Dashboard — Calendar", () => {
  test.skip(!CREDENTIALS.owner.email, "Owner credentials not configured");

  test.afterAll(async () => {
    await cleanupE2ERows("calendar_events", "title");
  });

  test("unauth → redirect to /dashboard/login", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/dashboard/calendar");
    await expect(page).toHaveURL(/\/dashboard\/login/);
  });

  test("page loads with Kalender Tim heading", async ({ page }) => {
    await page.goto("/dashboard/calendar");
    await expect(page.getByRole("heading", { name: /kalender tim/i })).toBeVisible();
  });

  test("Tambah event link is visible and points to workspace calendar", async ({ page }) => {
    await page.goto("/dashboard/calendar");
    const addLink = page.getByRole("link", { name: /tambah event/i });
    await expect(addLink).toBeVisible();
    const href = await addLink.getAttribute("href");
    expect(href).toContain("/calendar/new");
  });

  test("calendar grid or event list renders", async ({ page }) => {
    await page.goto("/dashboard/calendar");
    await expect(page.locator("main")).toBeVisible();
  });
});
