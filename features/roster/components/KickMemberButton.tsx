"use client";

import { UserMinus } from "lucide-react";
import { useState, useTransition } from "react";
import { notify } from "@/features/dashboard/components/NotifyModal";
import { ConfirmDeleteDialog } from "@/features/dashboard/components/ConfirmDeleteDialog";

import { kickMemberAction } from "../actions/kickMember";

interface KickMemberButtonProps {
  orgSlug: string;
  memberId: string;
  memberName: string;
  isSelf: boolean;
}

const KickMemberButton = ({
  orgSlug,
  memberId,
  memberName,
  isSelf,
}: KickMemberButtonProps) => {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  const title = isSelf ? "Keluar dari Tim" : "Kick Member";
  const message = isSelf
    ? "Yakin ingin keluar dari tim? Seluruh akses Anda ke data tim, jadwal, dan riwayat kompetisi akan dinonaktifkan."
    : `Yakin ingin mengeluarkan "${memberName}" dari tim? Seluruh data akses dan log aktivitas member ini akan dicabut secara permanen.`;
  const confirmPhrase = isSelf ? "KELUAR" : "KICK";
  const confirmText = isSelf ? "Keluar" : "Kick";

  const handleConfirm = () => {
    startTransition(async () => {
      const res = await kickMemberAction(orgSlug, memberId);
      if (res.ok) {
        notify.success(
          isSelf
            ? "Kamu telah keluar dari tim"
            : `${memberName} telah dikeluarkan`,
        );
      } else {
        notify.error(res.message);
      }
      setConfirming(false);
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="inline-flex h-7 items-center gap-1.5 rounded-md border border-white/10 px-2.5 text-xs text-white/50 transition hover:border-red-500/30 hover:text-red-400"
      >
        <UserMinus className="h-3.5 w-3.5" />
        {isSelf ? "Keluar" : "Kick"}
      </button>

      <ConfirmDeleteDialog
        open={confirming}
        title={title}
        message={message}
        confirmPhrase={confirmPhrase}
        confirmText={confirmText}
        pending={pending}
        onConfirm={handleConfirm}
        onCancel={() => setConfirming(false)}
      />
    </>
  );
};
export { KickMemberButton };
