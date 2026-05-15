"use client";

import { Plus, User } from "lucide-react";
import { useState } from "react";

import { AddTargetForm } from "./AddTargetForm";
import { PlayerTargetCard } from "./PlayerTargetCard";
import type { PlayerTargetWithHistory } from "@/features/player-development/queries";

interface PlayerDevelopmentClientProps {
  targets: PlayerTargetWithHistory[];
  orgSlug: string;
  members: Array<{ user_id: string; display_name: string | null }>;
  grouped: Record<string, PlayerTargetWithHistory[]>;
}

export function PlayerDevelopmentClient({
  targets,
  orgSlug,
  members,
  grouped,
}: PlayerDevelopmentClientProps) {
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
            className="inline-flex h-9 items-center gap-2 rounded-md border border-[#2D2D2D] bg-[#202020] px-4 text-xs font-medium text-[#E5E2E1] hover:bg-[#2C2C2C] cursor-pointer"
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
                  <User className="h-4 w-4 text-[#9B9A97]" />
                  <h2 className="text-sm font-medium text-[#E5E2E1]">{playerName}</h2>
                  <span className="text-[10px] text-[#6B6A68]">
                    {playerTargets.length} skill{playerTargets.length > 1 ? "s" : ""}
                  </span>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
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
}
