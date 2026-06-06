import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { listContent } from "@/features/content/queries";
import { ContentList } from "@/features/content/components/ContentList";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ orgSlug: string }>;
}

const ManageContentPage = async ({ params }: Props) => {
  const { orgSlug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/manage/${orgSlug}/content`);

  const admin = createAdminClient();
  const { data: org } = await admin
    .from("organizations")
    .select("id")
    .eq("slug", orgSlug)
    .maybeSingle();

  if (!org) redirect("/manage");

  const rows = await listContent(org.id);

  return (
    <div className="space-y-5">
      <ContentList
        rows={rows}
        orgId={org.id}
        currentUserId={user.id}
        isOwner={false}
        canCreate={true}
      />
    </div>
  );
};
export default ManageContentPage;
