import { test, expect, Browser, Page } from "@playwright/test";
import {
  cleanupE2ERows,
  getSiteSetting,
  restoreSiteSetting,
  E2E_PREFIX,
} from "./helpers/cleanup";
import { ADMIN_EMAIL, ADMIN_PASSWORD } from "../auth-helper";

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function unauthContext(browser: Browser) {
  const ctx = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const page = await ctx.newPage();
  return { ctx, page };
}

// Resolve a list-row by its visible title text: the nearest ancestor <div> that
// also contains the row's action buttons (edit/delete/toggle).
function rowByText(page: Page, text: string) {
  return page.getByText(text, { exact: true }).locator("xpath=ancestor::div[.//button][1]");
}

// ─── Achievements (CMS) ───────────────────────────────────────────────────────

test.describe("Admin — Achievements", () => {
  test.describe.configure({ mode: "serial" });
  test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, "Admin credentials not configured");

  test.beforeAll(async () => {
    await cleanupE2ERows("achievements", "title");
  });

  test.afterAll(async () => {
    await cleanupE2ERows("achievements", "title");
  });

  test("unauthenticated → redirect to /admin/login", async ({ browser }) => {
    const { ctx, page } = await unauthContext(browser);
    await page.goto("/admin/achievements");
    await expect(page).toHaveURL(/\/admin\/login/);
    await ctx.close();
  });

  test("page loads with heading", async ({ page }) => {
    await page.goto("/admin/achievements");
    await expect(page.getByRole("heading", { name: /achievements/i })).toBeVisible();
  });

  test("form validation — empty submit is blocked by required field", async ({ page }) => {
    await page.goto("/admin/achievements");
    await page.getByRole("button", { name: /tambah manual/i }).click();
    const titleInput = page.getByPlaceholder(/juara 1/i);
    // Native `required` blocks submit before the JS toast fires — assert invalid state.
    await page.getByRole("button", { name: /^tambah$/i }).click();
    const invalid = await titleInput.evaluate(
      (el) => el instanceof HTMLInputElement && !el.validity.valid
    );
    expect(invalid).toBe(true);
  });

  test("create achievement with [E2E] prefix", async ({ page }) => {
    await page.goto("/admin/achievements");
    await page.getByRole("button", { name: /tambah manual/i }).click();
    await page.getByPlaceholder(/juara 1/i).fill(`${E2E_PREFIX} Juara 1 PMPL E2E`);
    await page.locator('input[type="date"]').fill("2026-01-15");
    await page.getByRole("button", { name: /^tambah$/i }).click();
    // Form calls window.location.reload() on success — verify the new row, not the toast.
    await expect(page.getByText(`${E2E_PREFIX} Juara 1 PMPL E2E`)).toBeVisible({ timeout: 10_000 });
  });

  test("achievement appears in admin list after page reload", async ({ page }) => {
    await page.goto("/admin/achievements");
    await expect(page.getByText(`${E2E_PREFIX} Juara 1 PMPL E2E`)).toBeVisible({ timeout: 8_000 });
  });

  test("achievement appears on public landing page", async ({ browser }) => {
    // The landing page redirects logged-in users, so view it unauthenticated.
    const { ctx, page } = await unauthContext(browser);
    await page.goto("/");
    await expect(page.getByText(`${E2E_PREFIX} Juara 1 PMPL E2E`)).toBeVisible({ timeout: 8_000 });
    await ctx.close();
  });

  test("edit achievement title", async ({ page }) => {
    await page.goto("/admin/achievements");
    const row = rowByText(page, `${E2E_PREFIX} Juara 1 PMPL E2E`);
    // First icon button = edit (Pencil)
    await row.locator("button").nth(-2).click();
    const titleInput = page.getByPlaceholder(/juara 1/i);
    await titleInput.clear();
    await titleInput.fill(`${E2E_PREFIX} Juara 1 PMPL E2E Updated`);
    await page.getByRole("button", { name: /^simpan$/i }).click();
    // Reload on success — verify the updated row text.
    await expect(page.getByText(`${E2E_PREFIX} Juara 1 PMPL E2E Updated`)).toBeVisible({ timeout: 10_000 });
  });

  test("updated title appears on landing page", async ({ browser }) => {
    const { ctx, page } = await unauthContext(browser);
    await page.goto("/");
    await expect(page.getByText(`${E2E_PREFIX} Juara 1 PMPL E2E Updated`)).toBeVisible({ timeout: 8_000 });
    await ctx.close();
  });

  test("delete achievement — requires typing HAPUS", async ({ page }) => {
    await page.goto("/admin/achievements");
    const row = rowByText(page, `${E2E_PREFIX} Juara 1 PMPL E2E Updated`);
    // Last icon button = delete (Trash2)
    await row.locator("button").last().click();
    // ConfirmDeleteDialog appears — type HAPUS to unlock
    await page.getByRole("textbox").last().fill("HAPUS");
    await page.getByRole("button", { name: /^hapus$/i }).last().click();
    await expect(page.getByText(/achievement dihapus/i)).toBeVisible({ timeout: 8_000 });
  });

  test("deleted achievement no longer on landing page", async ({ browser }) => {
    const { ctx, page } = await unauthContext(browser);
    await page.goto("/");
    await expect(page.getByText(`${E2E_PREFIX} Juara 1 PMPL E2E Updated`)).not.toBeVisible();
    await ctx.close();
  });
});

