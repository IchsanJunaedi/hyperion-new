"use client";

import { useState, useTransition } from "react";
import { Copy, Link as LinkIcon, X } from "lucide-react";
import { toast } from "sonner";

import { cancelInviteAction } from "@/features/roster/actions";
import { MemberRoleBadge } from "@/features/roster/components/RoleBadge";
import type { PendingInvite } from "@/features/roster/queries";

export function PendingInviteRow({
  invite,
  orgSlug,
}: {
  invite: PendingInvite;
  orgSlug: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [optimisticallyCancelled, setOptimisticallyCancelled] = useState(false);

  if (optimisticallyCancelled) return null;

  const acceptUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/invite/${invite.token}`;
  const expires = new Date(invite.expires_at).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const recipient =
    invite.email ??
    (invite.phone_wa ? `+${invite.phone_wa}` : "—");

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(acceptUrl);
      toast.success("Link undangan disalin");
    } catch {
      toast.error("Gagal menyalin link");
    }
  }

  function cancel() {
    startTransition(async () => {
      setOptimisticallyCancelled(true);
      const result = await cancelInviteAction(orgSlug, {
        invite_id: invite.id,
      });
      if (!result.ok) {
        setOptimisticallyCancelled(false);
        toast.error(result.message);
      } else {
        toast.success("Undangan dibatalkan");
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-white/10 bg-zinc-900/40 p-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-medium text-white">{recipient}</p>
          <MemberRoleBadge role={invite.role} />
        </div>
        <p className="mt-0.5 text-xs text-white/55">
          {invite.division ? `${invite.division.name} · ` : ""}
          Berlaku sampai {expires}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={copyLink}
          className="inline-flex h-8 items-center gap-1 rounded-md border border-white/10 px-2 text-xs text-white/80 transition hover:border-white/25 hover:text-white"
        >
          <LinkIcon className="h-3.5 w-3.5" />
          <Copy className="h-3.5 w-3.5" />
          Salin link
        </button>
        <button
          type="button"
          onClick={cancel}
          disabled={isPending}
          className="inline-flex h-8 items-center gap-1 rounded-md border border-rose-500/30 bg-rose-500/10 px-2 text-xs text-rose-200 transition hover:border-rose-500/60 disabled:opacity-50"
        >
          <X className="h-3.5 w-3.5" />
          Batalkan
        </button>
      </div>
    </div>
  );
}
