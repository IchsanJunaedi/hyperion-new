"use client";

import { CheckCircle2, Circle, Loader2, Plus } from "lucide-react";
import { useState, useTransition } from "react";

import { useNotify } from "@/features/dashboard/components/NotifyModal";
import { createTournamentStageAction, toggleStageCompleteAction } from "@/features/tournaments/actions";
import type { TournamentStage } from "@/features/tournaments/queries";

interface TournamentTimelineProps {
  stages: TournamentStage[];
  tournamentId: string;
  orgSlug: string;
  canManage: boolean;
}

export function TournamentTimeline({ stages, tournamentId, orgSlug, canManage }: TournamentTimelineProps) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#E5E2E1]">Timeline Tahapan</h3>
        {canManage && (
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="inline-flex items-center gap-1 text-xs text-[#9B9A97] hover:text-[#E5E2E1] cursor-pointer"
          >
            <Plus className="h-3 w-3" />
            Tambah tahap
          </button>
        )}
      </div>

      {showForm && canManage && (
        <AddStageForm
          tournamentId={tournamentId}
          orgSlug={orgSlug}
          onDone={() => setShowForm(false)}
        />
      )}

      {stages.length === 0 ? (
        <p className="text-xs text-[#6B6A68]">Belum ada tahapan.</p>
      ) : (
        <div className="relative ml-3 border-l border-[#2D2D2D] pl-4 space-y-3">
          {stages.map((stage) => (
            <StageItem key={stage.id} stage={stage} orgSlug={orgSlug} canManage={canManage} />
          ))}
        </div>
      )}
    </div>
  );
}

function StageItem({
  stage,
  orgSlug,
  canManage,
}: {
  stage: TournamentStage;
  orgSlug: string;
  canManage: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const { success, error } = useNotify();

  function handleToggle() {
    startTransition(async () => {
      const res = await toggleStageCompleteAction(orgSlug, stage.id, !stage.is_completed);
      if (res.ok) success(stage.is_completed ? "Tahap dibuka kembali" : "Tahap selesai!");
      else error(res.message);
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

  return (
    <div className="relative flex items-start gap-3">
      <div className="absolute -left-[21px] top-0.5">
        {stage.is_completed ? (
          <CheckCircle2 className="h-4 w-4 text-green-400" />
        ) : (
          <Circle className="h-4 w-4 text-[#6B6A68]" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${stage.is_completed ? "text-green-400 line-through" : "text-[#E5E2E1]"}`}>
          {stage.stage_name}
        </p>
        <p className="text-xs text-[#6B6A68]">{date}</p>
        {stage.notes && <p className="text-xs text-[#9B9A97] mt-0.5">{stage.notes}</p>}
      </div>
      {canManage && (
        <button
          type="button"
          disabled={pending}
          onClick={handleToggle}
          className="shrink-0 text-xs text-[#9B9A97] hover:text-[#E5E2E1] disabled:opacity-50 cursor-pointer"
        >
          {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : stage.is_completed ? "Buka" : "Selesai"}
        </button>
      )}
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
    <div className="rounded-lg border border-[#2D2D2D] bg-[#202020] p-3 space-y-2">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nama tahap (misal: Technical Meeting)"
        className="h-8 w-full rounded-md border border-[#2D2D2D] bg-[#191919] px-3 text-xs text-[#E5E2E1] focus:border-yellow-400/50 focus:outline-none"
      />
      <input
        type="datetime-local"
        value={scheduledAt}
        onChange={(e) => setScheduledAt(e.target.value)}
        className="h-8 w-full rounded-md border border-[#2D2D2D] bg-[#191919] px-3 text-xs text-[#E5E2E1] focus:border-yellow-400/50 focus:outline-none"
      />
      <input
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Catatan (opsional)"
        className="h-8 w-full rounded-md border border-[#2D2D2D] bg-[#191919] px-3 text-xs text-[#E5E2E1] focus:border-yellow-400/50 focus:outline-none"
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
          className="h-7 rounded-md border border-[#2D2D2D] px-3 text-xs text-[#9B9A97] hover:bg-[#2C2C2C] cursor-pointer"
        >
          Batal
        </button>
      </div>
    </div>
  );
}
