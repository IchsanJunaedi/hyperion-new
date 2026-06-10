"use client";

import { useState, useEffect } from "react";
import { Plus, Users, TrendingUp, DollarSign, AlertTriangle, FileDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { SponsorCard } from "./SponsorCard";
import { SponsorFormModal } from "./SponsorFormModal";
import { SponsorStatusBadge } from "./SponsorStatusBadge";
import { SponsorROIDashboard } from "./SponsorROIDashboard";
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

function formatDate(d: string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

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
        <div key={label} className="rounded-xl border border-ui-border bg-ui-surface p-4">
          <div className="mb-2 flex items-center gap-2">
            <Icon className={cn("h-4 w-4", color)} />
            <span className="text-xs text-white/50">{label}</span>
          </div>
          <p className="text-lg font-semibold text-ui-text">{value}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Media Kit (print-only layout) ────────────────────────────────────────────

interface MediaKitProps {
  sponsors: SponsorWithStats[];
  orgName: string;
}

function MediaKit({ sponsors, orgName }: MediaKitProps) {
  const active = sponsors.filter((s) => s.status === "active");
  const others = sponsors.filter((s) => s.status !== "active" && (s.status === "prospect" || s.status === "inactive" || s.status === "ended"));
  const totalValue = sponsors
    .filter((s) => s.deal_value !== null && s.currency === "IDR")
    .reduce((sum, s) => sum + (s.deal_value ?? 0), 0);
  const generatedAt = new Date().toLocaleDateString("id-ID", {
    day: "numeric", month: "long", year: "numeric",
  });

  const SponsorRow = ({ s }: { s: SponsorWithStats }) => (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "12px 0", borderBottom: "1px solid #E5E7EB" }}>
      {s.logo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={s.logo_url} alt={s.name} style={{ width: 44, height: 44, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
      ) : (
        <div style={{ width: 44, height: 44, borderRadius: 8, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#6B7280", flexShrink: 0 }}>
          {s.name.slice(0, 2).toUpperCase()}
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontWeight: 600, fontSize: 14, color: "#111827" }}>{s.name}</span>
          <span style={{
            fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 999,
            background: s.status === "active" ? "#D1FAE5" : s.status === "prospect" ? "#FEF3C7" : "#F3F4F6",
            color: s.status === "active" ? "#065F46" : s.status === "prospect" ? "#92400E" : "#6B7280",
          }}>
            {s.status === "active" ? "Aktif" : s.status === "prospect" ? "Prospek" : s.status === "inactive" ? "Tidak Aktif" : "Selesai"}
          </span>
        </div>
        {formatCurrency(s.deal_value, s.currency) && (
          <p style={{ fontSize: 13, color: "#D97706", fontWeight: 600, marginTop: 2 }}>
            {formatCurrency(s.deal_value, s.currency)}
          </p>
        )}
        {(s.start_date || s.end_date) && (
          <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>
            {[s.start_date && `Mulai ${formatDate(s.start_date)}`, s.end_date && `Berakhir ${formatDate(s.end_date)}`].filter(Boolean).join(" · ")}
          </p>
        )}
        {s.contact_name && (
          <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 1 }}>PIC: {s.contact_name}</p>
        )}
      </div>
      {s.deliverableTotal > 0 && (
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <span style={{ fontSize: 11, color: "#6B7280" }}>{s.deliverableDone}/{s.deliverableTotal} deliverable</span>
        </div>
      )}
    </div>
  );

  return (
    <div style={{ fontFamily: "sans-serif", color: "#111827", maxWidth: 720, margin: "0 auto", padding: "40px 32px" }}>
      {/* Header */}
      <div style={{ borderBottom: "3px solid #111827", paddingBottom: 20, marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, letterSpacing: -0.5 }}>{orgName}</h1>
        <p style={{ fontSize: 14, color: "#6B7280", margin: "4px 0 0" }}>Sponsor &amp; Partner — Media Kit</p>
        <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 6 }}>Dibuat: {generatedAt}</p>
      </div>

      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 32 }}>
        {[
          { label: "Total Sponsor", value: sponsors.length },
          { label: "Sponsor Aktif", value: active.length },
          { label: "Total Deal (IDR)", value: totalValue > 0 ? new Intl.NumberFormat("id-ID", { notation: "compact", style: "currency", currency: "IDR", minimumFractionDigits: 0, maximumFractionDigits: 1 }).format(totalValue) : "—" },
        ].map(({ label, value }) => (
          <div key={label} style={{ border: "1px solid #E5E7EB", borderRadius: 10, padding: "14px 16px" }}>
            <p style={{ fontSize: 11, color: "#6B7280", margin: 0 }}>{label}</p>
            <p style={{ fontSize: 20, fontWeight: 700, margin: "4px 0 0" }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Active sponsors */}
      {active.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "#6B7280", marginBottom: 8 }}>
            Sponsor Aktif
          </h2>
          {active.map((s) => <SponsorRow key={s.id} s={s} />)}
        </div>
      )}

      {/* Other sponsors */}
      {others.length > 0 && (
        <div>
          <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "#6B7280", marginBottom: 8 }}>
            Lainnya
          </h2>
          {others.map((s) => <SponsorRow key={s.id} s={s} />)}
        </div>
      )}

      {sponsors.length === 0 && (
        <p style={{ textAlign: "center", color: "#9CA3AF", padding: "40px 0" }}>Belum ada data sponsor.</p>
      )}

      {/* Footer */}
      <div style={{ marginTop: 40, paddingTop: 16, borderTop: "1px solid #E5E7EB" }}>
        <p style={{ fontSize: 11, color: "#9CA3AF", margin: 0, textAlign: "center" }}>
          Dokumen ini bersifat rahasia dan hanya untuk keperluan internal tim.
        </p>
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

