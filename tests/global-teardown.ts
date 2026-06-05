/**
 * tests/global-teardown.ts
 *
 * Dijalankan sekali SETELAH semua test di folder `tests/` selesai.
 * Best-effort cleanup — error di sini tidak gagalkan test report.
 *
 * Berguna untuk CI agar tidak meninggalkan test data di cloud DB.
 * Local dev: tidak kritis karena global-setup sudah cleanup di awal.
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const TEST_SLUG_PREFIX = "team-";

async function globalTeardown() {
  if (!SUPABASE_URL || !SERVICE_KEY) return;

  const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log("\n🧹 [global-teardown] Post-run cleanup...");

  try {
    // Hapus orgs yang dibuat selama test run ini
    const { data: testOrgs } = await admin
      .from("organizations")
      .select("id, slug")
      .like("slug", `${TEST_SLUG_PREFIX}%`);

    if (testOrgs && testOrgs.length > 0) {
      const orgIds = testOrgs.map((o) => o.id);

      await Promise.allSettled([
        admin.from("scrims").delete().in("organization_id", orgIds),
        admin.from("calendar_events").delete().in("organization_id", orgIds),
        admin.from("announcements").delete().in("organization_id", orgIds),
        admin.from("polls").delete().in("organization_id", orgIds),
        admin.from("strategy_notes").delete().in("organization_id", orgIds),
        admin.from("team_members").delete().in("organization_id", orgIds),
        admin.from("divisions").delete().in("organization_id", orgIds),
      ]);

      await admin.from("organizations").delete().in("id", orgIds);
      console.log(`  ✓ Cleaned ${testOrgs.length} test org(s)`);
    }

    // Hapus test users yang tersisa
    const ownerEmail = process.env.OWNER_EMAIL ?? "owner@hyperion.com";
    const preserveEmails = new Set<string>([ownerEmail]);
    const seedEnvKeys = [
      "E2E_OWNER_EMAIL", "E2E_MANAGER_EMAIL", "E2E_COACH_EMAIL",
      "E2E_CAPTAIN_EMAIL", "E2E_MEMBER_EMAIL", "E2E_ADMIN_EMAIL",
    ];
    for (const key of seedEnvKeys) {
      if (process.env[key]) preserveEmails.add(process.env[key]!);
    }

    const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 1000 });
    const testUsers = users.filter(
      (u) => u.email?.endsWith("@hyperion.com") && !preserveEmails.has(u.email!)
    );

    for (const u of testUsers) {
      await admin.auth.admin.deleteUser(u.id);
    }

    if (testUsers.length > 0) {
      console.log(`  ✓ Cleaned ${testUsers.length} test user(s)`);
    }
  } catch (err) {
    // Non-blocking — teardown errors don't affect test report
    console.warn("[global-teardown] Cleanup error (non-critical):", err);
  }

  console.log("✅ [global-teardown] Done\n");
}

export default globalTeardown;