// ─── Partners (CMS) ───────────────────────────────────────────────────────────

test.describe("Admin — Partners", () => {
  test.describe.configure({ mode: "serial" });
  test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, "Admin credentials not configured");

  test.beforeAll(async () => {
    await cleanupE2ERows("partners", "name");
  });

  test.afterAll(async () => {
    await cleanupE2ERows("partners", "name");
  });

  test("unauthenticated → redirect to /admin/login", async ({ browser }) => {
    const { ctx, page } = await unauthContext(browser);
    await page.goto("/admin/partners");
    await expect(page).toHaveURL(/\/admin\/login/);
    await ctx.close();
  });

  test("page loads", async ({ page }) => {
    await page.goto("/admin/partners");
    await expect(page.getByRole("heading", { name: /partners/i })).toBeVisible();
  });

  test("form validation — empty name blocked by required field", async ({ page }) => {
    await page.goto("/admin/partners");
    await page.getByRole("button", { name: /tambah/i }).click();
    const nameInput = page.locator("form").getByRole("textbox").first();
    await page.getByRole("button", { name: /^tambah$|^simpan$/i }).last().click();
    const invalid = await nameInput.evaluate(
      (el) => el instanceof HTMLInputElement && !el.validity.valid
    );
    expect(invalid).toBe(true);
  });

  test("create partner", async ({ page }) => {
    await page.goto("/admin/partners");
    await page.getByRole("button", { name: /tambah/i }).click();
    await page.locator("form").getByRole("textbox").first().fill(`${E2E_PREFIX} E2E Sponsor Co`);
    await page.getByRole("button", { name: /^tambah$|^simpan$/i }).last().click();
    // Form reloads on success — verify the new row instead of the toast.
    await expect(page.getByText(`${E2E_PREFIX} E2E Sponsor Co`)).toBeVisible({ timeout: 10_000 });
  });

  test("partner appears in list", async ({ page }) => {
    await page.goto("/admin/partners");
    await expect(page.getByText(`${E2E_PREFIX} E2E Sponsor Co`)).toBeVisible({ timeout: 8_000 });
  });

  test("edit partner name", async ({ page }) => {
    await page.goto("/admin/partners");
    const row = rowByText(page, `${E2E_PREFIX} E2E Sponsor Co`);
    await row.locator("button").nth(-2).click();
    const nameInput = page.locator("form").getByRole("textbox").first();
    await nameInput.clear();
    await nameInput.fill(`${E2E_PREFIX} E2E Sponsor Co Updated`);
    await page.getByRole("button", { name: /^simpan$/i }).last().click();
    await expect(page.getByText(`${E2E_PREFIX} E2E Sponsor Co Updated`)).toBeVisible({ timeout: 10_000 });
  });

  test("delete partner", async ({ page }) => {
    await page.goto("/admin/partners");
    const row = rowByText(page, `${E2E_PREFIX} E2E Sponsor Co Updated`);
    await row.locator("button").last().click();
    await page.getByRole("textbox").last().fill("HAPUS");
    await page.getByRole("button", { name: /^hapus$/i }).last().click();
    await expect(page.getByText(/partner dihapus/i)).toBeVisible({ timeout: 8_000 });
  });
});

// ─── Testimonials (CMS) ───────────────────────────────────────────────────────

