"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

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

  function handleStart() {
    startTransition(async () => {
      const res = await updateTournamentStatusAction(orgSlug, tournament.id, "ongoing");
      if (res.ok) success("Turnamen dimulai!");
      else error(res.message);
    });
  }

  function handleComplete() {
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
        {/* Start — when scheduled and past start date */}
        {tournament.status === "scheduled" && (
          <button
            type="button"
            disabled={pending}
            onClick={handleStart}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-white/10 px-4 text-sm font-medium text-white/80 transition hover:bg-white/5 disabled:opacity-50 cursor-pointer"
          >
            {pending && <Loader2 className="h-3 w-3 animate-spin" />}
            Mulai Turnamen
          </button>
        )}

        {/* Complete — when ongoing */}
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

        {/* Cancel — when not completed */}
        {(tournament.status === "scheduled" || tournament.status === "ongoing") && (
          <button
            type="button"
            disabled={pending}
            onClick={handleCancel}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-white/10 px-4 text-sm font-medium text-white/80 transition hover:bg-white/5 disabled:opacity-50 cursor-pointer"
          >
            Batalkan
          </button>
        )}

        {/* Delete */}
        <button
          type="button"
          onClick={() => setDeleteOpen(true)}
          className="inline-flex h-9 items-center gap-1.5 rounded-md border border-red-500/20 px-4 text-sm font-medium text-red-400 transition hover:bg-red-500/10 cursor-pointer"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Hapus
        </button>
      </div>

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
