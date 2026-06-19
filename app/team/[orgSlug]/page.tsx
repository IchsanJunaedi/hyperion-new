import { notFound } from "next/navigation";
import { Shield, Trophy, Users, Gamepad2, Award } from "lucide-react";

import { getPublicProfile } from "@/features/teams/queries";
import { cn } from "@/lib/utils/cn";

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

const ROLE_BADGE: Record<string, string> = {
  owner: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20",
  manager: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20",
  coach: "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20",
  captain: "bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-500/20",
  member: "bg-zinc-100 dark:bg-zinc-500/10 text-zinc-700 dark:text-zinc-400 border-zinc-200 dark:border-zinc-500/20",
};

const ROLE_PRIORITY: Record<string, number> = {
  owner: 1,
  manager: 2,
  coach: 3,
  captain: 4,
  member: 5,
};

const PublicProfilePage = async ({ params }: PublicProfilePageProps) => {
  const { orgSlug } = await params;
  const profile = await getPublicProfile(orgSlug);
  if (!profile) notFound();

  const { org, members, tournamentStats } = profile;

  // Sort roster members by role priority (Owner -> Manager -> Coach -> Captain -> Member)
  const sortedMembers = [...members].sort((a, b) => {
    const aPri = ROLE_PRIORITY[a.role] ?? 99;
    const bPri = ROLE_PRIORITY[b.role] ?? 99;
    return aPri - bPri;
  });

  const winRate = tournamentStats.total > 0
    ? Math.round((tournamentStats.wins / tournamentStats.total) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200 pb-16">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md transition-colors duration-200">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <div className="flex items-center gap-2 text-foreground font-semibold min-w-0">
            {org.logo_url ? (
              <img
                src={org.logo_url}
                alt=""
                className="h-5 w-5 rounded object-contain bg-card shrink-0"
              />
            ) : (
              <Gamepad2 className="h-5 w-5 text-amber-500 shrink-0" />
            )}
            <span className="text-sm tracking-wider uppercase font-bold truncate">{org.name}</span>
          </div>
        </div>
      </header>

      {/* Banner / Cover */}
      <div className="relative h-48 md:h-60 w-full overflow-hidden bg-background">
        {org.banner_url ? (
          <>
            <img src={org.banner_url} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
          </>
        ) : (
          <>
            {/* Light mode background */}
            <div className="absolute inset-0 bg-gradient-to-tr from-amber-100/50 via-amber-50/30 to-orange-100/40 dark:hidden" />
            {/* Dark mode background */}
            <div className="absolute inset-0 hidden dark:block bg-zinc-950" />
            
            {/* Radial glow (amber in light, golden-yellow in dark) */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.06)_0%,transparent_70%)] dark:bg-[radial-gradient(circle_at_center,rgba(245,196,0,0.05)_0%,transparent_70%)]" />
            
            {/* Tech grid (subtle brown lines in light, white/gray in dark) */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(139,92,26,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(139,92,26,0.03)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:24px_24px]" />
            
            {/* Fade transition to page background */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
          </>
        )}
      </div>

      <div className="mx-auto max-w-4xl px-4">
        {/* Profile Identity Card (Overlapping Banner) */}
        <div className="relative -mt-16 md:-mt-20 z-10 flex flex-col md:flex-row md:items-end gap-4 md:gap-6 pb-8 border-b border-border/40">
          {org.logo_url ? (
            <img
              src={org.logo_url}
              alt={org.name}
              className="h-28 w-28 md:h-32 md:w-32 rounded-2xl object-contain bg-card p-2 border-4 border-background shadow-xl shrink-0"
            />
          ) : (
            <div className="h-28 w-28 md:h-32 md:w-32 rounded-2xl bg-card border-4 border-background shadow-xl flex items-center justify-center shrink-0">
              <Shield className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">{org.name}</h1>
            {org.game_focus && org.game_focus.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {org.game_focus.map((game) => (
                  <span key={game} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/10">
                    <Gamepad2 className="h-3 w-3" />
                    {game}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="py-8 grid gap-8">
          {/* Org Description */}
          {org.description && (
            <div className="space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tentang Kami</h2>
              <p className="text-muted-foreground leading-relaxed text-sm md:text-base max-w-3xl">
                {org.description}
              </p>
            </div>
          )}

          {/* Tournament Stats */}
          {tournamentStats.total > 0 && (
            <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-md">
              <div className="flex items-center gap-2 mb-6">
                <Trophy className="h-5 w-5 text-amber-500" />
                <h2 className="text-base font-bold text-foreground">Hasil Turnamen</h2>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-background/50 rounded-xl p-4 border border-border/50 text-center">
                  <span className="text-2xl font-extrabold text-foreground block">{tournamentStats.total}</span>
                  <span className="text-xs text-muted-foreground font-medium">Total Match</span>
                </div>
                <div className="bg-emerald-500/5 rounded-xl p-4 border border-emerald-500/10 text-center">
                  <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 block">{tournamentStats.wins}</span>
                  <span className="text-xs text-muted-foreground font-medium">Menang</span>
                </div>
                <div className="bg-rose-500/5 rounded-xl p-4 border border-rose-500/10 text-center">
                  <span className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 block">{tournamentStats.losses}</span>
                  <span className="text-xs text-muted-foreground font-medium">Kalah</span>
                </div>
                <div className="bg-amber-500/5 rounded-xl p-4 border border-amber-500/10 text-center">
                  <span className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 block">{winRate}%</span>
                  <span className="text-xs text-muted-foreground font-medium">Win Rate</span>
                </div>
              </div>

              {/* Win Rate Progress Bar */}
              <div className="mt-6 pt-5 border-t border-border/40">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground font-medium flex items-center gap-1">
                    <Award className="h-3.5 w-3.5 text-amber-500" />
                    Rasio Kemenangan
                  </span>
                  <span className="font-bold text-foreground">{winRate}%</span>
                </div>
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${winRate}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Roster */}
          {sortedMembers.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-amber-500" />
                  <h2 className="text-lg font-bold text-foreground">Roster Tim</h2>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border/60">
                    {sortedMembers.length} Anggota
                  </span>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                {sortedMembers.map((member) => (
                  <div
                    key={member.id}
                    className="group relative flex flex-col justify-between rounded-xl border border-border/80 bg-card p-4 hover:border-amber-500/30 hover:-translate-y-0.5 transition-all duration-300 shadow-sm hover:shadow-md"
                  >
                    <div className="flex items-start gap-3">
                      {member.avatar_url ? (
                        <img
                          src={member.avatar_url}
                          alt={member.display_name ?? ""}
                          className="h-11 w-11 rounded-full object-cover shrink-0 border border-border/60 shadow-sm group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="h-11 w-11 rounded-full bg-secondary text-muted-foreground flex items-center justify-center shrink-0 text-sm font-semibold border border-border/60 shadow-sm">
                          {(member.display_name ?? member.username ?? "?")[0]?.toUpperCase()}
                        </div>
                      )}
                      
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-foreground truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                          {member.display_name ?? member.username ?? "—"}
                        </p>
                        {member.username && (member.display_name && member.username !== member.display_name) && (
                          <p className="text-xs text-muted-foreground truncate -mt-0.5">
                            @{member.username}
                          </p>
                        )}
                        
                        <div className="mt-1.5">
                          <span className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border tracking-wide uppercase shadow-sm",
                            ROLE_BADGE[member.role] ?? ROLE_BADGE.member
                          )}>
                            {ROLE_LABEL[member.role] ?? member.role}
                          </span>
                        </div>
                      </div>
                    </div>

                    {(member.position || member.division_name) && (
                      <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
                        {member.position ? (
                          <span className="flex items-center gap-1 font-medium text-foreground/80">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                            {member.position}
                          </span>
                        ) : (
                          <span />
                        )}
                        {member.division_name && (
                          <span className="px-1.5 py-0.5 rounded bg-secondary text-muted-foreground font-semibold border border-border/60 uppercase tracking-wider text-[9px]">
                            {member.division_name}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-border/40 text-center flex flex-col items-center gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Shield className="h-4 w-4 text-amber-500" />
            <span className="font-bold text-foreground">Hyperion Team OS</span>
          </div>
          <p>© {new Date().getFullYear()} · Powered by Hyperion. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
};

export { PublicProfilePage as default };
