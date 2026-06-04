import { test, expect } from "@playwright/test";

test("Workspace Features E2E Flow", async ({ page }) => {
  test.setTimeout(300000);
  const timestamp = Date.now();
  const uniqueEmail = `user-${timestamp}@hyperion.com`;
  const uniqueUsername = `tester${timestamp}`;
  const uniqueTeamName = `Team ${timestamp}`;
  const uniqueTeamSlug = `team-${timestamp}`;

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
  await page.fill("input[name='date_of_birth']", "2000-01-01");
  await page.click("button[type='submit']");

  await expect(page).toHaveURL(/\/$/);

  // 3. Team Onboarding
  await page.goto("/onboarding/organization");
  await page.fill("input[id='org-name']", uniqueTeamName);
  await page.fill("input[id='org-slug']", uniqueTeamSlug);
  await page.fill("input[id='division-name-0']", "MLBB Division");
  await page.click("button[type='submit']");

  await expect(page).toHaveURL(new RegExp(`\\/${uniqueTeamSlug}`));

  // 4. Scrim Modul: CRUD & finish flow
  await page.goto(`/${uniqueTeamSlug}/scrim`);
  await expect(page.getByRole("heading", { name: "Daftar scrim" })).toBeVisible();

  await page.click("text=Buat scrim");
  await expect(page.getByRole("heading", { name: "Buat scrim baru" })).toBeVisible();

  // Compute future datetime-local string (tomorrow)
  const futureTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const yyyy = futureTime.getFullYear();
  const mm = String(futureTime.getMonth() + 1).padStart(2, '0');
  const dd = String(futureTime.getDate()).padStart(2, '0');
  const hh = String(futureTime.getHours()).padStart(2, '0');
  const min = String(futureTime.getMinutes()).padStart(2, '0');
  const futureStr = `${yyyy}-${mm}-${dd}T${hh}:${min}`;

  await page.fill("input[name='opponent_name']", "E2E Enemy Team");
  await page.fill("input[name='opponent_contact']", "08987654321");
  await page.fill("input[name='scheduled_at']", futureStr);
  await page.click("text=BO1");
  await page.fill("input[name='server_region']", "Singapore");
  await page.fill("textarea[name='notes']", "Catatan latihan strategi");
  await page.click("button[type='submit']");

  await expect(page).toHaveURL(new RegExp(`\\/${uniqueTeamSlug}\\/scrim\\/[0-9a-f-]+`));
  await expect(page.getByRole("heading", { name: "vs E2E Enemy Team" }).first()).toBeVisible();
  await expect(page.locator("text=Terjadwal")).toBeVisible();

  // Extract scrim ID from current URL
  const scrimUrl = page.url();
  const scrimId = scrimUrl.split("/").pop();

  // Navigate directly to finish scrim page
  await page.goto(`/${uniqueTeamSlug}/scrim/${scrimId}/finish`);
  await expect(page.getByRole("heading", { name: "Selesai Pertandingan" })).toBeVisible();

  await page.click("text=Menang");
  await page.fill("textarea[placeholder='Catatan game ini (opsional)']", "Game 1 epic comeback");
  await page.fill("textarea[placeholder='Evaluasi performa tim, area perbaikan, catatan taktis... (opsional)']", "Taktik berjalan lancar");
  await page.click("text=Simpan Hasil & Selesaikan Scrim");

  await expect(page).toHaveURL(new RegExp(`\\/${uniqueTeamSlug}\\/scrim\\/[0-9a-f-]+`));
  await expect(page.locator("span", { hasText: /^Selesai$/ })).toBeVisible();
  await expect(page.locator("text=1 — 0")).toBeVisible();
  await expect(page.locator("text=MENANG").first()).toBeVisible();

  // 5. Calendar Modul: Create event and view in calendar
  await page.goto(`/${uniqueTeamSlug}/calendar`);
  await expect(page.getByRole("heading", { name: "Kalender Tim" })).toBeVisible();

  await page.click("text=Tambah event");
  await expect(page.getByRole("heading", { name: "Tambah event baru" })).toBeVisible();

  await page.fill("input[name='title']", "Latihan Taktis A");
  await page.selectOption("select[name='event_type']", "practice");
  await page.fill("input[name='starts_at']", futureStr);
  await page.fill("input[name='location']", "Discord Server");
  await page.fill("textarea[name='description']", "Latihan strategi map.");
  await page.click("button[type='submit']");

  await expect(page).toHaveURL(new RegExp(`\\/${uniqueTeamSlug}\\/calendar`));
  await expect(page.locator("text=Latihan Taktis A")).toBeVisible();

  // 6. Roster Modul: Update availability
  await page.goto(`/${uniqueTeamSlug}/roster`);
  await expect(page.getByRole("heading", { name: "Roster" })).toBeVisible();

  await page.click("button:has-text('Aktif')");
  await page.click("button:has-text('Hiatus')");
  await expect(page.locator("text=Status ketersediaan diperbarui")).toBeVisible();

  // 7. Collaterals: Announcements CRUD
  await page.goto(`/${uniqueTeamSlug}/announcements`);
  await expect(page.getByRole("heading", { name: "Pengumuman Tim" })).toBeVisible();

  await page.click("text=Buat pengumuman");
  await expect(page.getByRole("heading", { name: "Buat pengumuman baru" })).toBeVisible();

  await page.fill("input[name='title']", "Pengumuman Penting E2E");
  await page.fill("textarea[name='body']", "Ini pengumuman E2E test.");
  await page.click("button[type='submit']");

  await expect(page).toHaveURL(new RegExp(`\\/${uniqueTeamSlug}\\/announcements\\/[0-9a-f-]+`));
  await expect(page.locator("text=Pengumuman Penting E2E")).toBeVisible();

  // 8. Collaterals: Polls CRUD & Vote
  await page.goto(`/${uniqueTeamSlug}/polls`);
  await expect(page.getByRole("heading", { name: "Polling Tim" })).toBeVisible();

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
  await expect(page.getByRole("heading", { name: "Bank Strategi" })).toBeVisible();

  await page.click("text=Tulis catatan");
  await expect(page.getByRole("heading", { name: "Tulis catatan strategi" })).toBeVisible();

  await page.fill("input[name='title']", "Strategi Defense Bind");
  await page.fill("textarea[name='content']", "Setup Cypher A site.");
  await page.fill("input[name='tags']", "bind, defense");
  await page.click("button[type='submit']");

  await expect(page).toHaveURL(new RegExp(`\\/${uniqueTeamSlug}\\/strategy\\/[0-9a-f-]+`));
  await expect(page.locator("text=Strategi Defense Bind")).toBeVisible();

  // 10. Collaterals: File Upload
  await page.goto(`/${uniqueTeamSlug}/files`);
  await expect(page.getByRole("heading", { name: "File Tim" })).toBeVisible();

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
