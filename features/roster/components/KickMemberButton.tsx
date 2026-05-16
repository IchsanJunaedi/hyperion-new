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
  const [pending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="inline-flex h-7 items-center gap-1.5 rounded-md border border-white/10 px-2 text-xs text-white/50 transition hover:border-red-500/30 hover:text-red-400"
      >
        <UserMinus className="h-3 w-3" />
        {isSelf ? "Keluar" : "Kick"}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-white/60">
        {isSelf ? "Keluar dari tim?" : `Kick ${memberName}?`}
      </span>
      <button
        type="button"
        disabled={pending}
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
            }
          });
        }}
        className="inline-flex h-7 items-center rounded-md bg-red-500/15 px-2 text-xs font-medium text-red-400 transition hover:bg-red-500/25 disabled:opacity-50"
      >
        {pending ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          "Ya, lanjutkan"
        )}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => setConfirming(false)}
        className="inline-flex h-7 items-center rounded-md border border-white/10 px-2 text-xs text-white/50 transition hover:bg-white/5 disabled:opacity-50"
      >
        Batal
      </button>
    </div>
  );
}
