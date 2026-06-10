"use client";

import { ExternalLink } from "lucide-react";

import { cn } from "@/lib/utils/cn";
import type { RosterMember } from "../queries";
import { attendanceBucket } from "../logic";

const ATTENDANCE_COLORS: Record<string, string> = {
  high: "text-emerald-400",
  mid: "text-yellow-400",
  low: "text-rose-400",
  none: "text-ui-text-muted",
};

const ROLE_COLORS: Record<string, string> = {
  owner:   "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  manager: "bg-green-500/20 text-green-400 border-green-500/30",
  coach:   "bg-blue-500/20 text-blue-400 border-blue-500/30",
  captain: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  member:  "bg-white/10 text-ui-text-2 border-white/15",
};

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner", manager: "Manager", coach: "Coach", captain: "Captain", member: "Member",
};

const MAIN_ROLE_COLORS: Record<string, string> = {
  exp_lane: "text-amber-400", jungler: "text-violet-400", mid_lane: "text-cyan-400",
  gold_lane: "text-yellow-400", roamer: "text-rose-400",
};

const MAIN_ROLE_LABELS: Record<string, string> = {
  exp_lane: "EXP", jungler: "JGL", mid_lane: "MID", gold_lane: "GOLD", roamer: "ROAM",
};

function PlayerCard({ m }: { m: RosterMember }) {
  const initials = (m.display_name ?? m.username ?? "?")
    .split(" ").slice(0, 2).map((w) => w[0] ?? "").join("").toUpperCase();

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-zinc-800/60 to-zinc-900/80 p-5 text-center shadow-xl">
      {/* Jersey number badge */}
      {m.jersey_number != null && (
        <span className="absolute left-3 top-3 font-mono text-xs font-bold text-ui-text-muted">
          #{m.jersey_number}
        </span>
      )}

      {/* Role badge */}
      <span className={cn(
        "absolute right-3 top-3 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
        ROLE_COLORS[m.role] ?? ROLE_COLORS.member,
      )}>
        {ROLE_LABELS[m.role] ?? m.role}
      </span>

      {/* Avatar */}
      <div className="mx-auto mb-3 h-16 w-16 overflow-hidden rounded-full border-2 border-white/10">
        {m.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={m.avatar_url} alt={m.display_name ?? ""} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-zinc-800 text-lg font-bold text-white/60">
            {initials}
          </div>
        )}
      </div>

      {/* Name */}
      <p className="truncate text-sm font-bold text-ui-text">{m.display_name ?? m.username ?? "Unnamed"}</p>

      {/* Main role + position */}
      <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
        {m.main_role && (
          <span className={cn("text-xs font-semibold", MAIN_ROLE_COLORS[m.main_role] ?? "text-ui-text-2")}>
            {MAIN_ROLE_LABELS[m.main_role] ?? m.main_role}
          </span>
        )}
        {m.position && (
          <span className="text-xs text-ui-text-muted">{m.position}</span>
        )}
      </div>

      {/* Attendance rate */}
      <div className="mt-2 flex items-center justify-center gap-1 text-[10px]">
        <span className="text-ui-text-muted">Kehadiran</span>
        <span className={cn("font-semibold tabular-nums", ATTENDANCE_COLORS[attendanceBucket(m.attendance_rate)])}>
          {m.attendance_rate === null ? "—" : `${m.attendance_rate}%`}
        </span>
      </div>

      {/* Division */}
      {m.division_name && (
        <p className="mt-1 truncate text-[10px] text-ui-text-muted">{m.division_name}</p>
      )}

      {/* Public profile link */}
      {m.username && (
        <a
          href={`/players/${m.username}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 text-[10px] text-ui-text-2 transition hover:bg-white/5 hover:text-ui-text"
        >
          <ExternalLink className="h-3 w-3" />
          Profil Publik
        </a>
      )}
    </div>
  );
}

interface RosterCardViewProps {
  members: RosterMember[];
}

const RosterCardView = ({ members }: RosterCardViewProps) => {
  const ROLE_ORDER: Record<string, number> = { owner: 0, manager: 1, coach: 2, captain: 3, member: 4 };
  const sorted = [...members].sort((a, b) => {
    const ro = (ROLE_ORDER[a.role] ?? 99) - (ROLE_ORDER[b.role] ?? 99);
    if (ro !== 0) return ro;
    return (a.display_name ?? a.username ?? "").localeCompare(b.display_name ?? b.username ?? "");
  });

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {sorted.map((m) => (
        <PlayerCard key={m.id} m={m} />
      ))}
    </div>
  );
};
export { RosterCardView };
