import { NextResponse } from "next/server";
import { checkRateLimit, ipKey } from "@/lib/rate-limit";

// Same API used by the onboarding/profile nickname check
const API_URL = "https://api.isan.eu.org/nickname/ml";

export async function GET(req: Request) {
  // Rate limiting: 20 requests per minute per IP
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = await checkRateLimit(ipKey(ip, "mlbb-nickname"), {
    maxAttempts: 20,
    windowMs: 60 * 1000,
  });
  if (!rl.allowed) {
    return NextResponse.json({ error: "Terlalu banyak permintaan" }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId")?.trim();
  const zoneId = searchParams.get("zoneId")?.trim();

  if (!userId || !zoneId || !/^\d+$/.test(userId) || !/^\d+$/.test(zoneId)) {
    return NextResponse.json({ nickname: null, error: "ID dan Server harus berupa angka" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `${API_URL}?id=${encodeURIComponent(userId)}&server=${encodeURIComponent(zoneId)}`,
      { signal: AbortSignal.timeout(5000) },
    );

    if (!res.ok) return NextResponse.json({ nickname: null });

    const json = await res.json() as Record<string, unknown>;
    const nickname = (json.name as string | undefined) ?? null;
    return NextResponse.json({ nickname });
  } catch {
    return NextResponse.json({ nickname: null });
  }
}
