"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { cancelScrimAction } from "@/features/scrim/actions";

interface CancelScrimButtonProps {
  scrimId: string;
  orgSlug: string;
}

const CancelScrimButton = ({ scrimId, orgSlug }: CancelScrimButtonProps) => {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showDialog, setShowDialog] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleCancel() {
    setShowDialog(false);
    setReason("");
    setError(null);
  }

  function handleConfirm() {
    startTransition(async () => {
      setError(null);
      const res = await cancelScrimAction(orgSlug, {
        scrim_id: scrimId,
        reason: reason.trim() || undefined,
      });
      if (!res.ok) {
        setError(res.message);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setShowDialog(true)}
        className="rounded-md border border-white/10 px-3 py-1.5 text-sm text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30 transition-colors"
      >
        Batalkan Scrim
      </button>

      {showDialog && (
        <div className="mt-3 rounded-lg border border-white/10 bg-zinc-900/60 p-4 space-y-3">
          <p className="text-sm text-ui-text">Yakin batalkan scrim ini?</p>

          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={500}
            placeholder="Alasan pembatalan (opsional)"
            rows={3}
            className="w-full rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-white/30 focus:border-yellow-400 focus:outline-none resize-none"
          />

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleConfirm}
              disabled={pending}
              className="inline-flex items-center gap-1.5 rounded-md bg-rose-600 hover:bg-rose-500 disabled:opacity-60 px-3 py-1.5 text-sm font-semibold text-white transition-colors"
            >
              {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Ya, batalkan
            </button>

            <button
              type="button"
              onClick={handleCancel}
              disabled={pending}
              className="text-sm text-ui-text-2 hover:text-ui-text transition-colors disabled:opacity-60"
            >
              Batal
            </button>
          </div>

          {error && (
            <p className="text-xs text-rose-400">{error}</p>
          )}
        </div>
      )}
    </div>
  );
};
export { CancelScrimButton };
