"use client";

import { cn } from "@/lib/utils/cn";

interface WaStatusBadgeProps {
  status: "pending" | "sent" | "failed";
}

const statusConfig = {
  pending: {
    label: "Pending",
    className: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  sent: {
    label: "Terkirim",
    className: "bg-green-500/10 text-green-400 border-green-500/20",
  },
  failed: {
    label: "Gagal",
    className: "bg-red-500/10 text-red-400 border-red-500/20",
  },
} as const;

export function WaStatusBadge({ status }: WaStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        config.className,
      )}
    >
      {config.label}
    </span>
  );
}
