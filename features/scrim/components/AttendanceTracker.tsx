"use client";

import { Check, Loader2, X } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { updateAttendanceAction } from "@/features/scrim/actions";
import { createClient } from "@/lib/supabase/client";
import type { AttendanceStatus } from "@/types/database";

interface AttendanceTrackerProps {
  scrimId: string;
  orgSlug: string;
  initialStatus: AttendanceStatus;
  /** When true, RSVP is locked (scrim completed/cancelled). */
  locked: boolean;
}

const CHOICES: Array<{
  key: AttendanceStatus;
  label: string;
  Icon: typeof Check;
  activeClass: string;
}> = [
  {
    key: "confirmed",
    label: "Hadir",
    Icon: Check,
    activeClass: "bg-emerald-500 text-black",
  },
  {
    key: "declined",
    label: "Tidak",
    Icon: X,
    activeClass: "bg-rose-500 text-white",
  },
];

const AttendanceTracker = ({
  scrimId,
  orgSlug,
  initialStatus,
  locked,
}: AttendanceTrackerProps) => {
  const router = useRouter();
  const [status, setStatus] = useState<AttendanceStatus>(initialStatus);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Sync local state when server re-renders with new initialStatus (e.g. after
  // ScrimCountdown quick-RSVP calls router.refresh()).
  useEffect(() => {
    if (!pending) setStatus(initialStatus);
  }, [initialStatus, pending]);

  // Subscribe to realtime updates so other members' RSVP changes
  // re-render the parent (the parent revalidates on action; here we
  // just clear any optimistic state when the server pushes our own).
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`scrim-attendance:${scrimId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "scrim_attendances",
          filter: `scrim_id=eq.${scrimId}`,
        },
        () => {
          // Soft refresh — revalidation comes from the page level
          // (router.refresh is owned by AttendanceList wrapper).
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [scrimId]);

  const choose = (next: AttendanceStatus) => {
    if (locked || pending || status === next) return;
    const prev = status;
    setStatus(next);
    setError(null);
    startTransition(async () => {
      const res = await updateAttendanceAction(orgSlug, {
        scrim_id: scrimId,
        status: next,
      });
      if (!res.ok) {
        setStatus(prev);
        setError(res.message);
      } else {
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {CHOICES.map(({ key, label, Icon, activeClass }) => {
          const active = status === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => choose(key)}
              disabled={locked || pending}
              aria-pressed={active}
              className={`inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
                active
                  ? activeClass
                  : "bg-ui-elevated text-ui-text hover:bg-zinc-700"
              }`}
            >
              {pending && active ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Icon className="h-4 w-4" />
              )}
              {label}
            </button>
          );
        })}
      </div>
      {error ? <p className="text-xs text-rose-400">{error}</p> : null}
      {locked ? (
        <p className="text-xs text-ui-text-2">
          Konfirmasi terkunci — scrim sudah selesai atau dibatalkan.
        </p>
      ) : null}
    </div>
  );
};
export { AttendanceTracker };
