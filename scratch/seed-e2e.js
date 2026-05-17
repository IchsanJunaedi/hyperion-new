const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

// 1. Read .env.local file to get Supabase credentials
const envPath = path.join(__dirname, "..", ".env.local");
if (!fs.existsSync(envPath)) {
  console.error("❌ File .env.local tidak ditemukan! Pastikan Anda sudah membuat file .env.local.");
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, "utf8");

function getEnvVar(name) {
  const match = envContent.match(new RegExp(`^${name}=(.*)$`, "m"));
  return match ? match[1].trim() : null;
}

const supabaseUrl = getEnvVar("NEXT_PUBLIC_SUPABASE_URL");
const serviceRoleKey = getEnvVar("SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY tidak ditemukan di .env.local!");
  process.exit(1);
}

console.log("🔌 Mengkoneksikan ke Supabase...");
// Initialize Supabase Admin client using the service role key
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const TEST_EMAIL = "test@gmail.com";
const TEST_PASSWORD = "Persib1933";
const TEST_SLUG = "hyperiontest"; // Slugs are usually lowercase in urls
const TEST_TEAM_NAME = "Hyperion TEST";

async function main() {
  try {
    console.log(`👤 Mengecek / Membuat user: ${TEST_EMAIL}...`);
    
    // Check if user already exists
    let userId;
    const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) throw listError;
    
    const existingUser = usersData.users.find(u => u.email === TEST_EMAIL);
    
    if (existingUser) {
      console.log("ℹ️ User sudah terdaftar. Mengupdate password agar sesuai...");
      userId = existingUser.id;
      const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
        password: TEST_PASSWORD,
        email_confirm: true
      });
      if (updateError) throw updateError;
    } else {
      console.log("✨ Mendaftarkan user baru...");
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        email_confirm: true,
        user_metadata: { display_name: "E2E Tester" }
      });
      if (createError) throw createError;
      userId = newUser.user.id;
    }

    console.log(`📁 Membuat / Mengupdate profile untuk user ${userId}...`);
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({
        id: userId,
        full_name: TEST_TEAM_NAME,
        username: "e2etester",
        display_name: "E2E Tester",
        avatar_url: null
      });
    if (profileError) throw profileError;

    console.log(`🏢 Mengecek / Membuat tim (organization) dengan slug: ${TEST_SLUG}...`);
    let orgId;
    const { data: existingOrg, error: orgFetchError } = await supabase
      .from("organizations")
      .select("id")
      .eq("slug", TEST_SLUG)
      .maybeSingle();
      
    if (orgFetchError) throw orgFetchError;
    
    if (existingOrg) {
      console.log("ℹ️ Organisasi sudah ada.");
      orgId = existingOrg.id;
      // Ensure owner is updated
      const { error: orgUpdateError } = await supabase
        .from("organizations")
        .update({ owner_id: userId })
        .eq("id", orgId);
      if (orgUpdateError) throw orgUpdateError;
    } else {
      console.log("✨ Membuat organisasi baru...");
      const { data: newOrg, error: orgCreateError } = await supabase
        .from("organizations")
        .insert({
          name: TEST_TEAM_NAME,
          slug: TEST_SLUG,
          tier: "pro",
          owner_id: userId
        })
        .select("id")
        .single();
      if (orgCreateError) throw orgCreateError;
      orgId = newOrg.id;
    }

    console.log(`🎮 Menambahkan divisi default (Mobile Legends) untuk tim...`);
    let divId;
    const { data: existingDiv, error: divFetchError } = await supabase
      .from("divisions")
      .select("id")
      .eq("organization_id", orgId)
      .eq("slug", "mobile-legends")
      .maybeSingle();
      
    if (divFetchError) throw divFetchError;
    
    if (existingDiv) {
      console.log("ℹ️ Divisi sudah ada.");
      divId = existingDiv.id;
    } else {
      console.log("✨ Membuat divisi baru...");
      const { data: newDiv, error: divCreateError } = await supabase
        .from("divisions")
        .insert({
          organization_id: orgId,
          name: "Mobile Legends",
          slug: "mobile-legends",
          game: "mobile_legends"
        })
        .select("id")
        .single();
      if (divCreateError) throw divCreateError;
      divId = newDiv.id;
    }

    console.log(`🔗 Menghubungkan user sebagai owner di tabel team_members...`);
    // Delete existing records to avoid duplicates
    await supabase
      .from("team_members")
      .delete()
      .eq("organization_id", orgId)
      .eq("user_id", userId);

    const { error: memberError } = await supabase
      .from("team_members")
      .insert([
        {
          organization_id: orgId,
          division_id: divId,
          user_id: userId,
          role: "owner",
          is_active: true
        },
        {
          organization_id: orgId,
          division_id: null,
          user_id: userId,
          role: "owner",
          is_active: true
        }
      ]);
      
    if (memberError) throw memberError;

    console.log("\n🎉 SEEDING BERHASIL! DETAIL AKUN:");
    console.log("=========================================");
    console.log(`📧 Email    : ${TEST_EMAIL}`);
    console.log(`🔑 Password : ${TEST_PASSWORD}`);
    console.log(`🔗 Slug Tim : ${TEST_SLUG}`);
    console.log("=========================================\n");
    console.log("Sekarang data ini sudah 100% siap dipakai untuk tes E2E!");
    
  } catch (error) {
    console.error("❌ Gagal melakukan seeding database:", error);
  }
}

main();
