"use client";

import { ClipboardList, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { TrialFormModal } from "@/features/trials/components/TrialFormModal";
import type { TrialWithCount } from "@/features/trials/queries";

const STATUS_BADGE: Record<string, string> = {
  draft:  "bg-ui-hover text-ui-text-2",
  active: "bg-green-500/15 text-green-400",
  closed: "bg-ui-hover text-ui-text-muted",
};

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  active: "Aktif",
  closed: "Ditutup",
};

interface TrialListClientProps {
  orgSlug: string;
  trials: TrialWithCount[];
  divisionId: string | null;
  canManage: boolean;
  revalidatePaths: string[];
}

const TrialListClient = ({ orgSlug, trials, divisionId, canManage, revalidatePaths }: TrialListClientProps) => {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ui-text-2 uppercase tracking-wide">
          Semua Trial ({trials.length})
        </h2>
        {canManage && (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            disabled={!divisionId}
            title={!divisionId ? "Belum ada divisi aktif di organisasi ini" : undefined}
            className="inline-flex h-9 items-center gap-2 rounded-md bg-ui-text px-4 text-sm font-semibold text-ui-bg hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Buat Trial
          </button>
        )}
      </div>

      {canManage && !divisionId && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-400">
          Belum ada divisi aktif. Buat atau aktifkan divisi terlebih dahulu sebelum membuat trial.
        </div>
      )}

      {trials.length === 0 ? (
        <div className="rounded-xl border border-dashed border-ui-border bg-ui-surface/40 p-10 text-center">
          <ClipboardList className="mx-auto h-8 w-8 text-ui-text-muted" />
          <p className="mt-3 text-sm text-ui-text-2">Belum ada open trial.</p>
          {canManage && (
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              disabled={!divisionId}
              className="mt-4 inline-flex h-9 items-center rounded-md border border-white/15 px-4 text-sm font-medium text-ui-text transition hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
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
              className="flex items-center justify-between rounded-xl border border-ui-border bg-ui-surface px-5 py-4 hover:bg-ui-hover transition"
            >
              <div className="space-y-1">
                <p className="text-sm font-medium text-ui-text">{t.title}</p>
                <p className="text-xs text-ui-text-muted">
                  {t.division_name ?? t.game}
                  {t.positions.length > 0 && ` · ${t.positions.join(", ")}`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-ui-text-2">{t.applicant_count} pendaftar</span>
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
};
export { TrialListClient };
