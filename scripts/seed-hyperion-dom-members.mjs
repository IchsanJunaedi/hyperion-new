import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars");
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const members = [
  { email: "juned@hyperiondom.gg", display_name: "Juned", main_role: "Midlane", role: "captain" },
  { email: "prit@hyperiondom.gg",  display_name: "Prit",  main_role: "Goldlane", role: "member" },
  { email: "karung@hyperiondom.gg", display_name: "Karung", main_role: "Roam", role: "member" },
];

// Find org
const { data: org, error: orgErr } = await admin
  .from("organizations")
  .select("id, name")
  .eq("slug", "hyperion-dom")
  .maybeSingle();

if (orgErr || !org) {
  console.error("Org not found:", orgErr);
  process.exit(1);
}
console.log(`Org: ${org.name} (${org.id})`);

for (const m of members) {
  console.log(`\nAdding ${m.display_name}...`);

  // Create auth user
  const { data: authData, error: authErr } = await admin.auth.admin.createUser({
    email: m.email,
    password: "Hyperion2026!",
    email_confirm: true,
  });

  if (authErr) {
    console.error(`  Auth error for ${m.display_name}:`, authErr.message);
    continue;
  }

  const userId = authData.user.id;
  console.log(`  Auth user created: ${userId}`);

  // Upsert profile
  const { error: profileErr } = await admin.from("profiles").upsert({
    id: userId,
    display_name: m.display_name,
    email: m.email,
  });

  if (profileErr) {
    console.error(`  Profile error:`, profileErr.message);
    continue;
  }
  console.log(`  Profile OK`);

  // Add to team_members
  const { error: memberErr } = await admin.from("team_members").insert({
    user_id: userId,
    organization_id: org.id,
    role: m.role,
    main_role: m.main_role,
    is_active: true,
  });

  if (memberErr) {
    console.error(`  team_members error:`, memberErr.message);
    continue;
  }
  console.log(`  team_members OK — role: ${m.role}, main_role: ${m.main_role}`);
}

console.log("\nDone.");
