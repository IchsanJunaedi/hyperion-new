"use client";

import { CheckCircle2, Loader2, Trash2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { ConfirmDeleteDialog } from "@/features/dashboard/components/ConfirmDeleteDialog";
import { useNotify } from "@/features/dashboard/components/NotifyModal";
import { deleteTournamentAction, updateTournamentStatusAction } from "@/features/tournaments/actions";
import type { Tournament } from "@/features/tournaments/queries";

interface TournamentDetailActionsProps {
  tournament: Tournament;
  orgSlug: string;
  canManage: boolean;
}

export function TournamentDetailActions({ tournament, orgSlug, canManage }: TournamentDetailActionsProps) {
  const router = useRouter();
  const { success, error } = useNotify();
  const [pending, startTransition] = useTransition();
  const [deleteOpen, setDeleteOpen] = useState(false);

  function handleRegister() {
    startTransition(async () => {
      const res = await updateTournamentStatusAction(orgSlug, tournament.id, "ongoing");
      if (res.ok) success("Turnamen ditandai sebagai terdaftar!");
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
      if (res.ok) success("Turnamen dibatalkan.");
      else error(res.message);
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

  if (!canManage) return null;

  return (
    <div className="space-y-3">
      {/* Register button — only when upcoming/scheduled */}
      {(tournament.status === "upcoming" || tournament.status === "scheduled") && (
        <button
          type="button"
          disabled={pending}
          onClick={handleRegister}
          className="flex w-full h-10 items-center justify-center gap-2 rounded-md bg-yellow-400 text-sm font-semibold text-black hover:bg-yellow-300 disabled:opacity-50 cursor-pointer"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          Daftar Turnamen
        </button>
      )}

      {/* Complete button — only when ongoing */}
      {tournament.status === "ongoing" && (
        <button
          type="button"
          disabled={pending}
          onClick={handleComplete}
          className="flex w-full h-10 items-center justify-center gap-2 rounded-md bg-green-500 text-sm font-semibold text-white hover:bg-green-400 disabled:opacity-50 cursor-pointer"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          Turnamen Selesai
        </button>
      )}

      {/* Cancel button — when upcoming/scheduled or ongoing */}
      {(tournament.status === "upcoming" || tournament.status === "scheduled" || tournament.status === "ongoing") && (
        <button
          type="button"
          disabled={pending}
          onClick={handleCancel}
          className="flex w-full h-9 items-center justify-center gap-2 rounded-md border border-white/10 text-xs font-medium text-[#9B9A97] hover:bg-white/5 disabled:opacity-50 cursor-pointer"
        >
          <XCircle className="h-3.5 w-3.5" />
          Batalkan
        </button>
      )}

      {/* Delete — always available */}
      <button
        type="button"
        onClick={() => setDeleteOpen(true)}
        className="flex w-full h-9 items-center justify-center gap-1.5 rounded-md border border-red-500/20 text-xs font-medium text-red-400 hover:bg-red-500/10 cursor-pointer"
      >
        <Trash2 className="h-3 w-3" />
        Hapus Turnamen
      </button>

      <ConfirmDeleteDialog
        open={deleteOpen}
        title="Hapus Turnamen"
        message={`Turnamen "${tournament.name}" akan dihapus permanen beserta semua tahapannya.`}
        confirmPhrase="HAPUS"
        pending={pending}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}
