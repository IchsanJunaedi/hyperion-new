// Supabase Edge Function — weekly-digest
//
// Sends a weekly summary WhatsApp message to each org owner every Monday
// at 09:00 WIB (scheduled via pg_cron at 02:00 UTC).
//
// Env (auto-injected or set via `supabase secrets set`):
//   SUPABASE_URL            — auto-injected
//   SUPABASE_SERVICE_ROLE_KEY — auto-injected
//   FONNTE_API_TOKEN        — Fonnte device token
//   FONNTE_API_URL          — defaults to https://api.fonnte.com/send

// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const FONNTE_URL = Deno.env.get("FONNTE_API_URL") ?? "https://api.fonnte.com/send";
const FONNTE_TOKEN = Deno.env.get("FONNTE_API_TOKEN") ?? "";

function buildSupabase() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key);
}

async function sendWA(phone: string, message: string): Promise<void> {
  if (!FONNTE_TOKEN || !phone) return;
  await fetch(FONNTE_URL, {
    method: "POST",
    headers: {
      Authorization: FONNTE_TOKEN,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ target: phone, message, delay: 0 }),
  });
}

function formatIDR(n: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

Deno.serve(async (_req) => {
  const supabase = buildSupabase();

  // Fetch all organizations with their owner_id
  const { data: orgs, error: orgsErr } = await supabase
    .from("organizations")
    .select("id, name, owner_id");

  if (orgsErr || !orgs || orgs.length === 0) {
    return new Response("no orgs", { status: 200 });
  }

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const weekAgoISO = weekAgo.toISOString();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const ownerIds = [...new Set(orgs.map((o: any) => o.owner_id))];

  // Fetch owner profiles (for phone_wa)
  const { data: ownerProfiles } = await supabase
    .from("profiles")
    .select("id, full_name, phone_wa")
    .in("id", ownerIds);

  const profileMap = new Map((ownerProfiles ?? []).map((p: any) => [p.id, p]));

  for (const org of orgs as any[]) {
    const ownerProfile = profileMap.get(org.owner_id);
    if (!ownerProfile?.phone_wa) continue;

    // Fetch weekly data in parallel
    const [scrimsRes, financesRes, sponsorsRes, membersRes] = await Promise.all([
      supabase
        .from("scrims")
        .select("id, status")
        .eq("organization_id", org.id)
        .gte("scheduled_at", weekAgoISO),
      supabase
        .from("finances")
        .select("type, amount")
        .eq("organization_id", org.id)
        .gte("date", monthStart),
      supabase
        .from("sponsors")
        .select("name, end_date, status")
        .eq("organization_id", org.id)
        .eq("status", "active")
        .lte("end_date", in30Days)
        .not("end_date", "is", null),
      supabase
        .from("team_members")
        .select("id")
        .eq("organization_id", org.id),
    ]);

    const scrims = (scrimsRes.data ?? []) as any[];
    const finances = (financesRes.data ?? []) as any[];
    const upcomingSponsors = (sponsorsRes.data ?? []) as any[];
    const memberCount = (membersRes.data ?? []).length;

    // Scrim stats
    const scrimIds = scrims.map((s: any) => s.id);
    let wins = 0;
    let losses = 0;
    if (scrimIds.length > 0) {
      const { data: results } = await supabase
        .from("scrim_results")
        .select("is_win")
        .in("scrim_id", scrimIds)
        .not("is_win", "is", null);
      wins = (results ?? []).filter((r: any) => r.is_win).length;
      losses = (results ?? []).filter((r: any) => !r.is_win).length;
    }

    // Finance balance this month
    const income = finances
      .filter((f: any) => f.type === "income")
      .reduce((sum: number, f: any) => sum + (f.amount ?? 0), 0);
    const expense = finances
      .filter((f: any) => f.type === "expense")
      .reduce((sum: number, f: any) => sum + (f.amount ?? 0), 0);
    const balance = income - expense;

    // Compose WA message
    const lines = [
      `🏆 *Ringkasan Mingguan — ${org.name}*`,
      `📅 ${now.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`,
      ``,
      `⚔️ *Scrim 7 Hari Terakhir*`,
      `   Total: ${scrims.length} scrim`,
      `   W/L: ${wins} menang / ${losses} kalah`,
      ``,
      `💰 *Keuangan Bulan Ini*`,
      `   Pemasukan: ${formatIDR(income)}`,
      `   Pengeluaran: ${formatIDR(expense)}`,
      `   Saldo: ${balance >= 0 ? "+" : ""}${formatIDR(balance)}`,
      ``,
      `👥 *Roster*`,
      `   Total member: ${memberCount}`,
    ];

    if (upcomingSponsors.length > 0) {
      lines.push(``, `⚠️ *Sponsor Berakhir < 30 Hari*`);
      for (const s of upcomingSponsors) {
        const daysLeft = Math.ceil(
          (new Date(s.end_date).getTime() - now.getTime()) / (24 * 60 * 60 * 1000),
        );
        lines.push(`   • ${s.name} (${daysLeft} hari lagi)`);
      }
    }

    lines.push(``, `_Dikirim otomatis oleh Hyperion OS_`);

    await sendWA(ownerProfile.phone_wa, lines.join("\n"));
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