test.describe("Admin — Testimonials", () => {
  test.describe.configure({ mode: "serial" });
  test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, "Admin credentials not configured");

  test.beforeAll(async () => {
    await cleanupE2ERows("testimonials", "author_name");
  });

  test.afterAll(async () => {
    await cleanupE2ERows("testimonials", "author_name");
  });

  test("unauthenticated → redirect to /admin/login", async ({ browser }) => {
    const { ctx, page } = await unauthContext(browser);
    await page.goto("/admin/testimonials");
    await expect(page).toHaveURL(/\/admin\/login/);
    await ctx.close();
  });

  test("page loads", async ({ page }) => {
    await page.goto("/admin/testimonials");
    await expect(page.getByRole("heading", { name: /testimonials/i })).toBeVisible();
  });

  test("form validation — empty name + content blocked by required field", async ({ page }) => {
    await page.goto("/admin/testimonials");
    await page.getByRole("button", { name: /tambah/i }).click();
    const nameInput = page.locator("form").getByRole("textbox").first();
    await page.getByRole("button", { name: /^tambah$|^simpan$/i }).last().click();
    const invalid = await nameInput.evaluate(
      (el) => el instanceof HTMLInputElement && !el.validity.valid
    );
    expect(invalid).toBe(true);
  });

  test("create testimonial", async ({ page }) => {
    await page.goto("/admin/testimonials");
    await page.getByRole("button", { name: /tambah/i }).click();
    await page.locator("form").getByRole("textbox").nth(0).fill(`${E2E_PREFIX} E2E Player`);
    await page.locator("form").getByRole("textbox").nth(2).fill("E2E test testimonial content");
    await page.getByRole("button", { name: /^tambah$|^simpan$/i }).last().click();
    // Form reloads on success — verify the new row instead of the toast.
    await expect(page.getByText(`${E2E_PREFIX} E2E Player`)).toBeVisible({ timeout: 10_000 });
  });

  test("testimonial appears in list", async ({ page }) => {
    await page.goto("/admin/testimonials");
    await expect(page.getByText(`${E2E_PREFIX} E2E Player`)).toBeVisible({ timeout: 8_000 });
  });

  test("edit testimonial", async ({ page }) => {
    await page.goto("/admin/testimonials");
    const row = rowByText(page, `${E2E_PREFIX} E2E Player`);
    await row.locator("button").nth(-2).click();
    const nameInput = page.locator("form").getByRole("textbox").first();
    await nameInput.clear();
    await nameInput.fill(`${E2E_PREFIX} E2E Player Updated`);
    await page.getByRole("button", { name: /^simpan$/i }).last().click();
    await expect(page.getByText(`${E2E_PREFIX} E2E Player Updated`)).toBeVisible({ timeout: 10_000 });
  });

  test("delete testimonial", async ({ page }) => {
    await page.goto("/admin/testimonials");
    const row = rowByText(page, `${E2E_PREFIX} E2E Player Updated`);
    await row.locator("button").last().click();
    await page.getByRole("textbox").last().fill("HAPUS");
    await page.getByRole("button", { name: /^hapus$/i }).last().click();
    await expect(page.getByText(/testimonial dihapus/i)).toBeVisible({ timeout: 8_000 });
  });
});

// ─── Hero (Singleton) ─────────────────────────────────────────────────────────

test.describe("Admin — Hero Section", () => {
  test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, "Admin credentials not configured");

  let originalEyebrow: string | null = null;

  test.beforeAll(async () => {
    originalEyebrow = await getSiteSetting("hero_eyebrow");
  });

  test.afterAll(async () => {
    await restoreSiteSetting("hero_eyebrow", originalEyebrow);
  });

  test("unauthenticated → redirect to /admin/login", async ({ browser }) => {
    const { ctx, page } = await unauthContext(browser);
    await page.goto("/admin/hero");
    await expect(page).toHaveURL(/\/admin\/login/);
    await ctx.close();
  });

  test("page loads with Hero Section heading", async ({ page }) => {
    await page.goto("/admin/hero");
    await expect(page.getByRole("heading", { name: /hero section/i })).toBeVisible();
  });

  test("update hero eyebrow text and verify on public landing page", async ({ page, browser }) => {
    await page.goto("/admin/hero");
    const eyebrowInput = page.getByPlaceholder(/est\. 2020/i);
    await eyebrowInput.clear();
    await eyebrowInput.fill("[E2E] Eyebrow Test Text");
    await page.getByRole("button", { name: /simpan/i }).click();
    await expect(page.getByText(/pengaturan hero disimpan/i)).toBeVisible({ timeout: 8_000 });

    // Verify on public page (unauthenticated to avoid the logged-in redirect)
    const { ctx, page: pub } = await unauthContext(browser);
    await pub.goto("/");
    await expect(pub.getByText("[E2E] Eyebrow Test Text")).toBeVisible({ timeout: 8_000 });
    await ctx.close();
  });
});

// ─── About (Singleton) ────────────────────────────────────────────────────────

