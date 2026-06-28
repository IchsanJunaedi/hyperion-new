"use client";
 
import { Check, CheckCircle2, GitCommit, Loader2, Pencil, Play, Plus, Trash2, X } from "lucide-react";
import { useState, useTransition } from "react";
 
import { ConfirmDeleteDialog } from "@/features/dashboard/components/ConfirmDeleteDialog";
import { useNotify } from "@/features/dashboard/components/NotifyModal";
import {
  createMetaPatchAction,
  activatePatchAction,
  deleteMetaPatchAction,
  updateMetaPatchAction,
} from "@/features/meta/actions";
import type { MetaPatch } from "@/features/meta/queries";
 
interface PatchManagerClientProps {
  orgSlug: string;
  orgId: string;
  initialPatches: MetaPatch[];
  isManager: boolean;
}
 
const PatchManagerClient = ({
  orgSlug,
  orgId,
  initialPatches,
  isManager,
}: PatchManagerClientProps) => {
  const [patches] = useState<MetaPatch[]>(initialPatches);
  const [patchVersion, setPatchVersion] = useState("");
  const [season, setSeason] = useState("");
  const [notes, setNotes] = useState("");
  const [pending, startTransition] = useTransition();
  const { success, error } = useNotify();
 
  // Delete Dialog state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedPatch, setSelectedPatch] = useState<MetaPatch | null>(null);
 
  // Edit state
  const [editingPatchId, setEditingPatchId] = useState<string | null>(null);
  const [editVersion, setEditVersion] = useState("");
  const [editSeason, setEditSeason] = useState("");
  const [editNotes, setEditNotes] = useState("");
 
  function handleCreate() {
    if (!patchVersion.trim() || !season.trim()) return;
 
    startTransition(async () => {
      const res = await createMetaPatchAction(
        orgSlug,
        orgId,
        patchVersion,
        season,
        notes || undefined
      );
 
      if (res.ok) {
        success("Patch berhasil ditambahkan dan diaktifkan!");
        setPatchVersion("");
        setSeason("");
        setNotes("");
        window.location.reload();
      } else {
        error(res.message);
      }
    });
  }
 
  function handleActivate(patchId: string, version: string) {
    startTransition(async () => {
      const res = await activatePatchAction(orgSlug, orgId, patchId);
      if (res.ok) {
        success(`Patch ${version} sekarang aktif!`);
        window.location.reload();
      } else {
        error(res.message);
      }
    });
  }
 
  function handleDeleteConfirm() {
    if (!selectedPatch) return;
 
    startTransition(async () => {
      const res = await deleteMetaPatchAction(orgSlug, orgId, selectedPatch.id);
      if (res.ok) {
        success(`Patch ${selectedPatch.patch_version} berhasil dihapus!`);
        setShowDeleteConfirm(false);
        setSelectedPatch(null);
        window.location.reload();
      } else {
        error(res.message);
      }
    });
  }
 
  function handleStartEdit(patch: MetaPatch) {
    setEditingPatchId(patch.id);
    setEditVersion(patch.patch_version);
    setEditSeason(patch.season);
    setEditNotes(patch.notes || "");
  }
 
  function handleCancelEdit() {
    setEditingPatchId(null);
  }
 
  function handleSaveEdit(patchId: string) {
    if (!editVersion.trim() || !editSeason.trim()) return;
 
    startTransition(async () => {
      const res = await updateMetaPatchAction(
        orgSlug,
        orgId,
        patchId,
        editVersion,
        editSeason,
        editNotes || undefined
      );
 
      if (res.ok) {
        success("Patch berhasil diperbarui!");
        setEditingPatchId(null);
        window.location.reload();
      } else {
        error(res.message);
      }
    });
  }
 
  return (
    <div className="space-y-6 max-w-5xl mx-auto w-full">
      <div>
        <h1 className="text-2xl font-bold text-ui-text sm:text-3xl tracking-tight">Kelola Patch</h1>
        <p className="text-xs text-ui-text-muted mt-1">
          Daftarkan versi patch game dan season yang aktif. Perubahan patch akan secara otomatis memengaruhi data Scrim, Turnamen, Meta, dan visualisasi Analytics.
        </p>
      </div>
 
      {isManager && (
        <div className="rounded-2xl border border-ui-border bg-ui-surface/40 p-5 sm:p-6 w-full shadow-xl shadow-black/20 space-y-4">
          <h2 className="text-sm font-semibold text-ui-text flex items-center gap-2">
            <Plus className="h-4 w-4 text-yellow-400" />
            Buat Patch Baru
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs text-ui-text-2 mb-1.5 block">Versi Patch *</label>
              <input
                value={patchVersion}
                onChange={(e) => setPatchVersion(e.target.value)}
                placeholder="misal: 2.1.88.1202.1"
                className="h-10 w-full rounded-lg border border-ui-border bg-ui-bg/40 px-3 text-sm text-ui-text focus:border-yellow-400/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-ui-text-2 mb-1.5 block">Season *</label>
              <input
                value={season}
                onChange={(e) => setSeason(e.target.value)}
                placeholder="misal: Season 41"
                className="h-10 w-full rounded-lg border border-ui-border bg-ui-bg/40 px-3 text-sm text-ui-text focus:border-yellow-400/50 focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-ui-text-2 mb-1.5 block">Catatan (opsional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan perubahan patch..."
              rows={2}
              className="w-full rounded-lg border border-ui-border bg-ui-bg/40 px-3 py-2 text-sm text-ui-text focus:border-yellow-400/50 focus:outline-none resize-none"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              disabled={pending || !patchVersion.trim() || !season.trim()}
              onClick={handleCreate}
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-yellow-400 px-4 text-xs font-semibold text-black hover:bg-yellow-300 disabled:opacity-50 cursor-pointer"
            >
              {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              Buat & Aktifkan
            </button>
          </div>
        </div>
      )}
 
      {/* Patches List */}
      <div className="rounded-2xl border border-ui-border bg-ui-surface/40 p-5 sm:p-6 w-full shadow-xl shadow-black/20 space-y-4">
        <h2 className="text-sm font-semibold text-ui-text flex items-center gap-2">
          <GitCommit className="h-4 w-4 text-yellow-400" />
          Daftar Patch Terdaftar
        </h2>
 
        {patches.length === 0 ? (
          <p className="text-xs text-ui-text-muted">Belum ada patch terdaftar.</p>
        ) : (
          <div className="space-y-2.5">
            {/* Table Header using CSS Grid */}
            <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr] gap-3 px-3 py-2 text-[10px] uppercase font-bold tracking-widest text-ui-text-muted border-b border-ui-border">
              <div>Patch & Season</div>
              <div>Tanggal Dibuat</div>
              <div>Status</div>
              <div className="text-right">Aksi</div>
            </div>
 
            {/* Table Rows */}
            {patches.map((p) => {
              const formattedDate = new Date(p.created_at).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric",
                timeZone: "Asia/Jakarta",
              });
 
              const isEditing = editingPatchId === p.id;
 
              if (isEditing) {
                return (
                  <div
                    key={p.id}
                    className="grid grid-cols-[1.5fr_1fr_1fr_1fr] gap-3 items-center px-3 py-3 rounded-lg border border-yellow-400/30 bg-ui-surface/60 animate-in fade-in duration-200"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <input
                        value={editVersion}
                        onChange={(e) => setEditVersion(e.target.value)}
                        placeholder="Versi patch"
                        className="h-8 w-full rounded border border-ui-border bg-ui-bg px-2 text-xs text-ui-text focus:outline-none focus:border-yellow-400"
                      />
                      <input
                        value={editSeason}
                        onChange={(e) => setEditSeason(e.target.value)}
                        placeholder="Season"
                        className="h-8 w-full rounded border border-ui-border bg-ui-bg px-2 text-xs text-ui-text focus:outline-none focus:border-yellow-400"
                      />
                      <input
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        placeholder="Catatan (opsional)"
                        className="h-8 w-full rounded border border-ui-border bg-ui-bg px-2 text-xs text-ui-text focus:outline-none focus:border-yellow-400"
                      />
                    </div>
                    <div className="text-xs text-ui-text-muted">
                      (Sedang diedit)
                    </div>
                    <div>
                      {p.is_active ? (
                        <span className="inline-flex items-center gap-1 rounded bg-green-500/10 px-2 py-0.5 text-[10px] font-medium text-green-400">
                          <CheckCircle2 className="h-3 w-3" />
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded bg-ui-border px-2 py-0.5 text-[10px] font-medium text-ui-text-muted">
                          Nonaktif
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        disabled={pending || !editVersion.trim() || !editSeason.trim()}
                        onClick={() => handleSaveEdit(p.id)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded bg-green-500/10 text-green-400 hover:bg-green-500 hover:text-black transition cursor-pointer"
                        title="Simpan"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={handleCancelEdit}
                        className="inline-flex h-7 w-7 items-center justify-center rounded border border-ui-border text-ui-text-muted hover:text-red-400 hover:border-red-500/30 transition cursor-pointer"
                        title="Batal"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              }
 
              return (
                <div
                  key={p.id}
                  className="grid grid-cols-[1.5fr_1fr_1fr_1fr] gap-3 items-center px-3 py-3 rounded-lg border border-ui-border bg-ui-bg/25 hover:bg-ui-hover/30 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ui-text truncate">
                      {p.patch_version}
                    </p>
                    <p className="text-[10px] text-ui-text-muted mt-0.5">
                      {p.season}
                    </p>
                    {p.notes && (
                      <p className="text-[11px] text-ui-text-2 mt-1 truncate" title={p.notes}>
                        {p.notes}
                      </p>
                    )}
                  </div>
                  <div className="text-xs text-ui-text-2">
                    {formattedDate}
                  </div>
                  <div>
                    {p.is_active ? (
                      <span className="inline-flex items-center gap-1 rounded bg-green-500/10 px-2 py-0.5 text-[10px] font-medium text-green-400">
                        <CheckCircle2 className="h-3 w-3" />
                        Aktif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded bg-ui-border px-2 py-0.5 text-[10px] font-medium text-ui-text-muted">
                        Nonaktif
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    {isManager && !p.is_active && (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => handleActivate(p.id, p.patch_version)}
                        className="inline-flex h-7 items-center gap-1 rounded bg-yellow-400/10 px-2.5 text-[11px] font-semibold text-yellow-400 hover:bg-yellow-400 hover:text-black transition cursor-pointer"
                        title="Aktifkan patch"
                      >
                        <Play className="h-3 w-3 fill-current" />
                        Aktifkan
                      </button>
                    )}
                    {isManager && (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => handleStartEdit(p)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded border border-ui-border text-ui-text-muted hover:text-yellow-400 hover:border-yellow-500/30 transition cursor-pointer"
                        title="Edit patch"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {isManager && (
                      <button
                        type="button"
                        disabled={pending || p.is_active}
                        onClick={() => {
                          setSelectedPatch(p);
                          setShowDeleteConfirm(true);
                        }}
                        className="inline-flex h-7 w-7 items-center justify-center rounded border border-ui-border text-ui-text-muted hover:text-red-400 hover:border-red-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        title="Hapus patch"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
 
      {/* Delete Confirmation */}
      {showDeleteConfirm && selectedPatch && (
        <ConfirmDeleteDialog
          open={showDeleteConfirm}
          onCancel={() => {
            setShowDeleteConfirm(false);
            setSelectedPatch(null);
          }}
          onConfirm={handleDeleteConfirm}
          title="Hapus Patch"
          message={`Apakah Anda yakin ingin menghapus patch "${selectedPatch.patch_version}"? Seluruh data meta yang dikaitkan dengan patch ini juga akan dihapus.`}
          confirmPhrase="HAPUS"
        />
      )}
    </div>
  );
};
 
export { PatchManagerClient };
