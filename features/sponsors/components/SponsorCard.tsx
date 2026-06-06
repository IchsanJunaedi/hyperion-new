import Link from "next/link";
import { SponsorStatusBadge } from "./SponsorStatusBadge";
import type { SponsorWithStats } from "../queries";

function formatCurrency(value: number | null, currency: string) {
  if (value === null) return null;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function daysUntil(date: string | null): number | null {
  if (!date) return null;
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86_400_000);
}

interface SponsorCardProps {
  sponsor: SponsorWithStats;
  detailHref: string;
  showOrgName?: boolean;
}

const SponsorCard = ({ sponsor, detailHref, showOrgName = false }: SponsorCardProps) => {
  const days = daysUntil(sponsor.end_date);
  const formattedValue = formatCurrency(sponsor.deal_value, sponsor.currency);
  const progressPct =
    sponsor.deliverableTotal > 0
      ? Math.round((sponsor.deliverableDone / sponsor.deliverableTotal) * 100)
      : null;
  const initials = sponsor.name.slice(0, 2).toUpperCase();

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[#2D2D2D] bg-[#1C1C1C] p-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        {sponsor.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={sponsor.logo_url} alt={sponsor.name} className="h-10 w-10 shrink-0 rounded-lg object-cover" />
        ) : (
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#2C2C2C] text-sm font-bold text-white/70">
            {initials}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{sponsor.name}</p>
          {showOrgName && sponsor.organizationName && (
            <p className="truncate text-[10px] text-white/35 mt-0.5">{sponsor.organizationName}</p>
          )}
          {formattedValue && (
            <p className="text-xs font-medium text-yellow-400">{formattedValue}</p>
          )}
        </div>
        <SponsorStatusBadge status={sponsor.status} />
      </div>

      {sponsor.contact_name && (
        <p className="truncate text-xs text-white/50">{sponsor.contact_name}</p>
      )}

      {days !== null && days >= 0 && days <= 30 && (
        <p className="text-xs text-red-400">Berakhir dalam {days} hari</p>
      )}
      {days !== null && days < 0 && (
        <p className="text-xs text-white/30">Sudah berakhir</p>
      )}

      {sponsor.deliverableTotal > 0 && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-white/40">
            <span>Deliverable</span>
            <span>{sponsor.deliverableDone}/{sponsor.deliverableTotal}</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-[#2D2D2D]">
            <div
              className="h-1.5 rounded-full bg-green-500/70 transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      <Link
        href={detailHref}
        className="mt-auto inline-flex h-8 items-center justify-center rounded-md border border-[#2D2D2D] text-xs text-white/60 transition hover:bg-white/5 hover:text-white"
      >
        Lihat Detail
      </Link>
    </div>
  );
};
export { SponsorCard };
