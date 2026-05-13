import { Users } from "lucide-react";
import { notFound } from "next/navigation";

import { RosterTable } from "@/features/roster/components/RosterTable";
import {
  getCurrentUserRole,
  getRosterMembers,
} from "@/features/roster/queries";
import { getOrgBySlug, getPublicTeamData } from "@/features/teams/queries";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface RosterPageProps {
  params: Promise<{ "team-slug": string }>;
}

export default async function RosterPage({ params }: RosterPageProps) {
  const { "team-slug": slug } = await params;
  const organization = await getOrgBySlug(slug);
  if (!organization) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const [members, currentUserRole, { divisions }] = await Promise.all([
    getRosterMembers(organization.id),
    getCurrentUserRole(organization.id),
    getPublicTeamData(organization),
  ]);

  if (!currentUserRole) notFound();

  return (
    <div className="space-y-6 px-4 py-6 sm:px-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-white/55">Tim</p>
          <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
            Roster
          </h1>
          <p className="mt-1 text-sm text-white/60">
            {members.length} anggota aktif
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-zinc-900/40 px-4 py-3">
          <Users className="h-5 w-5 text-white/40" />
          <span className="text-2xl font-bold text-white">
            {members.length}
          </span>
        </div>
      </header>

      <RosterTable
        members={members}
        currentUserId={user.id}
        currentUserRole={currentUserRole}
        orgSlug={slug}
        orgId={organization.id}
        divisions={divisions.map((d) => ({ id: d.id, name: d.name }))}
      />
    </div>
  );
}
