import { test, expect } from "@playwright/test";
import { cleanupE2ERows, E2E_PREFIX } from "../../admin/helpers/cleanup";
import { SLUG, storageFor } from "../workspace/_roles";

// Workspace ×2: captain creates a poll → member votes → captain sees the vote
// reflected in the poll's total count.
test.describe.configure({ mode: "serial" });

const QUESTION = `${E2E_PREFIX} Flow Poll`;

test.beforeAll(async () => {
  await cleanupE2ERows("polls", "question");
});
test.afterAll(async () => {
  await cleanupE2ERows("polls", "question");
});

test.describe("Integration — Poll (captain creates)", () => {
  test.use({ storageState: storageFor("captain") });

  test("captain creates a poll", async ({ page }) => {
    await page.goto(`/${SLUG}/polls`);
    await page.getByRole("button", { name: /buat poll/i }).click();
    await page.getByPlaceholder(/pertanyaan poll/i).fill(QUESTION);
    await page.getByPlaceholder("Opsi 1").fill("Opsi A");
    await page.getByPlaceholder("Opsi 2").fill("Opsi B");
    await page.getByRole("button", { name: /^buat poll$/i }).click();
    await expect(page.getByText(QUESTION).first()).toBeVisible({ timeout: 8_000 });
  });
});

test.describe("Integration — Poll (member votes)", () => {
  test.use({ storageState: storageFor("member") });

  test("member votes on the poll", async ({ page }) => {
    await page.goto(`/${SLUG}/polls`);
    const card = page.locator("div.rounded-xl").filter({ hasText: QUESTION }).first();
    await card.getByRole("button", { name: /^Opsi A$/ }).click();
    await expect(page.getByText(/vote berhasil/i).first()).toBeVisible({ timeout: 8_000 });
  });
});

test.describe("Integration — Poll (captain sees count)", () => {
  test.use({ storageState: storageFor("captain") });

  test("captain sees the updated vote total", async ({ page }) => {
    await page.goto(`/${SLUG}/polls`);
    const card = page.locator("div.rounded-xl").filter({ hasText: QUESTION }).first();
    await expect(card.getByText(/1 vote/i).first()).toBeVisible({ timeout: 8_000 });
  });
});
