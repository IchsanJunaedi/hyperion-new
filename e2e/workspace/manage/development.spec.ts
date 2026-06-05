import { test, expect } from "@playwright/test";
import { cleanupE2ERows, E2E_PREFIX } from "../../admin/helpers/cleanup";
import { CREDENTIALS } from "../helpers/auth";

// Manage development (PlayerDevelopmentClient) — set a skill target for a
// player, verify it appears. Operates on [E2E] Org; cleaned by skill_name.
test.describe.serial("Manage — Player Development", () => {
  test.skip(!CREDENTIALS.manager.email, "Manager credentials not configured");

  test.beforeAll(async () => {
    await cleanupE2ERows("player_targets", "skill_name");
  });
  test.afterAll(async () => {
    await cleanupE2ERows("player_targets", "skill_name");
  });

  test("unauth → redirect to login", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/manage/development");
    await expect(page).toHaveURL(/\/login/);
  });

  test("page loads with Player Development heading", async ({ page }) => {
    await page.goto("/manage/development");
    await expect(page.getByRole("heading", { name: /player development/i })).toBeVisible();
  });

  test("Set Target Baru opens the form", async ({ page }) => {
    await page.goto("/manage/development");
    await page.getByRole("button", { name: /set target baru/i }).click();
    // Player CustomSelect + skill name input become visible
    await expect(page.getByPlaceholder(/map awareness/i)).toBeVisible({ timeout: 5_000 });
  });

  test("create a skill target", async ({ page }) => {
    await page.goto("/manage/development");
    await page.getByRole("button", { name: /set target baru/i }).click();
    await page.getByPlaceholder(/map awareness/i).fill(`${E2E_PREFIX} E2E Skill`);
    await page.getByRole("button", { name: /tambah target/i }).click();
    await expect(page.getByText(/target ditambahkan/i).first()).toBeVisible({ timeout: 8_000 });
  });

  test("skill target appears in list", async ({ page }) => {
    await page.goto("/manage/development");
    await expect(page.getByText(`${E2E_PREFIX} E2E Skill`).first()).toBeVisible({ timeout: 8_000 });
  });
});
