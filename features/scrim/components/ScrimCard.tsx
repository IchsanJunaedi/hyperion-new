import { Calendar, MapPin, Swords } from "lucide-react";
import Link from "next/link";

import { ScrimStatusBadge } from "@/features/scrim/components/StatusBadge";
import type { ScrimListItem } from "@/features/scrim/queries";

export function ScrimCard({
  scrim,
  orgSlug,
}: {
  scrim: ScrimListItem;
  orgSlug: string;
}) {
  const scheduled = new Date(scrim.scheduled_at).toLocaleString("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });

  const result = scrim.result;

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
        <div className="flex flex-col items-end gap-1.5">
          <ScrimStatusBadge status={scrim.status} />
          {result ? (
            <span
              className={`text-xs font-semibold ${
                result.is_win === null
                  ? "text-white/55"
                  : result.is_win
                    ? "text-emerald-400"
                    : "text-rose-400"
              }`}
            >
              {result.our_score}–{result.opponent_score}{" "}
              {result.is_win === null ? "Imbang" : result.is_win ? "Menang" : "Kalah"}
            </span>
          ) : null}
        </div>
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
