import { NextResponse } from "next/server";

// Same API used by the onboarding/profile nickname check
const API_URL = "https://api.isan.eu.org/nickname/ml";

export async function GET(req: Request) {
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
