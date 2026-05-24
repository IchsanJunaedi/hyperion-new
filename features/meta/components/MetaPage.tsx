"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Pencil, X, Trash2, Shield, Star, Search, Settings, Download } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";
import { getHeroImageUrl, MLBB_HEROES } from "@/features/scrim/data/mlbb-heroes";
import { AddHeroModal } from "./AddHeroModal";
import { HeroDetailPanel } from "./HeroDetailPanel";
import {
  deleteHeroRatingAction,
  createMetaPatchAction,
  deleteMetaPatchAction,
  upsertHeroRatingAction,
  updatePatchSettingsAction,
} from "../actions";
import type { MetaHeroRating, MetaPatch, PatchWithHeroes } from "../queries";

type Tier = "SS" | "S" | "A" | "B" | "C" | "D";
type RoleFilter = "all" | "exp_lane" | "jungler" | "mid_lane" | "gold_lane" | "roamer";
type ClassFilter = "all" | "Fighter" | "Tank" | "Assassin" | "Mage" | "Marksman" | "Support";

const TIERS: Tier[] = ["SS", "S", "A", "B", "C", "D"];

const TIER_STYLES: Record<Tier, { bg: string; border: string; badge: string; label: string; activeBorder: string }> = {
  SS: { bg: "bg-violet-500/5", border: "border-violet-500/30", badge: "bg-violet-500/20 text-violet-300", label: "text-violet-300", activeBorder: "border-violet-500/50" },
  S: { bg: "bg-red-500/5", border: "border-red-500/30", badge: "bg-red-500/20 text-red-400", label: "text-red-400", activeBorder: "border-red-500/50" },
  A: { bg: "bg-orange-500/5", border: "border-orange-500/30", badge: "bg-orange-500/20 text-orange-400", label: "text-orange-400", activeBorder: "border-orange-500/50" },
  B: { bg: "bg-yellow-500/5", border: "border-yellow-500/30", badge: "bg-yellow-500/20 text-yellow-400", label: "text-yellow-400", activeBorder: "border-yellow-500/50" },
  C: { bg: "bg-green-500/5", border: "border-green-500/30", badge: "bg-green-500/20 text-green-400", label: "text-green-400", activeBorder: "border-green-500/50" },
  D: { bg: "bg-blue-500/5", border: "border-blue-500/30", badge: "bg-blue-500/20 text-blue-400", label: "text-blue-400", activeBorder: "border-blue-500/50" },
};

const TIER_DESCRIPTIONS_DEFAULT: Record<Tier, string> = {
  SS: "Meta-defining — always ban or first-pick",
  S: "Dominant — ban or first-pick when available",
  A: "Reliable in most compositions",
  B: "Situationally strong with the right comp",
  C: "Niche picks — requires specific conditions",
  D: "Avoid unless heavily mastered",
};

const ROLE_LABELS: Record<string, string> = {
  exp_lane: "EXP",
  jungler: "JGL",
  mid_lane: "MID",
  gold_lane: "GOLD",
  roamer: "ROAM",
};

const ROLE_COLORS: Record<string, string> = {
  exp_lane: "text-amber-400",
  jungler: "text-violet-400",
  mid_lane: "text-cyan-400",
  gold_lane: "text-yellow-400",
  roamer: "text-rose-400",
};

const CLASS_COLORS: Record<string, string> = {
  Fighter: "text-orange-400",
  Tank: "text-blue-400",
  Assassin: "text-red-400",
  Mage: "text-purple-400",
  Marksman: "text-green-400",
  Support: "text-pink-400",
};

const ROLE_BG: Record<string, string> = {
  exp_lane: "bg-amber-500/20",
  jungler: "bg-violet-500/20",
  mid_lane: "bg-cyan-500/20",
  gold_lane: "bg-yellow-500/20",
  roamer: "bg-rose-500/20",
};

const ROLE_DISPLAY: Record<string, string> = {
  exp_lane: "EXP Lane",
  jungler: "Jungler",
  mid_lane: "Mid Lane",
  gold_lane: "Gold Lane",
  roamer: "Roamer",
};

const ROLE_FILTERS: Array<{ value: RoleFilter; label: string }> = [
  { value: "all", label: "Semua" },
  { value: "exp_lane", label: "EXP Lane" },
  { value: "jungler", label: "Jungler" },
  { value: "mid_lane", label: "Mid Lane" },
  { value: "gold_lane", label: "Gold Lane" },
  { value: "roamer", label: "Roamer" },
];

const CLASS_FILTERS: Array<{ value: ClassFilter; label: string; color: string }> = [
  { value: "all", label: "Semua", color: "border-[#2D2D2D] text-white/40 hover:border-white/20 hover:text-white/70" },
  { value: "Fighter", label: "Fighter", color: "border-orange-500/50 bg-orange-500/10 text-orange-400" },
  { value: "Tank", label: "Tank", color: "border-blue-500/50 bg-blue-500/10 text-blue-400" },
  { value: "Assassin", label: "Assassin", color: "border-red-500/50 bg-red-500/10 text-red-400" },
  { value: "Mage", label: "Mage", color: "border-purple-500/50 bg-purple-500/10 text-purple-400" },
  { value: "Marksman", label: "Marksman", color: "border-green-500/50 bg-green-500/10 text-green-400" },
  { value: "Support", label: "Support", color: "border-pink-500/50 bg-pink-500/10 text-pink-400" },
];

