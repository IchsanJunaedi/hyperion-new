import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getTodoBadgeCount } from "@/features/todos/queries";

/**
 * Lightweight todo badge count endpoint. Fetched client-side by TodoBadge so
 * the ~12-query smart-todo computation no longer blocks layout SSR (PRF-02).
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const orgId = searchParams.get("orgId");
  if (!orgId) {
    return NextResponse.json({ count: 0, error: "orgId wajib diisi" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ count: 0 }, { status: 401 });
  }

  const admin = createAdminClient();

  // Same gate as the todos pages: global owner, or active owner/manager of the org.
  const isGlobalOwner = user.email === process.env.OWNER_EMAIL;
  if (!isGlobalOwner) {
    const { data: membership, error } = await admin
      .from("team_members")
      .select("role")
      .eq("organization_id", orgId)
      .eq("user_id", user.id)
      .eq("is_active", true)
      .in("role", ["owner", "manager"])
      .limit(1)
      .maybeSingle();

    if (error) console.error("[api/todos/badge] membership check:", error.message);
    if (!membership) {
      return NextResponse.json({ count: 0 }, { status: 403 });
    }
  }

  // Fetch org slug for building scrim navigate_to URLs
  const { data: org } = await admin
    .from("organizations")
    .select("slug")
    .eq("id", orgId)
    .limit(1)
    .maybeSingle();
  const orgSlug = org?.slug ?? "";

  try {
    const count = await getTodoBadgeCount(orgId, user.id, orgSlug);
    return NextResponse.json({ count });
  } catch (err) {
    console.error("[api/todos/badge] getTodoBadgeCount:", err);
    return NextResponse.json({ count: 0 });
  }
}
