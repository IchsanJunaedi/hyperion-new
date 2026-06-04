"use client";

import { Plus, Radar, Search } from "lucide-react";
import { useState } from "react";

import { ScoutingCard } from "@/features/scouting/components/ScoutingCard";
import { ScoutingDetailModal } from "@/features/scouting/components/ScoutingDetailModal";
import { ScoutingFormModal } from "@/features/scouting/components/ScoutingFormModal";
import type { OpponentProfile } from "@/features/scouting/queries";

interface ScoutingPageClientProps {
  orgSlug: string;
  profiles: OpponentProfile[];
}

const ScoutingPageClient = ({ orgSlug, profiles }: ScoutingPageClientProps) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<OpponentProfile | undefined>(undefined);
  const [viewTarget, setViewTarget] = useState<OpponentProfile | null>(null);
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? profiles.filter((p) =>
        p.opponent_name.toLowerCase().includes(search.toLowerCase()),
      )
    : profiles;

  function openCreate() {
    setEditTarget(undefined);
    setModalOpen(true);
  }

  function openEdit(profile: OpponentProfile) {
    setEditTarget(profile);
    setModalOpen(true);
  }

  function openView(profile: OpponentProfile) {
    setViewTarget(profile);
  }

  return (
    <>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">Scouting Lawan</h1>
          <p className="mt-1 text-sm text-[#9B9A97]">
            Database profil tim lawan — rank, hero pool, playstyle, dan kelemahan.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#6B6A68]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari tim lawan..."
              className="h-10 w-44 rounded-md border border-[#2D2D2D] bg-[#191919] pl-9 pr-3 text-sm text-[#E5E2E1] placeholder:text-[#6B6A68] focus:border-[#9B9A97] focus:outline-none focus:w-56 transition-all"
            />
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-yellow-400 px-4 text-sm font-semibold text-black transition hover:bg-yellow-300 cursor-pointer shrink-0"
          >
            <Plus className="h-4 w-4" />
            Tambah Profil
          </button>
        </div>
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
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#2D2D2D] bg-[#202020]/40 p-10 text-center">
          <Search className="mx-auto h-7 w-7 text-[#6B6A68]" />
          <p className="mt-3 text-sm text-[#9B9A97]">
            Tidak ada tim lawan yang cocok dengan &ldquo;{search}&rdquo;.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => (
            <ScoutingCard
              key={p.id}
              orgSlug={orgSlug}
              profile={p}
              onEdit={() => openEdit(p)}
              onView={() => openView(p)}
            />
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

      {viewTarget && (
        <ScoutingDetailModal
          profile={viewTarget}
          onClose={() => setViewTarget(null)}
        />
      )}
    </>
  );
};

export { ScoutingPageClient };
