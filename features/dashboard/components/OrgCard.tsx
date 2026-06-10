"use client";

import { Loader2, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  updateOrgAction,
  deleteOrgAction,
  addDivisionToOrgAction,
  removeDivisionFromOrgAction,
} from "../actions";
import { ConfirmDeleteDialog } from "./ConfirmDeleteDialog";
import { useNotify } from "./NotifyModal";

interface OrgCardProps {
  org: { id: string; name: string; slug: string };
  divisions: Array<{ id: string; name: string }>;
  allDivisions: Array<{ id: string; name: string; organizationId: string | null }>;
}

const OrgCard = ({ org, divisions, allDivisions }: OrgCardProps) => {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(org.name);
  const [showAddDiv, setShowAddDiv] = useState(false);
  const [selectedDivId, setSelectedDivId] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [removeDivState, setRemoveDivState] = useState<{ id: string; name: string } | null>(null);
  const { success, error: notifyError } = useNotify();

  // Divisions not yet in this org (available to add)
  const availableDivisions = allDivisions.filter(
    (d) => d.organizationId !== org.id && !divisions.some((od) => od.id === d.id),
  );

  function handleSaveName() {
    if (!editName.trim() || editName.trim() === org.name) {
      setEditing(false);
      return;
    }
    startTransition(async () => {
      const res = await updateOrgAction(org.id, { name: editName.trim(), tier: "komunitas", logo_url: null });
      if (res.ok) {
        success("Nama tim diubah");
        setEditing(false);
        router.refresh();
      } else {
        notifyError(res.message);
      }
    });
  }

  function handleDelete() {
    setDeleteOpen(true);
  }

  function handleConfirmDelete() {
    startTransition(async () => {
      const res = await deleteOrgAction(org.id);
      if (res.ok) {
        success("Tim dihapus");
        setDeleteOpen(false);
        router.refresh();
      } else {
        notifyError(res.message);
      }
    });
  }

  function handleAddDivision() {
    if (!selectedDivId) return;
    startTransition(async () => {
      const res = await addDivisionToOrgAction(selectedDivId, org.id);
      if (res.ok) {
        success("Divisi ditambahkan ke tim");
        setSelectedDivId("");
        setShowAddDiv(false);
        router.refresh();
      } else {
        notifyError(res.message);
      }
    });
  }

  function handleRemoveDivision(divId: string, divName: string) {
    setRemoveDivState({ id: divId, name: divName });
  }

  function handleConfirmRemoveDivision() {
    if (!removeDivState) return;
    const { id: divId, name: divName } = removeDivState;
    startTransition(async () => {
      const res = await removeDivisionFromOrgAction(divId, org.id);
      if (res.ok) {
        success(`Divisi "${divName}" dihapus dari tim`);
        setRemoveDivState(null);
        router.refresh();
      } else {
        notifyError(res.message);
      }
    });
  }

  return (
    <div className="rounded-xl border border-ui-border bg-ui-surface/40 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        {editing ? (
          <div className="flex items-center gap-1 flex-1 mr-2">
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="h-8 flex-1 rounded border border-ui-border bg-ui-surface px-2 text-sm font-semibold text-ui-text focus:border-yellow-400 focus:outline-none"
              autoFocus
              onKeyDown={(e) => { if (e.key === "Enter") handleSaveName(); if (e.key === "Escape") setEditing(false); }}
            />
            <button onClick={handleSaveName} disabled={pending} className="p-1 text-green-400 hover:bg-ui-hover rounded">
              <Save className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => { setEditing(false); setEditName(org.name); }} className="p-1 text-ui-text-muted hover:bg-ui-hover rounded">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-ui-text">{org.name}</h3>
            <span className="text-xs text-ui-text-muted">/{org.slug}</span>
          </div>
        )}
        {!editing && (
          <div className="flex gap-1">
            <button onClick={() => setEditing(true)} className="p-1.5 text-ui-text-muted hover:bg-ui-hover hover:text-ui-text rounded-md" title="Edit nama">
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button onClick={handleDelete} disabled={pending} className="p-1.5 text-ui-text-muted hover:bg-ui-hover hover:text-red-400 rounded-md" title="Hapus tim">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Divisions in this org */}
      <div className="space-y-1.5">
        <p className="text-xs text-ui-text-2">Divisi:</p>
        {divisions.length === 0 ? (
          <p className="text-xs text-ui-text-muted italic">Belum ada divisi</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {divisions.map((div) => (
              <span key={div.id} className="inline-flex items-center gap-1 rounded-full bg-ui-elevated px-2.5 py-1 text-xs text-ui-text">
                {div.name}
                <button
                  onClick={() => handleRemoveDivision(div.id, div.name)}
                  disabled={pending}
                  className="text-ui-text-muted hover:text-red-400"
                  title="Hapus dari tim"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Add division */}
        {showAddDiv ? (
          <div className="flex items-center gap-2 mt-2">
            <select
              value={selectedDivId}
              onChange={(e) => setSelectedDivId(e.target.value)}
              className="h-8 flex-1 rounded border border-ui-border bg-ui-surface px-2 text-xs text-ui-text focus:border-yellow-400 focus:outline-none"
            >
              <option value="">Pilih divisi...</option>
              {availableDivisions.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            <button onClick={handleAddDivision} disabled={pending || !selectedDivId} className="h-8 rounded bg-yellow-400 px-2 text-xs font-semibold text-black disabled:opacity-50">
              {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Tambah"}
            </button>
            <button onClick={() => setShowAddDiv(false)} className="p-1 text-ui-text-muted hover:text-ui-text">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowAddDiv(true)}
            className="inline-flex items-center gap-1 text-xs text-yellow-400 hover:text-yellow-300 mt-1"
          >
            <Plus className="h-3 w-3" />
            Tambah divisi
          </button>
        )}
      </div>
      <ConfirmDeleteDialog
        open={deleteOpen}
        title="Hapus Tim"
        message={`Yakin hapus tim "${org.name}"? Semua data tim termasuk divisi dan member akan hilang permanen.`}
        confirmPhrase="HAPUS"
        pending={pending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteOpen(false)}
      />
      <ConfirmDeleteDialog
        open={removeDivState !== null}
        title="Hapus Divisi dari Tim"
        message={`Yakin hapus divisi "${removeDivState?.name}" dari tim ini? Divisi akan diarsipkan.`}
        confirmText="Hapus"
        pending={pending}
        onConfirm={handleConfirmRemoveDivision}
        onCancel={() => setRemoveDivState(null)}
      />
    </div>
  );
};
export { OrgCard };
