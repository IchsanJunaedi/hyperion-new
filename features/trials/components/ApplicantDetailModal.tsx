"use client";

import { ExternalLink, X } from "lucide-react";
import { useEffect } from "react";

import type { ApplicantRow } from "@/features/trials/queries";
import { cn } from "@/lib/utils/cn";

const STATUS_COLORS: Record<string, string> = {
  pending:    "text-[#9B9A97] bg-[#2C2C2C]",
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
      <span className="w-32 shrink-0 text-xs text-[#6B6A68]">{label}</span>
      <span className="text-sm text-[#E5E2E1] break-words">{value}</span>
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
        className="my-4 w-full max-w-2xl rounded-xl border border-[#2D2D2D] bg-[#202020] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2D2D2D] px-6 py-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="min-w-0">
              <h3 className="text-base font-bold text-[#E5E2E1] truncate">{applicant.name}</h3>
              <p className="text-xs text-[#9B9A97]">{applicant.ign}</p>
            </div>
            <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold", statusColor)}>
              {statusLabel}
            </span>
          </div>
          <button type="button" onClick={onClose} className="ml-4 shrink-0 cursor-pointer text-[#9B9A97] hover:text-[#E5E2E1]">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="divide-y divide-[#2D2D2D]">
          {/* Data Pribadi */}
          <section className="px-6 py-4 space-y-2.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#6B6A68]">Data Pribadi</p>
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
            <p className="text-xs font-semibold uppercase tracking-wider text-[#6B6A68]">Info Game</p>
            <Row label="Role Dilamar" value={applicant.role_applied} />
            <Row label="Rank" value={applicant.rank} />
            <Row label="ID Game" value={applicant.game_id} />
            <Row label="Nick Terverifikasi" value={applicant.game_nickname} />
            <Row label="Win Rate" value={applicant.win_rate ? `${applicant.win_rate}%` : null} />
            {(applicant.hero_pool?.length ?? 0) > 0 && (
              <div className="flex gap-3">
                <span className="w-32 shrink-0 text-xs text-[#6B6A68]">Hero Pool</span>
                <div className="flex flex-wrap gap-1">
                  {applicant.hero_pool!.map((h) => (
                    <span key={h} className="rounded-full border border-[#2D2D2D] bg-[#2C2C2C] px-2 py-0.5 text-xs text-[#D4D4D4]">{h}</span>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Pengalaman */}
          {applicant.competitive_exp && (
            <section className="px-6 py-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#6B6A68]">Pengalaman Kompetitif</p>
              <p className="text-sm text-[#E5E2E1] whitespace-pre-wrap leading-relaxed">{applicant.competitive_exp}</p>
            </section>
          )}

          {/* Catatan internal */}
          {applicant.notes && (
            <section className="px-6 py-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#6B6A68]">Catatan Internal</p>
              <p className="text-sm text-[#9B9A97] whitespace-pre-wrap">{applicant.notes}</p>
            </section>
          )}

          {/* Screenshot */}
          {applicant.screenshot_url && (
            <section className="px-6 py-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#6B6A68]">Screenshot Profil</p>
                <a
                  href={applicant.screenshot_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-[#9B9A97] hover:text-[#E5E2E1] cursor-pointer"
                >
                  <ExternalLink className="h-3 w-3" />
                  Buka asli
                </a>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={applicant.screenshot_url}
                alt={`Screenshot profil ${applicant.name}`}
                className="w-full rounded-lg border border-[#2D2D2D] object-contain bg-[#141414] max-h-80"
              />
            </section>
          )}

          {/* Meta */}
          <section className="px-6 py-3">
            <p className="text-[10px] text-[#6B6A68]">
              Daftar: {new Date(applicant.created_at).toLocaleString("id-ID", { timeZone: "Asia/Jakarta", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export { ApplicantDetailModal };
