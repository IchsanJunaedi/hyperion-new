"use client";

import { CheckCircle2, ChevronDown, ChevronUp, Circle, Loader2, Pencil, Plus, Swords, Trash2, X, Send } from "lucide-react";
import { useState, useTransition } from "react";

import { useNotify } from "@/features/dashboard/components/NotifyModal";
import { ConfirmDeleteDialog } from "@/features/dashboard/components/ConfirmDeleteDialog";
import { TournamentMatchDetail } from "@/features/tournaments/components/TournamentMatchDetail";
import {
  createTournamentStageAction,
  updateTournamentStageAction,
  deleteTournamentStageAction,
  toggleStageCompleteAction,
  addTournamentMatchAction,
  updateTournamentMatchAction,
  deleteTournamentMatchAction,
  blastTournamentTimelineAction,
} from "@/features/tournaments/actions";
import type { TournamentStageWithMatches, TournamentMatch, TournamentGameResult } from "@/features/tournaments/queries";
import type { AttendingPlayer } from "@/features/scrim/components/DraftSection";

const MATCH_FORMATS = ["BO1", "BO2", "BO3", "BO5", "BO7"] as const;

interface TournamentTimelineProps {
  stages: TournamentStageWithMatches[];
  tournamentId: string;
  orgSlug: string;
  canManage: boolean;
  attendingPlayers: AttendingPlayer[];
}

const TournamentTimeline = ({ stages, tournamentId, orgSlug, canManage, attendingPlayers }: TournamentTimelineProps) => {
  const [showForm, setShowForm] = useState(false);
  const { success, error } = useNotify();
  const [isBlasting, startBlastTransition] = useTransition();

  function handleBlastWA() {
    startBlastTransition(async () => {
      const res = await blastTournamentTimelineAction(orgSlug, tournamentId);
      if (res.ok) {
        success("Timeline turnamen berhasil di-blast ke WhatsApp member!");
      } else {
        error(res.message);
      }
    });
  }

  const sortedStages = [...stages].sort((a, b) => {
    return new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime();
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ui-text">Timeline Tahapan</h3>
        {canManage && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={isBlasting}
              onClick={handleBlastWA}
              className="inline-flex items-center gap-1 text-xs text-yellow-400 hover:text-yellow-300 disabled:opacity-50 cursor-pointer"
              title="Blast timeline stages ke WhatsApp member"
            >
              {isBlasting ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Send className="h-3 w-3" />
              )}
              Blast WA
            </button>
            <button
              type="button"
              onClick={() => setShowForm((v) => !v)}
              className="inline-flex items-center gap-1 text-xs text-ui-text-2 hover:text-ui-text cursor-pointer"
            >
              <Plus className="h-3 w-3" />
              Tambah tahap
            </button>
          </div>
        )}
      </div>

      {showForm && canManage && (
        <AddStageForm
          tournamentId={tournamentId}
          orgSlug={orgSlug}
          onDone={() => setShowForm(false)}
        />
      )}

      {sortedStages.length === 0 ? (
        <p className="text-xs text-ui-text-muted">Belum ada tahapan.</p>
      ) : (
        <div className="relative ml-3 pl-4 space-y-3">
          {sortedStages.map((stage, i) => (
            <StageItem
              key={stage.id}
              stage={stage}
              orgSlug={orgSlug}
              tournamentId={tournamentId}
              canManage={canManage}
              isLast={i === sortedStages.length - 1}
              attendingPlayers={attendingPlayers}
            />
          ))}
        </div>
      )}
    </div>
  );
};
export { TournamentTimeline };

function getMatchStatus(match: TournamentMatch): "win" | "loss" | "draw" | "pending" {
  if (match.is_win === true) return "win";
  if (match.is_win === false) return "loss";
  
  const games = match.game_results ?? [];
  if (games.length === 0) return "pending";
  
  const w = games.filter(g => g.is_win === true).length;
  const l = games.filter(g => g.is_win === false).length;
  
  if (w > l) return "win";
  if (l > w) return "loss";
  return "draw";
}

