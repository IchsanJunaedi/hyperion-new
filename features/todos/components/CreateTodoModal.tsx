"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useNotify } from "@/features/dashboard/components/NotifyModal";
import { CustomSelect } from "@/features/dashboard/components/CustomSelect";
import { createManualTodoAction } from "../actions";
import type { TodoPriority, Manager } from "../types";

interface Props {
  orgId: string;
  managers: Manager[];
  isOwner: boolean;
  revalidatePaths: string[];
  onClose: () => void;
}

const PRIORITY_OPTIONS = [
  { value: "low", label: "Rendah" },
  { value: "medium", label: "Sedang" },
  { value: "high", label: "Tinggi" },
];

const CreateTodoModal = ({ orgId, managers, isOwner, revalidatePaths, onClose }: Props) => {
  const { success, error: notifyError } = useNotify();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<TodoPriority>("medium");
  const [assignedTo, setAssignedTo] = useState("");

  const assignOptions = [
    { value: "", label: "— Tidak di-assign —" },
    ...managers.map((m) => ({ value: m.user_id, label: m.display_name ?? m.user_id })),
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);

    const result = await createManualTodoAction(
      orgId,
      { title: title.trim(), due_date: dueDate || null, priority, assigned_to: assignedTo || null },
      revalidatePaths,
    );

    setLoading(false);
    if (!result.ok) { notifyError(result.message); return; }
    success("Todo berhasil ditambahkan.");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg border border-ui-border bg-ui-surface p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-semibold text-ui-text-dim">Tambah Todo</h2>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded p-1 text-ui-text-muted transition hover:bg-ui-hover hover:text-ui-text-2"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs text-ui-text-2">Judul *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Apa yang perlu dilakukan?"
              required
              className="w-full rounded border border-ui-border bg-ui-bg px-3 py-2 text-sm text-ui-text placeholder-ui-text-muted focus:border-ui-text-2 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs text-ui-text-2">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded border border-ui-border bg-ui-bg px-3 py-2 text-sm text-ui-text focus:border-ui-text-2 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-ui-text-2">Prioritas</label>
              <CustomSelect
                value={priority}
                options={PRIORITY_OPTIONS}
                onChange={(v) => setPriority(v as TodoPriority)}
              />
            </div>
          </div>

          {isOwner && managers.length > 0 && (
            <div>
              <label className="mb-1.5 block text-xs text-ui-text-2">Assign ke Manager (opsional)</label>
              <CustomSelect
                value={assignedTo}
                options={assignOptions}
                onChange={setAssignedTo}
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded px-4 py-2 text-sm text-ui-text-2 transition hover:bg-ui-hover"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim()}
              className="cursor-pointer rounded bg-ui-text-dim px-4 py-2 text-sm font-medium text-ui-bg transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export { CreateTodoModal };
