/**
 * tests/global-setup.ts
 *
 * Dijalankan sekali SEBELUM semua test di folder `tests/` (auth + workspace).
 * Membersihkan semua data dummy test lama (user @hyperion.com dan org yang dibuat
 * oleh test sebelumnya) agar setiap run bersih dan tidak ada collision.
 *
 * Test di sini bersifat self-registering (buat user baru tiap run via /register),
 * jadi cleanup harus dilakukan SEBELUM run, bukan sesudah.
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { WebSocket as WsWebSocket } from "ws";

// Polyfill WebSocket for Node.js < 22 (Supabase realtime client requires it)
// Node.js 20 lacks native WebSocket — this prevents the startup crash.
if (!globalThis.WebSocket) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).WebSocket = WsWebSocket;
}

// Load env vars (playwright config juga load ini, tapi global-setup jalan sendiri)
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Pattern email yang dipakai oleh test self-registering di tests/
const TEST_EMAIL_PATTERN = "%@hyperion.com";
// Slug prefix yang dipakai workspace.spec.ts untuk org buatan test
const TEST_SLUG_PREFIX = "team-";
// Slug E2E workspace seed (jangan hapus ini — dipakai e2e/workspace/)
const E2E_SEED_SLUG = "e2e-test";

async function globalSetup() {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.warn(
      "[global-setup] NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set — skipping DB cleanup"
    );
    return;
  }

  const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log("\n🧹 [global-setup] Membersihkan test data lama...");

  // ── 1. Hapus test organizations yang dibuat oleh tests/ (bukan e2e-test slug)
  //        Ini cascade-hapus team_members, divisions, scrims, dll jika RLS + FK cascade
  const { data: testOrgs, error: orgFetchErr } = await admin
    .from("organizations")
    .select("id, slug")
    .like("slug", `${TEST_SLUG_PREFIX}%`);

  if (orgFetchErr) {
    console.error("[global-setup] Error fetching test orgs:", orgFetchErr.message);
  } else if (testOrgs && testOrgs.length > 0) {
    const orgIds = testOrgs.map((o) => o.id);

    // Hapus child data yang tidak auto-cascade
    await Promise.allSettled([
      admin.from("scrims").delete().in("organization_id", orgIds),
      admin.from("calendar_events").delete().in("organization_id", orgIds),
      admin.from("announcements").delete().in("organization_id", orgIds),
      admin.from("polls").delete().in("organization_id", orgIds),
      admin.from("strategy_notes").delete().in("organization_id", orgIds),
      admin.from("team_members").delete().in("organization_id", orgIds),
      admin.from("divisions").delete().in("organization_id", orgIds),
    ]);

    const { error: delOrgErr } = await admin
      .from("organizations")
      .delete()
      .in("id", orgIds);

    if (delOrgErr) {
      console.error("[global-setup] Error deleting test orgs:", delOrgErr.message);
    } else {
      console.log(`  ✓ Deleted ${testOrgs.length} test org(s): ${testOrgs.map((o) => o.slug).join(", ")}`);
    }
  } else {
    console.log("  ✓ No leftover test orgs found");
  }

  // ── 2. Hapus test users (email @hyperion.com) kecuali owner dan seed accounts
  //        Gunakan admin auth API untuk list dan delete
  const ownerEmail = process.env.OWNER_EMAIL ?? "owner@hyperion.com";

  // Collect emails to preserve (owner + E2E seed accounts)
  const preserveEmails = new Set<string>([ownerEmail]);

  // Preserve E2E workspace seed accounts (dari e2e/workspace/setup/seed.ts)
  const seedEnvKeys = [
    "E2E_OWNER_EMAIL",
    "E2E_MANAGER_EMAIL",
    "E2E_COACH_EMAIL",
    "E2E_CAPTAIN_EMAIL",
    "E2E_MEMBER_EMAIL",
    "E2E_ADMIN_EMAIL",
  ];
  for (const key of seedEnvKeys) {
    if (process.env[key]) preserveEmails.add(process.env[key]!);
  }

  try {
    const { data: { users }, error: listErr } = await admin.auth.admin.listUsers({ perPage: 1000 });
    if (listErr) throw listErr;

    const testUsers = users.filter(
      (u) =>
        u.email &&
        u.email.endsWith("@hyperion.com") &&
        !preserveEmails.has(u.email)
    );

    if (testUsers.length > 0) {
      let deleted = 0;
      let failed = 0;
      for (const u of testUsers) {
        const { error } = await admin.auth.admin.deleteUser(u.id);
        if (error) {
          console.error(`  ✗ Failed to delete ${u.email}: ${error.message}`);
          failed++;
        } else {
          deleted++;
        }
      }
      console.log(`  ✓ Deleted ${deleted} test user(s)${failed > 0 ? `, ${failed} failed` : ""}`);
    } else {
      console.log("  ✓ No leftover test users found");
    }
  } catch (err) {
    console.error("[global-setup] Error cleaning test users:", err);
  }

  console.log("✅ [global-setup] DB cleanup selesai — test siap jalan bersih\n");
}

export default globalSetup;
