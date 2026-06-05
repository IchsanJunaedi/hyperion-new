import { test, expect } from "@playwright/test";
import { OWNER_EMAIL, OWNER_PASSWORD } from "./auth-helper";

/**
 * Prerequisites (set in .env.local or environment):
 *   E2E_TEAM_SLUG  — team slug (e.g. "hyperion-dom")
 *   E2E_SCRIM_ID   — ID of a completed scrim that has game results + confirmed attendances
 */
const TEAM_SLUG = process.env.E2E_TEAM_SLUG ?? "";
const SCRIM_ID = process.env.E2E_SCRIM_ID ?? "";

const RESULTS_URL = `/${TEAM_SLUG}/scrim/${SCRIM_ID}/results`;

test.describe("VOD Review — results page", () => {
  // Reuse the owner session captured once by the owner-setup project instead of
  // logging in per test (avoids concurrent-login races under parallel workers).
  test.use({ storageState: "e2e/.auth/owner.json" });
  test.skip(
    !OWNER_EMAIL || !OWNER_PASSWORD || !TEAM_SLUG || !SCRIM_ID,
    "Set E2E_OWNER_EMAIL, E2E_OWNER_PASSWORD, E2E_TEAM_SLUG, E2E_SCRIM_ID to run VOD tests",
  );

  test.beforeEach(async ({ page }) => {
    await page.goto(RESULTS_URL);
    await page.waitForLoadState("networkidle");
  });

  test("results page loads with game cards", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /hasil pertandingan/i })).toBeVisible();
    // At least one game card should exist
    await expect(page.getByText(/^Game \d/).first()).toBeVisible();
  });

  test("VOD Review accordion expands and shows form for Coach/Manager/Captain", async ({ page }) => {
    // Click the first VOD Review toggle
    const vodToggle = page.getByRole("button", { name: /vod review/i }).first();
    await expect(vodToggle).toBeVisible();
    await vodToggle.click();

    // "Tambah Timestamp" button should appear (owner has canEdit access)
    await expect(page.getByRole("button", { name: /tambah timestamp/i })).toBeVisible();
  });

  test("dapat menambah timestamp dengan waktu, username, dan alasan", async ({ page }) => {
    const uniqueNote = `E2E-tambah-${Date.now()}`;

    // Expand first game VOD Review
    await page.getByRole("button", { name: /vod review/i }).first().click();
    await page.getByRole("button", { name: /tambah timestamp/i }).click();

    // Fill waktu (MM:SS)
    const timeInput = page.locator('input[placeholder="12:34"]');
    await expect(timeInput).toBeVisible();
    await timeInput.fill("05:30");

    // Select player from dropdown if available
    const playerSelect = page.locator('select').first();
    const playerCount = await playerSelect.locator("option").count();
    let selectedPlayerName: string | null = null;

    if (playerCount > 1) {
      const firstOption = playerSelect.locator("option").nth(1);
      selectedPlayerName = await firstOption.textContent();
      await playerSelect.selectOption({ index: 1 });
    }

    // Fill alasan/catatan (unique per run)
    const noteInput = page.locator('input[placeholder*="Positioning"]');
    await expect(noteInput).toBeVisible();
    await noteInput.fill(uniqueNote);

    // Submit
    await page.getByRole("button", { name: /simpan/i }).click();

    // Verify by unique note text (waktu bisa duplikat antar run)
    const savedRow = page.locator('[data-testid="vod-timestamp-row"]').filter({ hasText: uniqueNote });
    await expect(savedRow).toBeVisible({ timeout: 8_000 });
    await expect(savedRow.getByText("5:30")).toBeVisible();

    if (selectedPlayerName) {
      await expect(savedRow.getByText(`@${selectedPlayerName.trim()}`)).toBeVisible();
    }
  });

  test("timestamp yang ditambah bisa dihapus", async ({ page }) => {
    // Use unique text per run to avoid DB leftovers from previous runs
    const uniqueNote = `E2E-hapus-${Date.now()}`;

    // Expand VOD accordion
    await page.getByRole("button", { name: /vod review/i }).first().click();
    await page.getByRole("button", { name: /tambah timestamp/i }).click();

    // Add a timestamp
    await page.locator('input[placeholder="12:34"]').fill("09:15");
    await page.locator('input[placeholder*="Positioning"]').fill(uniqueNote);
    await page.getByRole("button", { name: /simpan/i }).click();

    // Wait for it to appear
    await expect(page.getByText(uniqueNote)).toBeVisible({ timeout: 8_000 });

    // Hover the row to reveal delete button
    const tsRow = page.locator('[data-testid="vod-timestamp-row"]').filter({ hasText: uniqueNote });
    await tsRow.hover();

    // Click the X (delete) button in that specific row
    await tsRow.locator('[data-testid="vod-delete-btn"]').click();

    // Verify removed
    await expect(page.getByText(uniqueNote)).not.toBeVisible({ timeout: 8_000 });
  });

  test("input waktu format salah menampilkan error", async ({ page }) => {
    await page.getByRole("button", { name: /vod review/i }).first().click();
    await page.getByRole("button", { name: /tambah timestamp/i }).click();

    // Type invalid format
    await page.locator('input[placeholder="12:34"]').fill("abc");
    await page.locator('input[placeholder*="Positioning"]').fill("Catatan apapun");
    await page.getByRole("button", { name: /simpan/i }).click();

    // Error message should appear
    await expect(page.getByText(/format.*mm:ss/i)).toBeVisible();
  });
});
