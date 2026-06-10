import { AlertCircle, Eye, Megaphone, Pin } from "lucide-react";
import Link from "next/link";

import type { Database } from "@/types/database";

type Announcement = Database["public"]["Tables"]["announcements"]["Row"];

interface AnnouncementCardProps {
  announcement: Announcement;
  orgSlug: string;
  readCount?: number;
  totalMembers?: number;
}

const AnnouncementCard = ({
  announcement,
  orgSlug,
  readCount,
  totalMembers,
}: AnnouncementCardProps) => {
  const date = new Date(announcement.created_at).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });

  return (
    <Link
      href={`/${orgSlug}/announcements/${announcement.id}`}
      className="block rounded-xl border border-white/10 bg-zinc-900/40 p-5 transition hover:border-white/20 hover:bg-zinc-900/60"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Megaphone className="h-4 w-4 text-yellow-400" />
          <h3 className="line-clamp-1 text-sm font-semibold text-ui-text">
            {announcement.title}
          </h3>
        </div>
        {announcement.requires_ack && (
          <AlertCircle className="h-3.5 w-3.5 shrink-0 text-orange-400" />
        )}
        {announcement.is_pinned && (
          <Pin className="h-3.5 w-3.5 shrink-0 text-yellow-400" />
        )}
      </div>
      <p className="mt-2 line-clamp-2 text-sm text-ui-text-2">
        {announcement.body}
      </p>
      <div className="mt-3 flex items-center justify-between gap-2">
        <p className="text-xs text-ui-text-muted">{date}</p>
        {readCount !== undefined && (
          <span className="inline-flex items-center gap-1 text-[10px] text-ui-text-muted">
            <Eye className="h-3 w-3" />
            {readCount}{totalMembers !== undefined ? `/${totalMembers}` : ""} dibaca
          </span>
        )}
      </div>
    </Link>
  );
};
export { AnnouncementCard };
