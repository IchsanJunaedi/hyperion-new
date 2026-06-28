"use client";

import { Loader2, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { removeMemberAction, updateOrgAction, renameDivisionAction, deleteDivisionAction, addDivisionToOrgAction } from "../actions";
import { ConfirmDeleteDialog } from "./ConfirmDeleteDialog";
import { useNotify } from "./NotifyModal";

interface ManagerRow {
  memberId: string;
  managerName: string;
  orgId: string;
  orgName: string;
  divisions: Array<{ id: string; name: string }>;
}

interface ManagerTimDivisiTableProps {
  rows: ManagerRow[];
  allDivisions?: Array<{ id: string; name: string; organizationId: string | null }>;
}

const ManagerTimDivisiTable = ({ rows, allDivisions = [] }: ManagerTimDivisiTableProps) => {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [deleteTarget, setDeleteTarget] = useState<ManagerRow | null>(null);
  const [editingOrg, setEditingOrg] = useState<{ id: string; name: string } | null>(null);
  const [editName, setEditName] = useState("");
  const [editingDiv, setEditingDiv] = useState<{ id: string; name: string } | null>(null);
  const [editDivName, setEditDivName] = useState("");
  const [deleteDivTarget, setDeleteDivTarget] = useState<{ id: string; name: string } | null>(null);
  const [addDivOrgId, setAddDivOrgId] = useState<string | null>(null);
  const [selectedAddDiv, setSelectedAddDiv] = useState("");
  const { success, error: notifyError } = useNotify();

  function handleConfirmDelete() {
    if (!deleteTarget) return;
    startTransition(async () => {
      const res = await removeMemberAction(deleteTarget.memberId);
      if (res.ok) {
        success(`${deleteTarget.managerName} dihapus dari ${deleteTarget.orgName}`);
        setDeleteTarget(null);
        router.refresh();
      } else {
        notifyError(res.message);
      }
    });
  }

  function startEditOrg(orgId: string, orgName: string) {
    setEditingOrg({ id: orgId, name: orgName });
    setEditName(orgName);
  }

  function handleSaveOrg() {
    if (!editingOrg || !editName.trim() || editName.trim() === editingOrg.name) {
      setEditingOrg(null);
      return;
    }
    startTransition(async () => {
      const res = await updateOrgAction(editingOrg.id, {
        name: editName.trim(),
        tier: "komunitas",
        logo_url: null,
      });
      if (res.ok) {
        success("Nama tim diubah");
        setEditingOrg(null);
        router.refresh();
      } else {
        notifyError(res.message);
      }
    });
  }

  function startEditDiv(divId: string, divName: string) {
    setEditingDiv({ id: divId, name: divName });
    setEditDivName(divName);
  }

  function handleSaveDiv() {
    if (!editingDiv || !editDivName.trim() || editDivName.trim() === editingDiv.name) {
      setEditingDiv(null);
      return;
    }
    startTransition(async () => {
      const res = await renameDivisionAction(editingDiv.id, editDivName.trim());
      if (res.ok) {
        success("Divisi diubah");
        setEditingDiv(null);
        router.refresh();
      } else {
        notifyError(res.message);
      }
    });
  }

  function handleConfirmDeleteDiv() {
    if (!deleteDivTarget) return;
    startTransition(async () => {
      const res = await deleteDivisionAction(deleteDivTarget.id);
      if (res.ok) {
        success(`Divisi "${deleteDivTarget.name}" dihapus`);
        setDeleteDivTarget(null);
        router.refresh();
      } else {
        notifyError(res.message);
      }
    });
  }

  function handleAddDivToOrg(orgId: string) {
    if (!selectedAddDiv) return;
    startTransition(async () => {
      const res = await addDivisionToOrgAction(selectedAddDiv, orgId);
      if (res.ok) {
        success("Divisi ditambahkan ke tim");
        setAddDivOrgId(null);
        setSelectedAddDiv("");
        router.refresh();
      } else {
        notifyError(res.message);
      }
    });
  }

  if (rows.length === 0) {
    return (
      <p className="py-3 px-3 text-sm text-ui-text-muted">
        Belum ada Manager yang di-assign.
      </p>
    );
  }

  return (
    <>
      <div className="overflow-x-auto w-full">
      <div className="flex flex-col min-w-[480px]">
        {rows.map((r) => (
          <div
            key={r.memberId}
            className="grid grid-cols-[200px_1fr_1fr_32px] items-center py-2 px-3 -mx-3 hover:bg-ui-hover rounded transition-colors gap-4 group"
          >
            {/* Manager name */}
            <span className="text-sm text-ui-text-dim truncate">{r.managerName}</span>

            {/* Org name — editable */}
            {editingOrg?.id === r.orgId ? (
              <div className="flex-1 flex items-center gap-1">
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-6 flex-1 rounded border border-ui-border bg-ui-bg px-2 text-xs text-ui-text focus:border-ui-text-dim focus:outline-none"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveOrg();
                    if (e.key === "Escape") setEditingOrg(null);
                  }}
                />
                <button onClick={handleSaveOrg} disabled={pending} className="p-0.5 text-green-400 hover:bg-ui-hover-strong rounded">
                  <Save className="h-3 w-3" />
                </button>
                <button onClick={() => setEditingOrg(null)} className="p-0.5 text-ui-text-2 hover:bg-ui-hover-strong rounded">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <span
                className="flex-1 text-sm text-ui-text-2 truncate cursor-pointer hover:text-ui-text-dim group/org"
                onClick={() => startEditOrg(r.orgId, r.orgName)}
                title="Klik untuk edit nama tim"
              >
                {r.orgName}
                <Pencil className="h-2.5 w-2.5 inline ml-1 opacity-0 group-hover:opacity-50" />
              </span>
            )}

            {/* Divisions — editable */}
            <div className="flex-1 flex flex-wrap gap-1 items-center">
              {r.divisions.length === 0 && addDivOrgId !== r.orgId ? (
                <button
                  type="button"
                  onClick={() => { setAddDivOrgId(r.orgId); setSelectedAddDiv(""); }}
                  className="text-xs text-ui-text-muted hover:text-ui-text-dim transition-colors"
                >
                  + Tambah divisi
                </button>
              ) : r.divisions.length === 0 && addDivOrgId === r.orgId ? (
                <div className="flex items-center gap-1">
                  <select
                    value={selectedAddDiv}
                    onChange={(e) => setSelectedAddDiv(e.target.value)}
                    className="h-6 rounded border border-ui-border bg-ui-bg px-1 text-[11px] text-ui-text focus:outline-none"
                  >
                    <option value="">Pilih...</option>
                    {allDivisions
                      .filter((d) => d.organizationId !== r.orgId)
                      .filter((d, i, arr) => arr.findIndex((x) => x.name === d.name) === i)
                      .map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                  </select>
                  <button
                    onClick={() => handleAddDivToOrg(r.orgId)}
                    disabled={pending || !selectedAddDiv}
                    className="text-[11px] text-green-400 disabled:opacity-40"
                  >
                    OK
                  </button>
                  <button onClick={() => setAddDivOrgId(null)} className="text-[11px] text-ui-text-2">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                r.divisions.map((div) =>
                  editingDiv?.id === div.id ? (
                    <div key={div.id} className="flex items-center gap-0.5">
                      <input
                        value={editDivName}
                        onChange={(e) => setEditDivName(e.target.value)}
                        className="h-5 w-20 rounded border border-ui-border bg-ui-bg px-1 text-[11px] text-ui-text focus:border-ui-text-dim focus:outline-none"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveDiv();
                          if (e.key === "Escape") setEditingDiv(null);
                        }}
                      />
                      <button onClick={handleSaveDiv} disabled={pending} className="p-0.5 text-green-400">
                        <Save className="h-2.5 w-2.5" />
                      </button>
                      <button onClick={() => setEditingDiv(null)} className="p-0.5 text-ui-text-2">
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  ) : (
                    <span
                      key={div.id}
                      className="inline-flex items-center gap-0.5 rounded bg-ui-hover px-1.5 py-0.5 text-[11px] text-ui-text-2 cursor-pointer hover:text-ui-text-dim group/div"
                      onClick={() => startEditDiv(div.id, div.name)}
                    >
                      {div.name}
                      <Trash2
                        className="h-2.5 w-2.5 opacity-0 group-hover/div:opacity-100 text-red-400 ml-0.5"
                        onClick={(e) => { e.stopPropagation(); setDeleteDivTarget(div); }}
                      />
                    </span>
                  ),
                )
              )}
            </div>

            {/* Delete */}
            <button
              type="button"
              disabled={pending}
              onClick={() => setDeleteTarget(r)}
              className="opacity-0 group-hover:opacity-100 rounded p-1 text-ui-text-2 hover:text-red-400 hover:bg-ui-hover-strong transition-all disabled:opacity-40"
              title="Hapus manager dari tim"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
      </div>

      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        title="Hapus Manager"
        message={`Yakin hapus ${deleteTarget?.managerName} sebagai manager dari ${deleteTarget?.orgName}? Manager akan kehilangan akses ke panel manage untuk tim ini.`}
        confirmPhrase="HAPUS"
        pending={pending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
      <ConfirmDeleteDialog
        open={deleteDivTarget !== null}
        title="Hapus Divisi"
        message={`Yakin hapus divisi "${deleteDivTarget?.name}"? Member di divisi ini akan kehilangan assignment divisi.`}
        confirmPhrase="HAPUS"
        pending={pending}
        onConfirm={handleConfirmDeleteDiv}
        onCancel={() => setDeleteDivTarget(null)}
      />
    </>
  );
};
export { ManagerTimDivisiTable };
