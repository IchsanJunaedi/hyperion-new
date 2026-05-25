"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { acknowledgeAnnouncementAction } from "../actions";

interface AcknowledgeButtonProps {
  orgSlug: string;
  announcementId: string;
}

export function AcknowledgeButton({ orgSlug, announcementId }: AcknowledgeButtonProps) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleAck() {
    startTransition(async () => {
      const res = await acknowledgeAnnouncementAction(orgSlug, announcementId);
      if (res.ok) {
        toast.success("Konfirmasi berhasil dicatat!");
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleAck}
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <CheckCircle2 className="h-4 w-4" />
      )}
      Saya Sudah Membaca & Memahami
    </button>
  );
}
