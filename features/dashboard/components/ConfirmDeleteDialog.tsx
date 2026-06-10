"use client";

import { Loader2, X } from "lucide-react";
import { useRef, useState } from "react";

interface ConfirmDeleteDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  /** User must type this exact text to enable the final confirm button */
  confirmPhrase?: string;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDeleteDialog = ({
  open,
  title,
  message,
  confirmText = "Hapus",
  confirmPhrase,
  pending = false,
  onConfirm,
  onCancel,
}: ConfirmDeleteDialogProps) => {
  const [typed, setTyped] = useState("");

  // Reset typed text when dialog closes/opens
  const prevOpenRef = useRef(open);
  if (open && !prevOpenRef.current) {
    // Dialog just opened — reset
    setTyped("");
  }
  prevOpenRef.current = open;

  if (!open) return null;

  const canConfirm = confirmPhrase ? typed.trim() === confirmPhrase : true;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-xl border border-white/10 bg-zinc-900 p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-base font-bold text-ui-text">{title}</h3>
          <button onClick={onCancel} className="rounded p-1 text-white/40 hover:bg-white/10 hover:text-ui-text">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mb-4 text-sm text-white/70">{message}</p>
        {confirmPhrase && (
          <div className="mb-4 space-y-1">
            <p className="text-xs text-white/50">
              Ketik <span className="font-mono text-ui-text">{confirmPhrase}</span> untuk konfirmasi:
            </p>
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoFocus
              className="h-9 w-full rounded-md border border-white/10 bg-zinc-900 px-3 text-sm text-white focus:border-red-400 focus:outline-none"
            />
          </div>
        )}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="h-9 rounded-md border border-white/10 px-3 text-xs font-medium text-white/70 hover:bg-white/5"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={!canConfirm || pending}
            onClick={onConfirm}
            className="inline-flex h-9 items-center gap-1 rounded-md bg-red-500 px-3 text-xs font-semibold text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {pending && <Loader2 className="h-3 w-3 animate-spin" />}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
export { ConfirmDeleteDialog };
