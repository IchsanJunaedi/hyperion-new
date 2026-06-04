import { test, expect } from "@playwright/test";
import { cleanupE2ERows, E2E_PREFIX } from "../../admin/helpers/cleanup";
import { SLUG, storageFor, adminClient } from "../workspace/_roles";

// Workspace ×2: captain writes a strategy note → member comments on it →
// captain sees the comment (covers the cross-role discussion thread).
test.describe.configure({ mode: "serial" });

const TITLE = `${E2E_PREFIX} Flow Strat`;
const COMMENT = "[E2E] member comment here";
let noteId = "";

test.beforeAll(async () => {
  await cleanupE2ERows("strategy_notes", "title");
});
test.afterAll(async () => {
  await cleanupE2ERows("strategy_notes", "title");
});

test.describe("Integration — Strategy (captain writes)", () => {
  test.use({ storageState: storageFor("captain") });

  test("captain writes a strategy note", async ({ page }) => {
    await page.goto(`/${SLUG}/strategy/new`);
    await page.locator('input[name="title"]').fill(TITLE);
    await page.locator('textarea[name="content"]').fill("flow content");
    await page.locator('select[name="division_id"]').selectOption({ label: "[E2E] Division" });
    await page.getByRole("button", { name: /simpan catatan/i }).click();
    await page.waitForURL(/\/strategy\/([0-9a-f-]{36})/, { timeout: 10_000 });
    noteId = page.url().match(/strategy\/([0-9a-f-]{36})/)![1]!;
    expect(noteId).toBeTruthy();
  });
});

test.describe("Integration — Strategy (member comments)", () => {
  test.use({ storageState: storageFor("member") });

  test("member adds a comment", async ({ page }) => {
    await page.goto(`/${SLUG}/strategy/${noteId}`);
    await page.getByPlaceholder(/tulis komentar/i).fill(COMMENT);
    await page.getByRole("button", { name: /^kirim$/i }).click();
    // On success the textarea clears; verify the comment actually persisted
    // (getByText alone would false-match the textarea's retained value).
    await expect(page.getByPlaceholder(/tulis komentar/i)).toHaveValue("", { timeout: 8_000 });
    const admin = adminClient();
    await expect
      .poll(async () => {
        const { count } = await admin
          .from("strategy_comments")
          .select("*", { count: "exact", head: true })
          .eq("note_id", noteId);
        return count ?? 0;
      }, { timeout: 8_000 })
      .toBeGreaterThan(0);
  });
});

test.describe("Integration — Strategy (captain sees comment)", () => {
  test.use({ storageState: storageFor("captain") });

  test("captain sees the member's comment", async ({ page }) => {
    await page.goto(`/${SLUG}/strategy/${noteId}`);
    await expect(page.getByText(COMMENT).first()).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText(/diskusi \(1\)/i).first()).toBeVisible();
  });
});
