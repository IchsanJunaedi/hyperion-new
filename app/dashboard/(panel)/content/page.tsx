import { redirect } from "next/navigation";
import { FileText } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { listContent } from "@/features/content/queries";
import { ContentList } from "@/features/content/components/ContentList";

export const dynamic = "force-dynamic";

export default async function DashboardContentPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/dashboard/login");

  const ownerEmail = process.env.OWNER_EMAIL;
  if (!ownerEmail || user.email !== ownerEmail) redirect("/");

  const admin = createAdminClient();

  // Get first org for content
  const { data: org } = await admin
    .from("organizations")
    .select("id")
    .eq("owner_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!org) {
    return (
      <>
        <main className="flex-1 max-w-[900px] w-full mx-auto px-4 sm:px-8 py-12">
          <p className="text-sm text-ui-text-muted">Buat tim terlebih dahulu.</p>
        </main>
      </>
    );
  }

  const rows = await listContent(org.id);

  return (
    <>
      <main className="flex-1 max-w-[900px] w-full mx-auto px-4 sm:px-8 py-12">
        <div className="mb-8">
          <div className="flex items-center gap-2">
            <FileText className="h-8 w-8 text-ui-text-2" />
            <h1 className="font-bold text-[28px] text-ui-text">Content Calendar</h1>
          </div>
          <p className="text-ui-text-2 mt-1 text-sm">
            Jadwalkan dan approve konten sosial media tim.
          </p>
        </div>

        <ContentList
          rows={rows}
          orgId={org.id}
          currentUserId={user.id}
          isOwner={true}
          canCreate={true}
        />
      </main>
    </>
  );
}
