"use client";

import { Check, Circle, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { createClient } from "@/lib/supabase/client";
import type { ScrimDetail } from "@/features/scrim/queries";
import type { AttendanceStatus } from "@/types/database";

interface AttendanceListProps {
  scrimId: string;
  rows: ScrimDetail["attendances"];
}

const STATUS_META: Record<
  AttendanceStatus,
  { Icon: typeof Check; className: string; label: string }
> = {
  confirmed: {
    Icon: Check,
    className: "text-emerald-400",
    label: "Hadir",
  },
  declined: { Icon: X, className: "text-rose-400", label: "Tidak" },
  tentative: {
    Icon: Circle,
    className: "text-white/40",
    label: "Belum konfirmasi",
  },
  pending: {
    Icon: Circle,
    className: "text-white/40",
    label: "Belum konfirmasi",
  },
};

/**
 * Pure presentational component fed from server-side `getScrimDetail`,
 * but it subscribes to Postgres changes on the scrim's attendances so
 * peer RSVPs trigger a `router.refresh()` and the latest data is
 * re-fetched.
 */
const AttendanceList = ({ scrimId, rows }: AttendanceListProps) => {
  const router = useRouter();
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`scrim-attendance-list:${scrimId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "scrim_attendances",
          filter: `scrim_id=eq.${scrimId}`,
        },
        () => router.refresh(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [scrimId, router]);

  if (rows.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-white/10 bg-zinc-900/30 p-4 text-center text-sm text-white/55">
        Belum ada anggota divisi yang dapat konfirmasi.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-white/5 overflow-hidden rounded-xl border border-white/10">
      {rows.map((row) => {
        const { Icon, className, label } = STATUS_META[row.attendance.status];
        const name =
          row.member.display_name ??
          (row.member.user_id ? row.member.user_id.slice(0, 8) : "Anggota");
        return (
          <li
            key={row.attendance.id}
            className="flex items-center gap-3 bg-zinc-900/40 px-4 py-3"
          >
            <div className="grid h-9 w-9 flex-none place-items-center rounded-full bg-white/10 text-xs font-semibold text-white">
              {row.member.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={row.member.avatar_url}
                  alt={name}
                  className="h-9 w-9 rounded-full object-cover"
                />
              ) : (
                name.slice(0, 2).toUpperCase()
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{name}</p>
              <p className="truncate text-xs text-white/55">
                {row.member.position ?? "—"}
                {row.member.jersey_number !== null
                  ? ` · #${row.member.jersey_number}`
                  : ""}
              </p>
            </div>
            <span className={`inline-flex items-center gap-1.5 text-xs ${className}`}>
              <Icon className="h-3.5 w-3.5" />
              {label}
            </span>
          </li>
        );
      })}
    </ul>
  );
};
export { AttendanceList };
