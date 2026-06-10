import { notFound } from "next/navigation";
import { Shield, Trophy, Users } from "lucide-react";

import { getPublicProfile } from "@/features/teams/queries";

export const dynamic = "force-dynamic";

interface PublicProfilePageProps {
  params: Promise<{ orgSlug: string }>;
}

const ROLE_LABEL: Record<string, string> = {
  owner: "Owner",
  manager: "Manager",
  coach: "Coach",
  captain: "Captain",
  member: "Member",
};

const ROLE_COLOR: Record<string, string> = {
  owner: "text-yellow-400",
  manager: "text-green-400",
  coach: "text-blue-400",
  captain: "text-purple-400",
  member: "text-[#9B9A97]",
};

const PublicProfilePage = async ({ params }: PublicProfilePageProps) => {
  const { orgSlug } = await params;
  const profile = await getPublicProfile(orgSlug);
  if (!profile) notFound();

  const { org, members, tournamentStats } = profile;

  return (
    <div className="min-h-screen bg-[#191919] text-[#E5E2E1]">
      {/* Banner */}
      {org.banner_url && (
        <div className="h-48 w-full overflow-hidden">
          <img src={org.banner_url} alt="" className="h-full w-full object-cover" />
        </div>
      )}

      <div className="mx-auto max-w-3xl px-6 py-10 space-y-10">
        {/* Header */}
        <div className="flex items-center gap-5">
          {org.logo_url ? (
            <img
              src={org.logo_url}
              alt={org.name}
              className="h-16 w-16 rounded-xl object-contain bg-[#202020] p-1 shrink-0"
            />
          ) : (
            <div className="h-16 w-16 rounded-xl bg-[#202020] flex items-center justify-center shrink-0">
              <Shield className="h-8 w-8 text-[#6B6A68]" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-[#E5E2E1]">{org.name}</h1>
            {org.game_focus && org.game_focus.length > 0 && (
              <p className="text-sm text-[#9B9A97] mt-0.5">{org.game_focus.join(" · ")}</p>
            )}
          </div>
        </div>

        {org.description && (
          <p className="text-[#9B9A97] leading-relaxed">{org.description}</p>
        )}

        {/* Tournament Stats */}
        {tournamentStats.total > 0 && (
          <div className="rounded-lg border border-[#2D2D2D] bg-[#202020] p-5">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="h-4 w-4 text-[#9B9A97]" />
              <h2 className="text-sm font-semibold text-[#D4D4D4]">Hasil Turnamen</h2>
            </div>
            <div className="flex gap-8">
              <div>
                <p className="text-2xl font-bold text-emerald-400">{tournamentStats.wins}</p>
                <p className="text-xs text-[#6B6A68]">Menang</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-400">{tournamentStats.losses}</p>
                <p className="text-xs text-[#6B6A68]">Kalah</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-[#E5E2E1]">{tournamentStats.total}</p>
                <p className="text-xs text-[#6B6A68]">Total Match</p>
              </div>
              {tournamentStats.total > 0 && (
                <div>
                  <p className="text-2xl font-bold text-[#E5E2E1]">
                    {Math.round((tournamentStats.wins / tournamentStats.total) * 100)}%
                  </p>
                  <p className="text-xs text-[#6B6A68]">Win Rate</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Roster */}
        {members.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-4 w-4 text-[#9B9A97]" />
              <h2 className="text-sm font-semibold text-[#D4D4D4]">Roster</h2>
              <span className="text-xs text-[#6B6A68]">({members.length})</span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 rounded-lg border border-[#2D2D2D] bg-[#202020] p-3"
                >
                  {member.avatar_url ? (
                    <img
                      src={member.avatar_url}
                      alt={member.display_name ?? ""}
                      className="h-9 w-9 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="h-9 w-9 rounded-full bg-[#2D2D2D] flex items-center justify-center shrink-0 text-sm font-medium text-[#6B6A68]">
                      {(member.display_name ?? member.username ?? "?")[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#E5E2E1] truncate">
                      {member.display_name ?? member.username ?? "—"}
                    </p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-xs font-medium ${ROLE_COLOR[member.role] ?? "text-[#9B9A97]"}`}>
                        {ROLE_LABEL[member.role] ?? member.role}
                      </span>
                      {member.position && (
                        <span className="text-xs text-[#6B6A68]">· {member.position}</span>
                      )}
                      {member.division_name && (
                        <span className="text-xs text-[#6B6A68]">· {member.division_name}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-center text-[#6B6A68]">
          Powered by Hyperion
        </p>
      </div>
    </div>
  );
};

export { PublicProfilePage as default };
