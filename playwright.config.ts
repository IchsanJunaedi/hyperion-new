import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

// Load .env.local first, then fall back to .env
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./tests",
  timeout: 300_000, // workspace E2E can take up to 5 minutes
  expect: { timeout: 90_000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // sequential to prevent DB/state collisions

  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
  ],

  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  projects: [
    // Workspace / auth tests (tests/ folder)
    {
      name: "chromium",
      testDir: "./tests",
      use: { ...devices["Desktop Chrome"] },
    },

    // Admin auth setup
    {
      name: "admin-setup",
      testDir: "./e2e",
      testMatch: "**/admin/setup/auth.setup.ts",
      use: { ...devices["Desktop Chrome"] },
    },

    // Admin panel E2E tests (e2e/admin/ folder)
    {
      name: "admin-tests",
      testDir: "./e2e/admin",
      testMatch: "**/*.spec.ts",
      dependencies: ["admin-setup"],
      use: {
        ...devices["Desktop Chrome"],
        storageState: "e2e/.auth/admin.json",
      },
    },
  ],

  // Auto-start Next.js dev server for local runs
  webServer: {
    command: "npm run dev",
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
