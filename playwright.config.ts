import { defineConfig, devices, type Project } from "@playwright/test";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL ?? "http://localhost:3000";

// ─────────────────────────────────────────────────────────────────────────────
// Credential gating
//
// The workspace/manage/integration suites require a fully-seeded Supabase plus
// five role accounts (owner + manager + coach + captain + member). The admin
// suite requires a separate admin account. CI only provisions the owner creds,
// so those seed-dependent projects must be EXCLUDED there — otherwise their
// project-level `storageState` files never get created and every spec errors.
//
// We therefore build the project list conditionally:
//   • `chromium`      — always runs the self-authenticating legacy root specs.
//   • admin projects  — only when E2E_ADMIN_* creds are present.
//   • workspace projects + seed — only when ALL five role creds are present.
//
// Locally (all creds in .env.local) the full suite runs. In CI (owner only)
// just the legacy specs run, and they pass — green without false positives.
// ─────────────────────────────────────────────────────────────────────────────
const has = (...keys: string[]) => keys.every((k) => !!process.env[k]);

const HAS_ADMIN_CREDS = has("E2E_ADMIN_EMAIL", "E2E_ADMIN_PASSWORD");
const HAS_ALL_ROLE_CREDS = has(
  "E2E_OWNER_EMAIL",
  "E2E_OWNER_PASSWORD",
  "E2E_MANAGER_EMAIL",
  "E2E_MANAGER_PASSWORD",
  "E2E_COACH_EMAIL",
  "E2E_COACH_PASSWORD",
  "E2E_CAPTAIN_EMAIL",
  "E2E_CAPTAIN_PASSWORD",
  "E2E_MEMBER_EMAIL",
  "E2E_MEMBER_PASSWORD"
);

if (!HAS_ALL_ROLE_CREDS) {
  console.log(
    "[playwright] Role creds incomplete → skipping workspace/manage/integration projects (legacy specs only)."
  );
}
if (!HAS_ADMIN_CREDS) {
  console.log("[playwright] Admin creds absent → skipping admin projects.");
}

const adminProjects: Project[] = HAS_ADMIN_CREDS
  ? [
      {
        name: "admin-setup",
        testMatch: "**/admin/setup/auth.setup.ts",
        use: { ...devices["Desktop Chrome"] },
      },
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
    ]
  : [];

const workspaceProjects: Project[] = HAS_ALL_ROLE_CREDS
  ? [
      {
        name: "workspace-seed",
        testMatch: "**/workspace/setup/seed.ts",
        use: { ...devices["Desktop Chrome"] },
      },
      {
        name: "dashboard-tests",
        testDir: "./e2e/workspace/dashboard",
        testMatch: "**/*.spec.ts",
        dependencies: ["workspace-seed"],
        use: {
          ...devices["Desktop Chrome"],
          storageState: "e2e/.auth/owner.json",
        },
      },
      {
        name: "manage-tests",
        testDir: "./e2e/workspace/manage",
        testMatch: "**/*.spec.ts",
        dependencies: ["workspace-seed"],
        use: {
          ...devices["Desktop Chrome"],
          storageState: "e2e/.auth/manager.json",
        },
      },
      {
        // Workspace specs select their own per-role storageState via test.use(),
        // so no default storageState is set on the project.
        name: "workspace-tests",
        testDir: "./e2e/workspace/workspace",
        testMatch: "**/*.spec.ts",
        dependencies: ["workspace-seed"],
        use: {
          ...devices["Desktop Chrome"],
        },
      },
      {
        // Integration specs drive multiple roles per flow via test.use().
        name: "integration-tests",
        testDir: "./e2e/workspace/integration",
        testMatch: "**/*.spec.ts",
        dependencies: ["workspace-seed"],
        use: {
          ...devices["Desktop Chrome"],
        },
      },
    ]
  : [];

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // CI runs serially (workers: 1) so it retries 2×. Local runs go parallel
  // against a cold dev server that compiles routes on-demand; concurrent
  // form-logins as the same owner can race and bounce to /login on the first
  // hit. One local retry absorbs that startup flake without masking real bugs.
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : undefined,

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
    {
      // Legacy self-authenticating specs at the e2e root (auth, dashboard,
      // announcement, vod-review). These log in inside the test via the
      // auth-helper, so they need no storageState. The workspace/ and admin/
      // subtrees have their own dedicated projects with proper auth + seeding,
      // so they MUST be ignored here or they would run a second time
      // unauthenticated and fail.
      name: "chromium",
      testMatch: "**/*.spec.ts",
      testIgnore: ["**/workspace/**", "**/admin/**"],
      use: { ...devices["Desktop Chrome"] },
    },
    ...adminProjects,
    ...workspaceProjects,
  ],

  // Auto-start Next.js dev server for local runs
  webServer: {
    command: "npm run dev",
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
