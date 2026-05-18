import { type Page } from "@playwright/test";

export const OWNER_EMAIL = process.env.E2E_OWNER_EMAIL ?? "";
export const OWNER_PASSWORD = process.env.E2E_OWNER_PASSWORD ?? "";

/**
 * Reusable login helper — can be imported into other spec files.
 */
export async function loginAsOwner(page: Page) {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(OWNER_EMAIL);
  await page.getByLabel(/password/i).fill(OWNER_PASSWORD);
  await page.getByRole("button", { name: /masuk|login|sign in/i }).click();
  // Wait for redirect away from /login
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), {
    timeout: 15_000,
  });
}
