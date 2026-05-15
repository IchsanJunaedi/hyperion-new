"use client";

import { BarChart3, Plus } from "lucide-react";
import { useState } from "react";

import { CreatePollForm } from "./CreatePollForm";
import { PollCard } from "./PollCard";
import type { PollWithVotes } from "@/features/polls/queries";

interface PollPageClientProps {
  polls: PollWithVotes[];
  orgSlug: string;
  canManage: boolean;
  userId: string;
}

export function PollPageClient({ polls, orgSlug, canManage, userId }: PollPageClientProps) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-4">
      {canManage && (
        <div>
          {showForm ? (
            <CreatePollForm orgSlug={orgSlug} onDone={() => setShowForm(false)} />
          ) : (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-[#2D2D2D] bg-[#202020] px-4 text-xs font-medium text-[#E5E2E1] hover:bg-[#2C2C2C] cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              Buat Poll
            </button>
          )}
        </div>
      )}

      {polls.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 bg-zinc-900/30 p-10 text-center">
          <BarChart3 className="mx-auto h-8 w-8 text-white/35" />
          <p className="mt-3 text-sm text-white/65">Belum ada polling.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {polls.map((poll) => (
            <PollCard
              key={poll.id}
              poll={poll}
              orgSlug={orgSlug}
              canManage={canManage}
              userId={userId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
