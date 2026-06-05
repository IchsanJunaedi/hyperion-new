import { test, expect } from "@playwright/test";
import { cleanupE2ERows, E2E_PREFIX } from "../../admin/helpers/cleanup";
import { SLUG, storageFor } from "../workspace/_roles";

// Manage → Workspace: a skill target the manager sets for the member appears in
// that member's own workspace /development view.
test.describe.configure({ mode: "serial" });

const SKILL = `${E2E_PREFIX} FlowSkill`;

test.beforeAll(async () => {
  await cleanupE2ERows("player_targets", "skill_name");
});
test.afterAll(async () => {
  await cleanupE2ERows("player_targets", "skill_name");
});

test.describe("Integration — Development (manager sets target)", () => {
  test.use({ storageState: "e2e/.auth/manager.json" });

  test("manager sets a skill target for [E2E] Member", async ({ page }) => {
    await page.goto("/manage/development");
    await page.getByRole("button", { name: /set target baru/i }).click();
    // Player CustomSelect: open trigger (first button in the form card) and pick member
    const card = page.locator("div.rounded-lg").filter({ hasText: /nama skill/i }).first();
    await card.getByRole("button").first().click();
    // Pick the member from the opened CustomSelect dropdown (z-50 container)
    await page.locator(".z-50").getByRole("button", { name: /\[E2E\] Member/ }).click();
    await page.getByPlaceholder(/map awareness/i).fill(SKILL);
    await page.getByRole("button", { name: /tambah target/i }).click();
    await expect(page.getByText(/target ditambahkan/i).first()).toBeVisible({ timeout: 8_000 });
  });
});

test.describe("Integration — Development (member sees target)", () => {
  test.use({ storageState: storageFor("member") });

  test("member sees the target in their workspace development", async ({ page }) => {
    await page.goto(`/${SLUG}/development`);
    await expect(page.getByText(SKILL).first()).toBeVisible({ timeout: 8_000 });
  });
});
