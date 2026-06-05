import { test, expect } from "@playwright/test";

test("Workspace Features E2E Flow", async ({ page }) => {
  test.setTimeout(300000);
  const timestamp = Date.now();
  const uniqueEmail = `user-${timestamp}@hyperion.com`;
  const uniqueUsername = `tester${timestamp}`;
  const uniqueTeamName = `Team ${timestamp}`;
  const uniqueTeamSlug = `team-${timestamp}`;

  // Helper: set datetime-local input via JS (more reliable than fill)
  const setDatetimeLocal = async (selector: string, dateStr: string) => {
    await page.evaluate(
      ({ sel, val }) => {
        const el = document.querySelector(sel) as HTMLInputElement;
        if (el) {
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            "value"
          )?.set;
          nativeInputValueSetter?.call(el, val);
          el.dispatchEvent(new Event("input", { bubbles: true }));
          el.dispatchEvent(new Event("change", { bubbles: true }));
        }
      },
      { sel: selector, val: dateStr }
    );
  };

  // 1. Registration
  await page.goto("/register");
  await page.fill("input[id='display_name']", "Workspace Tester");
  await page.fill("input[id='email']", uniqueEmail);
  await page.fill("input[id='password']", "StrongPassword123!");
  await page.fill("input[id='phone_wa']", "081234567890");
  await page.click("button[type='submit']");

  await expect(page).toHaveURL(/\/onboarding\/profile/);

  // 2. Profile Setup
  await page.fill("input[name='username']", uniqueUsername);
  // Use JS to set date input reliably
  await setDatetimeLocal("input[name='date_of_birth']", "2000-01-01");
  await page.waitForTimeout(300);
  await page.click("button[type='submit']");

  await expect(page).toHaveURL(/\/$/);

  // 3. Team Onboarding
  await page.goto("/onboarding/organization");
  await page.fill("input[id='org-name']", uniqueTeamName);
  await page.fill("input[id='org-slug']", uniqueTeamSlug);
  await page.fill("input[id='division-name-0']", "MLBB Division");
  // Wait for slug check to complete
  await page.waitForTimeout(500);
  await page.click("button[type='submit']");

  await expect(page).toHaveURL(new RegExp(`\\/${uniqueTeamSlug}`));

  // 4. Scrim Modul: CRUD & finish flow
  await page.goto(`/${uniqueTeamSlug}/scrim`);
  await page.waitForLoadState("networkidle");
  await expect(page.locator("h1, h2").filter({ hasText: /daftar scrim/i }).first()).toBeVisible();

  await page.click("text=Buat scrim");
  await page.waitForLoadState("networkidle");
  await expect(page.locator("h1, h2").filter({ hasText: /buat scrim baru/i }).first()).toBeVisible();

  // Compute future datetime-local string (tomorrow at 23:00)
  const futureTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
  futureTime.setHours(23, 0, 0, 0);
  const yyyy = futureTime.getFullYear();
  const mm = String(futureTime.getMonth() + 1).padStart(2, '0');
  const dd = String(futureTime.getDate()).padStart(2, '0');
  const futureStr = `${yyyy}-${mm}-${dd}T23:00`;

  await page.fill("input[name='opponent_name']", "E2E Enemy Team");
  await page.fill("input[name='opponent_contact']", "08987654321");

  // Use JS to set datetime-local reliably
  await setDatetimeLocal("input[name='scheduled_at']", futureStr);
  await page.waitForTimeout(200);

  // Click BO1 format pill
  await page.locator("label").filter({ hasText: /^BO1$/ }).click();
  await page.fill("input[name='server_region']", "Singapore");
  await page.fill("textarea[name='notes']", "Catatan latihan strategi");

  // Verify division_id hidden input is populated
  const divisionId = await page.evaluate(() => {
    const el = document.querySelector('input[name="division_id"]') as HTMLInputElement | null;
    return el?.value ?? null;
  });
  console.log("division_id value:", divisionId);

  // Verify scheduled_at is set
  const scheduledAt = await page.evaluate(() => {
    const el = document.querySelector('input[name="scheduled_at"]') as HTMLInputElement | null;
    return el?.value ?? null;
  });
  console.log("scheduled_at value:", scheduledAt);

  await page.waitForTimeout(500);
  await page.click("button[type='submit']");

  await expect(page).toHaveURL(new RegExp(`\\/${uniqueTeamSlug}\\/scrim\\/[0-9a-f-]+`));
  await expect(page.locator("h1, h2").filter({ hasText: /vs E2E Enemy Team/i }).first()).toBeVisible();
  await expect(page.locator("text=Terjadwal")).toBeVisible();

  // Extract scrim ID from current URL
  const scrimUrl = page.url();
  const scrimId = scrimUrl.split("/").pop();

  // Navigate directly to finish scrim page
  await page.goto(`/${uniqueTeamSlug}/scrim/${scrimId}/finish`);
  await page.waitForLoadState("networkidle");
  await expect(page.locator("h1, h2").filter({ hasText: /selesai pertandingan/i }).first()).toBeVisible();

  await page.click("text=Menang");
  await page.fill("textarea[placeholder='Strategi, kesalahan, highlight…']", "Game 1 epic comeback");
  await page.fill("textarea[placeholder='Analisis keseluruhan, taktik, catatan penting…']", "Taktik berjalan lancar");
  await page.click("button:has-text('Simpan Hasil & Selesaikan Scrim')");

  await expect(page).toHaveURL(new RegExp(`\\/${uniqueTeamSlug}\\/analytics`));

  // Go back to scrim details to verify results
  await page.goto(`/${uniqueTeamSlug}/scrim/${scrimId}`);
  await page.waitForLoadState("networkidle");
  await expect(page.locator("span").filter({ hasText: /^Selesai$/i }).first()).toBeVisible();
  await expect(page.locator("text=1 — 0")).toBeVisible();
  await expect(page.getByText("Menang").first()).toBeVisible();

  // 5. Calendar Modul: Create event and view in calendar
  await page.goto(`/${uniqueTeamSlug}/calendar`);
  await page.waitForLoadState("networkidle");
  await expect(page.locator("h1, h2").filter({ hasText: /kalender tim/i }).first()).toBeVisible();

  await page.click("text=Tambah event");
  await page.waitForLoadState("networkidle");
  await expect(page.locator("h1, h2").filter({ hasText: /tambah event/i }).first()).toBeVisible();

  await page.fill("input[name='title']", "Latihan Taktis A");

  // event_type uses PremiumSelect (custom dropdown — NOT a native <select>)
  // Pattern: click the dropdown trigger → click the option inside the dropdown panel
  const eventTypeDropdown = page.locator("div[class*='relative']").filter({
    has: page.locator("input[name='event_type']"),
  });
  // Click the trigger to open the dropdown
  await eventTypeDropdown.locator("button[type='button']").click();
  await page.waitForTimeout(300);
  // Click the "Latihan" (practice) option inside the open dropdown panel
  // Use the dropdown div itself as scope to avoid strict mode (2 buttons match page-wide)
  await eventTypeDropdown.locator("button[type='button']").filter({ hasText: /^Latihan$/ }).first().click();
  await page.waitForTimeout(200);


  await setDatetimeLocal("input[name='starts_at']", futureStr);
  await page.fill("input[name='location']", "Discord Server");
  await page.fill("textarea[name='description']", "Latihan strategi map.");
  await page.click("button[type='submit']");

  await expect(page).toHaveURL(new RegExp(`\\/${uniqueTeamSlug}\\/calendar`));
  await expect(page.locator("text=Latihan Taktis A")).toBeVisible();

  // 6. Roster Modul: Update availability
  await page.goto(`/${uniqueTeamSlug}/roster`);
  await page.waitForLoadState("networkidle");
  await expect(page.locator("h1, h2").filter({ hasText: /roster/i }).first()).toBeVisible();

  await page.click("button:has-text('Aktif')");
  await page.click("button:has-text('Hiatus')");
  await expect(page.locator("text=Status ketersediaan diperbarui")).toBeVisible();

  // 7. Collaterals: Announcements CRUD
  await page.goto(`/${uniqueTeamSlug}/announcements`);
  await page.waitForLoadState("networkidle");
  await expect(page.locator("h1, h2").filter({ hasText: /pengumuman tim/i }).first()).toBeVisible();

  await page.click("text=Buat pengumuman");
  await page.waitForLoadState("networkidle");
  await expect(page.locator("h1, h2").filter({ hasText: /buat pengumuman/i }).first()).toBeVisible();

  await page.fill("input[name='title']", "Pengumuman Penting E2E");
  await page.fill("textarea[name='body']", "Ini pengumuman E2E test.");
  await page.click("button[type='submit']");

  await expect(page).toHaveURL(new RegExp(`\\/${uniqueTeamSlug}\\/announcements\\/[0-9a-f-]+`));
  await expect(page.locator("text=Pengumuman Penting E2E")).toBeVisible();

  // 8. Collaterals: Polls CRUD & Vote
  await page.goto(`/${uniqueTeamSlug}/polls`);
  await page.waitForLoadState("networkidle");
  await expect(page.locator("h1, h2").filter({ hasText: /polling tim/i }).first()).toBeVisible();

  await page.click("text=Buat Poll");
  await page.fill("input[placeholder='Pertanyaan poll...']", "Pilih Map Terbaik");
  await page.fill("input[placeholder='Opsi 1']", "Split");
  await page.fill("input[placeholder='Opsi 2']", "Bind");
  await page.click("button:has-text('Buat Poll')");

  await expect(page.locator("text=Pilih Map Terbaik")).toBeVisible();

  await page.click("button:has-text('Split')");
  await expect(page.locator("text=Vote berhasil!")).toBeVisible();
  await expect(page.locator("text=Split ✓")).toBeVisible();

  // 9. Collaterals: Strategy Note CRUD
  await page.goto(`/${uniqueTeamSlug}/strategy`);
  await page.waitForLoadState("networkidle");
  await expect(page.locator("h1, h2").filter({ hasText: /bank strategi/i }).first()).toBeVisible();

  await page.click("text=Tulis catatan");
  await page.waitForLoadState("networkidle");
  await expect(page.locator("h1, h2").filter({ hasText: /tulis catatan strategi/i }).first()).toBeVisible();

  await page.fill("input[name='title']", "Strategi Defense Bind");
  await page.fill("textarea[name='content']", "Setup Cypher A site.");
  await page.fill("input[name='tags']", "bind, defense");
  await page.click("button[type='submit']");

  await expect(page).toHaveURL(new RegExp(`\\/${uniqueTeamSlug}\\/strategy\\/[0-9a-f-]+`));
  await expect(page.locator("text=Strategi Defense Bind")).toBeVisible();

  // 10. Collaterals: File Upload
  await page.goto(`/${uniqueTeamSlug}/files`);
  await page.waitForLoadState("networkidle");
  await expect(page.locator("h1, h2").filter({ hasText: /file tim/i }).first()).toBeVisible();

  const filePayload = {
    name: "e2e_strategy_doc.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("Tactical guidelines for E2E testing"),
  };

  const fileChooserPromise = page.waitForEvent("filechooser");
  await page.click("text=Pilih file");
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles([filePayload]);

  await expect(page.locator("text=File berhasil diupload")).toBeVisible();
  await expect(page.locator("text=e2e_strategy_doc.txt")).toBeVisible();
});
