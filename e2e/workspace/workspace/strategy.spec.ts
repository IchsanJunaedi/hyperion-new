import { test, expect } from "@playwright/test";
import { cleanupE2ERows, E2E_PREFIX } from "../../admin/helpers/cleanup";
import { SLUG, WS_ROLES, storageFor } from "./_roles";

// Serial: avoid the file-level cleanup racing a freshly created row across
// parallel workers (see announcements.spec for the same pattern).
test.describe.configure({ mode: "serial" });

// Strategy notes: INSERT RLS is is_member_of → any active member can author.
// All three roles can view the bank; coach + captain author notes here
// (member authoring is covered indirectly and not asserted as a boundary).
test.beforeAll(async () => {
  await cleanupE2ERows("strategy_notes", "title");
});
test.afterAll(async () => {
  await cleanupE2ERows("strategy_notes", "title");
});

for (const role of WS_ROLES) {
  test.describe(`Workspace — Strategy list (${role})`, () => {
    test.use({ storageState: storageFor(role) });

    test("page loads with Bank Strategi heading", async ({ page }) => {
      await page.goto(`/${SLUG}/strategy`);
      await expect(page.getByRole("heading", { name: /bank strategi/i })).toBeVisible({ timeout: 8_000 });
    });
  });
}

for (const role of ["captain", "coach"] as const) {
  test.describe(`Workspace — Strategy create (${role})`, () => {
    test.use({ storageState: storageFor(role) });

    test(`${role} can write a strategy note`, async ({ page }) => {
      const title = `${E2E_PREFIX} Strat ${role}`;
      await page.goto(`/${SLUG}/strategy/new`);
      await page.locator('input[name="title"]').fill(title);
      await page.locator('textarea[name="content"]').fill("E2E strategy content");
      // Division is coerced to "" (invalid uuid) if left unselected — pick one.
      await page.locator('select[name="division_id"]').selectOption({ label: "[E2E] Division" });
      await page.getByRole("button", { name: /simpan catatan/i }).click();
      await page.waitForURL(/\/strategy\/[0-9a-f-]{36}/, { timeout: 10_000 });
      await expect(page.getByText(title).first()).toBeVisible({ timeout: 8_000 });
    });
  });
}
