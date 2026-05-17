"use client";

import { Loader2, UserMinus } from "lucide-react";
import { useState, useTransition } from "react";
import { notify } from "@/features/dashboard/components/NotifyModal";

import { kickMemberAction } from "../actions/kickMember";

interface KickMemberButtonProps {
  orgSlug: string;
  memberId: string;
  memberName: string;
  isSelf: boolean;
}

export function KickMemberButton({
  orgSlug,
  memberId,
  memberName,
  isSelf,
}: KickMemberButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [pending, startTransition] = useTransition();

  const requiredText = isSelf ? "KELUAR" : "KICK";
  const isValid = confirmText === requiredText;

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="inline-flex h-7 items-center gap-1.5 rounded-md border border-white/10 px-2.5 text-xs text-white/50 transition hover:border-red-500/30 hover:text-red-400"
      >
        <UserMinus className="h-3.5 w-3.5" />
        {isSelf ? "Keluar" : "Kick"}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-[#2D2D2D]/60 bg-[#141414] p-3 sm:flex-row sm:items-center sm:gap-3">
      <div className="flex flex-col">
        <span className="text-[11px] font-medium text-white/90">
          {isSelf
            ? `Ketik "${requiredText}" untuk keluar dari tim`
            : `Ketik "${requiredText}" untuk mengeluarkan ${memberName}`}
        </span>
        <input
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder={requiredText}
          disabled={pending}
          className="mt-1 h-7 w-full sm:w-36 rounded-md border border-[#2D2D2D] bg-[#1A1A1A] px-2 text-xs text-white placeholder-white/20 focus:border-red-500/50 focus:outline-none disabled:opacity-50"
        />
      </div>
      <div className="flex items-center gap-1.5 self-end sm:self-center mt-2 sm:mt-4">
        <button
          type="button"
          disabled={pending || !isValid}
          onClick={() => {
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
                setConfirming(false);
                setConfirmText("");
              }
            });
          }}
          className="inline-flex h-7 items-center rounded-md bg-red-500/10 px-2 text-xs font-semibold text-red-400 transition hover:bg-red-500/20 disabled:opacity-30 disabled:hover:bg-red-500/10"
        >
          {pending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            "Konfirmasi"
          )}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setConfirming(false);
            setConfirmText("");
          }}
          className="inline-flex h-7 items-center rounded-md border border-[#2D2D2D] px-2 text-xs text-white/50 transition hover:bg-white/5 disabled:opacity-50"
        >
          Batal
        </button>
      </div>
    </div>
  );
}
