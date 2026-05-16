/**
 * Fonnte WhatsApp API helper.
 *
 * Sends a message via Fonnte's HTTP API. Used for real-time WA blasts
 * (scrim/tournament creation) as well as the Edge Function queue processor.
 *
 * Env: FONNTE_API_TOKEN must be set in .env.local
 */

const FONNTE_URL = "https://api.fonnte.com/send";

export interface FonnteResult {
  ok: boolean;
  error?: string;
}

/**
 * Send a single WhatsApp message via Fonnte.
 * Returns { ok: true } on success, { ok: false, error } on failure.
 */
export async function sendWaMessage(
  to: string,
  message: string,
): Promise<FonnteResult> {
  const token = process.env.FONNTE_API_TOKEN;
  if (!token) {
    return { ok: false, error: "FONNTE_API_TOKEN not configured" };
  }

  try {
    const res = await fetch(FONNTE_URL, {
      method: "POST",
      headers: {
        Authorization: token,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        target: to,
        message,
        countryCode: "62",
      }),
    });

    if (!res.ok) {
      return { ok: false, error: `Fonnte HTTP ${res.status}` };
    }

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
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unknown fetch error",
    };
  }
}

/**
 * Blast a WA message to multiple numbers. Best-effort — failures are
 * logged but don't throw. Returns count of successful sends.
 */
export async function blastWaMessage(
  recipients: Array<{ phone: string; message: string }>,
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  for (const r of recipients) {
    const result = await sendWaMessage(r.phone, r.message);
    if (result.ok) {
      sent++;
    } else {
      failed++;
      console.error(`[Fonnte] Failed to send to ${r.phone}: ${result.error}`);
    }
  }

  return { sent, failed };
}
