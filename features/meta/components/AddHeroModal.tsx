"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Search, X } from "lucide-react";
import { toast } from "sonner";
import { MLBB_HEROES } from "@/features/scrim/data/mlbb-heroes";
import { cn } from "@/lib/utils/cn";
import { upsertHeroRatingAction } from "../actions";
import type { MetaHeroRating } from "../queries";

type Tier = "S" | "A" | "B" | "C" | "D";
type RoleTag = "exp_lane" | "jungler" | "mid_lane" | "gold_lane" | "roamer" | null;

const TIER_COLORS: Record<Tier, string> = {
  S: "bg-red-500/20 text-red-400 border-red-500/30",
  A: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  B: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  C: "bg-green-500/20 text-green-400 border-green-500/30",
  D: "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

const ROLE_OPTIONS: Array<{ value: RoleTag; label: string }> = [
  { value: null, label: "— Tidak ada —" },
  { value: "exp_lane", label: "EXP Lane" },
  { value: "jungler", label: "Jungler" },
  { value: "mid_lane", label: "Mid Lane" },
  { value: "gold_lane", label: "Gold Lane" },
  { value: "roamer", label: "Roamer" },
];

interface AddHeroModalProps {
  open: boolean;
  onClose: () => void;
  orgSlug: string;
  orgId: string;
  patchId: string;
  existingHeroes: Set<string>;
  editing?: MetaHeroRating | null;
  defaultTier?: Tier;
}

export function AddHeroModal({
  open,
  onClose,
  orgSlug,
  orgId,
  patchId,
  existingHeroes,
  editing,
  defaultTier = "B",
}: AddHeroModalProps) {
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [selectedHero, setSelectedHero] = useState<string>(editing?.hero_name ?? "");
  const [tier, setTier] = useState<Tier>(editing?.tier ?? defaultTier);
  const [roleTag, setRoleTag] = useState<RoleTag>(editing?.role_tag ?? null);
  const [isBan, setIsBan] = useState(editing?.is_ban_priority ?? false);
  const [isPriority, setIsPriority] = useState(editing?.priority_to_learn ?? false);
  const [notes, setNotes] = useState(editing?.notes ?? "");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setSelectedHero(editing?.hero_name ?? "");
      setTier(editing?.tier ?? defaultTier);
      setRoleTag(editing?.role_tag ?? null);
      setIsBan(editing?.is_ban_priority ?? false);
      setIsPriority(editing?.priority_to_learn ?? false);
      setNotes(editing?.notes ?? "");
      setSearch("");
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [open, editing, defaultTier]);

  if (!open) return null;

  const available = MLBB_HEROES.filter(
    (h) => !existingHeroes.has(h) || h === editing?.hero_name,
  );
  const filtered = search
    ? available.filter((h) => h.toLowerCase().includes(search.toLowerCase()))
    : available;

  function handleSave() {
    if (!selectedHero) { toast.error("Pilih hero terlebih dahulu"); return; }
    startTransition(async () => {
      const res = await upsertHeroRatingAction(orgSlug, orgId, patchId, {
        hero_name: selectedHero,
        tier,
        role_tag: roleTag,
        is_ban_priority: isBan,
        priority_to_learn: isPriority,
        notes,
      });
      if (res.ok) {
        toast.success(editing ? "Hero diperbarui" : `${selectedHero} ditambahkan ke Tier ${tier}`);
        onClose();
      } else {
        toast.error(res.message);
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl border border-[#2D2D2D] bg-[#1C1C1C] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2D2D2D] px-5 py-4">
          <h2 className="text-sm font-semibold text-white">
            {editing ? `Edit — ${editing.hero_name}` : "Tambah Hero ke Meta"}
          </h2>
          <button type="button" onClick={onClose} className="cursor-pointer text-white/40 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          {/* Hero picker — only shown when adding new */}
          {!editing && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/60">Hero</label>
              {selectedHero ? (
                <div className="flex items-center justify-between rounded-md border border-[#2D2D2D] bg-[#141414] px-3 py-2">
                  <span className="text-sm font-medium text-white">{selectedHero}</span>
                  <button type="button" onClick={() => setSelectedHero("")} className="cursor-pointer text-white/40 hover:text-white">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 rounded-md border border-[#2D2D2D] bg-[#141414] px-3 py-2">
                    <Search className="h-3.5 w-3.5 shrink-0 text-white/40" />
                    <input
                      ref={searchRef}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Cari hero..."
                      className="flex-1 bg-transparent text-sm text-white placeholder-white/30 outline-none"
                    />
                  </div>
                  <ul className="sidebar-scroll max-h-40 overflow-y-auto rounded-md border border-[#2D2D2D] bg-[#141414]">
                    {filtered.slice(0, 50).map((h) => (
                      <li key={h}>
                        <button
                          type="button"
                          onClick={() => setSelectedHero(h)}
                          className="w-full cursor-pointer px-3 py-1.5 text-left text-sm text-white/70 hover:bg-[#2C2C2C] hover:text-white"
                        >
                          {h}
                        </button>
                      </li>
                    ))}
                    {filtered.length === 0 && (
                      <li className="px-3 py-3 text-center text-xs text-white/40">Hero tidak ditemukan</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Tier */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/60">Tier</label>
            <div className="flex gap-2">
              {(["S", "A", "B", "C", "D"] as Tier[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTier(t)}
                  className={cn(
                    "h-9 w-12 cursor-pointer rounded-md border text-sm font-bold transition",
                    tier === t ? TIER_COLORS[t] : "border-[#2D2D2D] text-white/30 hover:border-white/20 hover:text-white/60",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Role tag */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/60">Lane / Role</label>
            <div className="flex flex-wrap gap-2">
              {ROLE_OPTIONS.map((r) => (
                <button
                  key={String(r.value)}
                  type="button"
                  onClick={() => setRoleTag(r.value)}
                  className={cn(
                    "cursor-pointer rounded-full border px-3 py-1 text-xs transition",
                    roleTag === r.value
                      ? "border-yellow-500/50 bg-yellow-500/10 text-yellow-400"
                      : "border-[#2D2D2D] text-white/40 hover:border-white/20 hover:text-white/60",
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Flags */}
          <div className="flex gap-4">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={isBan}
                onChange={(e) => setIsBan(e.target.checked)}
                className="h-4 w-4 accent-red-500"
              />
              <span className="text-xs text-white/70">Ban Priority</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={isPriority}
                onChange={(e) => setIsPriority(e.target.checked)}
                className="h-4 w-4 accent-yellow-400"
              />
              <span className="text-xs text-white/70">Priority to Learn</span>
            </label>
          </div>

          {/* Notes */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/60">Notes coach (opsional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Misal: kuat di early game, counter Fanny..."
              className="w-full resize-none rounded-md border border-[#2D2D2D] bg-[#141414] px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-white/30"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 cursor-pointer rounded-md border border-[#2D2D2D] py-2 text-sm text-white/60 transition hover:bg-white/5"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={pending || (!selectedHero && !editing)}
              className="flex-1 cursor-pointer rounded-md bg-yellow-400 py-2 text-sm font-semibold text-black transition hover:bg-yellow-300 disabled:opacity-50"
            >
              {pending ? "Menyimpan..." : editing ? "Simpan" : "Tambahkan"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
