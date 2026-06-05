import { test, expect } from "@playwright/test";
import { cleanupE2ERows, E2E_PREFIX } from "../../admin/helpers/cleanup";
import { SLUG, storageFor, adminClient, getE2EOrg } from "../workspace/_roles";

// Workspace ×2: coach publishes an announcement → member opens it → a read
// receipt is recorded (the read-tracking integration that powers read counts).
test.describe.configure({ mode: "serial" });

let annId = "";
let memberId = "";

test.beforeAll(async () => {
  await cleanupE2ERows("announcements", "title");
  const admin = adminClient();
  const { orgId } = await getE2EOrg();
  const { data } = await admin
    .from("team_members")
    .select("user_id")
    .eq("organization_id", orgId)
    .eq("role", "member")
    .maybeSingle();
  memberId = data!.user_id;
});
test.afterAll(async () => {
  await cleanupE2ERows("announcements", "title");
});

test.describe("Integration — Announcement (coach publishes)", () => {
  test.use({ storageState: storageFor("coach") });

  test("coach publishes an announcement", async ({ page }) => {
    await page.goto(`/${SLUG}/announcements/new`);
    await page.locator('input[name="title"]').fill(`${E2E_PREFIX} Flow Ann`);
    await page.locator('textarea[name="body"]').fill("read me");
    await page.getByRole("button", { name: /publikasikan/i }).click();
    // Generous timeout: the dev server may be compiling routes under parallel load.
    await page.waitForURL(/\/announcements\/([0-9a-f-]{36})/, { timeout: 25_000 });
    annId = page.url().match(/announcements\/([0-9a-f-]{36})/)![1]!;
    expect(annId).toBeTruthy();
  });
});

test.describe("Integration — Announcement (member reads)", () => {
  test.use({ storageState: storageFor("member") });

  test("member opening the detail records a read receipt", async ({ page }) => {
    await page.goto(`/${SLUG}/announcements/${annId}`);
    await expect(page.getByText(`${E2E_PREFIX} Flow Ann`).first()).toBeVisible({ timeout: 8_000 });
    // Read marking happens server-side on render — poll the DB for the receipt.
    const admin = adminClient();
    await expect
      .poll(
        async () => {
          const { count } = await admin
            .from("announcement_reads")
            .select("*", { count: "exact", head: true })
            .eq("announcement_id", annId)
            .eq("user_id", memberId);
          return count ?? 0;
        },
        { timeout: 8_000 }
      )
      .toBeGreaterThan(0);
  });
});
