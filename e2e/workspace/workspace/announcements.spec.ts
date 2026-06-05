import { test, expect } from "@playwright/test";
import { cleanupE2ERows, E2E_PREFIX } from "../../admin/helpers/cleanup";
import { SLUG, WS_ROLES, storageFor } from "./_roles";

// Run serially in a single worker: the file-level cleanup deletes [E2E] rows,
// which under fullyParallel would race a freshly created row (deleting it
// before its detail page loads → spurious 404).
test.describe.configure({ mode: "serial" });

// Announcements: the "Buat pengumuman" button is shown to all members, but the
// RLS INSERT policy decides who can actually publish. After the coach-permission
// migration, allowed = owner/captain/manager/coach. Member is blocked (security
// boundary holds — they get the 42501 fallback error toast).
test.beforeAll(async () => {
  await cleanupE2ERows("announcements", "title");
});
test.afterAll(async () => {
  await cleanupE2ERows("announcements", "title");
});

for (const role of WS_ROLES) {
  test.describe(`Workspace — Announcements (${role})`, () => {
    test.use({ storageState: storageFor(role) });

    test("page loads with Pengumuman Tim heading", async ({ page }) => {
      await page.goto(`/${SLUG}/announcements`);
      await expect(page.getByRole("heading", { name: /pengumuman tim/i })).toBeVisible({ timeout: 8_000 });
    });
  });
}

// Captain + coach can publish; member cannot.
for (const role of ["captain", "coach"] as const) {
  test.describe(`Workspace — Announcement create (${role})`, () => {
    test.use({ storageState: storageFor(role) });

    test(`${role} can publish an announcement`, async ({ page }) => {
      const title = `${E2E_PREFIX} Ann ${role}`;
      await page.goto(`/${SLUG}/announcements/new`);
      await page.locator('input[name="title"]').fill(title);
      await page.locator('textarea[name="body"]').fill("E2E announcement body");
      await page.getByRole("button", { name: /publikasikan/i }).click();
      // Success → redirected to the announcement detail page
      await page.waitForURL(/\/announcements\/[0-9a-f-]{36}/, { timeout: 10_000 });
      await expect(page.getByText(title).first()).toBeVisible({ timeout: 8_000 });
    });
  });
}

test.describe("Workspace — Announcement create blocked (member)", () => {
  test.use({ storageState: storageFor("member") });

  test("member is blocked by RLS on publish", async ({ page }) => {
    await page.goto(`/${SLUG}/announcements/new`);
    await page.locator('input[name="title"]').fill(`${E2E_PREFIX} Ann member`);
    await page.locator('textarea[name="body"]').fill("should be blocked");
    await page.getByRole("button", { name: /publikasikan/i }).click();
    // Stays on the form and shows the RLS rejection message
    await expect(page.getByText(/hanya captain atau owner|gagal membuat/i)).toBeVisible({ timeout: 8_000 });
    await expect(page).toHaveURL(/\/announcements\/new/);
  });
});
