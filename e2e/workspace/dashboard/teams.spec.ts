import { test, expect } from "@playwright/test";
import { CREDENTIALS, TEST_TEAM_SLUG } from "../helpers/auth";
import { createClient } from "@supabase/supabase-js";

async function getOrgName(): Promise<string | null> {
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
  const { data } = await client.from("organizations").select("name").eq("slug", TEST_TEAM_SLUG).maybeSingle();
  return data?.name ?? null;
}

async function restoreOrgName(name: string) {
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
  await client.from("organizations").update({ name }).eq("slug", TEST_TEAM_SLUG);
}

test.describe.serial("Dashboard — Teams (Org Settings)", () => {
  test.skip(!CREDENTIALS.owner.email, "Owner credentials not configured");

  let originalName: string | null = null;

  test.beforeAll(async () => {
    originalName = await getOrgName();
  });

  test.afterAll(async () => {
    if (originalName) await restoreOrgName(originalName);
  });

  test("unauth → redirect to /dashboard/login", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/dashboard/teams");
    await expect(page).toHaveURL(/\/dashboard\/login/);
  });

  test("page loads with Setting Tim heading", async ({ page }) => {
    await page.goto("/dashboard/teams");
    await expect(page.getByRole("heading", { name: /setting tim/i })).toBeVisible();
  });

  test("seeded [E2E] Org is listed", async ({ page }) => {
    await page.goto("/dashboard/teams");
    await expect(page.getByText(/\[E2E\] Org/i).first()).toBeVisible({ timeout: 8_000 });
  });

  test("edit org name inline", async ({ page }) => {
    await page.goto("/dashboard/teams");
    // Click the pencil edit button in the [E2E] Org name row (it sits next to the h3)
    const nameRow = page.locator("h3").filter({ hasText: /\[E2E\] Org/i }).locator("..");
    await nameRow.getByRole("button").first().click();
    // Input appears (h3 is replaced) — fill and press Enter to save (onKeyDown Enter → handleSave)
    const input = page.getByRole("textbox").first();
    await input.fill("[E2E] Org Updated");
    await input.press("Enter");
    await expect(page.getByText(/nama tim diubah/i).first()).toBeVisible({ timeout: 8_000 });
  });
});
