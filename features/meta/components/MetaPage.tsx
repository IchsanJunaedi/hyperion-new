"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, X, Trash2, Shield, Star } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";
import { AddHeroModal } from "./AddHeroModal";
import { deleteHeroRatingAction, createMetaPatchAction, deleteMetaPatchAction } from "../actions";
import type { MetaHeroRating, MetaPatch, PatchWithHeroes } from "../queries";

type Tier = "S" | "A" | "B" | "C" | "D";

const TIERS: Tier[] = ["S", "A", "B", "C", "D"];

const TIER_STYLES: Record<Tier, { bg: string; border: string; badge: string }> = {
  S: { bg: "bg-red-500/5", border: "border-red-500/20", badge: "bg-red-500/20 text-red-400" },
  A: { bg: "bg-orange-500/5", border: "border-orange-500/20", badge: "bg-orange-500/20 text-orange-400" },
  B: { bg: "bg-yellow-500/5", border: "border-yellow-500/20", badge: "bg-yellow-500/20 text-yellow-400" },
  C: { bg: "bg-green-500/5", border: "border-green-500/20", badge: "bg-green-500/20 text-green-400" },
  D: { bg: "bg-blue-500/5", border: "border-blue-500/20", badge: "bg-blue-500/20 text-blue-400" },
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

const ROLE_DISPLAY: Record<string, string> = {
  exp_lane: "EXP Lane",
  jungler: "Jungler",
  mid_lane: "Mid Lane",
  gold_lane: "Gold Lane",
  roamer: "Roamer",
};

function HeroChip({
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
    <div
      className={cn(
        "group relative inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition",
        style.bg,
        style.border,
      )}
    >
      {hero.is_ban_priority && (
        <Shield className="h-3 w-3 shrink-0 text-red-400" />
      )}
      {hero.priority_to_learn && (
        <Star className="h-3 w-3 shrink-0 text-yellow-400" />
      )}
      <span className="font-medium text-white/90">{hero.hero_name}</span>
      {hero.role_tag && (
        <span className={cn("font-mono text-[10px]", ROLE_COLORS[hero.role_tag])}>
          {ROLE_LABELS[hero.role_tag]}
        </span>
      )}
      {editMode && (
        <div className="absolute -right-1 -top-1 hidden gap-0.5 group-hover:flex">
          <button
            type="button"
            onClick={() => onEdit(hero)}
            className="grid h-4 w-4 cursor-pointer place-items-center rounded-full bg-[#2D2D2D] text-white/60 hover:text-white"
          >
            <Pencil className="h-2.5 w-2.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(hero.id, hero.hero_name)}
            className="grid h-4 w-4 cursor-pointer place-items-center rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/40"
          >
            <X className="h-2.5 w-2.5" />
          </button>
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
  const [activePatch, setActivePatch] = useState<PatchWithHeroes | null>(initialPatch);
  const [patchList, setPatchList] = useState<MetaPatch[]>(patches);
  const [activeTab, setActiveTab] = useState<"tier" | "ban" | "learn">("tier");
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
    // Reload to show server-revalidated data
    window.location.reload();
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
            <span className="text-xs text-white/30 italic">Belum ada patch</span>
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
                onClick={() => setActiveTab(tab)}
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
            <div className="space-y-3">
              {TIERS.map((tier) => {
                const style = TIER_STYLES[tier];
                const tierHeroes = heroes.filter((h) => h.tier === tier);
                return (
                  <div key={tier} className={cn("rounded-xl border p-4", style.bg, style.border)}>
                    <div className="flex items-start gap-4">
                      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg font-black", style.badge)}>
                        {tier}
                      </div>
                      <div className="flex flex-1 flex-wrap gap-2">
                        {tierHeroes.map((h) => (
                          <HeroChip
                            key={h.id}
                            hero={h}
                            editMode={editMode}
                            onEdit={openEditModal}
                            onDelete={handleDelete}
                          />
                        ))}
                        {tierHeroes.length === 0 && !editMode && (
                          <span className="text-xs italic text-white/20">Belum ada hero</span>
                        )}
                        {editMode && (
                          <button
                            type="button"
                            onClick={() => openAddModal(tier)}
                            className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-dashed border-white/10 px-2.5 py-1.5 text-xs text-white/30 transition hover:border-white/30 hover:text-white/60"
                          >
                            <Plus className="h-3 w-3" />
                            Tambah
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

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
                <div className="flex flex-wrap gap-2">
                  {banHeroes.map((h) => (
                    <div
                      key={h.id}
                      className="inline-flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2"
                    >
                      <Shield className="h-3.5 w-3.5 text-red-400" />
                      <span className="text-sm font-medium text-white/90">{h.hero_name}</span>
                      <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-bold", TIER_STYLES[h.tier].badge)}>
                        {h.tier}
                      </span>
                      {h.notes && (
                        <span className="max-w-[200px] truncate text-xs text-white/40">{h.notes}</span>
                      )}
                    </div>
                  ))}
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
                    <div key={role} className="space-y-2">
                      <p className={cn("text-xs font-semibold uppercase tracking-wide", color)}>{label}</p>
                      <div className="flex flex-wrap gap-2">
                        {roleHeroes.map((h) => (
                          <div
                            key={h.id}
                            className="inline-flex items-center gap-2 rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-3 py-2"
                          >
                            <Star className="h-3.5 w-3.5 text-yellow-400" />
                            <span className="text-sm font-medium text-white/90">{h.hero_name}</span>
                            <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-bold", TIER_STYLES[h.tier].badge)}>
                              {h.tier}
                            </span>
                          </div>
                        ))}
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
