import { test as setup } from "@playwright/test";
import { chromium } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import path from "path";
import fs from "fs";

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL ?? "http://localhost:3000";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const AUTH_DIR = path.join(__dirname, "../../.auth");

const ROLES = [
  { name: "manager",  email: process.env.E2E_MANAGER_EMAIL!,  password: process.env.E2E_MANAGER_PASSWORD!,  role: "manager"  },
  { name: "coach",    email: process.env.E2E_COACH_EMAIL!,    password: process.env.E2E_COACH_PASSWORD!,    role: "coach"    },
  { name: "captain",  email: process.env.E2E_CAPTAIN_EMAIL!,  password: process.env.E2E_CAPTAIN_PASSWORD!,  role: "captain"  },
  { name: "member",   email: process.env.E2E_MEMBER_EMAIL!,   password: process.env.E2E_MEMBER_PASSWORD!,   role: "member"   },
] as const;

setup.skip(
  !process.env.E2E_OWNER_EMAIL || !process.env.E2E_OWNER_PASSWORD,
  "E2E_OWNER_EMAIL / E2E_OWNER_PASSWORD not set in .env.local"
);

setup("seed workspace data and save auth states", async () => {
  fs.mkdirSync(AUTH_DIR, { recursive: true });

  const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 1. Find owner user
  const ownerEmail = process.env.E2E_OWNER_EMAIL!;
  const { data: { users: allUsers } } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const ownerUser = allUsers.find((u) => u.email === ownerEmail);
  if (!ownerUser) throw new Error(`Owner user not found: ${ownerEmail}`);

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
    await admin.from("profiles").upsert(
      {
        id: userIds[r.name],
        full_name: `[E2E] ${r.name.charAt(0).toUpperCase() + r.name.slice(1)}`,
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

  // 5. Assign roles in team_members idempotently
  for (const r of ROLES) {
    const { data: existing } = await admin
      .from("team_members")
      .select("id")
      .eq("user_id", userIds[r.name])
      .eq("organization_id", orgId)
      .maybeSingle();

    if (!existing) {
      const { error } = await admin.from("team_members").insert({
        user_id: userIds[r.name],
        organization_id: orgId,
        role: r.role,
        is_active: true,
        division_id: r.role === "captain" ? divisionId : null,
      });
      if (error) throw new Error(`Assign ${r.name}: ${error.message}`);
      console.log(`  [seed] assigned ${r.name}`);
    } else {
      console.log(`  [seed] ${r.name} already assigned`);
    }
  }

  // 6. Save storage states via browser
  console.log("  [seed] saving storage states...");
  const browser = await chromium.launch();

  // Save storage states via magic link (bypasses password entirely)
  const allRoles: Array<{ name: string; email: string }> = [
    { name: "owner", email: ownerEmail },
    ...ROLES.map((r) => ({ name: r.name, email: r.email })),
  ];

  for (const r of allRoles) {
    // Generate magic link via admin API (no password needed)
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: r.email,
    });
    if (linkError) throw new Error(`Magic link for ${r.name}: ${linkError.message}`);

    const magicUrl = linkData.properties.action_link;
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    // Navigate to magic link — Supabase redirects to PKCE callback then to app
    await page.goto(magicUrl);
    await page.waitForURL(
      (url) =>
        !url.pathname.includes("/login") &&
        !url.pathname.includes("/auth") &&
        !url.hostname.includes("supabase"),
      { timeout: 20_000 }
    );
    await ctx.storageState({ path: path.join(AUTH_DIR, `${r.name}.json`) });
    await ctx.close();
    console.log(`  [seed] saved ${r.name}.json`);
  }

  await browser.close();
  console.log("✅ Workspace seed complete");
});
