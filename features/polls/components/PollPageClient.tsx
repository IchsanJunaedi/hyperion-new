"use client";

import { BarChart3, Plus } from "lucide-react";
import { useState } from "react";

import { AvailabilityPollCard } from "./AvailabilityPollCard";
import { CreatePollForm } from "./CreatePollForm";
import { PollCard } from "./PollCard";
import type { PollWithVotes } from "@/features/polls/queries";

interface PollPageClientProps {
  polls: PollWithVotes[];
  orgSlug: string;
  canManage: boolean;
  userId: string;
}

const PollPageClient = ({ polls, orgSlug, canManage, userId }: PollPageClientProps) => {
  const [showForm, setShowForm] = useState(false);

  const now = new Date();
  const activePolls = polls.filter((p) => !p.is_closed && (!p.expires_at || new Date(p.expires_at) >= now));
  const closedPolls = polls.filter((p) => p.is_closed || (p.expires_at && new Date(p.expires_at) < now));

  return (
    <div className="space-y-6">
      {canManage && (
        <div>
          {showForm ? (
            <CreatePollForm orgSlug={orgSlug} onDone={() => setShowForm(false)} />
          ) : (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-ui-border bg-ui-surface px-4 text-xs font-medium text-ui-text hover:bg-ui-hover cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              Buat Poll
            </button>
          )}
        </div>
      )}

      {polls.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 bg-zinc-900/30 p-10 text-center">
          <BarChart3 className="mx-auto h-8 w-8 text-ui-text-muted" />
          <p className="mt-3 text-sm text-ui-text-2">Belum ada polling.</p>
        </div>
      ) : (
        <>
          {activePolls.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-ui-text-muted">Poll Aktif</p>
              {activePolls.map((poll) =>
                poll.type === "availability" ? (
                  <AvailabilityPollCard key={poll.id} poll={poll} orgSlug={orgSlug} canManage={canManage} userId={userId} />
                ) : (
                  <PollCard key={poll.id} poll={poll} orgSlug={orgSlug} canManage={canManage} userId={userId} />
                )
              )}
            </div>
          )}
          {closedPolls.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-ui-text-muted">Poll Selesai</p>
              {closedPolls.map((poll) =>
                poll.type === "availability" ? (
                  <AvailabilityPollCard key={poll.id} poll={poll} orgSlug={orgSlug} canManage={canManage} userId={userId} />
                ) : (
                  <PollCard key={poll.id} poll={poll} orgSlug={orgSlug} canManage={canManage} userId={userId} />
                )
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
export { PollPageClient };
