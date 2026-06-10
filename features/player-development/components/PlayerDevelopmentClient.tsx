"use client";

import { Plus, User } from "lucide-react";
import { useState } from "react";

import { AddTargetForm } from "./AddTargetForm";
import { PlayerTargetCard } from "./PlayerTargetCard";
import { SkillRadarChart } from "./SkillRadarChart";
import type { PlayerTargetWithHistory } from "@/features/player-development/queries";

interface PlayerDevelopmentClientProps {
  targets: PlayerTargetWithHistory[];
  orgSlug: string;
  members: Array<{ user_id: string; display_name: string | null }>;
  grouped: Record<string, PlayerTargetWithHistory[]>;
}

const PlayerDevelopmentClient = ({
  targets,
  orgSlug,
  members,
  grouped,
}: PlayerDevelopmentClientProps) => {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        {showForm ? (
          <AddTargetForm orgSlug={orgSlug} members={members} onDone={() => setShowForm(false)} />
        ) : (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-ui-border bg-ui-surface px-4 text-xs font-medium text-ui-text hover:bg-ui-hover cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            Set Target Baru
          </button>
        )}
      </div>

      {targets.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 bg-zinc-900/30 p-10 text-center">
          <p className="text-sm text-white/65">Belum ada target skill yang di-set.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([userId, playerTargets]) => {
            const playerName = playerTargets[0]?.player_name ?? "Unknown";
            return (
              <section key={userId}>
                <div className="flex items-center gap-2 mb-3">
                  <User className="h-4 w-4 text-ui-text-2" />
                  <h2 className="text-sm font-medium text-ui-text">{playerName}</h2>
                  <span className="text-[10px] text-ui-text-muted">
                    {playerTargets.length} skill{playerTargets.length > 1 ? "s" : ""}
                  </span>
                </div>
                <SkillRadarChart targets={playerTargets} />
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 mt-3">
                  {playerTargets.map((t) => (
                    <PlayerTargetCard key={t.id} target={t} orgSlug={orgSlug} canManage={true} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
};
export { PlayerDevelopmentClient };
