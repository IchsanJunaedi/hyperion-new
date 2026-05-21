"use client";

import { useState } from "react";
import { Plus, Users, TrendingUp, DollarSign, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { SponsorCard } from "./SponsorCard";
import { SponsorFormModal } from "./SponsorFormModal";
import type { SponsorWithStats } from "../queries";

interface StatsRowProps {
  sponsors: SponsorWithStats[];
}

function StatsRow({ sponsors }: StatsRowProps) {
  const total = sponsors.length;
  const active = sponsors.filter((s) => s.status === "active").length;
  const totalValue = sponsors
    .filter((s) => s.deal_value !== null && s.currency === "IDR")
    .reduce((sum, s) => sum + (s.deal_value ?? 0), 0);

  const expiringSoon = sponsors.filter((s) => {
    if (!s.end_date) return false;
    const days = Math.ceil((new Date(s.end_date).getTime() - Date.now()) / 86_400_000);
    return days >= 0 && days <= 30;
  }).length;

  const stats = [
    { label: "Total Sponsor", value: total, Icon: Users, color: "text-blue-400" },
    { label: "Aktif", value: active, Icon: TrendingUp, color: "text-green-400" },
    {
      label: "Total Deal (IDR)",
      value: new Intl.NumberFormat("id-ID", {
        style: "currency", currency: "IDR", minimumFractionDigits: 0, maximumFractionDigits: 0,
        notation: "compact",
      }).format(totalValue),
      Icon: DollarSign,
      color: "text-yellow-400",
    },
    { label: "Segera Berakhir", value: expiringSoon, Icon: AlertTriangle, color: "text-red-400" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map(({ label, value, Icon, color }) => (
        <div key={label} className="rounded-xl border border-[#2D2D2D] bg-[#1C1C1C] p-4">
          <div className="mb-2 flex items-center gap-2">
            <Icon className={cn("h-4 w-4", color)} />
            <span className="text-xs text-white/50">{label}</span>
          </div>
          <p className="text-lg font-semibold text-white">{value}</p>
        </div>
      ))}
    </div>
  );
}


interface SponsorListClientProps {
  sponsors: SponsorWithStats[];
  orgId: string;
  detailBasePath: string;
}

export function SponsorListClient({ sponsors, orgId, detailBasePath }: SponsorListClientProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);

  function handleSaved(id: string) {
    router.push(`${detailBasePath}/${id}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">Sponsor & Partner</h1>
          <p className="text-sm text-white/40">Kelola sponsor, deal, dan deliverable tim</p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="flex cursor-pointer items-center gap-1.5 rounded-md bg-yellow-400 px-3 py-2 text-sm font-semibold text-black transition hover:bg-yellow-300"
        >
          <Plus className="h-4 w-4" />
          Tambah Sponsor
        </button>
      </div>

      <StatsRow sponsors={sponsors} />

      {sponsors.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-[#2D2D2D] py-16">
          <Users className="h-10 w-10 text-white/20" />
          <p className="text-sm text-white/40">Belum ada sponsor. Tambah sponsor pertama!</p>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="flex cursor-pointer items-center gap-1.5 rounded-md border border-[#2D2D2D] px-4 py-2 text-sm text-white/60 transition hover:bg-white/5"
          >
            <Plus className="h-3.5 w-3.5" />
            Tambah Sponsor
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sponsors.map((s) => (
            <SponsorCard key={s.id} sponsor={s} detailHref={`${detailBasePath}/${s.id}`} />
          ))}
        </div>
      )}

      <SponsorFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        orgId={orgId}
        onSaved={handleSaved}
      />
    </div>
  );
}
