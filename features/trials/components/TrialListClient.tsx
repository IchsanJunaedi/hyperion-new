"use client";

import { ClipboardList, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { TrialFormModal } from "@/features/trials/components/TrialFormModal";
import type { TrialWithCount } from "@/features/trials/queries";

const STATUS_BADGE: Record<string, string> = {
  draft:  "bg-[#2C2C2C] text-[#9B9A97]",
  active: "bg-green-500/15 text-green-400",
  closed: "bg-[#2C2C2C] text-[#6B6A68]",
};

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  active: "Aktif",
  closed: "Ditutup",
};

interface TrialListClientProps {
  orgSlug: string;
  trials: TrialWithCount[];
  divisionId: string;
  canManage: boolean;
  revalidatePaths: string[];
}

export function TrialListClient({ orgSlug, trials, divisionId, canManage, revalidatePaths }: TrialListClientProps) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[#9B9A97] uppercase tracking-wide">
          Semua Trial ({trials.length})
        </h2>
        {canManage && (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex h-9 items-center gap-2 rounded-md bg-[#E5E2E1] px-4 text-sm font-semibold text-[#191919] hover:bg-white cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Buat Trial
          </button>
        )}
      </div>

      {trials.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#2D2D2D] bg-[#202020]/40 p-10 text-center">
          <ClipboardList className="mx-auto h-8 w-8 text-[#6B6A68]" />
          <p className="mt-3 text-sm text-[#9B9A97]">Belum ada open trial.</p>
          {canManage && (
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="mt-4 inline-flex h-9 items-center rounded-md border border-white/15 px-4 text-sm font-medium text-white transition hover:bg-white/5 cursor-pointer"
            >
              Buat trial pertama
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {trials.map((t) => (
            <Link
              key={t.id}
              href={`/${orgSlug}/trials/${t.id}`}
              className="flex items-center justify-between rounded-xl border border-[#2D2D2D] bg-[#202020] px-5 py-4 hover:bg-[#2C2C2C] transition"
            >
              <div className="space-y-1">
                <p className="text-sm font-medium text-[#E5E2E1]">{t.title}</p>
                <p className="text-xs text-[#6B6A68]">
                  {t.division_name ?? t.game}
                  {t.positions.length > 0 && ` · ${t.positions.join(", ")}`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-[#9B9A97]">{t.applicant_count} pendaftar</span>
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${STATUS_BADGE[t.status]}`}>
                  {STATUS_LABEL[t.status]}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {modalOpen && (
        <TrialFormModal
          divisionId={divisionId}
          revalidatePaths={revalidatePaths}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}
