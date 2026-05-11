import { Hash, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import type { RosterMember } from "@/features/roster/queries";
import { MemberRoleBadge } from "@/features/roster/components/RoleBadge";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function MemberCard({
  member,
  orgSlug,
  canManage,
}: {
  member: RosterMember;
  orgSlug: string;
  canManage: boolean;
}) {
  const displayName =
    member.profile?.display_name ??
    member.profile?.username ??
    "Member tanpa profil";
  const usernameLine =
    member.profile?.display_name && member.profile?.username
      ? `@${member.profile.username}`
      : null;

  const inner = (
    <article
      className={`group flex items-center gap-3 rounded-xl border ${member.is_active ? "border-white/10 bg-zinc-900/40" : "border-white/5 bg-zinc-900/20 opacity-70"} p-3 transition ${canManage ? "hover:border-white/20 hover:bg-zinc-900/70" : ""}`}
    >
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-zinc-800 ring-1 ring-white/10">
        {member.profile?.avatar_url ? (
          <Image
            src={member.profile.avatar_url}
            alt={displayName}
            fill
            sizes="48px"
            className="object-cover"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-xs font-semibold text-white/70">
            {initials(displayName) || "?"}
          </span>
        )}
        {!member.is_active ? (
          <span className="absolute inset-x-0 bottom-0 bg-black/60 text-center text-[9px] uppercase tracking-wide text-white/80">
            Nonaktif
          </span>
        ) : null}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-semibold text-white">
            {displayName}
          </p>
          <MemberRoleBadge role={member.role} />
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-white/55">
          {usernameLine ? <span>{usernameLine}</span> : null}
          {member.position ? (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {member.position}
            </span>
          ) : null}
          {member.jersey_number !== null &&
          member.jersey_number !== undefined ? (
            <span className="inline-flex items-center gap-1">
              <Hash className="h-3 w-3" />
              {member.jersey_number}
            </span>
          ) : null}
          {member.division ? (
            <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-white/70">
              {member.division.name}
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );

  if (!canManage) return inner;
  return (
    <Link
      href={`/${orgSlug}/roster/${member.id}`}
      className="block"
      aria-label={`Kelola ${displayName}`}
    >
      {inner}
    </Link>
  );
}
