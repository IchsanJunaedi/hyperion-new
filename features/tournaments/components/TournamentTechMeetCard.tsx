"use client";

import { ExternalLink, Loader2, Pencil, Video } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateTournamentTechMeetAction } from "../actions";

interface TournamentTechMeetCardProps {
  orgSlug: string;
  tournamentId: string;
  initialDate: string | null;
  initialTime: string | null;
  initialLink: string | null;
  canManage: boolean;
}

function formatMeetDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });
}

function formatMeetTime(timeStr: string): string {
  return timeStr.slice(0, 5) + " WIB";
}

function getMeetLabel(link: string): string {
  if (link.includes("zoom.us") || link.includes("zoom.com")) return "Zoom Meeting";
  if (link.includes("meet.google.com")) return "Google Meet";
  if (link.includes("teams.microsoft.com")) return "Microsoft Teams";
  return "Link Meeting";
}

const TournamentTechMeetCard = ({
  orgSlug,
  tournamentId,
  initialDate,
  initialTime,
  initialLink,
  canManage,
}: TournamentTechMeetCardProps) => {
  const [editing, setEditing] = useState(false);
  const [date, setDate] = useState(initialDate ?? "");
  const [time, setTime] = useState(initialTime ? initialTime.slice(0, 5) : "");
  const [link, setLink] = useState(initialLink ?? "");
  const [pending, startTransition] = useTransition();

  const hasData = !!(initialDate || initialTime || initialLink);

  function handleSave() {
    startTransition(async () => {
      const res = await updateTournamentTechMeetAction(orgSlug, tournamentId, {
        tech_meet_date: date || null,
        tech_meet_time: time || null,
        tech_meet_link: link.trim() || null,
      });
      if (res.ok) {
        toast.success("Tech meeting berhasil disimpan!");
        setEditing(false);
      } else {
        toast.error(res.message);
      }
    });
  }

  function handleCancel() {
    setDate(initialDate ?? "");
    setTime(initialTime ? initialTime.slice(0, 5) : "");
    setLink(initialLink ?? "");
    setEditing(false);
  }

  return (
    <article className="rounded-2xl border border-white/10 bg-zinc-900/40 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Video className="h-3.5 w-3.5 text-blue-400" />
          <h3 className="text-sm font-semibold text-ui-text">Tech Meeting</h3>
        </div>
        {canManage && !editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1.5 text-xs text-ui-text-2 hover:text-ui-text cursor-pointer transition-colors"
          >
            <Pencil className="h-3 w-3" />
            Atur
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs text-ui-text-muted font-medium">Tanggal</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-8 w-full rounded-md border border-ui-border bg-ui-bg px-3 text-xs text-ui-text focus:border-blue-400/50 focus:outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-ui-text-muted font-medium">Jam (WIB)</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="h-8 w-full rounded-md border border-ui-border bg-ui-bg px-3 text-xs text-ui-text focus:border-blue-400/50 focus:outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-ui-text-muted font-medium">Link Zoom / Google Meet</label>
            <input
              type="url"
              placeholder="https://zoom.us/j/... atau meet.google.com/..."
              value={link}
              onChange={(e) => setLink(e.target.value)}
              className="h-8 w-full rounded-md border border-ui-border bg-ui-bg px-3 text-xs text-ui-text focus:border-blue-400/50 focus:outline-none"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              disabled={pending}
              onClick={handleSave}
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-blue-500 px-3.5 text-xs font-semibold text-white hover:bg-blue-400 disabled:opacity-50 cursor-pointer transition-colors"
            >
              {pending && <Loader2 className="h-3 w-3 animate-spin" />}
              Simpan
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="h-8 rounded-md border border-ui-border px-3.5 text-xs text-ui-text-2 hover:bg-ui-hover cursor-pointer transition-colors"
            >
              Batal
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {hasData ? (
            <>
              {initialDate && (
                <div className="flex items-start gap-2.5">
                  <span className="mt-0.5 text-xs font-medium text-ui-text-muted w-14 shrink-0">Tanggal</span>
                  <span className="text-xs text-ui-text">{formatMeetDate(initialDate)}</span>
                </div>
              )}
              {initialTime && (
                <div className="flex items-start gap-2.5">
                  <span className="mt-0.5 text-xs font-medium text-ui-text-muted w-14 shrink-0">Jam</span>
                  <span className="text-xs text-ui-text">{formatMeetTime(initialTime)}</span>
                </div>
              )}
              {initialLink && (
                <a
                  href={initialLink.startsWith("http") ? initialLink : `https://${initialLink}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 flex items-center gap-2.5 rounded-lg border border-white/5 bg-white/[0.02] px-3.5 py-2.5 text-xs text-white/70 hover:bg-white/[0.05] hover:text-ui-text transition"
                >
                  <ExternalLink className="h-4 w-4 text-blue-400 shrink-0" />
                  <span className="flex-1 truncate font-medium">{getMeetLabel(initialLink)}</span>
                  <span className="text-[10px] text-white/30 shrink-0">Join</span>
                </a>
              )}
            </>
          ) : (
            <p className="text-xs text-white/35 italic">Belum ada jadwal tech meeting.</p>
          )}
        </div>
      )}
    </article>
  );
};
export { TournamentTechMeetCard };
