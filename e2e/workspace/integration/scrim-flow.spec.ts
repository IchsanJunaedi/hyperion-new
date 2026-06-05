import { test, expect } from "@playwright/test";
import { SLUG, storageFor, adminClient, getE2EOrg } from "../workspace/_roles";

// Workspace ×2: coach annotates a scrim with a VOD timestamp → member viewing
// the same results page sees that annotation.
test.describe.configure({ mode: "serial" });

let scrimId = "";
const NOTE = "[E2E] rotation timing";

test.beforeAll(async () => {
  const admin = adminClient();
  const { orgId, divisionId } = await getE2EOrg();
  const { data: cap } = await admin
    .from("team_members")
    .select("user_id")
    .eq("organization_id", orgId)
    .eq("role", "captain")
    .maybeSingle();
  const { data: scrim, error } = await admin
    .from("scrims")
    .insert({
      organization_id: orgId,
      division_id: divisionId,
      created_by: cap!.user_id,
      opponent_name: "[E2E] Flow Opponent",
      scheduled_at: new Date().toISOString(),
      format: "bo3",
      status: "completed",
    })
    .select("id")
    .single();
  if (error) throw new Error(`seed scrim: ${error.message}`);
  scrimId = scrim.id;
  const { error: gErr } = await admin
    .from("scrim_game_results")
    .insert({ scrim_id: scrimId, game_number: 1, is_win: true });
  if (gErr) throw new Error(`seed game: ${gErr.message}`);
});

test.afterAll(async () => {
  const admin = adminClient();
  if (scrimId) {
    await admin.from("scrim_game_results").delete().eq("scrim_id", scrimId);
    await admin.from("scrims").delete().eq("id", scrimId);
  }
});

test.describe("Integration — Scrim VOD (coach annotates)", () => {
  test.use({ storageState: storageFor("coach") });

  test("coach adds a VOD timestamp", async ({ page }) => {
    await page.goto(`/${SLUG}/scrim/${scrimId}/results`);
    await page.getByRole("button", { name: /vod review/i }).first().click();
    await page.getByRole("button", { name: /tambah timestamp/i }).first().click();
    await page.getByPlaceholder("12:34").fill("12:34");
    await page.getByPlaceholder(/positioning salah/i).fill(NOTE);
    await page.getByRole("button", { name: /^simpan$/i }).click();
    await expect(page.getByText(NOTE).first()).toBeVisible({ timeout: 8_000 });
  });
});

test.describe("Integration — Scrim VOD (member views)", () => {
  test.use({ storageState: storageFor("member") });

  test("member sees the coach's timestamp", async ({ page }) => {
    await page.goto(`/${SLUG}/scrim/${scrimId}/results`);
    await page.getByRole("button", { name: /vod review/i }).first().click();
    await expect(page.getByText(NOTE).first()).toBeVisible({ timeout: 8_000 });
  });
});
