import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { listContent } from "@/features/content/queries";
import { ContentList } from "@/features/content/components/ContentList";

export const dynamic = "force-dynamic";

export default async function DashboardContentPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/content");

  const ownerEmail = process.env.OWNER_EMAIL;
  if (!ownerEmail || user.email !== ownerEmail) redirect("/dashboard");

  const admin = createAdminClient();
  const { data: org } = await admin.from("organizations").select("id").limit(1).maybeSingle();
  if (!org) redirect("/dashboard");

  const rows = await listContent(org.id);

  return (
    <div className="space-y-5">
      <ContentList
        rows={rows}
        orgId={org.id}
        currentUserId={user.id}
        isOwner={true}
        canCreate={false}
      />
    </div>
  );
}
