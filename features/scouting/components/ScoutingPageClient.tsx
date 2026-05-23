"use client";

import { Plus, Radar } from "lucide-react";
import { useState } from "react";

import { ScoutingCard } from "@/features/scouting/components/ScoutingCard";
import { ScoutingFormModal } from "@/features/scouting/components/ScoutingFormModal";
import type { OpponentProfile } from "@/features/scouting/queries";

interface ScoutingPageClientProps {
  orgSlug: string;
  profiles: OpponentProfile[];
}

export function ScoutingPageClient({ orgSlug, profiles }: ScoutingPageClientProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<OpponentProfile | undefined>(undefined);

  function openCreate() {
    setEditTarget(undefined);
    setModalOpen(true);
  }

  function openEdit(profile: OpponentProfile) {
    setEditTarget(profile);
    setModalOpen(true);
  }

  return (
    <>
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">Scouting Lawan</h1>
          <p className="mt-1 text-sm text-[#9B9A97]">
            Database profil tim lawan — rank, hero pool, playstyle, dan kelemahan.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex h-10 items-center gap-2 rounded-md bg-yellow-400 px-4 text-sm font-semibold text-black transition hover:bg-yellow-300 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Tambah Profil
        </button>
      </header>

      {profiles.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#2D2D2D] bg-[#202020]/40 p-12 text-center">
          <Radar className="mx-auto h-8 w-8 text-[#6B6A68]" />
          <p className="mt-3 text-sm text-[#9B9A97]">Belum ada profil lawan tersimpan.</p>
          <button
            type="button"
            onClick={openCreate}
            className="mt-4 inline-flex h-9 items-center rounded-md border border-white/15 px-4 text-sm font-medium text-white transition hover:bg-white/5 cursor-pointer"
          >
            Tambah profil pertama
          </button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {profiles.map((p) => (
            <ScoutingCard key={p.id} profile={p} onEdit={() => openEdit(p)} />
          ))}
        </div>
      )}

      {modalOpen && (
        <ScoutingFormModal
          orgSlug={orgSlug}
          profile={editTarget}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}
