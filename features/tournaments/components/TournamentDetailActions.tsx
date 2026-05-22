"use client";

import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import { ConfirmDeleteDialog } from "@/features/dashboard/components/ConfirmDeleteDialog";
import { useNotify } from "@/features/dashboard/components/NotifyModal";
import { deleteTournamentAction, updateTournamentStatusAction } from "@/features/tournaments/actions";
import type { Tournament } from "@/features/tournaments/queries";

interface TournamentDetailActionsProps {
  tournament: Tournament;
  orgSlug: string;
}

export function TournamentDetailActions({ tournament, orgSlug }: TournamentDetailActionsProps) {
  const router = useRouter();
  const { success, error } = useNotify();
  const [pending, startTransition] = useTransition();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [completeConfirmOpen, setCompleteConfirmOpen] = useState(false);

  const isPastStartDate = useMemo(() => {
    return new Date(tournament.start_date).getTime() <= Date.now();
  }, [tournament.start_date]);

  const isRegistrationExpired = useMemo(() => {
    if (
      tournament.registration_deadline != null &&
      new Date(tournament.registration_deadline).getTime() < Date.now()
    ) {
      return true;
    }
    const timeStr = tournament.start_time || "00:00";
    const startDateTime = new Date(`${tournament.start_date}T${timeStr}:00+07:00`);
    return startDateTime.getTime() <= Date.now();
  }, [tournament.registration_deadline, tournament.start_date, tournament.start_time]);

  function handleRegister() {
    startTransition(async () => {
      const res = await updateTournamentStatusAction(orgSlug, tournament.id, "ongoing");
      if (res.ok) success("Pendaftaran dikonfirmasi!");
      else error(res.message);
    });
  }

  function handleComplete() {
    if (!isPastStartDate) {
      setCompleteConfirmOpen(true);
      return;
    }
    doComplete();
  }

  function doComplete() {
    setCompleteConfirmOpen(false);
    startTransition(async () => {
      const res = await updateTournamentStatusAction(orgSlug, tournament.id, "completed");
      if (res.ok) success("Turnamen selesai!");
      else error(res.message);
    });
  }

  function handleCancel() {
    startTransition(async () => {
      const res = await updateTournamentStatusAction(orgSlug, tournament.id, "cancelled");
      if (res.ok) {
        success("Turnamen dibatalkan.");
        router.push(`/${orgSlug}/tournaments`);
      } else {
        error(res.message);
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const res = await deleteTournamentAction(orgSlug, tournament.id);
      if (res.ok) {
        success("Turnamen dihapus!");
        router.push(`/${orgSlug}/tournaments`);
      } else {
        error(res.message);
      }
    });
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        {/* Konfirmasi Pendaftaran — when upcoming (belum daftar) */}
        {tournament.status === "upcoming" && !isRegistrationExpired && (
          <button
            type="button"
            disabled={pending}
            onClick={handleRegister}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-yellow-400 px-4 text-sm font-semibold text-black transition hover:bg-yellow-300 disabled:opacity-50 cursor-pointer"
          >
            {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Konfirmasi Pendaftaran
          </button>
        )}
        {tournament.status === "upcoming" && isRegistrationExpired && (
          <span className="inline-flex h-10 items-center rounded-md border border-orange-500/20 bg-orange-500/5 px-4 text-sm font-medium text-orange-400/70">
            Pendaftaran sudah ditutup
          </span>
        )}

        {/* Turnamen Selesai — when ongoing (sudah daftar) */}
        {tournament.status === "ongoing" && (
          <button
            type="button"
            disabled={pending}
            onClick={handleComplete}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-white/10 px-4 text-sm font-medium text-white/80 transition hover:bg-white/5 disabled:opacity-50 cursor-pointer"
          >
            {pending && <Loader2 className="h-3 w-3 animate-spin" />}
            Turnamen Selesai
          </button>
        )}

        {/* Batalkan — when not completed */}
        {(tournament.status === "upcoming" || tournament.status === "ongoing") && (
          <button
            type="button"
            disabled={pending}
            onClick={handleCancel}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-white/10 px-4 text-sm font-medium text-white/80 transition hover:bg-white/5 disabled:opacity-50 cursor-pointer"
          >
            Batalkan
          </button>
        )}

        {/* Hapus */}
        <button
          type="button"
          onClick={() => setDeleteOpen(true)}
          className="inline-flex h-9 items-center gap-1.5 rounded-md border border-red-500/20 px-4 text-sm font-medium text-red-400 transition hover:bg-red-500/10 cursor-pointer"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Hapus
        </button>
      </div>

      {/* Warning dialog — trying to complete before start date */}
      {completeConfirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setCompleteConfirmOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl border border-yellow-500/20 bg-[#191919] p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-yellow-500/10">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#E5E2E1]">Turnamen belum dimulai</h3>
                <p className="text-xs text-[#9B9A97]">Countdown masih berjalan</p>
              </div>
            </div>
            <p className="text-sm text-[#9B9A97] mb-4">
              Tanggal turnamen belum tiba. Yakin ingin menandai sebagai selesai sekarang?
              Ini tidak bisa di-undo.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCompleteConfirmOpen(false)}
                className="h-9 rounded-md border border-[#2D2D2D] px-4 text-xs font-medium text-[#9B9A97] hover:bg-[#2C2C2C] cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={doComplete}
                className="inline-flex h-9 items-center gap-1.5 rounded-md bg-yellow-400 px-4 text-xs font-semibold text-black hover:bg-yellow-300 disabled:opacity-50 cursor-pointer"
              >
                {pending && <Loader2 className="h-3 w-3 animate-spin" />}
                Tetap Selesaikan
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDeleteDialog
        open={deleteOpen}
        title="Hapus Turnamen"
        message={`Turnamen "${tournament.name}" akan dihapus permanen beserta semua tahapannya.`}
        confirmPhrase="HAPUS"
        pending={pending}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </>
  );
}