// ─── Hero card (in tier list) ──────────────────────────────────────────────

function HeroCard({
  hero,
  editMode,
  onEdit,
  onDelete,
  onDetail,
  pendingDeleteId,
}: {
  hero: MetaHeroRating;
  editMode: boolean;
  onEdit: (h: MetaHeroRating) => void;
  onDelete: (id: string, name: string) => void;
  onDetail: (h: MetaHeroRating) => void;
  pendingDeleteId: string | null;
}) {
  const style = TIER_STYLES[hero.tier];
  return (
    <div className="group relative w-[72px] shrink-0 select-none">
      <div
        className={cn(
          "relative aspect-square w-full overflow-hidden rounded-xl border-2 transition group-hover:scale-105",
          style.border,
          !editMode && "cursor-pointer",
        )}
        onClick={() => !editMode && onDetail(hero)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={getHeroImageUrl(hero.hero_name)}
          alt={hero.hero_name}
          className="h-full w-full object-cover"
        />
        <div className={cn("absolute bottom-1 left-1 flex h-4 min-w-4 items-center justify-center rounded px-1 text-[8px] font-black shadow", style.badge)}>
          {hero.tier}
        </div>
        {hero.is_ban_priority && (
          <div className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 shadow-md">
            <Shield className="h-2.5 w-2.5 text-white" />
          </div>
        )}
        {hero.priority_to_learn && (
          <div className={cn("absolute top-1 flex h-4 w-4 items-center justify-center rounded-full bg-yellow-500 shadow-md", hero.is_ban_priority ? "right-6" : "right-1")}>
            <Star className="h-2.5 w-2.5 fill-black text-black" />
          </div>
        )}
        {editMode && (
          <div className="absolute inset-0 z-10 flex items-center justify-center gap-1.5 bg-black/75 opacity-0 transition group-hover:opacity-100">
            <button
              type="button"
              onClick={() => onEdit(hero)}
              className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/40"
            >
              <Pencil className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(hero.id, hero.hero_name)}
              className={`flex h-6 w-6 cursor-pointer items-center justify-center rounded-full transition ${
                pendingDeleteId === hero.id
                  ? "bg-red-500/80 text-white"
                  : "bg-red-500/30 text-red-400 hover:bg-red-500/50"
              }`}
              title={pendingDeleteId === hero.id ? "Klik lagi untuk konfirmasi" : "Hapus"}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
      <p className="mt-1.5 truncate px-0.5 text-center text-[10px] font-medium leading-tight text-white/75">
        {hero.hero_name}
      </p>
      <div className="mt-0.5 flex justify-center gap-1">
        {hero.hero_class && (
          <span className={cn("text-[7px] font-bold leading-none", CLASS_COLORS[hero.hero_class] ?? "text-white/40")}>
            {hero.hero_class}
          </span>
        )}
        {hero.role_tag && (
          <span className={cn("rounded-sm px-1 py-0.5 text-[7px] font-bold leading-none", ROLE_COLORS[hero.role_tag], ROLE_BG[hero.role_tag])}>
            {ROLE_LABELS[hero.role_tag]}
          </span>
        )}
      </div>
      {hero.notes && (
        <div className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 -translate-x-1/2 whitespace-nowrap rounded border border-white/10 bg-black/95 px-2 py-1.5 text-[9px] italic text-white/50 opacity-0 shadow-lg transition group-hover:opacity-100">
          {hero.notes}
        </div>
      )}
    </div>
  );
}

// ─── Inline hero picker panel ──────────────────────────────────────────────

type RoleTag = "exp_lane" | "jungler" | "mid_lane" | "gold_lane" | "roamer" | null;

const ROLE_CONFIG: Array<{ value: RoleTag; label: string }> = [
  { value: "exp_lane", label: "EXP" },
  { value: "jungler", label: "JGL" },
  { value: "mid_lane", label: "MID" },
  { value: "gold_lane", label: "GOLD" },
  { value: "roamer", label: "ROAM" },
];

function HeroPickerPanel({
  tier,
  orgSlug,
  orgId,
  patchId,
  existingHeroNames,
  onAdd,
  style,
}: {
  tier: Tier;
  orgSlug: string;
  orgId: string;
  patchId: string;
  existingHeroNames: Set<string>;
  onAdd: (hero: MetaHeroRating) => void;
  style: typeof TIER_STYLES[Tier];
}) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [configRole, setConfigRole] = useState<RoleTag>(null);
  const [configBan, setConfigBan] = useState(false);
  const [configLearn, setConfigLearn] = useState(false);
  const [adding, setAdding] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => searchRef.current?.focus(), 50);
  }, []);

  const available = MLBB_HEROES.filter((h) => !existingHeroNames.has(h));
  const filtered = search
    ? available.filter((h) => h.toLowerCase().includes(search.toLowerCase()))
    : available;

  function selectHero(heroName: string) {
    setSelected(heroName);
    setConfigRole(null);
    setConfigBan(false);
    setConfigLearn(false);
  }

  function clearSelection() {
    setSelected(null);
    setConfigRole(null);
    setConfigBan(false);
    setConfigLearn(false);
  }

  async function handleConfirm() {
    if (!selected || adding) return;
    setAdding(true);

    const res = await upsertHeroRatingAction(orgSlug, orgId, patchId, {
      hero_name: selected,
      tier,
      role_tag: configRole,
      is_ban_priority: configBan,
      priority_to_learn: configLearn,
      notes: "",
      draft_notes: "",
      counters: [],
      synergies: [],
    });

    if (res.ok) {
      onAdd(res.hero);
      clearSelection();
      searchRef.current?.focus();
    } else {
      toast.error(res.message);
    }
    setAdding(false);
  }

  return (
    <div className={cn("mt-3 rounded-xl border bg-[#171717] p-4", style.border)}>
      {/* Search bar */}
      <div className="mb-3 flex items-center gap-2 rounded-lg border border-[#2D2D2D] bg-[#141414] px-3 py-2">
        <Search className="h-3.5 w-3.5 shrink-0 text-white/30" />
        <input
          ref={searchRef}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari hero..."
          className="flex-1 bg-transparent text-sm text-white placeholder-white/30 outline-none"
        />
        {search && (
          <button type="button" onClick={() => setSearch("")} className="cursor-pointer text-white/30 hover:text-white">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Config strip — shown after hero is selected */}
      {selected && (
        <div className="mb-3 rounded-lg border border-[#2D2D2D] bg-[#1C1C1C] p-3 space-y-3">
          {/* Hero identity + action buttons */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getHeroImageUrl(selected)}
                alt={selected}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-semibold text-white">{selected}</p>
              <p className={cn("text-xs", style.label)}>Tier {tier}</p>
            </div>
            <button
              type="button"
              onClick={clearSelection}
              className="cursor-pointer text-white/30 hover:text-white shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Role selector */}
          <div className="flex flex-wrap items-center gap-1.5">
            {ROLE_CONFIG.map((r) => (
              <button
                key={String(r.value)}
                type="button"
                onClick={() => setConfigRole(configRole === r.value ? null : r.value)}
                className={cn(
                  "cursor-pointer rounded-full border px-2.5 py-0.5 text-xs font-medium transition",
                  configRole === r.value
                    ? cn(ROLE_COLORS[r.value!], ROLE_BG[r.value!], "border-transparent")
                    : "border-[#2D2D2D] text-white/40 hover:border-white/20 hover:text-white/70",
                )}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Flags + confirm */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setConfigBan((v) => !v)}
              className={cn(
                "inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition",
                configBan
                  ? "border-red-500/50 bg-red-500/10 text-red-400"
                  : "border-[#2D2D2D] text-white/40 hover:border-white/20 hover:text-white/60",
              )}
            >
              <Shield className="h-3 w-3" />
              Ban Priority
            </button>
            <button
              type="button"
              onClick={() => setConfigLearn((v) => !v)}
              className={cn(
                "inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition",
                configLearn
                  ? "border-yellow-500/50 bg-yellow-500/10 text-yellow-400"
                  : "border-[#2D2D2D] text-white/40 hover:border-white/20 hover:text-white/60",
              )}
            >
              <Star className="h-3 w-3" />
              Priority to Learn
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={adding}
              className="ml-auto inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-yellow-400 px-4 py-1.5 text-xs font-bold text-black transition hover:bg-yellow-300 disabled:opacity-60"
            >
              {adding ? (
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-black/20 border-t-black" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
              Tambahkan
            </button>
          </div>
        </div>
      )}

      {/* Hero grid */}
      <div className="sidebar-scroll max-h-48 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="py-4 text-center text-xs text-white/30">Hero tidak ditemukan</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {filtered.map((heroName) => {
              const isSelected = selected === heroName;
              return (
                <button
                  key={heroName}
                  type="button"
                  onClick={() => selectHero(heroName)}
                  title={heroName}
                  className={cn(
                    "group relative w-14 shrink-0 cursor-pointer rounded-lg border p-0.5 transition focus:outline-none",
                    isSelected
                      ? cn(style.border, "bg-white/5 scale-105")
                      : "border-transparent hover:border-white/20 hover:bg-white/5",
                  )}
                >
                  <div className="aspect-square overflow-hidden rounded-md">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getHeroImageUrl(heroName)}
                      alt={heroName}
                      className="h-full w-full object-cover transition group-hover:scale-110"
                    />
                  </div>
                  <p className={cn(
                    "mt-0.5 truncate text-center text-[8px] transition",
                    isSelected ? "text-white/90 font-semibold" : "text-white/50 group-hover:text-white/80",
                  )}>
                    {heroName}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <p className="mt-3 text-[10px] text-white/25">
        {available.length} hero tersedia · Pilih hero → atur lane & flag → Tambahkan
      </p>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────

interface MetaPageProps {
  orgSlug: string;
  orgId: string;
  patches: MetaPatch[];
  initialPatch: PatchWithHeroes | null;
  canEdit: boolean;
}

export function MetaPage({ orgSlug, orgId, patches, initialPatch, canEdit }: MetaPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activePatch, setActivePatch] = useState<PatchWithHeroes | null>(initialPatch);
  const [patchList, setPatchList] = useState<MetaPatch[]>(patches);
  const [activeTab, setActiveTab] = useState<"tier" | "ban" | "learn">("tier");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [classFilter, setClassFilter] = useState<ClassFilter>("all");
  const [editMode, setEditMode] = useState(false);
  const [expandedTier, setExpandedTier] = useState<Tier | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingHero, setEditingHero] = useState<MetaHeroRating | null>(null);
  const [showNewPatchForm, setShowNewPatchForm] = useState(false);
  const [newPatchVersion, setNewPatchVersion] = useState("");
  const [newPatchNotes, setNewPatchNotes] = useState("");
  const [pending, startTransition] = useTransition();
  const [detailHero, setDetailHero] = useState<MetaHeroRating | null>(null);
  const [showPatchSettings, setShowPatchSettings] = useState(false);
  const [settingsNotes, setSettingsNotes] = useState("");
  const [settingsDescriptions, setSettingsDescriptions] = useState<Record<string, string>>({});
  const [confirmDeleteHeroId, setConfirmDeleteHeroId] = useState<string | null>(null);
  const [confirmDeletePatch, setConfirmDeletePatch] = useState(false);

  // Close picker when edit mode is turned off
  useEffect(() => {
    if (!editMode) setExpandedTier(null);
  }, [editMode]);

  const heroes = activePatch?.heroes ?? [];
  const existingHeroNames = new Set(heroes.map((h) => h.hero_name));
  const filteredHeroes = heroes
    .filter((h) => roleFilter === "all" || h.role_tag === roleFilter)
    .filter((h) => classFilter === "all" || h.hero_class === classFilter);

  function openEditModal(hero: MetaHeroRating) {
    setEditingHero(hero);
    setModalOpen(true);
  }

  function handlePickerAdd(hero: MetaHeroRating) {
    setActivePatch((prev) =>
      prev ? { ...prev, heroes: [...prev.heroes, hero] } : prev,
    );
  }

  function handleDelete(ratingId: string, _heroName: string) {
    if (confirmDeleteHeroId !== ratingId) {
      setConfirmDeleteHeroId(ratingId);
      return;
    }
    setConfirmDeleteHeroId(null);
    startTransition(async () => {
      const hero = activePatch?.heroes.find((h) => h.id === ratingId);
      const res = await deleteHeroRatingAction(orgSlug, orgId, ratingId);
      if (res.ok) {
        setActivePatch((prev) =>
          prev ? { ...prev, heroes: prev.heroes.filter((h) => h.id !== ratingId) } : prev,
        );
        toast.success(`${hero?.hero_name ?? "Hero"} dihapus dari tier list`);
      } else {
        toast.error(res.message);
      }
    });
  }

  function handleCreatePatch() {
    startTransition(async () => {
      const res = await createMetaPatchAction(orgSlug, orgId, newPatchVersion, newPatchNotes);
      if (res.ok && res.id) {
        const newPatch: PatchWithHeroes = {
          id: res.id,
          organization_id: orgId,
          patch_version: newPatchVersion.trim(),
          notes: newPatchNotes.trim() || null,
          created_by: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          tier_descriptions: null,
          heroes: [],
        };
        setPatchList((prev) => [newPatch, ...prev]);
        setActivePatch(newPatch);
        setShowNewPatchForm(false);
        setNewPatchVersion("");
        setNewPatchNotes("");
        toast.success(`Patch ${newPatch.patch_version} dibuat`);
      } else if (!res.ok) {
        toast.error(res.message);
      }
    });
  }

  function handleDeletePatch() {
    if (!activePatch) return;
    if (!confirmDeletePatch) {
      setConfirmDeletePatch(true);
      return;
    }
    setConfirmDeletePatch(false);
    startTransition(async () => {
      const res = await deleteMetaPatchAction(orgSlug, orgId, activePatch.id);
      if (res.ok) {
        const remaining = patchList.filter((p) => p.id !== activePatch.id);
        setPatchList(remaining);
        setActivePatch(remaining[0] ? { ...remaining[0], heroes: [] } : null);
        setEditMode(false);
        toast.success("Patch dihapus");
      } else {
        toast.error(res.message);
      }
    });
  }

  function handleModalClose(updated?: MetaHeroRating) {
    setModalOpen(false);
    if (updated) {
      setActivePatch((prev) =>
        prev
          ? { ...prev, heroes: prev.heroes.map((h) => (h.id === updated.id ? updated : h)) }
          : prev,
      );
    } else {
      router.refresh();
    }
  }

  const banHeroes = heroes.filter((h) => h.is_ban_priority);
  const learnHeroes = heroes.filter((h) => h.priority_to_learn);

  type RoleKey = "exp_lane" | "jungler" | "mid_lane" | "gold_lane" | "roamer" | "untagged";
  const learnByRole: Record<RoleKey, MetaHeroRating[]> = {
    exp_lane: learnHeroes.filter((h) => h.role_tag === "exp_lane"),
    jungler: learnHeroes.filter((h) => h.role_tag === "jungler"),
    mid_lane: learnHeroes.filter((h) => h.role_tag === "mid_lane"),
    gold_lane: learnHeroes.filter((h) => h.role_tag === "gold_lane"),
    roamer: learnHeroes.filter((h) => h.role_tag === "roamer"),
    untagged: learnHeroes.filter((h) => !h.role_tag),
  };

  return (
    <div className="space-y-6 px-4 py-6 sm:px-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">Meta MLBB</h1>
          <p className="mt-1 text-sm text-white/50">
            Tier list hero per patch — dikelola coach
            {activePatch?.updated_at && (
              <span className="ml-2 text-white/30">
                · Diperbarui {new Date(activePatch.updated_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            )}
          </p>
        </div>
        <div className="print-hide flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-md border border-white/10 px-3 text-xs text-white/60 transition hover:bg-white/5 hover:text-white"
          >
            <Download className="h-3.5 w-3.5" />
            Export PDF
          </button>
          {canEdit && (
            <button
              type="button"
              onClick={() => setEditMode((v) => !v)}
              className={cn(
                "inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm transition",
                editMode
                  ? "border-yellow-500/50 bg-yellow-500/10 text-yellow-400"
                  : "border-[#2D2D2D] text-white/60 hover:bg-white/5",
              )}
            >
              <Pencil className="h-3.5 w-3.5" />
              {editMode ? "Selesai Edit" : "Edit"}
            </button>
          )}
        </div>
      </div>

      {/* Patch selector */}
      <div className="print-hide flex flex-wrap items-center gap-3">
        <span className="text-xs text-white/50">Patch:</span>
        <div className="flex flex-wrap gap-1.5">
          {patchList.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString());
                params.set("patch", p.id);
                router.push(`?${params.toString()}`);
              }}
              className={cn(
                "cursor-pointer rounded-full border px-3 py-1 text-xs transition",
                activePatch?.id === p.id
                  ? "border-yellow-500/50 bg-yellow-500/10 text-yellow-400"
                  : "border-[#2D2D2D] text-white/50 hover:border-white/20 hover:text-white/80",
              )}
            >
              {p.patch_version}
            </button>
          ))}
          {patchList.length === 0 && (
            <span className="text-xs italic text-white/30">Belum ada patch</span>
          )}
        </div>
        {canEdit && (
          <button
            type="button"
            onClick={() => setShowNewPatchForm((v) => !v)}
            className="inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-full border border-dashed border-[#2D2D2D] px-3 text-xs text-white/40 transition hover:border-white/20 hover:text-white/70"
          >
            <Plus className="h-3 w-3" />
            Patch Baru
          </button>
        )}
        {activePatch && canEdit && (
          <button
            type="button"
            onClick={() => {
              setSettingsNotes(activePatch.notes ?? "");
              setSettingsDescriptions((activePatch.tier_descriptions as Record<string, string>) ?? {});
              setShowPatchSettings((v) => !v);
            }}
            className={cn(
              "inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border transition",
              showPatchSettings
                ? "border-yellow-500/50 bg-yellow-500/10 text-yellow-400"
                : "border-[#2D2D2D] text-white/40 hover:border-white/20 hover:text-white/70",
            )}
          >
            <Settings className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* New patch form */}
      {showNewPatchForm && canEdit && (
        <div className="print-hide space-y-3 rounded-xl border border-[#2D2D2D] bg-[#1C1C1C] p-4">
          <p className="text-xs font-medium text-white/70">Tambah Patch Baru</p>
          <div className="flex gap-2">
            <input
              value={newPatchVersion}
              onChange={(e) => setNewPatchVersion(e.target.value)}
              placeholder="Versi patch (misal: 33.1)"
              className="flex-1 rounded-md border border-[#2D2D2D] bg-[#141414] px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-white/30"
            />
            <input
              value={newPatchNotes}
              onChange={(e) => setNewPatchNotes(e.target.value)}
              placeholder="Catatan singkat (opsional)"
              className="flex-1 rounded-md border border-[#2D2D2D] bg-[#141414] px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-white/30"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowNewPatchForm(false)}
              className="cursor-pointer rounded-md border border-[#2D2D2D] px-4 py-1.5 text-sm text-white/60 transition hover:bg-white/5"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleCreatePatch}
              disabled={pending || !newPatchVersion.trim()}
              className="cursor-pointer rounded-md bg-yellow-400 px-4 py-1.5 text-sm font-semibold text-black transition hover:bg-yellow-300 disabled:opacity-50"
            >
              Buat Patch
            </button>
          </div>
        </div>
      )}

      {/* Patch settings form */}
      {showPatchSettings && activePatch && canEdit && (
        <div className="print-hide space-y-4 rounded-xl border border-[#2D2D2D] bg-[#1C1C1C] p-4">
          <p className="text-xs font-medium text-white/70">Pengaturan Patch {activePatch.patch_version}</p>

          <div>
            <label className="mb-1 block text-xs text-white/50">Catatan patch</label>
            <input
              value={settingsNotes}
              onChange={(e) => setSettingsNotes(e.target.value)}
              placeholder="Catatan singkat tentang patch ini..."
              className="w-full rounded-md border border-[#2D2D2D] bg-[#141414] px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-white/30"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs text-white/50">Deskripsi tier</label>
            <div className="space-y-2">
              {(["SS", "S", "A", "B", "C", "D"] as Tier[]).map((t) => (
                <div key={t} className="flex items-center gap-3">
                  <span className={cn("w-7 shrink-0 text-center text-xs font-bold", TIER_STYLES[t].label)}>{t}</span>
                  <input
                    value={settingsDescriptions[t] ?? ""}
                    onChange={(e) =>
                      setSettingsDescriptions((prev) => ({ ...prev, [t]: e.target.value }))
                    }
                    placeholder={TIER_DESCRIPTIONS_DEFAULT[t]}
                    className="flex-1 rounded-md border border-[#2D2D2D] bg-[#141414] px-3 py-1.5 text-xs text-white placeholder-white/25 outline-none focus:border-white/30"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowPatchSettings(false)}
              className="cursor-pointer rounded-md border border-[#2D2D2D] px-4 py-1.5 text-sm text-white/60 transition hover:bg-white/5"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() => {
                startTransition(async () => {
                  const res = await updatePatchSettingsAction(
                    orgSlug,
                    orgId,
                    activePatch.id,
                    settingsNotes,
                    settingsDescriptions,
                  );
                  if (res.ok) {
                    setActivePatch((prev) =>
                      prev
                        ? {
                            ...prev,
                            notes: settingsNotes.trim() || null,
                            tier_descriptions:
                              Object.keys(settingsDescriptions).length > 0
                                ? settingsDescriptions
                                : null,
                          }
                        : prev,
                    );
                    setShowPatchSettings(false);
                    toast.success("Pengaturan patch disimpan");
                  } else {
                    toast.error(res.message);
                  }
                });
              }}
              disabled={pending}
              className="cursor-pointer rounded-md bg-yellow-400 px-4 py-1.5 text-sm font-semibold text-black transition hover:bg-yellow-300 disabled:opacity-50"
            >
              {pending ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </div>
      )}

      {!activePatch ? (
        <div className="rounded-xl border border-dashed border-white/10 bg-zinc-900/30 p-10 text-center">
          <p className="text-sm text-white/50">
            Belum ada patch.
            {canEdit && " Klik \"Patch Baru\" untuk mulai tracking meta."}
          </p>
        </div>
      ) : (
        <>
          {activePatch.notes && (
            <p className="text-xs italic text-white/50">{activePatch.notes}</p>
          )}

          {/* Tab navigation */}
          <div className="print-hide flex gap-1 border-b border-[#2D2D2D]">
            {(["tier", "ban", "learn"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  setActiveTab(tab);
                  setRoleFilter("all");
                  setClassFilter("all");
                }}
                className={cn(
                  "-mb-px cursor-pointer border-b-2 px-4 py-2 text-sm transition",
                  activeTab === tab
                    ? "border-yellow-400 text-yellow-400"
                    : "border-transparent text-white/50 hover:text-white/80",
                )}
              >
                {tab === "tier" && "Tier List"}
                {tab === "ban" && `Ban Priority${banHeroes.length > 0 ? ` (${banHeroes.length})` : ""}`}
                {tab === "learn" && `Priority to Learn${learnHeroes.length > 0 ? ` (${learnHeroes.length})` : ""}`}
              </button>
            ))}
          </div>

          {/* ── Tier List tab ─────────────────────────────────────── */}
          {activeTab === "tier" && (
            <div className="space-y-4">
              {/* Filter bars */}
              <div className="print-hide space-y-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs text-white/40">Lane:</span>
                  {ROLE_FILTERS.map((rf) => (
                    <button
                      key={rf.value}
                      type="button"
                      onClick={() => setRoleFilter(rf.value)}
                      className={cn(
                        "cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition",
                        roleFilter === rf.value
                          ? "border-yellow-500/50 bg-yellow-500/10 text-yellow-400"
                          : "border-[#2D2D2D] text-white/40 hover:border-white/20 hover:text-white/70",
                      )}
                    >
                      {rf.label}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs text-white/40">Role:</span>
                  {CLASS_FILTERS.map((cf) => (
                    <button
                      key={cf.value}
                      type="button"
                      onClick={() => setClassFilter(cf.value)}
                      className={cn(
                        "cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition",
                        classFilter === cf.value
                          ? cf.color
                          : "border-[#2D2D2D] text-white/40 hover:border-white/20 hover:text-white/70",
                      )}
                    >
                      {cf.label}
                    </button>
                  ))}
                </div>
                {/* Active filter indicator */}
                {(roleFilter !== "all" || classFilter !== "all") && (
                  <div className="flex items-center gap-2 pt-0.5">
                    <span className="text-[10px] text-white/30">
                      {filteredHeroes.length} hero ditampilkan
                      {roleFilter !== "all" && classFilter !== "all" && " (2 filter aktif)"}
                    </span>
                    <button
                      type="button"
                      onClick={() => { setRoleFilter("all"); setClassFilter("all"); }}
                      className="cursor-pointer text-[10px] text-white/30 underline hover:text-white/60"
                    >
                      Reset filter
                    </button>
                  </div>
                )}
              </div>

              {/* Tier rows */}
              <div className="space-y-3">
                {TIERS.map((tier) => {
                  const style = TIER_STYLES[tier];
                  const tierHeroes = filteredHeroes.filter((h) => h.tier === tier);
                  const totalInTier = heroes.filter((h) => h.tier === tier).length;
                  const isOpen = expandedTier === tier;

                  if (roleFilter !== "all" && tierHeroes.length === 0) return null;

                  return (
                    <div key={tier} className={cn("rounded-xl border p-4", style.bg, style.border)}>
                      <div className="flex items-start gap-4">
                        {/* Tier badge + count + description */}
                        <div className="flex shrink-0 flex-col items-center gap-1">
                          <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg text-xl font-black", style.badge)}>
                            {tier}
                          </div>
                          <span className="text-[9px] text-white/30">
                            {roleFilter === "all" ? totalInTier : `${tierHeroes.length}/${totalInTier}`}
                          </span>
                          <span className="mt-0.5 hidden max-w-[80px] text-center text-[8px] italic leading-tight text-white/25 sm:block">
                            {(activePatch?.tier_descriptions as Record<string, string> | null)?.[tier] ?? TIER_DESCRIPTIONS_DEFAULT[tier]}
                          </span>
                        </div>

                        {/* Heroes + Tambah toggle */}
                        <div className="flex flex-1 flex-wrap items-center gap-3">
                          {tierHeroes.map((h) => (
                            <HeroCard
                              key={h.id}
                              hero={h}
                              editMode={editMode}
                              onEdit={openEditModal}
                              onDelete={handleDelete}
                              onDetail={setDetailHero}
                              pendingDeleteId={confirmDeleteHeroId}
                            />
                          ))}
                          {tierHeroes.length === 0 && !editMode && (
                            <span className="self-center text-xs italic text-white/20">Belum ada hero</span>
                          )}
                          {editMode && roleFilter === "all" && (
                            <button
                              type="button"
                              onClick={() => setExpandedTier(isOpen ? null : tier)}
                              className={cn(
                                "print-hide inline-flex h-[72px] w-[72px] shrink-0 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed transition",
                                isOpen
                                  ? `${style.activeBorder} bg-white/5 ${style.label}`
                                  : "border-white/10 text-white/30 hover:border-white/30 hover:text-white/60",
                              )}
                            >
                              {isOpen ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                              <span className="text-[9px]">{isOpen ? "Tutup" : "Tambah"}</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Inline picker */}
                      {isOpen && editMode && activePatch && (
                        <div className="print-hide">
                        <HeroPickerPanel
                          tier={tier}
                          orgSlug={orgSlug}
                          orgId={orgId}
                          patchId={activePatch.id}
                          existingHeroNames={existingHeroNames}
                          onAdd={handlePickerAdd}
                          style={style}
                        />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {editMode && canEdit && (
                <div className="print-hide flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleDeletePatch}
                    disabled={pending}
                    onBlur={() => setConfirmDeletePatch(false)}
                    className={`inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5 text-xs transition disabled:opacity-50 ${
                      confirmDeletePatch
                        ? "border-red-500/50 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                        : "border-red-500/20 text-red-400 hover:bg-red-500/10"
                    }`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {confirmDeletePatch ? "Yakin hapus?" : `Hapus Patch ${activePatch.patch_version}`}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Ban Priority tab ──────────────────────────────────── */}
          {activeTab === "ban" && (
            <div>
              {banHeroes.length === 0 ? (
                <p className="py-8 text-center text-sm text-white/40">
                  Belum ada hero yang ditandai sebagai ban priority.
                  {canEdit && " Tandai hero di Tier List dengan flag Ban Priority."}
                </p>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {banHeroes.map((h) => {
                    const style = TIER_STYLES[h.tier];
                    return (
                      <div key={h.id} className="group relative w-[72px] shrink-0 cursor-pointer select-none" onClick={() => setDetailHero(h)}>
                        <div className={cn("relative aspect-square w-full overflow-hidden rounded-xl border-2 transition group-hover:scale-105", style.border)}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={getHeroImageUrl(h.hero_name)} alt={h.hero_name} className="h-full w-full object-cover" />
                          <div className="absolute left-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 shadow-md">
                            <Shield className="h-2.5 w-2.5 text-white" />
                          </div>
                          <div className={cn("absolute bottom-1 right-1 flex h-4 min-w-4 items-center justify-center rounded px-1 text-[8px] font-black shadow", style.badge)}>
                            {h.tier}
                          </div>
                        </div>
                        <p className="mt-1.5 truncate px-0.5 text-center text-[10px] font-medium leading-tight text-white/75">{h.hero_name}</p>
                        {h.role_tag && (
                          <div className="mt-0.5 flex justify-center">
                            <span className={cn("rounded-sm px-1 py-0.5 text-[7px] font-bold leading-none", ROLE_COLORS[h.role_tag], ROLE_BG[h.role_tag])}>
                              {ROLE_LABELS[h.role_tag]}
                            </span>
                          </div>
                        )}
                        {h.notes && (
                          <div className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 -translate-x-1/2 whitespace-nowrap rounded border border-white/10 bg-black/95 px-2 py-1.5 text-[9px] italic text-white/50 opacity-0 shadow-lg transition group-hover:opacity-100">
                            {h.notes}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Priority to Learn tab ─────────────────────────────── */}
          {activeTab === "learn" && (
            <div className="space-y-5">
              {learnHeroes.length === 0 ? (
                <p className="py-8 text-center text-sm text-white/40">
                  Belum ada hero yang ditandai sebagai priority to learn.
                  {canEdit && " Tandai hero di Tier List dengan flag Priority to Learn."}
                </p>
              ) : (
                (Object.entries(learnByRole) as [RoleKey, MetaHeroRating[]][]).map(([role, roleHeroes]) => {
                  if (roleHeroes.length === 0) return null;
                  const label = role === "untagged" ? "Tanpa Lane" : (ROLE_DISPLAY[role] ?? role);
                  const color = role === "untagged" ? "text-white/60" : (ROLE_COLORS[role] ?? "text-white/60");
                  return (
                    <div key={role} className="space-y-3">
                      <p className={cn("text-xs font-semibold uppercase tracking-wide", color)}>{label}</p>
                      <div className="flex flex-wrap gap-3">
                        {roleHeroes.map((h) => {
                          const style = TIER_STYLES[h.tier];
                          return (
                            <div key={h.id} className="group relative w-[72px] shrink-0 cursor-pointer select-none" onClick={() => setDetailHero(h)}>
                              <div className={cn("relative aspect-square w-full overflow-hidden rounded-xl border-2 transition group-hover:scale-105", style.border)}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={getHeroImageUrl(h.hero_name)} alt={h.hero_name} className="h-full w-full object-cover" />
                                <div className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-yellow-500 shadow-md">
                                  <Star className="h-2.5 w-2.5 fill-black text-black" />
                                </div>
                                <div className={cn("absolute bottom-1 right-1 flex h-4 min-w-4 items-center justify-center rounded px-1 text-[8px] font-black shadow", style.badge)}>
                                  {h.tier}
                                </div>
                              </div>
                              <p className="mt-1.5 truncate px-0.5 text-center text-[10px] font-medium leading-tight text-white/75">{h.hero_name}</p>
                              {h.role_tag && (
                                <div className="mt-0.5 flex justify-center">
                                  <span className={cn("rounded-sm px-1 py-0.5 text-[7px] font-bold leading-none", ROLE_COLORS[h.role_tag], ROLE_BG[h.role_tag])}>
                                    {ROLE_LABELS[h.role_tag]}
                                  </span>
                                </div>
                              )}
                              {h.notes && (
                                <div className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 -translate-x-1/2 whitespace-nowrap rounded border border-white/10 bg-black/95 px-2 py-1.5 text-[9px] italic text-white/50 opacity-0 shadow-lg transition group-hover:opacity-100">
                                  {h.notes}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </>
      )}

      {/* Edit hero modal (role, tier, flags, notes) */}
      <AddHeroModal
        open={modalOpen}
        onClose={handleModalClose}
        orgSlug={orgSlug}
        orgId={orgId}
        patchId={activePatch?.id ?? ""}
        existingHeroes={existingHeroNames}
        editing={editingHero}
        defaultTier="B"
      />

      {detailHero && (
        <HeroDetailPanel
          hero={detailHero}
          allHeroes={heroes}
          onClose={() => setDetailHero(null)}
        />
      )}
    </div>
  );
}
