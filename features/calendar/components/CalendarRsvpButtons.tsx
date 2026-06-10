"use client";

import { CheckCircle2, HelpCircle, Loader2, XCircle } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

import { upsertCalendarRsvpAction } from "../actions";

interface CalendarRsvpButtonsProps {
  orgSlug: string;
  eventId: string;
  currentStatus: string | null;
  rsvpCounts?: { hadir: number; tentative: number; tidak_hadir: number };
}

const OPTIONS = [
  {
    value: "hadir" as const,
    label: "Hadir",
    Icon: CheckCircle2,
    active: "border-green-500/40 bg-green-500/10 text-green-400",
    hover: "hover:border-green-500/30 hover:text-green-400",
  },
  {
    value: "tentative" as const,
    label: "Mungkin",
    Icon: HelpCircle,
    active: "border-yellow-500/40 bg-yellow-500/10 text-yellow-400",
    hover: "hover:border-yellow-500/30 hover:text-yellow-400",
  },
  {
    value: "tidak_hadir" as const,
    label: "Tidak Hadir",
    Icon: XCircle,
    active: "border-red-500/40 bg-red-500/10 text-red-400",
    hover: "hover:border-red-500/30 hover:text-red-400",
  },
];

const COUNT_KEY: Record<string, keyof { hadir: number; tentative: number; tidak_hadir: number }> = {
  hadir: "hadir",
  tentative: "tentative",
  tidak_hadir: "tidak_hadir",
};

const CalendarRsvpButtons = ({
  orgSlug,
  eventId,
  currentStatus,
  rsvpCounts,
}: CalendarRsvpButtonsProps) => {
  const [pending, startTransition] = useTransition();

  function handleRsvp(status: "hadir" | "tidak_hadir" | "tentative") {
    startTransition(async () => {
      const res = await upsertCalendarRsvpAction(orgSlug, eventId, status);
      if (res.ok) {
        toast.success("RSVP diperbarui");
      } else {
        toast.error(res.message);
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-ui-text-muted mr-1">Konfirmasi kehadiran:</span>
      {OPTIONS.map(({ value, label, Icon, active, hover }) => {
        const isActive = currentStatus === value;
        return (
          <button
            key={value}
            type="button"
            disabled={pending}
            onClick={() => handleRsvp(value)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition disabled:opacity-50 cursor-pointer ${
              isActive
                ? active
                : `border-white/10 text-ui-text-2 ${hover} hover:bg-white/5`
            }`}
          >
            {pending && isActive ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Icon className="h-3.5 w-3.5" />
            )}
            {label}
            {rsvpCounts && (
              <span className="ml-0.5 opacity-60">
                {rsvpCounts[COUNT_KEY[value]!]}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
export { CalendarRsvpButtons };
