import { ArrowLeft, Calendar, MapPin, MessageCircle } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ScrimCountdown } from "@/components/team/ScrimCountdown";
import { AttendanceList } from "@/features/scrim/components/AttendanceList";
import { AttendanceTracker } from "@/features/scrim/components/AttendanceTracker";
import { CancelScrimButton } from "@/features/scrim/components/CancelScrimButton";
import { FinishScrimSection } from "@/features/scrim/components/FinishScrimSection";
import { ScrimReviewSection } from "@/features/scrim/components/ScrimReviewSection";
import { ScrimStatusBadge } from "@/features/scrim/components/StatusBadge";
import { ScrimVodLinkSection } from "@/features/scrim/components/ScrimVodLinkSection";
import { CoachSummarySection } from "@/features/scrim/components/CoachSummarySection";
import { getCurrentUserRole } from "@/features/roster/queries";
import {
  getScrimDetail,
  getScrimReviewRequest,
  getOpponentHistory,
  summarizeAttendance,
} from "@/features/scrim/queries";
import { findOpponentByName } from "@/features/scouting/queries";
import { ScoutingCard } from "@/features/scouting/components/ScoutingCard";
import { ContextFiles } from "@/features/files/components/ContextFiles";
import { getLinkedFiles } from "@/features/files/queries";

export const dynamic = "force-dynamic";

interface ScrimDetailPageProps {
  params: Promise<{ "team-slug": string; id: string }>;
}

