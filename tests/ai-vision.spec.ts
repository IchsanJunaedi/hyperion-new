import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";

test("AI-Assisted Finish Scrim via Dual Screenshot Upload E2E", async ({ page }) => {
  test.setTimeout(180000); // 3 minutes timeout

  // Credentials and slug from .env.local
  const email = process.env.E2E_OWNER_EMAIL || "owner@hyperion.id";
  const password = process.env.E2E_OWNER_PASSWORD || "password123";
  const slug = process.env.E2E_TEAM_SLUG || "hyperion-dom";

  const draftPath = path.resolve(process.cwd(), "scratch/draft.png");
  const scoreboardPath = path.resolve(process.cwd(), "scratch/scoreboard.png");

  // Verify test images exist
  if (!fs.existsSync(draftPath) || !fs.existsSync(scoreboardPath)) {
    throw new Error("Missing test images in scratch/ directory!");
  }

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

  // 1. Log in
  console.log("🔑 Logging in as owner...");
  await page.goto("/login");
  await page.fill("input[name='email']", email);
  await page.fill("input[name='password']", password);
  await page.click("button[type='submit']");
  await page.waitForLoadState("networkidle");

  // Expect dashboard or home redirect
  await expect(page).toHaveURL(new RegExp(`\\/${slug}|\\/dashboard`));

  // 2. Create Scrim
  console.log("📅 Creating a test scrim...");
  await page.goto(`/${slug}/scrim/new`);
  await page.waitForLoadState("networkidle");

  await page.fill("input[name='opponent_name']", "AI Vision E2E Enemy");
  await page.fill("input[name='opponent_contact']", "0812345678");

  // Compute future datetime-local string (tomorrow at 20:00)
  const futureTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
  futureTime.setHours(20, 0, 0, 0);
  const yyyy = futureTime.getFullYear();
  const mm = String(futureTime.getMonth() + 1).padStart(2, '0');
  const dd = String(futureTime.getDate()).padStart(2, '0');
  const futureStr = `${yyyy}-${mm}-${dd}T20:00`;
  await setDatetimeLocal("input[name='scheduled_at']", futureStr);

  // Select BO1 format
  await page.locator("label").filter({ hasText: /^BO1$/ }).click();
  await page.fill("input[name='server_region']", "Singapore");
  await page.fill("textarea[name='notes']", "AI Vision E2E Scrim notes");

  await page.click("button[type='submit']");
  await page.waitForLoadState("networkidle");

  // Confirm redirected to scrim details
  await expect(page).toHaveURL(new RegExp(`\\/${slug}\\/scrim\\/[0-9a-f-]+`));
  const scrimId = page.url().split("/").pop();
  console.log(`✓ Scrim created successfully with ID: ${scrimId}`);

  // 3. Go to Finish Scrim page
  console.log("🏁 Navigating to Finish Scrim page...");
  await page.goto(`/${slug}/scrim/${scrimId}/finish`);
  await page.waitForLoadState("networkidle");
  await expect(page.locator("h1, h2").filter({ hasText: /selesai pertandingan/i }).first()).toBeVisible();

  // 4. Upload Draft Screenshot
  console.log("📷 Uploading Draft Screenshot...");
  const draftInput = page.locator("label:has-text('Draft')").locator("input[type='file']");
  await draftInput.setInputFiles(draftPath);

  // Wait for processing
  console.log("⏳ Waiting for AI to process Draft Screenshot...");
  await expect(page.locator("text=AI selesai membaca").first()).toBeVisible({ timeout: 45000 });
  console.log("✓ Draft scan complete.");

  // Verify picks populated (e.g. Lancelot should be in the draft list)
  const lancelotText = page.locator("button:has-text('Lancelot')").first();
  await expect(lancelotText).toBeVisible();

  // 5. Upload Scoreboard Screenshot
  console.log("📷 Uploading Scoreboard Screenshot...");
  const scoreboardInput = page.locator("label:has-text('Scoreboard')").locator("input[type='file']");
  await scoreboardInput.setInputFiles(scoreboardPath);

  // Wait for processing
  console.log("⏳ Waiting for AI to process Scoreboard Screenshot...");
  await expect(page.locator("text=AI selesai membaca").first()).toBeVisible({ timeout: 45000 });
  console.log("✓ Scoreboard scan complete.");

  // Verify W/L is active and KDA review table is visible
  const resultHeader = page.locator("text=Hasil Scan Scoreboard");
  await expect(resultHeader).toBeVisible();

  // 6. Complete and Save Scrim
  console.log("💾 Submitting scrim results...");
  await page.fill("textarea[placeholder='Analisis keseluruhan, taktik, catatan penting…']", "AI Vision E2E Smoke Test Success");
  
  await page.click("button:has-text('Simpan Hasil & Selesaikan Scrim')");
  await page.waitForLoadState("networkidle");

  // Redirected back to analytics
  await expect(page).toHaveURL(new RegExp(`\\/${slug}\\/analytics`));
  console.log("✓ Scrim completed and saved successfully!");

  // 7. Verify AI Tactical Review narrative on Scrim Results page
  console.log("🔍 Verifying AI Tactical Review Card in results...");
  await page.goto(`/${slug}/scrim/${scrimId}/results`);
  await page.waitForLoadState("networkidle");

  const aiReviewCard = page.locator("text=Tinjauan Taktis AI");
  await expect(aiReviewCard).toBeVisible({ timeout: 15000 });
  
  const reviewText = page.locator("p:has-text('Ling')");
  await expect(reviewText).toBeVisible();
  console.log("🎉 AI Tactical Review narrative loaded and verified successfully!");
});
