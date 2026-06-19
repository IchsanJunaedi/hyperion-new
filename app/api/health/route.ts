import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const GET = async () => {
  const start = Date.now();
  const supabase = await createClient();

  const { error } = await supabase.from("profiles").select("id").limit(1);
  const dbOk = !error;

  return NextResponse.json({
    ok: true,
    db: dbOk,
    timestamp: new Date().toISOString(),
    uptime: Date.now() - start + "ms",
  });
};
export { GET };
