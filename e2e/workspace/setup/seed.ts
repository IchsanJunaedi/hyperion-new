import { test as setup } from "@playwright/test";
import { chromium } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import path from "path";
import fs from "fs";

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL ?? "http://localhost:3000";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const AUTH_DIR = path.join(__dirname, "../../.auth");

// Temporary password set on owner account for E2E testing
const OWNER_E2E_PASSWORD = "E2eOwnerTemp001!";

const ROLES = [
  { name: "manager",  email: process.env.E2E_MANAGER_EMAIL!,  password: process.env.E2E_MANAGER_PASSWORD!,  role: "manager"  },
  { name: "coach",    email: process.env.E2E_COACH_EMAIL!,    password: process.env.E2E_COACH_PASSWORD!,    role: "coach"    },
  { name: "captain",  email: process.env.E2E_CAPTAIN_EMAIL!,  password: process.env.E2E_CAPTAIN_PASSWORD!,  role: "captain"  },
  { name: "member",   email: process.env.E2E_MEMBER_EMAIL!,   password: process.env.E2E_MEMBER_PASSWORD!,   role: "member"   },
] as const;

setup.skip(
  !process.env.E2E_OWNER_EMAIL,
  "E2E_OWNER_EMAIL not set in .env.local"
);

setup("seed workspace data and save auth states", async () => {
  // Heavy setup: admin API calls + 5 sequential form logins (each can be slow
  // on a cold dev server). Give it plenty of headroom beyond the global 30s.
  setup.setTimeout(180_000);
  fs.mkdirSync(AUTH_DIR, { recursive: true });

  const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 1. Find owner user
  const ownerEmail = process.env.E2E_OWNER_EMAIL!;
  const { data: { users: allUsers } } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const ownerUser = allUsers.find((u) => u.email === ownerEmail);
  if (!ownerUser) throw new Error(`Owner user not found: ${ownerEmail}`);

  // Set a known temporary password on the owner account for E2E testing
  await admin.auth.admin.updateUserById(ownerUser.id, { password: OWNER_E2E_PASSWORD });
  console.log(`  [seed] owner password set to E2E temp value`);

  // 2. Create 4 test users idempotently
  const userIds: Record<string, string> = {};
  for (const r of ROLES) {
    const existing = allUsers.find((u) => u.email === r.email);
    if (existing) {
      userIds[r.name] = existing.id;
      console.log(`  [seed] ${r.name} already exists`);
    } else {
      const { data, error } = await admin.auth.admin.createUser({
        email: r.email,
        password: r.password,
        email_confirm: true,
      });
      if (error) throw new Error(`Create ${r.name}: ${error.message}`);
      userIds[r.name] = data.user.id;
      console.log(`  [seed] created ${r.name}`);
    }
    const displayName = `[E2E] ${r.name.charAt(0).toUpperCase() + r.name.slice(1)}`;
    await admin.from("profiles").upsert(
      {
        id: userIds[r.name],
        full_name: displayName,
        display_name: displayName,
        email: r.email,
      },
      { onConflict: "id" }
    );
  }

  // 3. Create org idempotently
  let { data: org } = await admin
    .from("organizations")
    .select("id")
    .eq("slug", "e2e-test")
    .maybeSingle();

  if (!org) {
    const { data, error } = await admin
      .from("organizations")
      .insert({
        name: "[E2E] Org",
        slug: "e2e-test",
        owner_id: ownerUser.id,
        tier: "komunitas",
        social_links: {},
      })
      .select("id")
      .single();
    if (error) throw new Error(`Create org: ${error.message}`);
    org = data;
    console.log("  [seed] created [E2E] Org");
  } else {
    console.log("  [seed] [E2E] Org already exists");
  }
  const orgId = org.id;

  // 4. Create division idempotently (linked to org)
  let { data: div } = await admin
    .from("divisions")
    .select("id")
    .eq("name", "[E2E] Division")
    .eq("organization_id", orgId)
    .maybeSingle();

  if (!div) {
    const { data, error } = await admin
      .from("divisions")
      .insert({
        name: "[E2E] Division",
        slug: "e2e-division",
        game: "Mobile Legends",
        organization_id: orgId,
      })
      .select("id")
      .single();
    if (error) throw new Error(`Create division: ${error.message}`);
    div = data;
    console.log("  [seed] created [E2E] Division");
  } else {
    console.log("  [seed] [E2E] Division already exists");
  }
  const divisionId = div.id;

  // 5. Assign roles in team_members idempotently.
  // Self-healing: if a row already exists, ensure its role + division_id match
  // the intended seed state (older rows may have drifted, e.g. captain with a
  // null division_id from a previous seed version).
  for (const r of ROLES) {
    const wantDivision = r.role === "captain" ? divisionId : null;
    const { data: existing } = await admin
      .from("team_members")
      .select("id, role, division_id")
      .eq("user_id", userIds[r.name])
      .eq("organization_id", orgId)
      .maybeSingle();

    if (!existing) {
      const { error } = await admin.from("team_members").insert({
        user_id: userIds[r.name],
        organization_id: orgId,
        role: r.role,
        is_active: true,
        division_id: wantDivision,
      });
      if (error) throw new Error(`Assign ${r.name}: ${error.message}`);
      console.log(`  [seed] assigned ${r.name}`);
    } else if (existing.role !== r.role || existing.division_id !== wantDivision) {
      const { error } = await admin
        .from("team_members")
        .update({ role: r.role, is_active: true, division_id: wantDivision })
        .eq("id", existing.id);
      if (error) throw new Error(`Update ${r.name}: ${error.message}`);
      console.log(`  [seed] corrected ${r.name} (role/division)`);
    } else {
      console.log(`  [seed] ${r.name} already assigned`);
    }
  }

  // 6. Save storage states via form-based login (most reliable for @supabase/ssr cookie setting)
  console.log("  [seed] saving storage states via form login...");
  const browser = await chromium.launch();

  // Owner — form login at /login with temp password
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto(`${BASE_URL}/login`);
    await page.getByLabel(/email/i).fill(ownerEmail);
    await page.getByLabel(/password/i).fill(OWNER_E2E_PASSWORD);
    await page.getByRole("button", { name: /masuk/i }).click();
    await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 15_000 });
    await ctx.storageState({ path: path.join(AUTH_DIR, "owner.json") });
    await ctx.close();
    console.log("  [seed] saved owner.json");
  }

  // Other roles — form login at /login with their passwords
  for (const r of ROLES) {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto(`${BASE_URL}/login`);
    await page.getByLabel(/email/i).fill(r.email);
    await page.getByLabel(/password/i).fill(r.password);
    await page.getByRole("button", { name: /masuk/i }).click();
    await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 15_000 });
    await ctx.storageState({ path: path.join(AUTH_DIR, `${r.name}.json`) });
    await ctx.close();
    console.log(`  [seed] saved ${r.name}.json`);
  }

  await browser.close();
  console.log("✅ Workspace seed complete");
  console.log("⚠️  Note: owner account password has been changed to E2E temp value.");
  console.log("    Update E2E_OWNER_PASSWORD=E2eOwnerTemp001! in .env.local for future runs.");
});
