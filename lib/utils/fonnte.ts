/**
 * WhatsApp Cloud API (Meta) helper.
 *
 * Sends messages via Meta's WhatsApp Business Cloud API.
 * Used for real-time WA blasts (scrim/tournament creation).
 *
 * Env:
 *   WHATSAPP_ACCESS_TOKEN  — Meta access token (from App dashboard)
 *   WHATSAPP_PHONE_ID      — Phone Number ID (from WhatsApp API Setup)
 */

const GRAPH_API_VERSION = "v21.0";

export interface WaResult {
  ok: boolean;
  error?: string;
}

/**
 * Send a single WhatsApp text message via Meta Cloud API.
 * The recipient must have messaged the business number within 24h
 * (customer service window) OR you must use a template message.
 *
 * For notifications to users who haven't chatted first, consider
 * using sendWaTemplate() instead.
 */
export async function sendWaMessage(
  to: string,
  message: string,
): Promise<WaResult> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;

  if (!token || !phoneId) {
    return { ok: false, error: "WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_ID not configured" };
  }

  // Normalize Indonesian number: remove leading 0, add 62 prefix
  const normalizedTo = normalizePhoneNumber(to);

  try {
    const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneId}/messages`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: normalizedTo,
        type: "text",
        text: {
          preview_url: true,
          body: message,
        },
      }),
    });

    if (!res.ok) {
      const errorBody = await res.json().catch(() => null);
      const errorMsg = errorBody?.error?.message ?? `HTTP ${res.status}`;
      return { ok: false, error: errorMsg };
    }

    const json = await res.json().catch(() => null);
    if (json?.messages?.[0]?.id) {
      return { ok: true };
    }

    return { ok: false, error: "No message ID in response" };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unknown fetch error",
    };
  }
}

/**
 * Send a WhatsApp template message. Templates can be sent to any number
 * without requiring a 24h conversation window.
 *
 * @param to - Recipient phone number
 * @param templateName - Approved template name (e.g. "hello_world")
 * @param languageCode - Template language (e.g. "id" for Indonesian)
 * @param components - Template components (header, body params, etc.)
 */
export async function sendWaTemplate(
  to: string,
  templateName: string,
  languageCode: string = "id",
  components?: unknown[],
): Promise<WaResult> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;

  if (!token || !phoneId) {
    return { ok: false, error: "WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_ID not configured" };
  }

  const normalizedTo = normalizePhoneNumber(to);

  try {
    const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneId}/messages`;

    const templatePayload: Record<string, unknown> = {
      name: templateName,
      language: { code: languageCode },
    };
    if (components && components.length > 0) {
      templatePayload.components = components;
    }

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: normalizedTo,
        type: "template",
        template: templatePayload,
      }),
    });

    if (!res.ok) {
      const errorBody = await res.json().catch(() => null);
      const errorMsg = errorBody?.error?.message ?? `HTTP ${res.status}`;
      return { ok: false, error: errorMsg };
    }

    const json = await res.json().catch(() => null);
    if (json?.messages?.[0]?.id) {
      return { ok: true };
    }

    return { ok: false, error: "No message ID in response" };
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
      console.error(`[WA Cloud API] Failed to send to ${r.phone}: ${result.error}`);
    }
  }

  return { sent, failed };
}

/**
 * Normalize an Indonesian phone number to international format (digits only, no +).
 * Examples:
 *   "08123456789"   → "628123456789"
 *   "+628123456789" → "628123456789"
 *   "628123456789"  → "628123456789"
 *   "8123456789"    → "628123456789"
 */
function normalizePhoneNumber(input: string): string {
  // Strip all non-digits
  let digits = input.replace(/\D/g, "");

  // Remove leading 0 and prepend 62
  if (digits.startsWith("0")) {
    digits = "62" + digits.slice(1);
  }
  // If doesn't start with country code, assume Indonesian
  else if (!digits.startsWith("62")) {
    digits = "62" + digits;
  }

  return digits;
}
