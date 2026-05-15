"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { ConfirmDeleteDialog } from "@/features/dashboard/components/ConfirmDeleteDialog";
import { CustomSelect } from "@/features/dashboard/components/CustomSelect";
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

  function handleStatusChange(status: string) {
    startTransition(async () => {
      const res = await updateTournamentStatusAction(orgSlug, tournament.id, status);
      if (res.ok) success("Status diperbarui!");
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

  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-5 space-y-4">
      <h3 className="text-sm font-semibold text-[#E5E2E1]">Aksi</h3>

      <div>
        <label className="text-xs text-[#9B9A97] mb-1 block">Status</label>
        <CustomSelect
          value={tournament.status}
          options={[
            { value: "upcoming", label: "Upcoming", color: "text-blue-400" },
            { value: "ongoing", label: "Berlangsung", color: "text-yellow-400" },
            { value: "completed", label: "Selesai", color: "text-green-400" },
            { value: "cancelled", label: "Dibatalkan", color: "text-red-400" },
          ]}
          onChange={handleStatusChange}
          disabled={pending}
        />
      </div>

      <button
        type="button"
        onClick={() => setDeleteOpen(true)}
        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-red-500/20 px-3 text-xs font-medium text-red-400 hover:bg-red-500/10 cursor-pointer"
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
