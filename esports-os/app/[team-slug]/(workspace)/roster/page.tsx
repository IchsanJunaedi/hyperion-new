import { Mail, Plus, UserPlus, Users } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { MemberCard } from "@/features/roster/components/MemberCard";
import { PendingInviteRow } from "@/features/roster/components/PendingInviteRow";
import {
  getCurrentMemberRole,
  listPendingInvites,
  listRosterMembers,
  sortRosterByRoleThenName,
  summarizeRoster,
} from "@/features/roster/queries";
import { getOrgBySlug } from "@/features/teams/queries";
import { createClient } from "@/lib/supabase/server";
import type { MemberRole } from "@/types/database";

export const dynamic = "force-dynamic";

interface RosterPageProps {
  params: Promise<{ "team-slug": string }>;
  searchParams: Promise<{
    division?: string;
    role?: string;
    inactive?: string;
  }>;
}

function canManage(role: MemberRole | null): boolean {
  return role === "owner" || role === "captain";
}

export default async function RosterPage({
  params,
  searchParams,
}: RosterPageProps) {
  const [{ "team-slug": slug }, sp] = await Promise.all([params, searchParams]);
  const organization = await getOrgBySlug(slug);
  if (!organization) notFound();

  const role = await getCurrentMemberRole(organization.id);
  const includeInactive = sp.inactive === "1";

  const supabase = await createClient();
  const { data: allDivisions } = await supabase
    .from("divisions")
    .select("id, name")
    .eq("organization_id", organization.id)
    .eq("is_active", true)
    .order("name", { ascending: true });
  const divisions = allDivisions ?? [];

  const divisionFilter = sp.division
    ? sp.division === "none"
      ? null
      : divisions.find((d) => d.id === sp.division)
        ? sp.division
        : undefined
    : undefined;

  const members = await listRosterMembers(organization.id, {
    divisionId: divisionFilter,
    includeInactive,
  });

  const filteredByRole =
    sp.role && ["owner", "captain", "member", "coach", "manager"].includes(sp.role)
      ? members.filter((m) => m.role === (sp.role as MemberRole))
      : members;

  const sorted = sortRosterByRoleThenName(filteredByRole);
  const summary = summarizeRoster(members);

  const pendingInvites = canManage(role)
    ? await listPendingInvites(organization.id)
    : [];

  return (
    <div className="space-y-6 px-4 py-6 sm:px-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-white/55">Roster</p>
          <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
            Anggota tim
          </h1>
          <p className="mt-1 text-sm text-white/60">
            {summary.total} anggota
            {includeInactive ? " (termasuk nonaktif)" : " aktif"}
            {summary.byRole.captain > 0
              ? ` · ${summary.byRole.captain} captain`
              : ""}
            {summary.byRole.coach > 0 ? ` · ${summary.byRole.coach} coach` : ""}
          </p>
        </div>
        {canManage(role) ? (
          <Link
            href={`/${slug}/roster/invite`}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-yellow-400 px-4 text-sm font-semibold text-black transition hover:bg-yellow-300"
          >
            <UserPlus className="h-4 w-4" />
            Undang member
          </Link>
        ) : null}
      </header>

      <RosterFilters
        slug={slug}
        divisions={divisions}
        currentDivision={sp.division}
        currentRole={sp.role}
        includeInactive={includeInactive}
      />

      {sorted.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 bg-zinc-900/30 p-10 text-center">
          <Users className="mx-auto h-8 w-8 text-white/35" />
          <p className="mt-3 text-sm text-white/65">
            Belum ada anggota yang cocok dengan filter ini.
          </p>
          {canManage(role) ? (
            <Link
              href={`/${slug}/roster/invite`}
              className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-md border border-white/15 px-4 text-sm font-medium text-white transition hover:bg-white/5"
            >
              <Plus className="h-3.5 w-3.5" />
              Undang member pertama
            </Link>
          ) : null}
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {sorted.map((m) => (
            <li key={m.id}>
              <MemberCard
                member={m}
                orgSlug={slug}
                canManage={canManage(role)}
              />
            </li>
          ))}
        </ul>
      )}

      {canManage(role) && pendingInvites.length > 0 ? (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
            <Mail className="h-4 w-4 text-white/55" />
            Undangan menunggu ({pendingInvites.length})
          </h2>
          <div className="space-y-2">
            {pendingInvites.map((inv) => (
              <PendingInviteRow key={inv.id} invite={inv} orgSlug={slug} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function RosterFilters({
  slug,
  divisions,
  currentDivision,
  currentRole,
  includeInactive,
}: {
  slug: string;
  divisions: Array<{ id: string; name: string }>;
  currentDivision?: string;
  currentRole?: string;
  includeInactive: boolean;
}) {
  function url(updates: Record<string, string | undefined>): string {
    const sp = new URLSearchParams();
    const next = {
      division: currentDivision,
      role: currentRole,
      inactive: includeInactive ? "1" : undefined,
      ...updates,
    };
    for (const [k, v] of Object.entries(next)) {
      if (v !== undefined && v !== "") sp.set(k, v);
    }
    const qs = sp.toString();
    return `/${slug}/roster${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <FilterChip
        href={url({ division: undefined })}
        active={!currentDivision}
        label="Semua divisi"
      />
      {divisions.map((d) => (
        <FilterChip
          key={d.id}
          href={url({ division: d.id })}
          active={currentDivision === d.id}
          label={d.name}
        />
      ))}
      <FilterChip
        href={url({ division: "none" })}
        active={currentDivision === "none"}
        label="Tanpa divisi"
      />
      <span className="mx-1 h-6 w-px bg-white/10" aria-hidden />
      {(["captain", "member", "coach", "manager"] as const).map((r) => (
        <FilterChip
          key={r}
          href={url({ role: currentRole === r ? undefined : r })}
          active={currentRole === r}
          label={r.charAt(0).toUpperCase() + r.slice(1)}
        />
      ))}
      <span className="mx-1 h-6 w-px bg-white/10" aria-hidden />
      <FilterChip
        href={url({ inactive: includeInactive ? undefined : "1" })}
        active={includeInactive}
        label="Tampilkan nonaktif"
      />
    </div>
  );
}

function FilterChip({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex h-8 items-center rounded-full px-3 text-xs font-medium transition ${active ? "bg-white text-black" : "bg-zinc-800 text-white/70 hover:bg-zinc-700 hover:text-white"}`}
    >
      {label}
    </Link>
  );
}
