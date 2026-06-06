import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWaMessage } from "@/lib/utils/fonnte";

// Normalize phone to 62XXXXXXXXX format for comparison
function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("0")) return "62" + digits.slice(1);
  return "62" + digits;
}

const REPLY_MAP: Record<string, "confirmed" | "declined" | "tentative"> = {
  "1": "confirmed",
  hadir: "confirmed",
  "2": "declined",
  "tidak": "declined",
  "ga": "declined",
  "gak": "declined",
  "3": "tentative",
  mungkin: "tentative",
};

const STATUS_LABEL: Record<string, string> = {
  confirmed: "✅ *Hadir*",
  declined: "❌ *Tidak Hadir*",
  tentative: "❓ *Mungkin Hadir*",
};

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ ok: true, service: "hyperion-wa-webhook" });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Verify secret from query param: /api/wa/webhook?secret=...
  const secret = req.nextUrl.searchParams.get("secret");
  const expectedSecret = process.env.FONNTE_WEBHOOK_SECRET;
  if (expectedSecret && secret !== expectedSecret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let body: Record<string, string>;
  try {
    const ct = req.headers.get("content-type") ?? "";
    if (ct.includes("application/json")) {
      body = await req.json();
    } else {
      const form = await req.formData();
      body = Object.fromEntries(
        [...form.entries()].map(([k, v]) => [k, String(v)]),
      );
    }
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 });
  }

  const senderRaw: string = body.sender ?? body.from ?? "";
  const messageRaw: string = (body.message ?? body.text ?? "").trim().toLowerCase();

  if (!senderRaw || !messageRaw) {
    return NextResponse.json({ ok: true }); // silently ignore non-message events
  }

  const senderNorm = normalizePhone(senderRaw);
  const attendanceStatus = REPLY_MAP[messageRaw];

  // Not a recognised reply keyword — ignore silently
  if (!attendanceStatus) {
    return NextResponse.json({ ok: true });
  }

  const admin = createAdminClient();

  // Find profile by phone_wa (normalize stored numbers for comparison)
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, display_name, phone_wa")
    .not("phone_wa", "is", null)
    .limit(500);

  const profile = (profiles ?? []).find(
    (p) => !!p.phone_wa && normalizePhone(p.phone_wa) === senderNorm,
  ) as { id: string; display_name: string | null; phone_wa: string } | undefined;

  if (!profile) {
    return NextResponse.json({ ok: true }); // unknown number, ignore
  }

  // Find the nearest upcoming scrim for this user's active membership
  const now = new Date().toISOString();

  const { data: membership } = await admin
    .from("team_members")
    .select("organization_id, division_id")
    .eq("user_id", profile.id)
    .eq("is_active", true)
    .in("role", ["captain", "member"])
    .limit(1)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json({ ok: true });
  }

  const { data: scrim } = await admin
    .from("scrims")
    .select("id, opponent_name, scheduled_at")
    .eq("organization_id", membership.organization_id)
    .eq("division_id", membership.division_id ?? "")
    .eq("status", "scheduled")
    .gte("scheduled_at", now)
    .order("scheduled_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!scrim) {
    await sendWaMessage(
      senderRaw,
      "Tidak ada scrim mendatang yang perlu dikonfirmasi saat ini.",
    );
    return NextResponse.json({ ok: true });
  }

  // Upsert attendance
  const { error } = await admin.from("scrim_attendances").upsert(
    {
      scrim_id: scrim.id,
      user_id: profile.id,
      status: attendanceStatus,
      updated_at: now,
    },
    { onConflict: "scrim_id,user_id" },
  );

  if (error) {
    console.error("[WA Webhook] attendance upsert error:", error.message);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  // Reply confirmation to member
  const scheduledLabel = new Date(scrim.scheduled_at).toLocaleString("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });

  const replyMsg = [
    `${STATUS_LABEL[attendanceStatus]} konfirmasi diterima!`,
    "",
    `*Scrim vs ${scrim.opponent_name}*`,
    `📅 ${scheduledLabel} WIB`,
    "",
    "Sampai jumpa di scrim! 💪",
  ].join("\n");

  await sendWaMessage(senderRaw, replyMsg);

  return NextResponse.json({ ok: true });
}
