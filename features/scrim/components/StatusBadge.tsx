import type { ScrimStatus } from "@/types/database";

const STATUS_STYLE: Record<ScrimStatus, string> = {
  scheduled: "bg-blue-500/15 text-blue-300",
  ongoing: "bg-amber-500/15 text-amber-300",
  completed: "bg-emerald-500/15 text-emerald-300",
  cancelled: "bg-zinc-500/15 text-zinc-300",
};

const STATUS_LABEL: Record<ScrimStatus, string> = {
  scheduled: "Terjadwal",
  ongoing: "Berlangsung",
  completed: "Selesai",
  cancelled: "Batal",
};

const ScrimStatusBadge = ({ status }: { status: ScrimStatus }) => {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${STATUS_STYLE[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
};
export { ScrimStatusBadge };
