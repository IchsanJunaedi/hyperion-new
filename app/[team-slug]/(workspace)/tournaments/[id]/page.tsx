import { Calendar, ExternalLink, Trophy } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getCurrentUserRole } from "@/features/roster/queries";
import { getOrgBySlug } from "@/features/teams/queries";
import { getTournamentDetail } from "@/features/tournaments/queries";
import { TournamentTimeline } from "@/features/tournaments/components/TournamentTimeline";
import { TournamentDetailActions } from "@/features/tournaments/components/TournamentDetailActions";

export const dynamic = "force-dynamic";

interface TournamentDetailPageProps {
  params: Promise<{ "team-slug": string; id: string }>;
}

export default async function TournamentDetailPage({ params }: TournamentDetailPageProps) {
  const { "team-slug": slug, id } = await params;
  const organization = await getOrgBySlug(slug);
  if (!organization) notFound();

  const detail = await getTournamentDetail(id);
  if (!detail) notFound();

  const currentUserRole = await getCurrentUserRole(organization.id);
  const canManage = ["captain", "manager", "owner"].includes(currentUserRole ?? "");

  const startDate = new Date(detail.start_date).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6 px-4 py-6 sm:px-8">
      <header className="space-y-2">
        <Link
          href={`/${slug}/tournaments`}
          className="text-xs text-white/55 hover:text-white"
        >
          ← Daftar turnamen
        </Link>
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-400" />
          <h1 className="text-2xl font-bold text-white sm:text-3xl">{detail.name}</h1>
        </div>
        {detail.organizer && (
          <p className="text-sm text-[#9B9A97]">oleh {detail.organizer}</p>
        )}
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          {/* Info */}
          <article className="rounded-2xl border border-white/10 bg-zinc-900/40 p-5 space-y-3">
            <h2 className="text-sm font-semibold text-[#E5E2E1]">Detail</h2>
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs text-[#6B6A68]">Tanggal</dt>
                <dd className="text-[#E5E2E1] inline-flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-[#9B9A97]" />
                  {startDate}
                  {detail.end_date && ` — ${new Date(detail.end_date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}`}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[#6B6A68]">Divisi</dt>
                <dd className="text-[#E5E2E1]">{detail.division_name ?? "—"}</dd>
              </div>
              {detail.prize_pool && (
                <div>
                  <dt className="text-xs text-[#6B6A68]">Prize Pool</dt>
                  <dd className="text-yellow-400 font-medium">{detail.prize_pool}</dd>
                </div>
              )}
              {detail.registration_fee && (
                <div>
                  <dt className="text-xs text-[#6B6A68]">Biaya Registrasi</dt>
                  <dd className="text-[#E5E2E1]">{detail.registration_fee}</dd>
                </div>
              )}
              {detail.registration_deadline && (
                <div>
                  <dt className="text-xs text-[#6B6A68]">Deadline Registrasi</dt>
                  <dd className="text-[#E5E2E1]">
                    {new Date(detail.registration_deadline).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-xs text-[#6B6A68]">Status Registrasi</dt>
                <dd>
                  {detail.is_registered ? (
                    <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-400">Terdaftar</span>
                  ) : (
                    <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs font-medium text-[#6B6A68]">Belum daftar</span>
                  )}
                </dd>
              </div>
            </dl>
            {(detail.link || detail.registration_url) && (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-[#2D2D2D]">
                {detail.link && (
                  <a
                    href={detail.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-blue-400 hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Link Turnamen
                  </a>
                )}
                {detail.registration_url && (
                  <a
                    href={detail.registration_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-blue-400 hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Link Registrasi
                  </a>
                )}
              </div>
            )}
            {detail.notes && (
              <p className="text-sm text-[#9B9A97] whitespace-pre-line pt-2 border-t border-[#2D2D2D]">
                {detail.notes}
              </p>
            )}
          </article>

          {/* Timeline (Feature 12) */}
          {detail.is_registered && (
            <article className="rounded-2xl border border-white/10 bg-zinc-900/40 p-5">
              <TournamentTimeline
                stages={detail.stages}
                tournamentId={detail.id}
                orgSlug={slug}
                canManage={canManage}
              />
            </article>
          )}
        </div>

        <aside>
          {canManage && (
            <TournamentDetailActions
              tournament={detail}
              orgSlug={slug}
            />
          )}
        </aside>
      </div>
    </div>
  );
}
