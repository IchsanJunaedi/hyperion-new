import { test, expect } from "@playwright/test";
import { SLUG, WS_ROLES, storageFor, adminClient, getE2EOrg } from "./_roles";

// Seed a completed scrim with one game result so the VOD Review accordion
// renders. "Tambah Timestamp" is gated by canEdit = manager/coach/captain/owner
// — so coach + captain see it, member does not.
let scrimId = "";

test.beforeAll(async () => {
  const admin = adminClient();
  const { orgId, divisionId } = await getE2EOrg();
  // Need a created_by user — use the seeded captain.
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
      opponent_name: "[E2E] VOD Opponent",
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
  if (gErr) throw new Error(`seed game result: ${gErr.message}`);
});

test.afterAll(async () => {
  const admin = adminClient();
  if (scrimId) {
    await admin.from("scrim_game_results").delete().eq("scrim_id", scrimId);
    await admin.from("scrims").delete().eq("id", scrimId);
  }
});

for (const role of WS_ROLES) {
  test.describe(`Workspace — Scrim results VOD (${role})`, () => {
    test.use({ storageState: storageFor(role) });

    test("results page loads with Hasil Pertandingan heading", async ({ page }) => {
      await page.goto(`/${SLUG}/scrim/${scrimId}/results`);
      await expect(page.getByRole("heading", { name: /hasil pertandingan/i })).toBeVisible({ timeout: 8_000 });
    });

    test(`VOD "Tambah Timestamp" visibility matches canEdit`, async ({ page }) => {
      await page.goto(`/${SLUG}/scrim/${scrimId}/results`);
      // Expand the VOD Review accordion
      await page.getByRole("button", { name: /vod review/i }).first().click();
      const addBtn = page.getByRole("button", { name: /tambah timestamp/i });
      if (role === "member") {
        await expect(addBtn).toHaveCount(0);
      } else {
        await expect(addBtn.first()).toBeVisible({ timeout: 5_000 });
      }
    });
  });
}
