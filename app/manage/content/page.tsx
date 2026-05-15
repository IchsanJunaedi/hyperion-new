import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { listContent } from "@/features/content/queries";
import { ContentList } from "@/features/content/components/ContentList";

export const dynamic = "force-dynamic";

export default async function ManageContentPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/manage/content");

  const admin = createAdminClient();
  const { data: membership } = await admin
    .from("team_members")
    .select("organization_id, role")
    .eq("user_id", user.id)
    .in("role", ["manager", "owner"])
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (!membership) redirect("/manage");

  const rows = await listContent(membership.organization_id);

  return (
    <div className="space-y-5">
      <ContentList
        rows={rows}
        orgId={membership.organization_id}
        currentUserId={user.id}
        isOwner={membership.role === "owner"}
        canCreate={true}
      />
    </div>
  );
}
