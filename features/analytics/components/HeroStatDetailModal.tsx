"use client";

import { useEffect, useState } from "react";
import { X, Users, Swords, Shield } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { getHeroImageUrl } from "@/features/scrim/data/mlbb-heroes";
import { getHeroDetailAction } from "@/features/analytics/actions";
import type {
  HeroDetailData,
  HeroDetailPlayerRow,
  HeroDetailHeroRow,
} from "@/features/analytics/queries";

interface HeroStatDetailModalProps {
  orgId: string;
  heroName: string | null;
  onClose: () => void;
}

function WrBadge({ wr }: { wr: number }) {
  return (
    <span
      className={cn(
        "text-[11px] font-bold tabular-nums",
        wr >= 60
          ? "text-emerald-400"
          : wr >= 50
            ? "text-yellow-400"
            : wr > 0
              ? "text-rose-400"
              : "text-[#4B4A48]",
      )}
    >
      {wr > 0 ? `${wr}%` : "—"}
    </span>
  );
}

function ColHeader({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1.5 border-b border-ui-border bg-ui-surface px-4 py-3">
      {icon}
      <span className="text-xs font-semibold text-ui-text">{label}</span>
    </div>
  );
}

function ColSubHeader() {
  return (
    <div className="grid grid-cols-[1fr_32px_32px_32px_40px] gap-1 border-b border-ui-elevated bg-ui-hover px-4 py-1.5 text-center text-[9px] font-semibold uppercase tracking-wider text-[#4B4A48]">
      <span className="text-left">—</span>
      <span>Tot</span>
      <span>W</span>
      <span>L</span>
      <span>WR</span>
    </div>
  );
}

function PlayerRow({ row }: { row: HeroDetailPlayerRow }) {
  return (
    <div className="grid grid-cols-[1fr_32px_32px_32px_40px] items-center gap-1 px-4 py-2.5 text-center transition-colors hover:bg-ui-surface">
      <span className="truncate text-left text-xs font-medium text-ui-text">
        {row.display_name}
      </span>
      <span className="text-xs font-semibold text-ui-text">{row.total}</span>
      <span className="text-xs font-semibold text-emerald-400">{row.wins}</span>
      <span className="text-xs font-semibold text-rose-400">{row.losses}</span>
      <WrBadge wr={Number(row.win_rate)} />
    </div>
  );
}

function HeroRow({ row }: { row: HeroDetailHeroRow }) {
  return (
    <div className="grid grid-cols-[1fr_32px_32px_32px_40px] items-center gap-1 px-4 py-2 text-center transition-colors hover:bg-ui-surface">
      <div className="flex items-center gap-2">
        <div className="h-5 w-5 shrink-0 overflow-hidden rounded-full border border-white/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={getHeroImageUrl(row.hero_name)}
            alt={row.hero_name}
            className="h-full w-full object-cover"
          />
        </div>
        <span className="truncate text-xs font-medium text-ui-text">{row.hero_name}</span>
      </div>
      <span className="text-xs font-semibold text-ui-text">{row.total}</span>
      <span className="text-xs font-semibold text-emerald-400">{row.wins}</span>
      <span className="text-xs font-semibold text-rose-400">{row.losses}</span>
      <WrBadge wr={Number(row.win_rate)} />
    </div>
  );
}

function EmptyCol({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      <p className="text-xs text-[#4B4A48]">Belum ada data {label}</p>
    </div>
  );
}

const HeroStatDetailModal = ({
  orgId,
  heroName,
  onClose,
}: HeroStatDetailModalProps) => {
  const [data, setData] = useState<HeroDetailData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!heroName) {
      setData(null);
      return;
    }
    setLoading(true);
    setData(null);
    getHeroDetailAction(orgId, heroName).then((res) => {
      if (res.ok) setData(res.data);
      setLoading(false);
    });
  }, [orgId, heroName]);

  useEffect(() => {
    if (!heroName) return;
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [heroName, onClose]);

  if (!heroName) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-ui-border bg-ui-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center gap-4 border-b border-ui-border bg-ui-surface px-6 py-4">
          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getHeroImageUrl(heroName)}
              alt={heroName}
              className="h-full w-full object-cover"
            />
          </div>
          <div>
            <h2 className="text-base font-bold text-ui-text">{heroName}</h2>
            <p className="text-xs text-ui-text-muted">Detailed Statistics</p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto shrink-0 cursor-pointer rounded-lg p-1.5 text-ui-text-muted transition hover:bg-ui-hover hover:text-ui-text-dim"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Body ── */}
        {loading ? (
          <div className="flex flex-1 items-center justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-ui-border border-t-yellow-400" />
          </div>
        ) : (
          <div className="flex flex-1 overflow-hidden">
            {/* Column 1: Played By Player */}
            <div className="flex w-1/3 flex-col overflow-hidden border-r border-ui-border">
              <ColHeader
                icon={<Users className="h-3.5 w-3.5 text-emerald-400" />}
                label="Played By Player"
              />
              <ColSubHeader />
              <div className="flex-1 overflow-y-auto divide-y divide-ui-elevated">
                {(data?.played_by_player ?? []).length > 0 ? (
                  data!.played_by_player.map((r, i) => <PlayerRow key={i} row={r} />)
                ) : (
                  <EmptyCol label="pemain" />
                )}
              </div>
            </div>

            {/* Column 2: Played With */}
            <div className="flex w-1/3 flex-col overflow-hidden border-r border-ui-border">
              <ColHeader
                icon={<Shield className="h-3.5 w-3.5 text-blue-400" />}
                label="Played With"
              />
              <ColSubHeader />
              <div className="flex-1 overflow-y-auto divide-y divide-ui-elevated">
                {(data?.played_with ?? []).length > 0 ? (
                  data!.played_with.map((r, i) => <HeroRow key={i} row={r} />)
                ) : (
                  <EmptyCol label="kombo" />
                )}
              </div>
            </div>

            {/* Column 3: Played Against */}
            <div className="flex w-1/3 flex-col overflow-hidden">
              <ColHeader
                icon={<Swords className="h-3.5 w-3.5 text-rose-400" />}
                label="Played Against"
              />
              <ColSubHeader />
              <div className="flex-1 overflow-y-auto divide-y divide-ui-elevated">
                {(data?.played_against ?? []).length > 0 ? (
                  data!.played_against.map((r, i) => <HeroRow key={i} row={r} />)
                ) : (
                  <EmptyCol label="musuh" />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export { HeroStatDetailModal };
