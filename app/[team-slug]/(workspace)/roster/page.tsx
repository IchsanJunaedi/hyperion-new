import { Users } from "lucide-react";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { RosterTable } from "@/features/roster/components/RosterTable";
import { RosterCardView } from "@/features/roster/components/RosterCardView";
import { RosterViewToggle } from "@/features/roster/components/RosterViewToggle";
import {
  getCurrentUserRole,
  getRosterMembers,
} from "@/features/roster/queries";
import { getOrgBySlug, getPublicTeamData } from "@/features/teams/queries";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface RosterPageProps {
  params: Promise<{ "team-slug": string }>;
  searchParams: Promise<{ view?: string }>;
}

export default async function RosterPage({ params, searchParams }: RosterPageProps) {
  const [{ "team-slug": slug }, sp] = await Promise.all([params, searchParams]);
  const viewMode = sp.view === "cards" ? "cards" : "table";
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

  if (!currentUserRole) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
        <div className="rounded-full bg-ui-surface/50 p-4 border border-ui-border mb-4">
          <Users className="h-10 w-10 text-ui-text-muted" />
        </div>
        <h1 className="text-xl font-bold text-ui-text sm:text-2xl">Roster Belum Diisi</h1>
        <p className="mt-2 text-sm text-ui-text-2 max-w-md">
          Roster tim ini belum diisi atau Anda belum terdaftar sebagai anggota aktif. Silakan hubungi Owner atau Manager tim untuk mengelola Roster.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 py-6 sm:px-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ui-text sm:text-3xl">
            Roster
          </h1>
          <p className="mt-1 text-sm text-ui-text-2">
            {members.length} anggota aktif
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Suspense>
            <RosterViewToggle activeView={viewMode} />
          </Suspense>
          <div className="flex h-8 items-center gap-1.5 rounded-md border border-ui-border bg-ui-surface/40 px-2.5 text-xs font-medium text-ui-text-2">
            <Users className="h-3.5 w-3.5 text-ui-text-muted" />
            <span className="font-semibold text-ui-text">
              {members.length}
            </span>
          </div>
        </div>
      </header>

      {viewMode === "cards" ? (
        <RosterCardView members={members} />
      ) : (
        <RosterTable
          members={members}
          currentUserId={user.id}
          currentUserRole={currentUserRole}
          orgSlug={slug}
          orgId={organization.id}
          divisions={divisions.map((d: { id: string; name: string }) => ({ id: d.id, name: d.name }))}
        />
      )}
    </div>
  );
}
