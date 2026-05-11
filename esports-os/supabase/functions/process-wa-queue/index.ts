// Supabase Edge Function — process-wa-queue
//
// Invoked every minute by the pg_cron job (`process-wa-queue`).
// Pulls a small batch of pending WhatsApp notifications, sends them
// via Fonnte, and updates `notifications.status` accordingly.
//
// Auth: this function is called with the service-role key (set in cron
//       headers) and runs with `verify_jwt = false` (see config.toml).
//
// Env (set via `supabase secrets set ...`):
//   FONNTE_API_TOKEN  — Fonnte device token
//   FONNTE_API_URL    — defaults to https://api.fonnte.com/send
//
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are auto-injected by the
// Edge runtime, no need to set them.

// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const BATCH_SIZE = 25;
const MAX_ATTEMPTS = 3;
const FONNTE_URL =
  Deno.env.get("FONNTE_API_URL") ?? "https://api.fonnte.com/send";

interface PendingNotification {
  id: string;
  user_id: string;
  wa_number: string | null;
  wa_message: string | null;
  attempts: number;
}

function buildSupabase() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY for Edge Function",
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function sendViaFonnte(
  token: string,
  target: string,
  message: string,
): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch(FONNTE_URL, {
    method: "POST",
    headers: {
      Authorization: token,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      target,
      message,
      countryCode: "62",
    }),
  });

  if (!res.ok) {
    return { ok: false, error: `Fonnte HTTP ${res.status}` };
  }

  // Fonnte responds with { status: true, ... } on success.
  const json = (await res.json().catch(() => null)) as
    | { status?: boolean; reason?: string }
    | null;

  if (!json || json.status !== true) {
    return {
      ok: false,
      error: json?.reason ?? "Fonnte returned non-success response",
    };
  }
  return { ok: true };
}

Deno.serve(async (_req) => {
  const fonnteToken = Deno.env.get("FONNTE_API_TOKEN");
  if (!fonnteToken) {
    return new Response(
      JSON.stringify({ error: "FONNTE_API_TOKEN not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  const supabase = buildSupabase();

  // Pull a batch of pending WA-targeted notifications.
  const { data: pending, error: fetchErr } = await supabase
    .from("notifications")
    .select("id, user_id, wa_number, wa_message, attempts")
    .eq("status", "pending")
    .not("wa_number", "is", null)
    .not("wa_message", "is", null)
    .lt("attempts", MAX_ATTEMPTS)
    .order("created_at", { ascending: true })
    .limit(BATCH_SIZE);

  if (fetchErr) {
    return new Response(
      JSON.stringify({ error: fetchErr.message }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  const rows = (pending ?? []) as PendingNotification[];
  if (rows.length === 0) {
    return new Response(JSON.stringify({ processed: 0 }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  let sentCount = 0;
  let failedCount = 0;

  for (const n of rows) {
    if (!n.wa_number || !n.wa_message) {
      // Defensive — should be filtered out by the .not() above.
      continue;
    }

    const result = await sendViaFonnte(fonnteToken, n.wa_number, n.wa_message);
    const nextAttempts = n.attempts + 1;

    if (result.ok) {
      sentCount += 1;
      await supabase
        .from("notifications")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
          attempts: nextAttempts,
          last_error: null,
        })
        .eq("id", n.id);
    } else {
      const exhausted = nextAttempts >= MAX_ATTEMPTS;
      failedCount += 1;
      await supabase
        .from("notifications")
        .update({
          status: exhausted ? "failed" : "pending",
          attempts: nextAttempts,
          last_error: result.error ?? "unknown error",
        })
        .eq("id", n.id);
    }
  }

  return new Response(
    JSON.stringify({
      processed: rows.length,
      sent: sentCount,
      failed: failedCount,
    }),
    { headers: { "Content-Type": "application/json" } },
  );
});
