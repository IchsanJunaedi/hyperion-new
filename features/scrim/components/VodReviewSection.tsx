"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Plus, X, Video } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";
import {
  addVodTimestampAction,
  deleteVodTimestampAction,
  type VodTimestampRow,
} from "@/features/scrim/actions/vodTimestampsAction";

interface Player {
  userId: string;
  displayName: string;
}

interface VodReviewSectionProps {
  scrimId: string;
  gameNumber: number;
  initialTimestamps: VodTimestampRow[];
  players: Player[];
  canEdit: boolean;
  currentUserId: string;
  isCoach: boolean;
}

function secsToTimestamp(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function parseTimestamp(input: string): number | null {
  const match = input.trim().match(/^(\d{1,3}):(\d{2})$/);
  if (!match) return null;
  const secs = parseInt(match[2]!);
  if (secs >= 60) return null;
  return parseInt(match[1]!) * 60 + secs;
}

const VodReviewSection = ({
  scrimId,
  gameNumber,
  initialTimestamps,
  players,
  canEdit,
  currentUserId,
  isCoach,
}: VodReviewSectionProps) => {
  const [expanded, setExpanded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [timestamps, setTimestamps] = useState<VodTimestampRow[]>(
    [...initialTimestamps].sort((a, b) => a.timestamp_secs - b.timestamp_secs),
  );
  const [timeInput, setTimeInput] = useState("");
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [noteText, setNoteText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [timeError, setTimeError] = useState(false);

  async function handleAdd() {
    const secs = parseTimestamp(timeInput);
    if (secs === null) {
      setTimeError(true);
      return;
    }
    if (!noteText.trim()) return;

    setSubmitting(true);
    const result = await addVodTimestampAction(
      scrimId,
      gameNumber,
      secs,
      selectedPlayerId || null,
      noteText.trim(),
    );
    setSubmitting(false);

    if (!result.ok) {
      toast.error(result.message);
      return;
    }

    setTimestamps((prev) =>
      [...prev, result.timestamp].sort((a, b) => a.timestamp_secs - b.timestamp_secs),
    );
    setTimeInput("");
    setSelectedPlayerId("");
    setNoteText("");
    setShowForm(false);
    setTimeError(false);
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    const result = await deleteVodTimestampAction(id);
    setDeletingId(null);

    if (!result.ok) {
      toast.error(result.message);
      return;
    }

    setTimestamps((prev) => prev.filter((t) => t.id !== id));
  }

  const canDelete = (ts: VodTimestampRow) =>
    isCoach || ts.created_by === currentUserId;

  return (
    <div className="border-t border-white/5">
      {/* Toggle header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-3 text-left hover:bg-white/[0.02] transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <Video className="h-3.5 w-3.5 text-white/40" />
          <span className="text-xs font-semibold text-white/60">VOD Review</span>
          {timestamps.length > 0 && (
            <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] font-bold text-white/60">
              {timestamps.length}
            </span>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="h-3.5 w-3.5 text-white/30" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-white/30" />
        )}
      </button>

      {expanded && (
        <div className="px-5 pb-4 space-y-3">
          {/* Timestamp list */}
          {timestamps.length === 0 && !showForm && (
            <p className="text-xs text-white/30 py-1">Belum ada timestamp.</p>
          )}

          {timestamps.length > 0 && (
            <div className="space-y-1.5">
              {timestamps.map((ts) => (
                <div
                  key={ts.id}
                  data-testid="vod-timestamp-row"
                  className="group flex items-start gap-3 rounded-md bg-white/[0.03] px-3 py-2"
                >
                  <span className="shrink-0 font-mono text-[11px] font-bold text-blue-400/80 pt-0.5 w-10">
                    {secsToTimestamp(ts.timestamp_secs)}
                  </span>
                  <div className="min-w-0 flex-1">
                    {ts.tagged_player_name && (
                      <span className="text-[11px] font-semibold text-purple-400 mr-1.5">
                        @{ts.tagged_player_name}
                      </span>
                    )}
                    <span className="text-xs text-white/80">{ts.note}</span>
                  </div>
                  {canDelete(ts) && (
                    <button
                      data-testid="vod-delete-btn"
                      onClick={() => handleDelete(ts.id)}
                      disabled={deletingId === ts.id}
                      className={cn(
                        "shrink-0 rounded p-0.5 text-white/20 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-400 cursor-pointer",
                        deletingId === ts.id && "opacity-100 animate-pulse",
                      )}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add form */}
          {canEdit && !showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              Tambah Timestamp
            </button>
          )}

          {canEdit && showForm && (
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 space-y-2.5">
              {/* Time input */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
                  Waktu (MM:SS)
                </label>
                <input
                  type="text"
                  placeholder="12:34"
                  value={timeInput}
                  onChange={(e) => {
                    setTimeInput(e.target.value);
                    setTimeError(false);
                  }}
                  className={cn(
                    "w-full rounded-md border bg-white/[0.04] px-3 py-1.5 font-mono text-sm text-white placeholder-white/20 outline-none focus:ring-1 focus:ring-blue-500/50",
                    timeError ? "border-red-500/50" : "border-white/10",
                  )}
                />
                {timeError && (
                  <p className="text-[10px] text-red-400">Format: MM:SS (contoh: 12:34)</p>
                )}
              </div>

              {/* Player dropdown */}
              {players.length > 0 && (
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
                    Player (opsional)
                  </label>
                  <select
                    value={selectedPlayerId}
                    onChange={(e) => setSelectedPlayerId(e.target.value)}
                    className="w-full rounded-md border border-white/10 bg-[#191919] px-3 py-1.5 text-sm text-white outline-none focus:ring-1 focus:ring-blue-500/50 cursor-pointer"
                  >
                    <option value="">— Tidak ada —</option>
                    {players.map((p) => (
                      <option key={p.userId} value={p.userId}>
                        {p.displayName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Note */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
                  Catatan
                </label>
                <input
                  type="text"
                  placeholder="Positioning salah di lord pit..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                  className="w-full rounded-md border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm text-white placeholder-white/20 outline-none focus:ring-1 focus:ring-blue-500/50"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-0.5">
                <button
                  onClick={handleAdd}
                  disabled={submitting || !noteText.trim() || !timeInput}
                  className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  {submitting ? "Menyimpan..." : "Simpan"}
                </button>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setTimeInput("");
                    setSelectedPlayerId("");
                    setNoteText("");
                    setTimeError(false);
                  }}
                  className="rounded-md px-3 py-1.5 text-xs text-white/40 hover:text-white/70 transition-colors cursor-pointer"
                >
                  Batal
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export { VodReviewSection };
