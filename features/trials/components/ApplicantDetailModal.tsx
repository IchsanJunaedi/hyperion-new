"use client";

import { ExternalLink, FileText, X } from "lucide-react";
import { useEffect } from "react";

import type { ApplicantRow } from "@/features/trials/queries";
import { cn } from "@/lib/utils/cn";

const STATUS_COLORS: Record<string, string> = {
  pending:    "text-ui-text-2 bg-ui-hover",
  accepted:   "text-green-400 bg-green-500/15",
  waitlisted: "text-yellow-400 bg-yellow-500/15",
  rejected:   "text-red-400 bg-red-500/15",
};
const STATUS_LABELS: Record<string, string> = {
  pending: "Pending", accepted: "Diterima", waitlisted: "Waitlist", rejected: "Ditolak",
};

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex gap-3">
      <span className="w-32 shrink-0 text-xs text-ui-text-muted">{label}</span>
      <span className="text-sm text-ui-text break-words">{value}</span>
    </div>
  );
}

interface ApplicantDetailModalProps {
  applicant: ApplicantRow;
  onClose: () => void;
}

const ApplicantDetailModal = ({ applicant, onClose }: ApplicantDetailModalProps) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const statusColor = STATUS_COLORS[applicant.status] ?? STATUS_COLORS.pending;
  const statusLabel = STATUS_LABELS[applicant.status] ?? applicant.status;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="my-4 w-full max-w-2xl rounded-xl border border-ui-border bg-ui-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-ui-border px-6 py-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="min-w-0">
              <h3 className="text-base font-bold text-ui-text truncate">{applicant.name}</h3>
              <p className="text-xs text-ui-text-2">{applicant.ign}</p>
            </div>
            <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold", statusColor)}>
              {statusLabel}
            </span>
          </div>
          <button type="button" onClick={onClose} className="ml-4 shrink-0 cursor-pointer text-ui-text-2 hover:text-ui-text">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="divide-y divide-ui-border">
          {/* Data Pribadi */}
          <section className="px-6 py-4 space-y-2.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-ui-text-muted">Data Pribadi</p>
            <Row label="Nama" value={applicant.name} />
            <Row label="IGN" value={applicant.ign} />
            <Row label="Umur" value={applicant.age ? `${applicant.age} tahun` : null} />
            <Row label="Kota Asal" value={applicant.city} />
            <Row label="WhatsApp" value={applicant.phone} />
            <Row label="Email" value={applicant.email} />
            <Row label="Sosial Media" value={applicant.social_media} />
            <Row label="Status" value={applicant.is_free_agent ? "Free agent" : "Masih di tim lain"} />
          </section>

          {/* Info Game */}
          <section className="px-6 py-4 space-y-2.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-ui-text-muted">Info Game</p>
            <Row label="Role Dilamar" value={applicant.role_applied} />
            <Row label="Rank" value={applicant.rank} />
            <Row label="ID Game" value={applicant.game_id} />
            <Row label="Nick Terverifikasi" value={applicant.game_nickname} />
            <Row label="Win Rate" value={applicant.win_rate ? `${applicant.win_rate}%` : null} />
            {(applicant.hero_pool?.length ?? 0) > 0 && (
              <div className="flex gap-3">
                <span className="w-32 shrink-0 text-xs text-ui-text-muted">Hero Pool</span>
                <div className="flex flex-wrap gap-1">
                  {applicant.hero_pool!.map((h) => (
                    <span key={h} className="rounded-full border border-ui-border bg-ui-hover px-2 py-0.5 text-xs text-ui-text-dim">{h}</span>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Pengalaman */}
          {applicant.competitive_exp && (
            <section className="px-6 py-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-ui-text-muted">Pengalaman Kompetitif</p>
              <p className="text-sm text-ui-text whitespace-pre-wrap leading-relaxed">{applicant.competitive_exp}</p>
            </section>
          )}

          {/* Catatan internal */}
          {applicant.notes && (
            <section className="px-6 py-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-ui-text-muted">Catatan Internal</p>
              <p className="text-sm text-ui-text-2 whitespace-pre-wrap">{applicant.notes}</p>
            </section>
          )}

          {/* Screenshot */}
          {applicant.screenshot_url && (
            <section className="px-6 py-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-ui-text-muted">Screenshot Profil</p>
                <a
                  href={applicant.screenshot_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-ui-text-2 hover:text-ui-text cursor-pointer"
                >
                  <ExternalLink className="h-3 w-3" />
                  Buka asli
                </a>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={applicant.screenshot_url}
                alt={`Screenshot profil ${applicant.name}`}
                className="w-full rounded-lg border border-ui-border object-contain bg-ui-bg max-h-80"
              />
            </section>
          )}

          {/* CV */}
          {applicant.cv_url && (
            <section className="px-6 py-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-ui-text-muted">CV / Pengalaman Turnamen</p>
              {/\.(png|jpe?g|webp)$/i.test(applicant.cv_url) ? (
                <div className="space-y-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={applicant.cv_url}
                    alt="CV"
                    className="w-full rounded-lg border border-ui-border object-contain bg-ui-bg max-h-80"
                  />
                  <a href={applicant.cv_url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-ui-text-2 hover:text-ui-text">
                    <ExternalLink className="h-3 w-3" /> Buka asli
                  </a>
                </div>
              ) : (
                <a
                  href={applicant.cv_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-ui-border bg-ui-bg px-4 py-3 text-sm text-ui-text-2 hover:bg-ui-hover hover:text-ui-text transition-colors"
                >
                  <FileText className="h-4 w-4 shrink-0 text-orange-400" />
                  <span className="truncate">Buka CV / Dokumen</span>
                  <ExternalLink className="h-3 w-3 shrink-0 ml-auto" />
                </a>
              )}
            </section>
          )}

          {/* Meta */}
          <section className="px-6 py-3">
            <p className="text-[10px] text-ui-text-muted">
              Daftar: {new Date(applicant.created_at).toLocaleString("id-ID", { timeZone: "Asia/Jakarta", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export { ApplicantDetailModal };