interface SponsorListClientProps {
  sponsors: SponsorWithStats[];
  /** Always required – the org used as default for new sponsor creation. */
  orgId: string;
  orgName?: string;
  detailBasePath: string;
  /** When true, shows multi-org aggregated view (Semua Tim). */
  isAllOrgs?: boolean;
  /** Full list of orgs; passed to SponsorFormModal for org picker dropdown. */
  organizations?: Array<{ id: string; name: string }>;
}

const SponsorListClient = ({ sponsors, orgId, orgName, detailBasePath, isAllOrgs = false, organizations }: SponsorListClientProps) => {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [printMode, setPrintMode] = useState(false);

  useEffect(() => {
    if (!printMode) return;
    const timer = setTimeout(() => {
      window.print();
      const cleanup = () => {
        setPrintMode(false);
        window.removeEventListener("afterprint", cleanup);
      };
      window.addEventListener("afterprint", cleanup);
    }, 80);
    return () => clearTimeout(timer);
  }, [printMode]);

  function handleSaved(id: string) {
    router.push(`${detailBasePath}/${id}`);
  }

  if (printMode) {
    return <MediaKit sponsors={sponsors} orgName={orgName ?? "Tim"} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-ui-text">Sponsor &amp; Partner</h1>
          <p className="text-sm text-white/40">Kelola sponsor, deal, dan deliverable tim</p>
        </div>
        <div className="flex items-center gap-2">
          {sponsors.length > 0 && (
            <button
              type="button"
              onClick={() => setPrintMode(true)}
              className="flex cursor-pointer items-center gap-1.5 rounded-md border border-ui-border px-3 py-2 text-sm text-white/60 transition hover:bg-white/5 hover:text-ui-text"
            >
              <FileDown className="h-4 w-4" />
              Media Kit
            </button>
          )}
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="flex cursor-pointer items-center gap-1.5 rounded-md bg-yellow-400 px-3 py-2 text-sm font-semibold text-black transition hover:bg-yellow-300"
          >
            <Plus className="h-4 w-4" />
            Tambah Sponsor
          </button>
        </div>
      </div>

      <StatsRow sponsors={sponsors} />

      <SponsorROIDashboard sponsors={sponsors} />

      {sponsors.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-ui-border py-16">
          <Users className="h-10 w-10 text-white/20" />
          <p className="text-sm text-white/40">Belum ada sponsor. Tambah sponsor pertama!</p>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="flex cursor-pointer items-center gap-1.5 rounded-md border border-ui-border px-4 py-2 text-sm text-white/60 transition hover:bg-white/5"
          >
            <Plus className="h-3.5 w-3.5" />
            Tambah Sponsor
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sponsors.map((s) => (
            <SponsorCard key={s.id} sponsor={s} detailHref={`${detailBasePath}/${s.id}`} showOrgName={isAllOrgs} />
          ))}
        </div>
      )}

      <SponsorFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        orgId={orgId}
        onSaved={handleSaved}
        organizations={isAllOrgs ? organizations : undefined}
      />
    </div>
  );
};
export { SponsorListClient };
