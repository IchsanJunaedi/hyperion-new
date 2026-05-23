import { Eye, Radar } from "lucide-react";
import { notFound, redirect } from "next/navigation";

import { ScoutingCard } from "@/features/scouting/components/ScoutingCard";
import { listOpponentProfiles } from "@/features/scouting/queries";
import { getCurrentUserRole } from "@/features/roster/queries";
import { getOrgBySlug } from "@/features/teams/queries";

export const dynamic = "force-dynamic";

interface ScoutingPageProps {
  params: Promise<{ "team-slug": string }>;
}

export default async function ScoutingPage({ params }: ScoutingPageProps) {
  const { "team-slug": slug } = await params;
  const organization = await getOrgBySlug(slug);
  if (!organization) notFound();

  const currentUserRole = await getCurrentUserRole(organization.id);
  if (
    currentUserRole !== "owner" &&
    currentUserRole !== "manager" &&
    currentUserRole !== "coach" &&
    currentUserRole !== "captain"
  ) {
    redirect(`/${slug}`);
  }

  const profiles = await listOpponentProfiles(organization.id);

  return (
    <div className="space-y-6 px-4 py-6 sm:px-8">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">
            Scouting Lawan
          </h1>
          <p className="mt-1 text-sm text-[#9B9A97]">
            Database profil tim lawan — rank, hero pool, playstyle, dan kelemahan.
          </p>
        </div>
      </header>

      {profiles.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#2D2D2D] bg-[#202020]/40 p-12 text-center">
          <Radar className="mx-auto h-8 w-8 text-[#6B6A68]" />
          <p className="mt-3 text-sm text-[#9B9A97]">
            Belum ada profil lawan tersimpan.
          </p>
          <p className="mt-1 text-xs text-[#6B6A68]">
            Profil lawan ditambahkan otomatis saat kamu menyimpan data scouting
            dari halaman detail scrim.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {profiles.map((profile) => (
            <ScoutingCard key={profile.id} profile={profile} />
          ))}
        </div>
      )}
    </div>
  );
}
