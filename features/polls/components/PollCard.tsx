"use client";

import { BarChart3, Clock, Lock } from "lucide-react";
import { useTransition } from "react";

import { useNotify } from "@/features/dashboard/components/NotifyModal";
import { votePollAction, closePollAction } from "@/features/polls/actions";
import type { PollWithVotes } from "@/features/polls/queries";

interface PollCardProps {
  poll: PollWithVotes;
  orgSlug: string;
  canManage: boolean;
  userId: string;
}

export function PollCard({ poll, orgSlug, canManage, userId }: PollCardProps) {
  const [pending, startTransition] = useTransition();
  const { success, error } = useNotify();

  const options = (poll.options as string[]) ?? [];
  const isExpired = poll.expires_at && new Date(poll.expires_at) < new Date();
  const isClosed = poll.is_closed || isExpired;
  const hasVoted = poll.my_vote !== null;
  const showResults = hasVoted || isClosed;
  const isCreator = poll.created_by === userId;

  function handleVote(optionIndex: number) {
    startTransition(async () => {
      const res = await votePollAction(orgSlug, {
        poll_id: poll.id,
        option_index: optionIndex,
      });
      if (res.ok) success("Vote berhasil!");
      else error(res.message);
    });
  }

  function handleClose() {
    startTransition(async () => {
      const res = await closePollAction(orgSlug, poll.id);
      if (res.ok) success("Poll ditutup!");
      else error(res.message);
    });
  }

  // Count votes per option
  const voteCounts = options.map((_, i) =>
    poll.votes.filter((v) => v.option_index === i).length,
  );

  return (
    <div className="rounded-xl border border-[#2D2D2D] bg-[#202020] p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-purple-400 shrink-0" />
          <h3 className="text-sm font-medium text-[#E5E2E1]">{poll.question}</h3>
        </div>
        {isClosed && <Lock className="h-3.5 w-3.5 text-[#6B6A68] shrink-0" />}
      </div>

      <div className="mt-3 space-y-2">
        {options.map((option, i) => {
          const count = voteCounts[i];
          const pct = poll.total_votes > 0 ? Math.round((count / poll.total_votes) * 100) : 0;
          const isMyVote = poll.my_vote === i;

          if (showResults) {
            return (
              <div key={i} className="relative">
                <div
                  className="absolute inset-0 rounded-md bg-purple-500/10"
                  style={{ width: `${pct}%` }}
                />
                <div className={`relative flex items-center justify-between rounded-md px-3 py-1.5 text-xs ${isMyVote ? "text-purple-400 font-medium" : "text-[#9B9A97]"}`}>
                  <span>{option} {isMyVote && "✓"}</span>
                  <span>{pct}% ({count})</span>
                </div>
              </div>
            );
          }

          return (
            <button
              key={i}
              type="button"
              disabled={pending || isClosed}
              onClick={() => handleVote(i)}
              className="flex w-full items-center rounded-md border border-[#2D2D2D] px-3 py-1.5 text-xs text-[#9B9A97] transition hover:border-purple-400/30 hover:bg-[#2C2C2C] hover:text-[#E5E2E1] disabled:opacity-50 cursor-pointer"
            >
              {option}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between text-[10px] text-[#6B6A68]">
        <span>{poll.total_votes} vote{poll.total_votes !== 1 ? "s" : ""}</span>
        <div className="flex items-center gap-2">
          {poll.expires_at && !isClosed && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(poll.expires_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          {(isCreator || canManage) && !isClosed && (
            <button
              type="button"
              disabled={pending}
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
