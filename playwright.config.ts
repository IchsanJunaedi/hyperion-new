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
        // Depends on owner-setup so the single owner login (owner.json) happens
        // first; seed then only logs in the 4 role accounts. No concurrent
        // same-account owner login → owner.json stays valid.
        name: "workspace-seed",
        testMatch: "**/workspace/setup/seed.ts",
        dependencies: ["owner-setup"],
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
  // Local runs use a production server (see webServer below) with pre-compiled
  // routes, so the on-demand-compile latency that previously made multi-step
  // create flows flaky is gone → zero local retries. CI keeps a small safety net
  // for transient network blips to Supabase. Workers are capped at 50% to keep
  // memory/CPU comfortable for the single server under the full suite.
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : "50%",

  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
  ],

  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    // Opt-in slow motion for watching a run with --headed: each Playwright
    // action waits this many ms so you can see what it types/clicks. Default 0
    // (no effect on CI / normal runs). Example: E2E_SLOWMO=800
    launchOptions: { slowMo: Number(process.env.E2E_SLOWMO) || 0 },
  },

  projects: [
    {
      // The auth-flow specs (login/logout/redirect). This is the ONLY spec that
      // logs out, and the app's signOut() is global-scope — it revokes ALL of
      // the owner's sessions. So it must run FIRST, before owner.json is
      // created, or its global logout would invalidate the shared owner session
      // that every authed spec relies on. It logs in itself → needs no state.
      name: "auth-flow",
      testMatch: "**/auth.spec.ts",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      // Logs the owner in once → e2e/.auth/owner.json, AFTER auth-flow's global
      // logout has already happened. The authed legacy specs and dashboard-tests
      // both reuse this single session, so it must not be revoked mid-run.
      name: "owner-setup",
      testMatch: "**/setup/owner-auth.setup.ts",
      dependencies: ["auth-flow"],
      use: { ...devices["Desktop Chrome"] },
    },
    {
      // Legacy root specs that need an authenticated owner (dashboard,
      // announcement, vod-review). They reuse owner.json via test.use(). auth.spec
      // is excluded (it has its own project above); workspace/ and admin/ have
      // their own dedicated projects, so they're ignored here too.
      name: "chromium",
      testMatch: "**/*.spec.ts",
      testIgnore: ["**/workspace/**", "**/admin/**", "**/auth.spec.ts"],
      dependencies: ["owner-setup"],
      use: { ...devices["Desktop Chrome"] },
    },
    ...adminProjects,
    ...workspaceProjects,
  ],

  // E2E runs against a PRODUCTION build by default: `next start` serves
  // pre-compiled routes, eliminating the on-demand-compile latency and
  // turbopack instability of `next dev` that caused create-flow flakes — this
  // is what makes zero retries possible. CI builds in its own workflow step, so
  // there we only `start`. For quick local iteration against the dev server
  // (faster startup, but flaky), set E2E_DEV_SERVER=1.
  webServer: {
    command: process.env.E2E_DEV_SERVER
      ? "npm run dev"
      : process.env.CI
        ? "npm run start"
        : "npm run build && npm run start",
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    // Generous: a cold production build can take a couple of minutes.
    timeout: 300_000,
  },
});
