import { AlertCircle, Calendar, CheckCircle2, Clock, Eye, Pin, Users } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import {
  getAnnouncement,
  markAnnouncementRead,
  getAnnouncementReadCount,
  hasCurrentUserAcknowledged,
  getAcknowledgementDetails,
} from "@/features/announcements/queries";
import { AnnouncementActions } from "@/features/announcements/components/AnnouncementActions";
import { AcknowledgeButton } from "@/features/announcements/components/AcknowledgeButton";

export const dynamic = "force-dynamic";

interface AnnouncementDetailPageProps {
  params: Promise<{ "team-slug": string; id: string }>;
}

export default async function AnnouncementDetailPage({
  params,
}: AnnouncementDetailPageProps) {
  const { "team-slug": slug, id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const announcement = await getAnnouncement(id);
  if (!announcement) notFound();

  const { data: membership } = user
    ? await supabase
        .from("team_members")
        .select("role")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle()
    : { data: null };

  const isManager =
    membership?.role === "manager" ||
    membership?.role === "owner" ||
    user?.email === process.env.OWNER_EMAIL;

  const canManageAnnouncement =
    isManager ||
    membership?.role === "coach" ||
    membership?.role === "captain";

  // For requires_ack announcements, don't auto-mark — require explicit confirmation
  const alreadyAcknowledged = announcement.requires_ack && user
    ? await hasCurrentUserAcknowledged(id)
    : false;

  if (!announcement.requires_ack) {
    await markAnnouncementRead(id);
  }

  const [readCount, totalMembers, ackDetails] = await Promise.all([
    isManager ? getAnnouncementReadCount(id) : Promise.resolve(null),
    isManager
      ? supabase
          .from("team_members")
          .select("*", { count: "exact", head: true })
          .eq("organization_id", announcement.organization_id)
          .eq("is_active", true)
          .then(({ count }) => count ?? 0)
      : Promise.resolve(null),
    isManager && announcement.requires_ack
      ? getAcknowledgementDetails(id, announcement.organization_id)
      : Promise.resolve(null),
  ]);

  const date = new Date(announcement.created_at).toLocaleString("id-ID", {
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
        <Link
          href={`/${slug}/announcements`}
          className="text-xs text-ui-text-2 hover:text-ui-text"
        >
          ← Pengumuman
        </Link>
        <div className="flex items-center gap-2">
          {announcement.is_pinned && (
            <span className="inline-flex items-center gap-1 rounded-full bg-yellow-400/10 px-2 py-0.5 text-xs font-medium text-yellow-400">
              <Pin className="h-3 w-3" />
              Pinned
            </span>
          )}
          {announcement.requires_ack && (
            <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/10 px-2 py-0.5 text-xs font-medium text-orange-400">
              <AlertCircle className="h-3 w-3" />
              Wajib Konfirmasi
            </span>
          )}
        </div>
        <h1 className="text-3xl font-bold text-ui-text">{announcement.title}</h1>
        <div className="flex flex-wrap items-center gap-4 text-sm text-ui-text-2">
          <div className="inline-flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5" />
            {date}
          </div>
          {readCount !== null && (
            <div className="inline-flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5" />
              <span>
                {readCount}
                {totalMembers !== null ? `/${totalMembers}` : ""} dibaca
              </span>
            </div>
          )}
        </div>
      </header>

      <article className="max-w-3xl rounded-2xl border border-ui-border bg-ui-surface/40 p-5 sm:p-6">
        <div className="whitespace-pre-line text-sm leading-relaxed text-ui-text">
          {announcement.body}
        </div>
      </article>

      {/* Acknowledgement block for members */}
      {announcement.requires_ack && !isManager && (
        <div className={`max-w-3xl rounded-2xl border p-5 ${
          alreadyAcknowledged
            ? "border-green-500/20 bg-green-500/5"
            : "border-orange-500/20 bg-orange-500/5"
        }`}>
          {alreadyAcknowledged ? (
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-green-400" />
              <div>
                <p className="text-sm font-semibold text-green-400">Sudah Dikonfirmasi</p>
                <p className="text-xs text-ui-text-muted">Kamu telah mengkonfirmasi pengumuman ini.</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-orange-400" />
                <div>
                  <p className="text-sm font-semibold text-orange-400">Konfirmasi Diperlukan</p>
                  <p className="text-xs text-ui-text-2">Klik tombol untuk mengkonfirmasi bahwa kamu telah membaca dan memahami pengumuman ini.</p>
                </div>
              </div>
              <AcknowledgeButton orgSlug={slug} announcementId={id} />
            </div>
          )}
        </div>
      )}

      {/* Manager acknowledgement overview */}
      {isManager && announcement.requires_ack && ackDetails && (
        <div className="max-w-3xl rounded-2xl border border-ui-border bg-ui-surface/40 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-4 w-4 text-ui-text-muted" />
            <h3 className="text-sm font-semibold text-ui-text">Status Konfirmasi Member</h3>
            <span className="ml-auto text-xs text-ui-text-muted">
              {ackDetails.acknowledgedCount}/{ackDetails.acknowledgedCount + ackDetails.pendingCount} sudah konfirmasi
            </span>
          </div>
          {/* Progress bar */}
          <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-ui-hover">
            <div
              className="h-full rounded-full bg-green-500 transition-all"
              style={{
                width: `${
                  ackDetails.acknowledgedCount + ackDetails.pendingCount > 0
                    ? Math.round((ackDetails.acknowledgedCount / (ackDetails.acknowledgedCount + ackDetails.pendingCount)) * 100)
                    : 0
                }%`,
              }}
            />
          </div>
          {ackDetails.pendingCount > 0 ? (
            <div>
              <p className="mb-2 text-xs font-medium text-ui-text-2">Belum konfirmasi ({ackDetails.pendingCount}):</p>
              <div className="flex flex-wrap gap-1.5">
                {ackDetails.pendingNames.map((name) => (
                  <span key={name} className="rounded-full bg-orange-500/10 px-2.5 py-1 text-xs text-orange-400">
                    {name}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              <p className="text-sm font-medium">Semua member sudah konfirmasi!</p>
            </div>
          )}
        </div>
      )}

      {canManageAnnouncement && (
        <AnnouncementActions
          orgSlug={slug}
          announcementId={announcement.id}
          isPinned={announcement.is_pinned}
        />
      )}
    </div>
  );
}
