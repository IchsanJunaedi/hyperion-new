import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWaMessage } from "@/lib/utils/fonnte";
import { checkRateLimit, ipKey } from "@/lib/rate-limit";
import { hashPhone } from "@/lib/encryption";

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
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Verify secret from header (preferred) or query param (fallback for legacy).
  // Fail closed: if the secret is not configured, reject all requests rather
  // than accepting unauthenticated webhook calls (which could spoof attendance).
  const expectedSecret = process.env.FONNTE_WEBHOOK_SECRET;
  const headerSecret = req.headers.get("x-webhook-secret");
  const querySecret = req.nextUrl.searchParams.get("secret");
  const secret = headerSecret ?? querySecret;

  if (!expectedSecret || secret !== expectedSecret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  // Rate limiting by IP to prevent brute-force of the secret
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = await checkRateLimit(ipKey(ip, "wa-webhook"), {
    maxAttempts: 30, // 30 requests per minute per IP
    windowMs: 60 * 1000,
  });
  if (!rl.allowed) {
    return NextResponse.json({ ok: false }, { status: 429 });
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

  // Step 1: find profile by phone hash (encrypted lookup — PII protection)
  const senderHash = hashPhone(senderRaw);
  const { data: candidates } = await admin
    .from("profiles")
    .select("id, display_name, phone_wa")
    .eq("phone_hash", senderHash)
    .limit(5);

  const matchingIds = (candidates ?? [])
    .filter((p) => !!p.phone_wa && normalizePhone(p.phone_wa) === senderNorm)
    .map((p) => p.id);

  if (matchingIds.length === 0) {
    return NextResponse.json({ ok: true }); // unknown number
  }

  // Step 2: find which one has an active captain/member membership
  const { data: membershipRows } = await admin
    .from("team_members")
    .select("user_id, organization_id, division_id")
    .in("user_id", matchingIds)
    .eq("is_active", true)
    .in("role", ["captain", "member"])
    .limit(1);

  const membership = membershipRows?.[0] ?? null;

  if (!membership) {
    return NextResponse.json({ ok: true }); // no active team membership
  }

  const profile = (candidates ?? []).find((p) => p.id === membership.user_id)!;

  // Find the nearest upcoming scrim for this user's active membership
  const now = new Date().toISOString();

  let scrimQuery = admin
    .from("scrims")
    .select("id, opponent_name, scheduled_at")
    .eq("organization_id", membership.organization_id)
    .eq("status", "scheduled")
    .gte("scheduled_at", now)
    .order("scheduled_at", { ascending: true })
    .limit(1);
  if (membership.division_id) {
    scrimQuery = scrimQuery.eq("division_id", membership.division_id);
  }
  const { data: scrim } = await scrimQuery.maybeSingle();

  if (!scrim) {
    await sendWaMessage(
      senderRaw,
      "Tidak ada scrim mendatang yang perlu dikonfirmasi saat ini.",
    );
    return NextResponse.json({ ok: true });
  }

  // Validate that the membership's user_id matches the profile id
  // to prevent profile-spoofing via the webhook
  if (profile.id !== membership.user_id) {
    console.error("[WA Webhook] profile/user mismatch — rejecting");
    return NextResponse.json({ ok: false }, { status: 400 });
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
