import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { MemberManagePanel } from "@/features/roster/components/MemberManagePanel";
import { MemberRoleBadge } from "@/features/roster/components/RoleBadge";
import {
  getCurrentMemberRole,
  getRosterMember,
} from "@/features/roster/queries";
import { getOrgBySlug } from "@/features/teams/queries";

export const dynamic = "force-dynamic";

interface MemberDetailPageProps {
  params: Promise<{ "team-slug": string; memberId: string }>;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default async function MemberDetailPage({
  params,
}: MemberDetailPageProps) {
  const { "team-slug": slug, memberId } = await params;
  const organization = await getOrgBySlug(slug);
  if (!organization) notFound();

  const role = await getCurrentMemberRole(organization.id);
  if (role !== "owner" && role !== "captain") {
    redirect(`/${slug}/roster`);
  }

  const member = await getRosterMember(memberId);
  if (!member || member.organization_id !== organization.id) notFound();

  const displayName =
    member.profile?.display_name ??
    member.profile?.username ??
    "Member tanpa profil";

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-8">
      <Link
        href={`/${slug}/roster`}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-white/60 transition hover:text-white"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Kembali ke roster
      </Link>

      <header className="flex flex-wrap items-center gap-4">
        <div className="relative h-16 w-16 overflow-hidden rounded-full bg-zinc-800 ring-1 ring-white/10">
          {member.profile?.avatar_url ? (
            <Image
              src={member.profile.avatar_url}
              alt={displayName}
              fill
              sizes="64px"
              className="object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-sm font-semibold text-white/70">
              {initials(displayName) || "?"}
            </span>
          )}
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-white sm:text-2xl">
            {displayName}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-white/55">
            <MemberRoleBadge role={member.role} size="md" />
            {member.profile?.username ? (
              <span>@{member.profile.username}</span>
            ) : null}
            {member.division ? (
              <span className="rounded bg-white/5 px-1.5 py-0.5 uppercase tracking-wide">
                {member.division.name}
              </span>
            ) : null}
            <span
              className={`rounded px-1.5 py-0.5 uppercase tracking-wide ${member.is_active ? "bg-emerald-500/15 text-emerald-300" : "bg-zinc-500/15 text-zinc-300"}`}
            >
              {member.is_active ? "Aktif" : "Nonaktif"}
            </span>
          </div>
        </div>
      </header>

      <MemberManagePanel
        member={member}
        orgSlug={slug}
        canRemove={role === "owner"}
      />
    </div>
  );
}
