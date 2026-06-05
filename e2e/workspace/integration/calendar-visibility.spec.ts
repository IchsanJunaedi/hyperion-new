import { test, expect } from "@playwright/test";
import { SLUG, storageFor, adminClient, getE2EOrg } from "../workspace/_roles";

// Dashboard/Workspace visibility: a "management"-only event must be hidden from
// a member, while an "all" event is visible. Events are seeded via admin (the
// producing UI uses a custom select); the assertion is the role-based read
// filtering in the member's calendar agenda view.
test.describe.configure({ mode: "serial" });

const ALL_TITLE = "[E2E] All Event";
const MGMT_TITLE = "[E2E] Mgmt Event";

async function cleanupEvents() {
  const admin = adminClient();
  await admin.from("calendar_events").delete().like("title", "[E2E]%");
}

test.beforeAll(async () => {
  await cleanupEvents();
  const admin = adminClient();
  const { orgId } = await getE2EOrg();
  const { data: coach } = await admin
    .from("team_members")
    .select("user_id")
    .eq("organization_id", orgId)
    .eq("role", "coach")
    .maybeSingle();
  const startsAt = new Date();
  startsAt.setHours(12, 0, 0, 0);
  const rows = [ALL_TITLE, MGMT_TITLE].map((title) => ({
    organization_id: orgId,
    created_by: coach!.user_id,
    title,
    starts_at: startsAt.toISOString(),
    event_type: "meeting",
    visibility: title === ALL_TITLE ? "all" : "management",
  }));
  const { error } = await admin.from("calendar_events").insert(rows);
  if (error) throw new Error(`seed events: ${error.message}`);
});

test.afterAll(async () => {
  await cleanupEvents();
});

test.describe("Integration — Calendar visibility (member)", () => {
  test.use({ storageState: storageFor("member") });

  test("member sees the 'all' event but not the 'management' event", async ({ page }) => {
    await page.goto(`/${SLUG}/calendar?view=list`);
    await expect(page.getByText(ALL_TITLE).first()).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText(MGMT_TITLE)).toHaveCount(0);
  });
});

test.describe("Integration — Calendar visibility (coach)", () => {
  test.use({ storageState: storageFor("coach") });

  test("coach sees both events", async ({ page }) => {
    await page.goto(`/${SLUG}/calendar?view=list`);
    await expect(page.getByText(ALL_TITLE).first()).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText(MGMT_TITLE).first()).toBeVisible();
  });
});
