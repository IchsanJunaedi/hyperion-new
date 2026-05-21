import { Calendar, Eye, Pin } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import {
  getAnnouncement,
  markAnnouncementRead,
  getAnnouncementReadCount,
} from "@/features/announcements/queries";
import { AnnouncementActions } from "@/features/announcements/components/AnnouncementActions";

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

  const [announcement] = await Promise.all([
    getAnnouncement(id),
    markAnnouncementRead(id),
  ]);
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

  const readCount = isManager ? await getAnnouncementReadCount(id) : null;

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
          className="text-xs text-white/55 hover:text-white"
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
        </div>
        <h1 className="text-3xl font-bold text-white">{announcement.title}</h1>
        <div className="flex flex-wrap items-center gap-4 text-sm text-white/55">
          <div className="inline-flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5" />
            {date}
          </div>
          {readCount !== null && (
            <div className="inline-flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5" />
              <span>{readCount} dibaca</span>
            </div>
          )}
        </div>
      </header>

      <article className="max-w-3xl rounded-2xl border border-white/10 bg-zinc-900/40 p-5 sm:p-6">
        <div className="whitespace-pre-line text-sm leading-relaxed text-white/85">
          {announcement.body}
        </div>
      </article>

      <AnnouncementActions
        orgSlug={slug}
        announcementId={announcement.id}
        isPinned={announcement.is_pinned}
      />
    </div>
  );
}
