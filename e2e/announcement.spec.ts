import { test, expect } from "@playwright/test";
import { loginAsOwner } from "./auth.spec";

const OWNER_EMAIL = process.env.E2E_OWNER_EMAIL ?? "";
const OWNER_PASSWORD = process.env.E2E_OWNER_PASSWORD ?? "";

// Replace with an actual team slug that exists in your Supabase
const TEAM_SLUG = process.env.E2E_TEAM_SLUG ?? "hyperiontest";

test.describe("Buat Pengumuman Baru", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!OWNER_EMAIL || !OWNER_PASSWORD, "E2E credentials not configured");
    await loginAsOwner(page);
  });

  test("renders Buat Pengumuman Baru page correctly", async ({ page }) => {
    await page.goto(`/${TEAM_SLUG}/announcements/new`);
    await page.waitForLoadState("networkidle");

    // Heading
    await expect(page.getByRole("heading", { name: /buat pengumuman baru/i })).toBeVisible();

    // Back button pill
    await expect(page.getByRole("link", { name: /kembali ke pengumuman/i })).toBeVisible();

    // Form fields
    await expect(page.getByLabel(/judul/i)).toBeVisible();
    await expect(page.getByLabel(/isi pengumuman/i)).toBeVisible();
  });

  test("no placeholders exist in the form", async ({ page }) => {
    await page.goto(`/${TEAM_SLUG}/announcements/new`);
    await page.waitForLoadState("networkidle");

    const titleInput = page.locator('input[name="title"]');
    await expect(titleInput).not.toHaveAttribute("placeholder");
  });

  test("back button navigates to announcements list", async ({ page }) => {
    await page.goto(`/${TEAM_SLUG}/announcements/new`);
    await page.getByRole("link", { name: /kembali ke pengumuman/i }).click();
    await expect(page).toHaveURL(new RegExp(`/${TEAM_SLUG}/announcements$`));
  });
});
