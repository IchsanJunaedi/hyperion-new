import { NextResponse } from "next/server";

// MLBB nickname lookup via Moonton's player profile API.
// Configure MLBB_NICKNAME_API_URL in .env.local if you use a different provider.
// Expected response shape: { nickname: string } or { data: { name: string } }
const API_URL = process.env.MLBB_NICKNAME_API_URL ??
  "https://order2.moonton.com/api/userId/checkUser";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId")?.trim();
  const zoneId = searchParams.get("zoneId")?.trim();

  if (!userId || !zoneId || !/^\d+$/.test(userId) || !/^\d+$/.test(zoneId)) {
    return NextResponse.json({ nickname: null, error: "ID dan Server harus berupa angka" }, { status: 400 });
  }

  try {
    const res = await fetch(`${API_URL}?userId=${userId}&zoneId=${zoneId}`, {
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) return NextResponse.json({ nickname: null });

    const json = await res.json() as Record<string, unknown>;
    // Normalise across common response shapes
    const nickname =
      (json.nickname as string | undefined) ??
      (json.name as string | undefined) ??
      ((json.data as Record<string, unknown> | undefined)?.name as string | undefined) ??
      null;

    return NextResponse.json({ nickname });
  } catch {
    return NextResponse.json({ nickname: null });
  }
}
