"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Search, X } from "lucide-react";
import { toast } from "sonner";
import { MLBB_HEROES } from "@/features/scrim/data/mlbb-heroes";
import { cn } from "@/lib/utils/cn";
import { upsertHeroRatingAction } from "../actions";
import type { MetaHeroRating } from "../queries";

// AddHeroModal is now used for EDIT only (role, tier, flags, notes).
// Adding new heroes uses the inline HeroPickerPanel in MetaPage.

type Tier = "SS" | "S" | "A" | "B" | "C" | "D";
type RoleTag = "exp_lane" | "jungler" | "mid_lane" | "gold_lane" | "roamer" | null;

const TIER_COLORS: Record<Tier, string> = {
  SS: "bg-violet-500/20 text-violet-300 border-violet-500/40",
  S: "bg-red-500/20 text-red-400 border-red-500/30",
  A: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  B: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  C: "bg-green-500/20 text-green-400 border-green-500/30",
  D: "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

const ROLE_OPTIONS: Array<{ value: RoleTag; label: string }> = [
  { value: "exp_lane", label: "EXP Lane" },
  { value: "jungler", label: "Jungler" },
  { value: "mid_lane", label: "Mid Lane" },
  { value: "gold_lane", label: "Gold Lane" },
  { value: "roamer", label: "Roamer" },
];

interface AddHeroModalProps {
  open: boolean;
  onClose: (updated?: MetaHeroRating) => void;
  orgSlug: string;
  orgId: string;
  patchId: string;
  existingHeroes: Set<string>;
  editing?: MetaHeroRating | null;
  defaultTier?: Tier;
}

function MultiHeroPicker({
  label,
  selected,
  onToggle,
  excludeHero,
}: {
  label: string;
  selected: string[];
  onToggle: (name: string) => void;
  excludeHero: string;
}) {
  const [search, setSearch] = useState("");
  const available = MLBB_HEROES.filter((h) => h !== excludeHero);
  const filtered = search
    ? available.filter((h) => h.toLowerCase().includes(search.toLowerCase()))
    : available;

  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-ui-text-2">{label}</label>
      {selected.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {selected.map((name) => (
            <span
              key={name}
              className="flex items-center gap-1 rounded-full border border-ui-border bg-ui-bg px-2 py-0.5 text-xs text-ui-text"
            >
              {name}
              <button
                type="button"
                onClick={() => onToggle(name)}
                className="cursor-pointer text-ui-text-muted hover:text-ui-text"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2 rounded-md border border-ui-border bg-ui-bg px-3 py-1.5">
        <Search className="h-3 w-3 shrink-0 text-ui-text-muted" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari hero..."
          className="flex-1 bg-transparent text-xs text-ui-text placeholder-white/30 outline-none"
        />
      </div>
      {search && (
        <ul className="sidebar-scroll mt-1 max-h-28 overflow-y-auto rounded-md border border-ui-border bg-ui-bg">
          {filtered.slice(0, 30).map((h) => (
            <li key={h}>
              <button
                type="button"
                onClick={() => { onToggle(h); setSearch(""); }}
                className={cn(
                  "w-full cursor-pointer px-3 py-1 text-left text-xs transition",
                  selected.includes(h)
                    ? "text-yellow-400 hover:bg-yellow-500/10"
                    : "text-ui-text-2 hover:bg-ui-hover hover:text-ui-text",
                )}
              >
                {selected.includes(h) ? `✓ ${h}` : h}
              </button>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="px-3 py-2 text-center text-xs text-ui-text-muted">Tidak ditemukan</li>
          )}
        </ul>
      )}
    </div>
  );
}

const AddHeroModal = ({
  open,
  onClose,
  orgSlug,
  orgId,
  patchId,
  existingHeroes,
  editing,
  defaultTier = "B",
}: AddHeroModalProps) => {
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [selectedHero, setSelectedHero] = useState<string>(editing?.hero_name ?? "");
  const [tier, setTier] = useState<Tier>((editing?.tier as Tier) ?? defaultTier);
  const [roleTag, setRoleTag] = useState<RoleTag>((editing?.role_tag as RoleTag) ?? null);
  const [isBan, setIsBan] = useState(editing?.is_ban_priority ?? false);
  const [isPriority, setIsPriority] = useState(editing?.priority_to_learn ?? false);
  const [notes, setNotes] = useState(editing?.notes ?? "");
  const [draftNotes, setDraftNotes] = useState(editing?.draft_notes ?? "");
  const [counters, setCounters] = useState<string[]>(editing?.counters ?? []);
  const [synergies, setSynergies] = useState<string[]>(editing?.synergies ?? []);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setSelectedHero(editing?.hero_name ?? "");
      setTier((editing?.tier as Tier) ?? defaultTier);
      setRoleTag((editing?.role_tag as RoleTag) ?? null);
      setIsBan(editing?.is_ban_priority ?? false);
      setIsPriority(editing?.priority_to_learn ?? false);
      setNotes(editing?.notes ?? "");
      setDraftNotes(editing?.draft_notes ?? "");
      setCounters(editing?.counters ?? []);
      setSynergies(editing?.synergies ?? []);
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
        draft_notes: draftNotes,
        counters,
        synergies,
      });
      if (res.ok) {
        toast.success(editing ? "Hero diperbarui" : `${selectedHero} ditambahkan ke Tier ${tier}`);
        onClose(res.hero);
      } else {
        toast.error(res.message);
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl border border-ui-border bg-ui-surface shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-ui-border px-5 py-4">
          <h2 className="text-sm font-semibold text-ui-text">
            {editing ? `Edit — ${editing.hero_name}` : "Tambah Hero ke Meta"}
          </h2>
          <button type="button" onClick={() => onClose()} className="cursor-pointer text-ui-text-muted hover:text-ui-text">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          {/* Hero picker — only shown when adding new */}
          {!editing && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-ui-text-2">Hero</label>
              {selectedHero ? (
                <div className="flex items-center justify-between rounded-md border border-ui-border bg-ui-bg px-3 py-2">
                  <span className="text-sm font-medium text-ui-text">{selectedHero}</span>
                  <button type="button" onClick={() => setSelectedHero("")} className="cursor-pointer text-ui-text-muted hover:text-ui-text">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 rounded-md border border-ui-border bg-ui-bg px-3 py-2">
                    <Search className="h-3.5 w-3.5 shrink-0 text-ui-text-muted" />
                    <input
                      ref={searchRef}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Cari hero..."
                      className="flex-1 bg-transparent text-sm text-ui-text placeholder-white/30 outline-none"
                    />
                  </div>
                  <ul className="sidebar-scroll max-h-40 overflow-y-auto rounded-md border border-ui-border bg-ui-bg">
                    {filtered.slice(0, 50).map((h) => (
                      <li key={h}>
                        <button
                          type="button"
                          onClick={() => setSelectedHero(h)}
                          className="w-full cursor-pointer px-3 py-1.5 text-left text-sm text-ui-text hover:bg-ui-hover hover:text-ui-text"
                        >
                          {h}
                        </button>
                      </li>
                    ))}
                    {filtered.length === 0 && (
                      <li className="px-3 py-3 text-center text-xs text-ui-text-muted">Hero tidak ditemukan</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Tier */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ui-text-2">Tier</label>
            <div className="flex gap-2">
              {(["SS", "S", "A", "B", "C", "D"] as Tier[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTier(t)}
                  className={cn(
                    "h-9 w-12 cursor-pointer rounded-md border text-sm font-bold transition",
                    tier === t ? TIER_COLORS[t] : "border-ui-border text-ui-text-muted hover:border-white/20 hover:text-ui-text-2",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Role tag */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ui-text-2">Role</label>
            <div className="flex flex-wrap gap-2">
              {ROLE_OPTIONS.map((r) => (
                <button
                  key={String(r.value)}
                  type="button"
                  onClick={() => setRoleTag(roleTag === r.value ? null : r.value)}
                  className={cn(
                    "cursor-pointer rounded-full border px-3 py-1 text-xs transition",
                    roleTag === r.value
                      ? "border-yellow-500/50 bg-yellow-500/10 text-yellow-400"
                      : "border-ui-border text-ui-text-muted hover:border-white/20 hover:text-ui-text-2",
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
              <span className="text-xs text-ui-text">Ban Priority</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={isPriority}
                onChange={(e) => setIsPriority(e.target.checked)}
                className="h-4 w-4 accent-yellow-400"
              />
              <span className="text-xs text-ui-text">Priority to Learn</span>
            </label>
          </div>

          {/* Notes */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ui-text-2">Notes coach (opsional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Misal: kuat di early game, counter Fanny..."
              className="w-full resize-none rounded-md border border-ui-border bg-ui-bg px-3 py-2 text-sm text-ui-text placeholder-white/30 outline-none focus:border-white/30"
            />
          </div>

          {/* Draft Notes */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ui-text-2">Draft Notes (opsional)</label>
            <textarea
              value={draftNotes}
              onChange={(e) => setDraftNotes(e.target.value)}
              rows={2}
              placeholder="Misal: kuat di turtle fight, pair dengan Atlas..."
              className="w-full resize-none rounded-md border border-ui-border bg-ui-bg px-3 py-2 text-sm text-ui-text placeholder-white/30 outline-none focus:border-white/30"
            />
          </div>

          {/* Counters */}
          <MultiHeroPicker
            label="Counters"
            selected={counters}
            onToggle={(name) =>
              setCounters((prev) =>
                prev.includes(name) ? prev.filter((h) => h !== name) : [...prev, name],
              )
            }
            excludeHero={selectedHero || editing?.hero_name || ""}
          />

          {/* Synergies */}
          <MultiHeroPicker
            label="Synergies"
            selected={synergies}
            onToggle={(name) =>
              setSynergies((prev) =>
                prev.includes(name) ? prev.filter((h) => h !== name) : [...prev, name],
              )
            }
            excludeHero={selectedHero || editing?.hero_name || ""}
          />

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => onClose()}
              className="flex-1 cursor-pointer rounded-md border border-ui-border py-2 text-sm text-ui-text-2 transition hover:bg-white/5"
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
};
export { AddHeroModal };