export default async function ScrimDetailPage({
  params,
}: ScrimDetailPageProps) {
  const { "team-slug": slug, id } = await params;
  const detail = await getScrimDetail(id);
  if (!detail) notFound();
  const { scrim, attendances, result, resultImageUrl, divisionName, myAttendance } = detail;
  const counts = summarizeAttendance(attendances);
  const locked = scrim.status === "completed" || scrim.status === "cancelled";

  const currentUserRole = await getCurrentUserRole(scrim.organization_id);
  const canManageScrims = ["captain", "manager", "owner"].includes(currentUserRole ?? "");
  const isCoach = currentUserRole === "coach";

  const [opponentProfile, reviewRequest, opponentHistory, linkedFiles] = await Promise.all([
    findOpponentByName(scrim.organization_id, scrim.opponent_name),
    getScrimReviewRequest(id),
    getOpponentHistory(scrim.organization_id, scrim.opponent_name, id),
    getLinkedFiles(scrim.organization_id, "scrim", id),
  ]);

  const scheduled = new Date(scrim.scheduled_at).toLocaleString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });

  return (
    <div className="space-y-6 px-4 py-6 sm:px-8">
      <header className="space-y-2">
      <div className="flex justify-start">
        <Link
          href={`/${slug}/scrim`}
          className="group inline-flex items-center gap-2 rounded-full border border-ui-border bg-ui-surface/40 px-3.5 py-1.5 text-xs font-semibold text-ui-text-2 transition-all duration-300 hover:bg-ui-elevated/60 hover:text-ui-text"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-x-0.5" />
          Kembali ke daftar scrim
        </Link>
      </div>
        <div className="flex items-center gap-2">
          <ScrimStatusBadge status={scrim.status} />
          <span className="text-xs uppercase tracking-wide text-ui-text-2">
            {scrim.format.toUpperCase()}
            {divisionName ? ` · ${divisionName}` : ""}
          </span>
        </div>
        <h1 className="text-3xl font-bold text-ui-text">vs {scrim.opponent_name}</h1>
        {scrim.status === "scheduled" && (
          <div className="mt-3">
            <ScrimCountdown scrim={scrim} orgSlug={slug} myAttendanceStatus={myAttendance?.status} />
          </div>
        )}
        <dl className="grid gap-1 text-sm text-ui-text sm:grid-cols-2">
          <div className="inline-flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 text-ui-text-2" />
            {scheduled}
          </div>
          {scrim.server_region ? (
            <div className="inline-flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-ui-text-2" />
              {scrim.server_region}
            </div>
          ) : null}
          {scrim.opponent_contact ? (
            <div className="inline-flex items-center gap-2">
              <MessageCircle className="h-3.5 w-3.5 text-ui-text-2" />
              {scrim.opponent_contact}
            </div>
          ) : null}
        </dl>
      </header>

      {canManageScrims && (
        <div className="flex flex-wrap items-center gap-3">
          {!locked && (
            <Link
              href={`/${slug}/scrim/${scrim.id}/edit`}
              className="inline-flex h-9 items-center rounded-md border border-ui-border px-4 text-sm font-medium text-ui-text transition hover:bg-ui-elevated"
            >
              Edit scrim
            </Link>
          )}
          {(scrim.status === "scheduled" || scrim.status === "ongoing") && (
            <CancelScrimButton scrimId={scrim.id} orgSlug={slug} />
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="space-y-6">
          {/* Only show attendance RSVP for captain and member (not manager/owner/coach) */}
          {(currentUserRole === "captain" || currentUserRole === "member") && (
          <article className="rounded-2xl border border-ui-border bg-ui-surface/40 p-5">
            <h2 className="text-sm font-semibold text-ui-text">
              Konfirmasi kehadiran kamu
            </h2>
            <p className="mt-1 text-xs text-ui-text-2">
              Pilih satu — bisa diubah selama scrim belum selesai.
            </p>
            <div className="mt-4">
              <AttendanceTracker
                scrimId={scrim.id}
                orgSlug={slug}
                initialStatus={myAttendance?.status ?? "pending"}
                locked={locked}
              />
            </div>
          </article>
          )}

          <article className="rounded-2xl border border-ui-border bg-ui-surface/40 p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-ui-text">
                Anggota divisi
              </h2>
              <p className="text-xs text-ui-text-2">
                {counts.confirmed} hadir · {counts.declined} tidak ·{" "}
                {counts.pending} pending
              </p>
            </div>
            <div className="mt-4">
              <AttendanceList scrimId={scrim.id} rows={attendances} />
            </div>
          </article>

          {scrim.notes || scrim.room_info ? (
            <article className="rounded-2xl border border-ui-border bg-ui-surface/40 p-5">
              <h2 className="text-sm font-semibold text-ui-text">
                Detail tambahan
              </h2>
              {scrim.room_info ? (
                <p className="mt-3 text-sm text-ui-text">
                  <span className="text-ui-text-2">Room:</span> {scrim.room_info}
                </p>
              ) : null}
              {scrim.notes ? (
                <p className="mt-2 whitespace-pre-line text-sm text-ui-text">
                  {scrim.notes}
                </p>
              ) : null}
            </article>
          ) : null}

          {(scrim.vod_link || canManageScrims || isCoach) && (
            <ScrimVodLinkSection
              scrimId={scrim.id}
              initialLink={scrim.vod_link}
              canEdit={canManageScrims || isCoach}
            />
          )}

          <CoachSummarySection
            scrimId={scrim.id}
            initialSummary={scrim.coach_summary}
            canEdit={canManageScrims || isCoach}
          />
        </section>

        <aside className="space-y-6">
          <FinishScrimSection
            scrim={scrim}
            orgSlug={slug}
            canManage={canManageScrims}
            initialResult={result}
            resultImageUrl={resultImageUrl}
          />

          {/* Review request (shown for coaches, captains, and members on completed scrims) */}
          {(isCoach || currentUserRole === "captain" || currentUserRole === "member") && (
            <ScrimReviewSection
              orgSlug={slug}
              scrimId={scrim.id}
              role={currentUserRole}
              reviewRequest={reviewRequest}
              scrimCompleted={scrim.status === "completed"}
            />
          )}

          {/* Files linked to this scrim */}
          {(linkedFiles.length > 0 || isCoach || canManageScrims) && (
            <article className="rounded-2xl border border-ui-border bg-ui-surface/40 p-5">
              <ContextFiles
                orgId={scrim.organization_id}
                orgSlug={slug}
                refType="scrim"
                refId={id}
                canUpload={isCoach || canManageScrims}
                initialFiles={linkedFiles}
              />
            </article>
          )}

          {/* Scouting info (auto-shown if opponent profile exists) */}
          {opponentProfile && (
            <article className="rounded-2xl border border-ui-border bg-ui-surface/40 p-5">
              <h2 className="text-sm font-semibold text-ui-text mb-3">Intel Lawan</h2>
              <ScoutingCard profile={opponentProfile} />
            </article>
          )}

          {/* Opponent history */}
          {opponentHistory.length > 0 && (
            <article className="rounded-2xl border border-ui-border bg-ui-surface/40 p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-ui-text">Riwayat vs {scrim.opponent_name}</h2>
                <span className="text-xs text-ui-text-muted">{opponentHistory.length} pertandingan</span>
              </div>
              <div className="space-y-2">
                {opponentHistory.map((h) => {
                  const date = new Date(h.scheduled_at).toLocaleDateString("id-ID", {
                    day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta",
                  });
                  const scoreText = h.our_score != null && h.opponent_score != null
                    ? `${h.our_score}–${h.opponent_score}`
                    : "–";
                  return (
                    <div key={h.scrim_id} className="flex items-center justify-between text-xs">
                      <span className="text-ui-text-2">{date} · {h.format.toUpperCase()}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-ui-text">{scoreText}</span>
                        {h.is_win !== null && (
                          <span className={h.is_win ? "font-semibold text-green-400" : "font-semibold text-red-400"}>
                            {h.is_win ? "W" : "L"}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {(() => {
                const wins = opponentHistory.filter(h => h.is_win === true).length;
                const total = opponentHistory.filter(h => h.is_win !== null).length;
                if (total === 0) return null;
                return (
                  <div className="mt-3 border-t border-ui-border pt-3 text-xs text-ui-text-muted">
                    W/L: <span className="font-semibold text-ui-text">{wins}/{total - wins}</span>
                  </div>
                );
              })()}
            </article>
          )}
        </aside>
      </div>
    </div>
  );
}
