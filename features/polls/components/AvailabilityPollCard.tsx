"use client";

import { CalendarCheck2, Clock, Lock } from "lucide-react";
import { useState, useTransition } from "react";

import { useNotify } from "@/features/dashboard/components/NotifyModal";
import { voteAvailabilityAction, closePollAction } from "@/features/polls/actions";
import type { PollWithVotes } from "@/features/polls/queries";
import { cn } from "@/lib/utils/cn";

interface AvailabilityPollCardProps {
  poll: PollWithVotes;
  orgSlug: string;
  canManage: boolean;
  userId: string;
}

function formatSlot(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });
}

export function AvailabilityPollCard({
  poll,
  orgSlug,
  canManage,
  userId,
}: AvailabilityPollCardProps) {
  const { success, error } = useNotify();
  const [pending, startTransition] = useTransition();
  const [closePending, startCloseTrans] = useTransition();
  const [optimisticClosed, setOptimisticClosed] = useState(poll.is_closed);
  const [selected, setSelected] = useState<Set<number>>(
    new Set(poll.my_slot_indices),
  );
  const [dirty, setDirty] = useState(false);

  const slots = (poll.availability_slots as string[]) ?? [];
  const isExpired = poll.expires_at && new Date(poll.expires_at) < new Date();
  const isClosed = optimisticClosed || isExpired;
  const isCreator = poll.created_by === userId;

  // Count how many people voted for each slot
  const slotCounts = slots.map((_, i) =>
    poll.availability_votes.filter((v) => v.slot_index === i).length,
  );
  const maxCount = Math.max(...slotCounts, 1);

  function toggleSlot(i: number) {
    if (isClosed) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
    setDirty(true);
  }

  function handleSave() {
    startTransition(async () => {
      const res = await voteAvailabilityAction(orgSlug, {
        poll_id: poll.id,
        slot_indices: Array.from(selected),
      });
      if (res.ok) {
        success("Jadwal tersimpan!");
        setDirty(false);
      } else {
        error(res.message);
      }
    });
  }

  function handleClose() {
    setOptimisticClosed(true);
    startCloseTrans(async () => {
      const res = await closePollAction(orgSlug, poll.id);
      if (res.ok) success("Poll ditutup!");
      else {
        setOptimisticClosed(false);
        error(res.message);
      }
    });
  }

  // Count unique voters
  const uniqueVoters = new Set(poll.availability_votes.map((v) => v.user_id)).size;

  return (
    <div className="rounded-xl border border-[#2D2D2D] bg-[#202020] p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <CalendarCheck2 className="h-4 w-4 text-teal-400 shrink-0" />
          <h3 className="text-sm font-medium text-[#E5E2E1]">{poll.question}</h3>
        </div>
        {isClosed && <Lock className="h-3.5 w-3.5 text-[#6B6A68] shrink-0" />}
      </div>

      {slots.length === 0 ? (
        <p className="text-xs text-[#6B6A68]">Tidak ada slot waktu.</p>
      ) : (
        <div className="space-y-1.5">
          {slots.map((slot, i) => {
            const count = slotCounts[i] ?? 0;
            const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
            const isSelected = selected.has(i);
            const intensity = pct >= 75 ? "bg-teal-500/25" : pct >= 40 ? "bg-teal-500/12" : "bg-white/5";

            return (
              <button
                key={i}
                type="button"
                disabled={!!isClosed || pending}
                onClick={() => toggleSlot(i)}
                className={cn(
                  "relative w-full overflow-hidden rounded-md border text-left transition cursor-pointer disabled:cursor-default",
                  isSelected
                    ? "border-teal-500/50 bg-teal-500/10"
                    : "border-[#2D2D2D] hover:border-white/20",
                )}
              >
                <div
                  className={cn("absolute inset-y-0 left-0 rounded-md transition-all", intensity)}
                  style={{ width: `${pct}%` }}
                />
                <div className="relative flex items-center justify-between px-3 py-2">
                  <span className={cn("text-xs", isSelected ? "text-teal-400 font-medium" : "text-[#9B9A97]")}>
                    {isSelected && "✓ "}{formatSlot(slot)}
                  </span>
                  <span className="text-[10px] text-[#6B6A68] shrink-0 ml-2">
                    {count} bisa
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {!isClosed && dirty && (
        <button
          type="button"
          disabled={pending}
          onClick={handleSave}
          className="inline-flex h-8 items-center rounded-md bg-teal-600 px-4 text-xs font-semibold text-white hover:bg-teal-500 disabled:opacity-50 cursor-pointer"
        >
          {pending ? "Menyimpan..." : "Perbarui Jadwalku"}
        </button>
      )}

      {!isClosed && !dirty && poll.my_slot_indices.length > 0 && (
        <p className="text-[10px] text-teal-400">
          Kamu sudah memilih {poll.my_slot_indices.length} slot.
        </p>
      )}

      <div className="flex items-center justify-between text-[10px] text-[#6B6A68]">
        <span>{uniqueVoters} member sudah pilih</span>
        <div className="flex items-center gap-3">
          {poll.expires_at && !isClosed && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(poll.expires_at).toLocaleDateString("id-ID", {
                day: "numeric", month: "short",
                hour: "2-digit", minute: "2-digit",
              })}
            </span>
          )}
          {(isCreator || canManage) && !isClosed && (
            <button
              type="button"
              disabled={closePending}
              onClick={handleClose}
              className="text-red-400 hover:underline cursor-pointer"
            >
              Tutup poll
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
