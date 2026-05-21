import { notFound, redirect } from "next/navigation";
import { TrendingUp } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { getOrgBySlug } from "@/features/teams/queries";
import { getPlayerTargets } from "@/features/player-development/queries";
import { PlayerTargetCard } from "@/features/player-development/components/PlayerTargetCard";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ "team-slug": string }>;
}

export default async function WorkspaceDevelopmentPage({ params }: Props) {
  const { "team-slug": slug } = await params;
  const organization = await getOrgBySlug(slug);
  if (!organization) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/${slug}/development`);

  const { data: membership } = await supabase
    .from("team_members")
    .select("role")
    .eq("user_id", user.id)
    .eq("organization_id", organization.id)
    .eq("is_active", true)
    .maybeSingle();

  const role = membership?.role ?? "member";
  const canManage =
    role === "coach" ||
    role === "captain" ||
    role === "manager" ||
    role === "owner";

  const targets = await getPlayerTargets(organization.id, user.id);

  return (
    <div className="space-y-6 px-4 py-6 sm:px-8">
      <header className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#252525]">
          <TrendingUp className="h-4 w-4 text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">
            Development Kamu
          </h1>
          <p className="text-xs text-[#6B6A68]">
            Target dan perkembangan skill kamu
          </p>
        </div>
      </header>

      {targets.length === 0 ? (
        <div className="rounded-xl border border-[#2D2D2D] bg-[#202020] p-12 text-center">
          <TrendingUp className="mx-auto mb-3 h-8 w-8 text-[#6B6A68]" />
          <p className="text-sm text-[#9B9A97]">Belum ada target yang ditetapkan.</p>
          <p className="mt-1 text-xs text-[#6B6A68]">
            Coach atau manager akan menetapkan target skill kamu.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {targets.map((target) => (
            <PlayerTargetCard
              key={target.id}
              target={target}
              orgSlug={slug}
              canManage={canManage}
            />
          ))}
        </div>
      )}
    </div>
  );
}
