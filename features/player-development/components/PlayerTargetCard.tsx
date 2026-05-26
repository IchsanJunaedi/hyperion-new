"use client";

import { Loader2, TrendingUp, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";

import { ConfirmDeleteDialog } from "@/features/dashboard/components/ConfirmDeleteDialog";
import { useNotify } from "@/features/dashboard/components/NotifyModal";
import { NumberInput } from "@/components/ui/number-input";
import { deletePlayerTargetAction, updatePlayerTargetAction } from "@/features/player-development/actions";
import type { PlayerTargetWithHistory } from "@/features/player-development/queries";

interface PlayerTargetCardProps {
  target: PlayerTargetWithHistory;
  orgSlug: string;
  canManage: boolean;
}

export function PlayerTargetCard({ target, orgSlug, canManage }: PlayerTargetCardProps) {
  const [pending, startTransition] = useTransition();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [newLevel, setNewLevel] = useState(target.current_level);
  const [notes, setNotes] = useState(target.notes ?? "");
  const { success, error } = useNotify();

  const progress = Math.round((target.current_level / target.target_level) * 100);

  function handleUpdate() {
    startTransition(async () => {
      const res = await updatePlayerTargetAction(orgSlug, {
        target_id: target.id,
        current_level: newLevel,
        notes: notes || undefined,
      });
      if (res.ok) {
        success("Progress diperbarui!");
        setEditing(false);
      } else {
        error(res.message);
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const res = await deletePlayerTargetAction(orgSlug, target.id);
      if (res.ok) success("Target dihapus!");
      else error(res.message);
    });
  }

  return (
    <div className="rounded-lg border border-[#2D2D2D] bg-[#202020] p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-3.5 w-3.5 text-blue-400" />
          <span className="text-xs font-medium text-[#E5E2E1]">{target.skill_name}</span>
        </div>
        <span className="text-[10px] text-[#6B6A68]">
          {target.current_level}/{target.target_level}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 rounded-full bg-[#2D2D2D] overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>

      {/* Mini chart from history */}
      {target.history.length > 1 && (
        <div className="flex items-end gap-0.5 h-6">
          {target.history.slice(-10).map((h, i) => (
            <div
              key={h.id}
              className="flex-1 rounded-sm bg-blue-500/30"
              style={{ height: `${(h.level / target.target_level) * 100}%` }}
              title={`Level ${h.level} — ${new Date(h.recorded_at).toLocaleDateString("id-ID")}`}
            />
          ))}
        </div>
      )}

      {target.notes && (
        <p className="text-[10px] text-[#6B6A68]">{target.notes}</p>
      )}

      {canManage && (
        <div className="flex items-center gap-2 pt-1 border-t border-[#2D2D2D]">
          {editing ? (
            <div className="flex items-center gap-2 flex-1">
              <NumberInput
                min={1}
                max={10}
                value={newLevel}
                onChange={(e) => setNewLevel(Number(e.target.value))}
                className="h-6 text-center text-xs focus:outline-none"
                containerClassName="w-18 shrink-0"
              />
              <button
                type="button"
                disabled={pending}
                onClick={handleUpdate}
                className="text-[10px] text-green-400 hover:underline cursor-pointer"
              >
                {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Simpan"}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="text-[10px] text-[#6B6A68] hover:underline cursor-pointer"
              >
                Batal
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="text-[10px] text-blue-400 hover:underline cursor-pointer"
              >
                Update level
              </button>
              <button
                type="button"
                onClick={() => setDeleteOpen(true)}
                className="text-[10px] text-red-400 hover:underline cursor-pointer ml-auto"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </>
          )}
        </div>
      )}

      <ConfirmDeleteDialog
        open={deleteOpen}
        title="Hapus Target"
        message={`Target "${target.skill_name}" akan dihapus permanen.`}
        confirmPhrase="HAPUS"
        pending={pending}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}
