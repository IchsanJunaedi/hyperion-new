"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, X, Trash2, Shield, Star } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";
import { getHeroImageUrl } from "@/features/scrim/data/mlbb-heroes";
import { AddHeroModal } from "./AddHeroModal";
import { deleteHeroRatingAction, createMetaPatchAction, deleteMetaPatchAction } from "../actions";
import type { MetaHeroRating, MetaPatch, PatchWithHeroes } from "../queries";

type Tier = "S" | "A" | "B" | "C" | "D";
type RoleFilter = "all" | "exp_lane" | "jungler" | "mid_lane" | "gold_lane" | "roamer";

const TIERS: Tier[] = ["S", "A", "B", "C", "D"];

const TIER_STYLES: Record<Tier, { bg: string; border: string; badge: string; label: string }> = {
  S: { bg: "bg-red-500/5", border: "border-red-500/30", badge: "bg-red-500/20 text-red-400", label: "text-red-400" },
  A: { bg: "bg-orange-500/5", border: "border-orange-500/30", badge: "bg-orange-500/20 text-orange-400", label: "text-orange-400" },
  B: { bg: "bg-yellow-500/5", border: "border-yellow-500/30", badge: "bg-yellow-500/20 text-yellow-400", label: "text-yellow-400" },
  C: { bg: "bg-green-500/5", border: "border-green-500/30", badge: "bg-green-500/20 text-green-400", label: "text-green-400" },
  D: { bg: "bg-blue-500/5", border: "border-blue-500/30", badge: "bg-blue-500/20 text-blue-400", label: "text-blue-400" },
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

function HeroCard({
  hero,
  editMode,
  onEdit,
  onDelete,
}: {
  hero: MetaHeroRating;
  editMode: boolean;
  onEdit: (h: MetaHeroRating) => void;
  onDelete: (id: string, name: string) => void;
}) {
  const style = TIER_STYLES[hero.tier];
  return (
    <div className="group relative w-[72px] shrink-0 select-none">
      {/* Portrait */}
      <div
        className={cn(
          "relative aspect-square w-full overflow-hidden rounded-xl border-2 transition group-hover:scale-105",
          style.border,
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={getHeroImageUrl(hero.hero_name)}
          alt={hero.hero_name}
          className="h-full w-full object-cover"
        />

        {/* Tier badge bottom-left */}
        <div
          className={cn(
            "absolute bottom-1 left-1 flex h-4 min-w-4 items-center justify-center rounded px-1 text-[8px] font-black shadow",
            style.badge,
          )}
        >
          {hero.tier}
        </div>

        {/* Flag badges */}
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

        {/* Edit mode overlay */}
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
              className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-red-500/30 text-red-400 hover:bg-red-500/50"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>

      {/* Hero name */}
      <p className="mt-1.5 truncate px-0.5 text-center text-[10px] font-medium leading-tight text-white/75">
        {hero.hero_name}
      </p>

      {/* Role tag */}
      {hero.role_tag && (
        <div className="mt-0.5 flex justify-center">
          <span
            className={cn(
              "rounded-sm px-1 py-0.5 text-[7px] font-bold leading-none",
              ROLE_COLORS[hero.role_tag],
              ROLE_BG[hero.role_tag],
            )}
          >
            {ROLE_LABELS[hero.role_tag]}
          </span>
        </div>
      )}

      {/* Tooltip on hover */}
      {hero.notes && (
        <div className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 -translate-x-1/2 whitespace-nowrap rounded border border-white/10 bg-black/95 px-2 py-1.5 text-[10px] font-medium text-white opacity-0 shadow-lg transition group-hover:opacity-100">
          <span className="block text-[9px] italic text-white/50">{hero.notes}</span>
        </div>
      )}
    </div>
  );
}

interface MetaPageProps {
  orgSlug: string;
  orgId: string;
  patches: MetaPatch[];
  initialPatch: PatchWithHeroes | null;
  canEdit: boolean;
}

export function MetaPage({ orgSlug, orgId, patches, initialPatch, canEdit }: MetaPageProps) {
  const router = useRouter();
  const [activePatch, setActivePatch] = useState<PatchWithHeroes | null>(initialPatch);
  const [patchList, setPatchList] = useState<MetaPatch[]>(patches);
  const [activeTab, setActiveTab] = useState<"tier" | "ban" | "learn">("tier");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [editMode, setEditMode] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingHero, setEditingHero] = useState<MetaHeroRating | null>(null);
  const [defaultTier, setDefaultTier] = useState<Tier>("B");
  const [showNewPatchForm, setShowNewPatchForm] = useState(false);
  const [newPatchVersion, setNewPatchVersion] = useState("");
  const [newPatchNotes, setNewPatchNotes] = useState("");
  const [pending, startTransition] = useTransition();

  const heroes = activePatch?.heroes ?? [];
  const existingHeroNames = new Set(heroes.map((h) => h.hero_name));

  const filteredHeroes =
    roleFilter === "all" ? heroes : heroes.filter((h) => h.role_tag === roleFilter);

  function openAddModal(tier: Tier) {
    setEditingHero(null);
    setDefaultTier(tier);
    setModalOpen(true);
  }

  function openEditModal(hero: MetaHeroRating) {
    setEditingHero(hero);
    setModalOpen(true);
  }

  function handleDelete(ratingId: string, heroName: string) {
    if (!confirm(`Hapus ${heroName} dari tier list?`)) return;
    startTransition(async () => {
      const res = await deleteHeroRatingAction(orgSlug, orgId, ratingId);
      if (res.ok) {
        setActivePatch((prev) =>
          prev ? { ...prev, heroes: prev.heroes.filter((h) => h.id !== ratingId) } : prev,
        );
        toast.success(`${heroName} dihapus dari tier list`);
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
    if (!confirm(`Hapus patch ${activePatch.patch_version}? Semua hero di patch ini akan ikut terhapus.`)) return;
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

  function handleModalClose() {
    setModalOpen(false);
    router.refresh();
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
          <p className="mt-1 text-sm text-white/50">Tier list hero per patch — dikelola coach</p>
        </div>
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

      {/* Patch selector */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs text-white/50">Patch:</span>
        <div className="flex flex-wrap gap-1.5">
          {patchList.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                const params = new URLSearchParams(window.location.search);
                params.set("patch", p.id);
                window.location.search = params.toString();
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
      </div>

      {/* New patch form */}
      {showNewPatchForm && canEdit && (
        <div className="space-y-3 rounded-xl border border-[#2D2D2D] bg-[#1C1C1C] p-4">
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
          <div className="flex gap-1 border-b border-[#2D2D2D]">
            {(["tier", "ban", "learn"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  setActiveTab(tab);
                  setRoleFilter("all");
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

          {/* Tier List tab */}
          {activeTab === "tier" && (
            <div className="space-y-4">
              {/* Role filter bar */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-white/40">Filter lane:</span>
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

              {/* Tier rows */}
              <div className="space-y-3">
                {TIERS.map((tier) => {
                  const style = TIER_STYLES[tier];
                  const tierHeroes = filteredHeroes.filter((h) => h.tier === tier);
                  const totalInTier = heroes.filter((h) => h.tier === tier).length;

                  if (roleFilter !== "all" && tierHeroes.length === 0) return null;

                  return (
                    <div key={tier} className={cn("rounded-xl border p-4", style.bg, style.border)}>
                      <div className="flex items-start gap-4">
                        {/* Tier badge */}
                        <div className="flex shrink-0 flex-col items-center gap-1">
                          <div
                            className={cn(
                              "flex h-10 w-10 items-center justify-center rounded-lg text-xl font-black",
                              style.badge,
                            )}
                          >
                            {tier}
                          </div>
                          <span className="text-[9px] text-white/30">
                            {roleFilter === "all" ? totalInTier : `${tierHeroes.length}/${totalInTier}`}
                          </span>
                        </div>

                        {/* Heroes */}
                        <div className="flex flex-1 flex-wrap gap-3">
                          {tierHeroes.map((h) => (
                            <HeroCard
                              key={h.id}
                              hero={h}
                              editMode={editMode}
                              onEdit={openEditModal}
                              onDelete={handleDelete}
                            />
                          ))}
                          {tierHeroes.length === 0 && !editMode && (
                            <span className="self-center text-xs italic text-white/20">
                              Belum ada hero
                            </span>
                          )}
                          {editMode && roleFilter === "all" && (
                            <button
                              type="button"
                              onClick={() => openAddModal(tier)}
                              className="inline-flex h-[72px] w-[72px] shrink-0 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-white/10 text-white/30 transition hover:border-white/30 hover:text-white/60"
                            >
                              <Plus className="h-4 w-4" />
                              <span className="text-[9px]">Tambah</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {editMode && canEdit && (
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleDeletePatch}
                    disabled={pending}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-red-500/20 px-3 py-1.5 text-xs text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Hapus Patch {activePatch.patch_version}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Ban Priority tab */}
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
                      <div
                        key={h.id}
                        className="group relative w-[72px] shrink-0 select-none"
                      >
                        <div
                          className={cn(
                            "relative aspect-square w-full overflow-hidden rounded-xl border-2 transition group-hover:scale-105",
                            style.border,
                          )}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={getHeroImageUrl(h.hero_name)}
                            alt={h.hero_name}
                            className="h-full w-full object-cover"
                          />
                          <div className="absolute left-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 shadow-md">
                            <Shield className="h-2.5 w-2.5 text-white" />
                          </div>
                          <div
                            className={cn(
                              "absolute bottom-1 right-1 flex h-4 min-w-4 items-center justify-center rounded px-1 text-[8px] font-black shadow",
                              style.badge,
                            )}
                          >
                            {h.tier}
                          </div>
                        </div>
                        <p className="mt-1.5 truncate px-0.5 text-center text-[10px] font-medium leading-tight text-white/75">
                          {h.hero_name}
                        </p>
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

          {/* Priority to Learn tab */}
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
                            <div
                              key={h.id}
                              className="group relative w-[72px] shrink-0 select-none"
                            >
                              <div
                                className={cn(
                                  "relative aspect-square w-full overflow-hidden rounded-xl border-2 transition group-hover:scale-105",
                                  style.border,
                                )}
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={getHeroImageUrl(h.hero_name)}
                                  alt={h.hero_name}
                                  className="h-full w-full object-cover"
                                />
                                <div className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-yellow-500 shadow-md">
                                  <Star className="h-2.5 w-2.5 fill-black text-black" />
                                </div>
                                <div
                                  className={cn(
                                    "absolute bottom-1 right-1 flex h-4 min-w-4 items-center justify-center rounded px-1 text-[8px] font-black shadow",
                                    style.badge,
                                  )}
                                >
                                  {h.tier}
                                </div>
                              </div>
                              <p className="mt-1.5 truncate px-0.5 text-center text-[10px] font-medium leading-tight text-white/75">
                                {h.hero_name}
                              </p>
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

      {/* Add/Edit hero modal */}
      <AddHeroModal
        open={modalOpen}
        onClose={handleModalClose}
        orgSlug={orgSlug}
        orgId={orgId}
        patchId={activePatch?.id ?? ""}
        existingHeroes={existingHeroNames}
        editing={editingHero}
        defaultTier={defaultTier}
      />
    </div>
  );
}
