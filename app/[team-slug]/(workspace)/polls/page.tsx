import { BarChart3, Plus } from "lucide-react";
import { notFound } from "next/navigation";

import { getCurrentUserRole } from "@/features/roster/queries";
import { getOrgBySlug } from "@/features/teams/queries";
import { listPolls } from "@/features/polls/queries";
import { PollCard } from "@/features/polls/components/PollCard";
import { PollPageClient } from "@/features/polls/components/PollPageClient";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface PollsPageProps {
  params: Promise<{ "team-slug": string }>;
}

export default async function PollsPage({ params }: PollsPageProps) {
  const { "team-slug": slug } = await params;
  const organization = await getOrgBySlug(slug);
  if (!organization) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const currentUserRole = await getCurrentUserRole(organization.id);
  const canManage = ["captain", "coach", "manager", "owner"].includes(currentUserRole ?? "");

  const polls = await listPolls(organization.id);

  return (
    <div className="space-y-6 px-4 py-6 sm:px-8">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ui-text sm:text-3xl">Polling Tim</h1>
        </div>
      </header>

      <PollPageClient
        polls={polls}
        orgSlug={slug}
        canManage={canManage}
        userId={user?.id ?? ""}
      />
    </div>
  );
}
