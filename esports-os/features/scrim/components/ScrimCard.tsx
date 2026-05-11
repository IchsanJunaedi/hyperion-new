import { Calendar, MapPin, Swords } from "lucide-react";
import Link from "next/link";

import { ScrimStatusBadge } from "@/features/scrim/components/StatusBadge";
import type { Scrim } from "@/features/scrim/queries";

export function ScrimCard({
  scrim,
  orgSlug,
}: {
  scrim: Scrim;
  orgSlug: string;
}) {
  const scheduled = new Date(scrim.scheduled_at).toLocaleString("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <Link
      href={`/${orgSlug}/scrim/${scrim.id}`}
      className="block rounded-xl border border-white/10 bg-zinc-900/40 p-4 transition hover:border-white/20 hover:bg-zinc-900/70"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-yellow-400">
            <Swords className="h-3.5 w-3.5" />
            {scrim.format.toUpperCase()}
          </p>
          <h3 className="mt-1 truncate text-base font-semibold text-white">
            vs {scrim.opponent_name}
          </h3>
        </div>
        <ScrimStatusBadge status={scrim.status} />
      </div>

      <dl className="mt-3 grid gap-1.5 text-xs text-white/70">
        <div className="inline-flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-white/45" />
          <span>{scheduled}</span>
        </div>
        {scrim.server_region ? (
          <div className="inline-flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-white/45" />
            <span>{scrim.server_region}</span>
          </div>
        ) : null}
      </dl>
    </Link>
  );
}
