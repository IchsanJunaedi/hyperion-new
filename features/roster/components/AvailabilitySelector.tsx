"use client";

import { Loader2 } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

import type { MemberAvailability } from "@/types/database";
import { updateAvailabilityAction } from "../actions/updateAvailability";

interface AvailabilitySelectorProps {
  orgSlug: string;
  memberId: string;
  currentAvailability: MemberAvailability;
}

const OPTIONS: Array<{ value: MemberAvailability; label: string; emoji: string }> = [
  { value: "active", label: "Aktif", emoji: "🟢" },
  { value: "hiatus", label: "Hiatus", emoji: "🟡" },
  { value: "unavailable", label: "Tidak Tersedia", emoji: "🔴" },
];

export function AvailabilitySelector({
  orgSlug,
  memberId,
  currentAvailability,
}: AvailabilitySelectorProps) {
  const [pending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value as MemberAvailability;
    if (value === currentAvailability) return;

    startTransition(async () => {
      const res = await updateAvailabilityAction(orgSlug, memberId, value);
      if (res.ok) {
        toast.success("Status ketersediaan diperbarui");
      } else {
        toast.error(res.message);
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={currentAvailability}
        onChange={handleChange}
        disabled={pending}
        className="h-8 rounded-md border border-white/10 bg-zinc-900 px-2 text-xs text-white focus:border-yellow-400 focus:outline-none disabled:opacity-50"
      >
        {OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.emoji} {opt.label}
          </option>
        ))}
      </select>
      {pending && <Loader2 className="h-3 w-3 animate-spin text-white/40" />}
    </div>
  );
}