function StageItem({
  stage,
  orgSlug,
  tournamentId,
  canManage,
  isLast,
  attendingPlayers,
}: {
  stage: TournamentStageWithMatches;
  orgSlug: string;
  tournamentId: string;
  canManage: boolean;
  isLast: boolean;
  attendingPlayers: AttendingPlayer[];
}) {
  const [pending, startTransition] = useTransition();
  const [showMatchForm, setShowMatchForm] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(stage.stage_name);
  
  // Convert ISO string to Asia/Jakarta local datetime-local value (YYYY-MM-DDTHH:MM)
  const getLocalDateTimeLocalString = (isoString: string) => {
    const d = new Date(isoString);
    const tzOffset = 7 * 60 * 60 * 1000; // Jakarta is UTC+7
    const localTime = new Date(d.getTime() + tzOffset);
    return localTime.toISOString().slice(0, 16);
  };
  
  const [scheduledAt, setScheduledAt] = useState(getLocalDateTimeLocalString(stage.scheduled_at));
  const [notes, setNotes] = useState(stage.notes ?? "");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { success, error } = useNotify();
 
  function handleToggle() {
    startTransition(async () => {
      const res = await toggleStageCompleteAction(orgSlug, stage.id, !stage.is_completed);
      if (res.ok) success(stage.is_completed ? "Tahap dibuka kembali" : "Tahap selesai!");
      else error(res.message);
    });
  }

  function handleSave() {
    startTransition(async () => {
      const res = await updateTournamentStageAction(orgSlug, {
        id: stage.id,
        stage_name: name,
        scheduled_at: scheduledAt,
        notes: notes || undefined,
      });
      if (res.ok) {
        success("Tahap diperbarui!");
        setEditing(false);
      } else {
        error(res.message);
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const res = await deleteTournamentStageAction(orgSlug, stage.id);
      if (res.ok) {
        success("Tahap dihapus!");
        setShowDeleteConfirm(false);
      } else {
        error(res.message);
      }
    });
  }
 
  const date = new Date(stage.scheduled_at).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });
 
  const matchStatuses = stage.matches.map(getMatchStatus);
  const wins = matchStatuses.filter((s) => s === "win").length;
  const losses = matchStatuses.filter((s) => s === "loss").length;
 
  if (editing) {
    return (
      <div className="relative space-y-2">
        {!isLast && (
          <div className="absolute left-[-16px] top-[15px] bottom-[-17px] w-[1px] bg-ui-border" />
        )}
        <div className="flex items-start gap-3">
          <div className="absolute -left-[24px] top-0.5">
            <Pencil className="h-4 w-4 text-yellow-400" />
          </div>
          <div className="flex-1 rounded-lg border border-yellow-400/30 bg-ui-surface p-3 space-y-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama tahap (misal: Technical Meeting)"
              className="h-8 w-full rounded-md border border-ui-border bg-ui-bg px-3 text-xs text-ui-text focus:border-yellow-400/50 focus:outline-none"
            />
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="h-8 w-full rounded-md border border-ui-border bg-ui-bg px-3 text-xs text-ui-text focus:border-yellow-400/50 focus:outline-none"
            />
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan (opsional)"
              className="h-8 w-full rounded-md border border-ui-border bg-ui-bg px-3 text-xs text-ui-text focus:border-yellow-400/50 focus:outline-none"
            />
            <div className="flex gap-2">
              <button
                type="button"
                disabled={pending || !name || !scheduledAt}
                onClick={handleSave}
                className="inline-flex h-7 items-center gap-1 rounded-md bg-yellow-400 px-3 text-xs font-semibold text-black hover:bg-yellow-300 disabled:opacity-50 cursor-pointer"
              >
                {pending && <Loader2 className="h-3 w-3 animate-spin" />}
                Simpan
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="h-7 rounded-md border border-ui-border px-3 text-xs text-ui-text-2 hover:bg-ui-hover cursor-pointer"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative space-y-2">
      {!isLast && (
        <div className="absolute left-[-16px] top-[15px] bottom-[-17px] w-[1px] bg-ui-border" />
      )}
      <div className="flex items-start gap-3">
        <div className="absolute -left-[24px] top-0.5">
          {stage.is_completed ? (
            <CheckCircle2 className="h-4 w-4 text-green-400" />
          ) : (
            <Circle className="h-4 w-4 text-ui-text-muted" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${stage.is_completed ? "text-green-400 line-through" : "text-ui-text"}`}>
            {stage.stage_name}
          </p>
          <p className="text-xs text-ui-text-muted">{date}</p>
          {stage.notes && <p className="text-xs text-ui-text-2 mt-0.5">{stage.notes}</p>}
          {stage.matches.length > 0 && (
            <p className="text-[10px] text-ui-text-muted mt-0.5">
              {stage.matches.length} match · {wins}W {losses}L
            </p>
          )}
        </div>
        <div className="shrink-0 flex items-center gap-2">
          {canManage && (
            <button
              type="button"
              onClick={() => setShowMatchForm((v) => !v)}
              className="text-xs text-ui-text-2 hover:text-ui-text cursor-pointer"
              title="Tambah hasil match"
            >
              <Swords className="h-3.5 w-3.5" />
            </button>
          )}
          {canManage && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-xs text-ui-text-2 hover:text-yellow-400 cursor-pointer"
              title="Edit tahap"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
          {canManage && (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="text-xs text-ui-text-2 hover:text-red-400 cursor-pointer"
              title="Hapus tahap"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
          {canManage && (
            <button
              type="button"
              disabled={pending}
              onClick={handleToggle}
              className="text-xs text-ui-text-2 hover:text-ui-text disabled:opacity-50 cursor-pointer"
            >
              {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : stage.is_completed ? "Buka" : "Selesai"}
            </button>
          )}
        </div>
      </div>
 
      {/* Match results */}
      {stage.matches.length > 0 && (
        <div className="ml-1 space-y-1">
          {stage.matches.map((match) => (
            <MatchRow
              key={match.id}
              match={match}
              orgSlug={orgSlug}
              tournamentId={tournamentId}
              canManage={canManage}
              attendingPlayers={attendingPlayers}
            />
          ))}
        </div>
      )}
 
      {showMatchForm && canManage && (
        <AddMatchForm
          stageId={stage.id}
          orgSlug={orgSlug}
          tournamentId={tournamentId}
          onDone={() => setShowMatchForm(false)}
        />
      )}

      {showDeleteConfirm && (
        <ConfirmDeleteDialog
          open={showDeleteConfirm}
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={handleDelete}
          title="Hapus Tahap"
          message={`Apakah Anda yakin ingin menghapus tahap "${stage.stage_name}"? Semua hasil match di tahap ini juga akan terhapus.`}
          confirmPhrase="HAPUS"
        />
      )}
    </div>
  );
}

function MatchRow({
  match,
  orgSlug,
  tournamentId,
  canManage,
  attendingPlayers,
}: {
  match: TournamentMatch;
  orgSlug: string;
  tournamentId: string;
  canManage: boolean;
  attendingPlayers: AttendingPlayer[];
}) {
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [roundLabel, setRoundLabel] = useState(match.round_label);
  const [opponentName, setOpponentName] = useState(match.opponent_name ?? "");
  const [opponentId, setOpponentId] = useState(match.opponent_id ?? "");
  const [matchFormat, setMatchFormat] = useState(match.match_format ?? "");
  const [pending, startTransition] = useTransition();
  const { success, error } = useNotify();

  const gameResults = match.game_results ?? [];
  const wins = gameResults.filter((g: TournamentGameResult) => g.is_win === true).length;
  const losses = gameResults.filter((g: TournamentGameResult) => g.is_win === false).length;

  function handleDelete() {
    startTransition(async () => {
      const res = await deleteTournamentMatchAction(orgSlug, tournamentId, match.id);
      if (!res.ok) error(res.message);
    });
  }

  function handleSave() {
    startTransition(async () => {
      const res = await updateTournamentMatchAction(orgSlug, tournamentId, match.id, {
        round_label: roundLabel,
        opponent_name: opponentName,
        opponent_id: opponentId || undefined,
        match_format: matchFormat || undefined,
      });
      if (res.ok) {
        success("Match diperbarui!");
        setEditing(false);
      } else {
        error(res.message);
      }
    });
  }

  if (editing) {
    return (
      <div className="rounded-md border border-yellow-400/30 bg-ui-surface p-2 space-y-1.5">
        <div className="grid grid-cols-2 gap-1.5">
          <input
            value={roundLabel}
            onChange={(e) => setRoundLabel(e.target.value)}
            placeholder="Label ronde *"
            className="h-7 w-full rounded-md border border-ui-border bg-ui-bg px-2 text-xs text-ui-text focus:border-yellow-400/50 focus:outline-none"
          />
          <select
            value={matchFormat}
            onChange={(e) => setMatchFormat(e.target.value)}
            className="h-7 rounded-md border border-ui-border bg-ui-bg px-2 text-xs text-ui-text focus:border-yellow-400/50 focus:outline-none"
          >
            <option value="">Format match</option>
            {MATCH_FORMATS.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <input
            value={opponentName}
            onChange={(e) => setOpponentName(e.target.value)}
            placeholder="Nama lawan (opsional)"
            className="h-7 w-full rounded-md border border-ui-border bg-ui-bg px-2 text-xs text-ui-text focus:border-yellow-400/50 focus:outline-none"
          />
          <input
            value={opponentId}
            onChange={(e) => setOpponentId(e.target.value)}
            placeholder="ID lawan (opsional)"
            className="h-7 w-full rounded-md border border-ui-border bg-ui-bg px-2 text-xs text-ui-text focus:border-yellow-400/50 focus:outline-none"
          />
        </div>

        <div className="flex gap-1.5 mt-2">
          <button
            type="button"
            disabled={pending || !roundLabel.trim()}
            onClick={handleSave}
            className="inline-flex h-6 items-center gap-1 rounded bg-yellow-400 px-2.5 text-[10px] font-semibold text-black hover:bg-yellow-300 disabled:opacity-50 cursor-pointer"
          >
            {pending && <Loader2 className="h-2.5 w-2.5 animate-spin" />}
            Simpan
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="inline-flex h-6 items-center gap-1 rounded border border-ui-border px-2.5 text-[10px] text-ui-text-2 hover:bg-ui-hover cursor-pointer"
          >
            <X className="h-2.5 w-2.5" />
            Batal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-ui-border bg-ui-bg overflow-hidden">
      <div className="group flex items-center gap-2 px-2 py-1.5">
        <span className={`shrink-0 text-[10px] font-bold ${getMatchStatus(match) === "win" ? "text-green-400" : getMatchStatus(match) === "loss" ? "text-red-400" : "text-ui-text-muted"}`}>
          {getMatchStatus(match) === "win" ? "W" : getMatchStatus(match) === "loss" ? "L" : "—"}
        </span>
        <span className="flex-1 min-w-0 text-xs text-ui-text-2 truncate">
          {match.round_label}
          {match.opponent_name && (
            <span className="text-ui-text-muted"> vs {match.opponent_name}</span>
          )}
        </span>
        {/* Format badge */}
        {match.match_format && (
          <span className="shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold border border-yellow-400/20 text-yellow-400/80 bg-yellow-400/5">
            {match.match_format}
          </span>
        )}
        {/* Game summary */}
        {gameResults.length > 0 && (
          <span className="text-[10px] text-ui-text-muted shrink-0">
            {wins}W {losses}L
          </span>
        )}
        {canManage && (
          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 shrink-0 transition">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-ui-text-muted hover:text-yellow-400 cursor-pointer"
              title="Edit match"
            >
              <Pencil className="h-3 w-3" />
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={handleDelete}
              className="text-ui-text-muted hover:text-red-400 cursor-pointer"
              title="Hapus match"
            >
              {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
            </button>
          </div>
        )}
        {/* Expand toggle */}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="shrink-0 text-ui-text-muted hover:text-ui-text cursor-pointer"
          title={expanded ? "Tutup detail" : "Lihat / input game results"}
        >
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Expandable game results */}
      {expanded && (
        <div className="border-t border-ui-border px-2 pb-2">
          <TournamentMatchDetail
            matchId={match.id}
            tournamentId={tournamentId}
            orgSlug={orgSlug}
            matchFormat={match.match_format ?? null}
            gameResults={gameResults}
            canManage={canManage}
            attendingPlayers={attendingPlayers}
          />
        </div>
      )}
    </div>
  );
}

function AddMatchForm({
  stageId,
  orgSlug,
  tournamentId,
  onDone,
}: {
  stageId: string;
  orgSlug: string;
  tournamentId: string;
  onDone: () => void;
}) {
  const [roundLabel, setRoundLabel] = useState("");
  const [matchFormat, setMatchFormat] = useState("");
  const [opponentName, setOpponentName] = useState("");
  const [opponentId, setOpponentId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [pending, startTransition] = useTransition();
  const { success, error } = useNotify();

  function handleSubmit() {
    startTransition(async () => {
      const res = await addTournamentMatchAction(orgSlug, tournamentId, {
        stage_id: stageId,
        round_label: roundLabel,
        opponent_name: opponentName || undefined,
        opponent_id: opponentId || undefined,
        match_format: matchFormat || undefined,
        scheduled_at: scheduledAt || undefined,
      });
      if (res.ok) {
        success("Match ditambahkan!");
        setRoundLabel("");
        setMatchFormat("");
        setOpponentName("");
        setOpponentId("");
        setScheduledAt("");
        onDone();
      } else {
        error(res.message);
      }
    });
  }

  return (
    <div className="rounded-lg border border-ui-border bg-ui-surface p-3 space-y-2">
      <p className="text-[10px] uppercase tracking-wider font-semibold text-ui-text-muted">Tambah Match Baru</p>
      <div className="grid grid-cols-2 gap-2">
        <input
          value={roundLabel}
          onChange={(e) => setRoundLabel(e.target.value)}
          placeholder="Label ronde * (misal: Babak 64)"
          className="h-8 w-full rounded-md border border-ui-border bg-ui-bg px-3 text-xs text-ui-text focus:border-yellow-400/50 focus:outline-none"
        />
        <select
          value={matchFormat}
          onChange={(e) => setMatchFormat(e.target.value)}
          className="h-8 rounded-md border border-ui-border bg-ui-bg px-3 text-xs text-ui-text focus:border-yellow-400/50 focus:outline-none"
        >
          <option value="">Format match (opsional)</option>
          {MATCH_FORMATS.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input
          value={opponentName}
          onChange={(e) => setOpponentName(e.target.value)}
          placeholder="Nama lawan (opsional)"
          className="h-8 w-full rounded-md border border-ui-border bg-ui-bg px-3 text-xs text-ui-text focus:border-yellow-400/50 focus:outline-none"
        />
        <input
          value={opponentId}
          onChange={(e) => setOpponentId(e.target.value)}
          placeholder="ID lawan (opsional)"
          className="h-8 w-full rounded-md border border-ui-border bg-ui-bg px-3 text-xs text-ui-text focus:border-yellow-400/50 focus:outline-none"
        />
      </div>

      <div className="flex gap-2 mt-2">
        <button
          type="button"
          disabled={pending || !roundLabel.trim()}
          onClick={handleSubmit}
          className="inline-flex h-7 items-center gap-1 rounded-md bg-yellow-400 px-3 text-xs font-semibold text-black hover:bg-yellow-300 disabled:opacity-50 cursor-pointer"
        >
          {pending && <Loader2 className="h-3 w-3 animate-spin" />}
          Simpan
        </button>
        <button
          type="button"
          onClick={onDone}
          className="h-7 rounded-md border border-ui-border px-3 text-xs text-ui-text-2 hover:bg-ui-hover cursor-pointer"
        >
          Batal
        </button>
      </div>
    </div>
  );
}

function AddStageForm({
  tournamentId,
  orgSlug,
  onDone,
}: {
  tournamentId: string;
  orgSlug: string;
  onDone: () => void;
}) {
  const [name, setName] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [notes, setNotes] = useState("");
  const [pending, startTransition] = useTransition();
  const { success, error } = useNotify();

  function handleSubmit() {
    startTransition(async () => {
      const res = await createTournamentStageAction(orgSlug, {
        tournament_id: tournamentId,
        stage_name: name,
        scheduled_at: scheduledAt,
        notes: notes || undefined,
      });
      if (res.ok) {
        success("Tahap ditambahkan!");
        setName("");
        setScheduledAt("");
        setNotes("");
        onDone();
      } else {
        error(res.message);
      }
    });
  }

  return (
    <div className="rounded-lg border border-ui-border bg-ui-surface p-3 space-y-2">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nama tahap (misal: Technical Meeting)"
        className="h-8 w-full rounded-md border border-ui-border bg-ui-bg px-3 text-xs text-ui-text focus:border-yellow-400/50 focus:outline-none"
      />
      <input
        type="datetime-local"
        value={scheduledAt}
        onChange={(e) => setScheduledAt(e.target.value)}
        className="h-8 w-full rounded-md border border-ui-border bg-ui-bg px-3 text-xs text-ui-text focus:border-yellow-400/50 focus:outline-none"
      />
      <input
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Catatan (opsional)"
        className="h-8 w-full rounded-md border border-ui-border bg-ui-bg px-3 text-xs text-ui-text focus:border-yellow-400/50 focus:outline-none"
      />
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending || !name || !scheduledAt}
          onClick={handleSubmit}
          className="inline-flex h-7 items-center gap-1 rounded-md bg-yellow-400 px-3 text-xs font-semibold text-black hover:bg-yellow-300 disabled:opacity-50 cursor-pointer"
        >
          {pending && <Loader2 className="h-3 w-3 animate-spin" />}
          Tambah
        </button>
        <button
          type="button"
          onClick={onDone}
          className="h-7 rounded-md border border-ui-border px-3 text-xs text-ui-text-2 hover:bg-ui-hover cursor-pointer"
        >
          Batal
        </button>
      </div>
    </div>
  );
}