test.describe("Admin — About", () => {
  test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, "Admin credentials not configured");

  test("unauthenticated → redirect to /admin/login", async ({ browser }) => {
    const { ctx, page } = await unauthContext(browser);
    await page.goto("/admin/about");
    await expect(page).toHaveURL(/\/admin\/login/);
    await ctx.close();
  });

  test("page loads", async ({ page }) => {
    await page.goto("/admin/about");
    await expect(page.getByRole("heading", { name: /about/i })).toBeVisible();
  });

  test("/about public page loads without 500", async ({ page }) => {
    const response = await page.goto("/about");
    expect(response?.status()).not.toBe(500);
    expect(response?.status()).toBe(200);
  });
});

// ─── Contact (Singleton) ──────────────────────────────────────────────────────

test.describe("Admin — Contact", () => {
  test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, "Admin credentials not configured");

  test("unauthenticated → redirect to /admin/login", async ({ browser }) => {
    const { ctx, page } = await unauthContext(browser);
    await page.goto("/admin/contact");
    await expect(page).toHaveURL(/\/admin\/login/);
    await ctx.close();
  });

  test("page loads", async ({ page }) => {
    await page.goto("/admin/contact");
    // SettingsForm heading is "Kontak & Sosial Media".
    await expect(page.getByRole("heading", { name: /kontak/i })).toBeVisible();
  });

  test("/contact public page returns 200", async ({ page }) => {
    const response = await page.goto("/contact");
    expect(response?.status()).toBe(200);
  });
});

// ─── SEO (Singleton) ──────────────────────────────────────────────────────────

test.describe("Admin — SEO", () => {
  test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, "Admin credentials not configured");

  let originalHomeTitle: string | null = null;

  test.beforeAll(async () => {
    originalHomeTitle = await getSiteSetting("seo_home_title");
  });

  test.afterAll(async () => {
    await restoreSiteSetting("seo_home_title", originalHomeTitle);
  });

  test("unauthenticated → redirect to /admin/login", async ({ browser }) => {
    const { ctx, page } = await unauthContext(browser);
    await page.goto("/admin/seo");
    await expect(page).toHaveURL(/\/admin\/login/);
    await ctx.close();
  });

  test("page loads", async ({ page }) => {
    await page.goto("/admin/seo");
    // SettingsForm heading is "SEO & Meta Tags".
    await expect(page.getByRole("heading", { name: /seo/i })).toBeVisible();
  });

  test("update home title and verify <title> tag on public page", async ({ page, browser }) => {
    await page.goto("/admin/seo");
    // First field is "Homepage — Title" (key seo_home_title); labels are not associated.
    const titleInput = page.locator("form").getByRole("textbox").first();
    await titleInput.clear();
    await titleInput.fill("[E2E] Test Site Title");
    await page.getByRole("button", { name: /simpan/i }).click();
    await expect(page.getByText(/disimpan/i)).toBeVisible({ timeout: 8_000 });

    // Verify <title> tag on the public homepage (unauthenticated to avoid redirect).
    const { ctx, page: pub } = await unauthContext(browser);
    await pub.goto("/");
    await expect(pub).toHaveTitle(/E2E.*Test Site Title|Test Site Title/);
    await ctx.close();
  });
});

// ─── Footer (Singleton) ───────────────────────────────────────────────────────

test.describe("Admin — Footer", () => {
  test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, "Admin credentials not configured");

  test("unauthenticated → redirect to /admin/login", async ({ browser }) => {
    const { ctx, page } = await unauthContext(browser);
    await page.goto("/admin/footer");
    await expect(page).toHaveURL(/\/admin\/login/);
    await ctx.close();
  });

  test("page loads", async ({ page }) => {
    await page.goto("/admin/footer");
    await expect(page.getByRole("heading", { name: /footer/i })).toBeVisible();
  });

  test("save footer settings without error", async ({ page }) => {
    await page.goto("/admin/footer");
    await page.getByRole("button", { name: /simpan/i }).click();
    await expect(page.getByText(/disimpan/i)).toBeVisible({ timeout: 8_000 });
  });
});

// ─── Navigation (Singleton) ───────────────────────────────────────────────────

test.describe("Admin — Navigation", () => {
  test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, "Admin credentials not configured");

  test("unauthenticated → redirect to /admin/login", async ({ browser }) => {
    const { ctx, page } = await unauthContext(browser);
    await page.goto("/admin/navigation");
    await expect(page).toHaveURL(/\/admin\/login/);
    await ctx.close();
  });

  test("page loads", async ({ page }) => {
    await page.goto("/admin/navigation");
    await expect(page.getByRole("heading", { name: /navigation|nav/i })).toBeVisible();
  });
});
