"use client";

import { Check, Copy, LayoutGrid, List, Loader2, MessageSquare, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { CustomSelect } from "@/features/dashboard/components/CustomSelect";
import { useNotify } from "@/features/dashboard/components/NotifyModal";
import { updateTrialStatusAction, updateApplicantStatusAction } from "@/features/trials/actions";
import { ApplicantRow } from "@/features/trials/components/ApplicantRow";
import type { ApplicantRow as ApplicantRowType, TrialRow } from "@/features/trials/queries";
import { cn } from "@/lib/utils/cn";

const STATUS_OPTIONS: Array<{ value: "draft" | "active" | "closed"; label: string }> = [
  { value: "draft",  label: "Draft"   },
  { value: "active", label: "Aktif"   },
  { value: "closed", label: "Ditutup" },
];

interface TrialDetailClientProps {
  trial: TrialRow;
  applicants: ApplicantRowType[];
  canManage: boolean;
  appUrl: string;
  revalidatePaths: string[];
}

const PIPELINE_COLS = [
  { status: "pending",    label: "Pending",  color: "border-ui-border text-ui-text-2",  dot: "bg-white/30" },
  { status: "waitlisted", label: "Waitlist", color: "border-yellow-500/30 text-yellow-400", dot: "bg-yellow-400" },
  { status: "accepted",   label: "Diterima", color: "border-green-500/30 text-green-400",   dot: "bg-green-400" },
  { status: "rejected",   label: "Ditolak",  color: "border-red-500/30 text-red-400",       dot: "bg-red-400" },
] as const;

function PipelineCard({
  applicant,
  canManage,
  revalidatePaths,
}: { applicant: ApplicantRowType; canManage: boolean; revalidatePaths: string[] }) {
  const router = useRouter();
  const { success, error: notifyError } = useNotify();
  const [pending, start] = useTransition();
  const [notesSaving, startNotesSave] = useTransition();
  const [showNotes, setShowNotes] = useState(!!applicant.notes);
  const [notesValue, setNotesValue] = useState(applicant.notes ?? "");

  function moveTo(status: string) {
    start(async () => {
      const res = await updateApplicantStatusAction(
        applicant.id, applicant.trial_id, status as ApplicantRowType["status"], notesValue || undefined, revalidatePaths,
      );
      if (res.ok) { success("Status diperbarui"); router.refresh(); }
      else notifyError(res.message);
    });
  }

  function handleSaveNotes() {
    startNotesSave(async () => {
      const res = await updateApplicantStatusAction(applicant.id, applicant.trial_id, applicant.status, notesValue || undefined, revalidatePaths);
      if (res.ok) success("Catatan disimpan");
      else notifyError(res.message);
    });
  }

  return (
    <div className="rounded-lg border border-ui-border bg-ui-bg p-3 space-y-2">
      <div>
        <p className="text-xs font-semibold text-ui-text truncate">{applicant.name}</p>
        <p className="text-[10px] text-ui-text-muted truncate">{applicant.ign} · {applicant.rank}</p>
      </div>
      {applicant.role_applied && (
        <span className="inline-block rounded-full bg-ui-hover px-2 py-0.5 text-[10px] text-ui-text-2">{applicant.role_applied}</span>
      )}
      {canManage && (
        <>
          <div className="flex flex-wrap gap-1 pt-1">
            {PIPELINE_COLS.filter((c) => c.status !== applicant.status).map((col) => (
              <button
                key={col.status}
                type="button"
                disabled={pending}
                onClick={() => moveTo(col.status)}
                className={cn(
                  "inline-flex h-5 items-center gap-1 rounded px-1.5 text-[9px] font-semibold border transition cursor-pointer disabled:opacity-40",
                  col.color,
                )}
              >
                {pending ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : `→ ${col.label}`}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setShowNotes((v) => !v)}
              className={cn("inline-flex h-5 items-center rounded px-1.5 transition cursor-pointer", showNotes ? "text-yellow-400" : "text-ui-text-muted hover:text-ui-text-2")}
              title="Catatan"
            >
              <MessageSquare className="h-3 w-3" />
            </button>
          </div>
          {showNotes && (
            <div className="flex items-start gap-1.5 pt-0.5">
              <textarea
                value={notesValue}
                onChange={(e) => setNotesValue(e.target.value)}
                placeholder="Catatan…"
                rows={2}
                className="flex-1 resize-none rounded border border-ui-border bg-ui-bg px-2 py-1 text-[10px] text-ui-text placeholder-ui-text-muted focus:border-white/20 focus:outline-none"
              />
              <button
                type="button"
                disabled={notesSaving}
                onClick={handleSaveNotes}
                className="shrink-0 rounded bg-ui-hover px-1.5 py-1 text-[9px] font-medium text-ui-text-2 transition hover:bg-ui-hover-strong hover:text-ui-text disabled:opacity-50 cursor-pointer"
              >
                {notesSaving ? "..." : "OK"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const TrialDetailClient = ({ trial, applicants, canManage, appUrl, revalidatePaths }: TrialDetailClientProps) => {
  const router = useRouter();
  const { success, error: notifyError } = useNotify();
  const [updating, startUpdate] = useTransition();
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "pipeline">("table");
  const [roleFilter, setRoleFilter] = useState("");
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const uniqueRoles = [...new Set(applicants.map((a) => a.role_applied).filter(Boolean))] as string[];
  const roleOptions = [
    { value: "", label: "Semua Role" },
    ...uniqueRoles.map((r) => ({ value: r, label: r })),
  ];
  const visibleApplicants = roleFilter
    ? applicants.filter((a) => a.role_applied === roleFilter)
    : applicants;

  const registrationUrl = `${appUrl}/trial/${trial.public_token}`;

  useEffect(() => () => { if (copyTimerRef.current) clearTimeout(copyTimerRef.current); }, []);

  function copyLink() {
    navigator.clipboard.writeText(registrationUrl).then(() => {
      setCopied(true);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
    }).catch(() => notifyError("Gagal menyalin link"));
  }

  function handleStatus(val: "draft" | "active" | "closed") {
    startUpdate(async () => {
      const res = await updateTrialStatusAction(trial.id, val, revalidatePaths);
      if (res.ok) { success("Status trial diperbarui"); router.refresh(); }
      else notifyError(res.message);
    });
  }

  const pending    = applicants.filter((a) => a.status === "pending").length;
  const accepted   = applicants.filter((a) => a.status === "accepted").length;
  const waitlisted = applicants.filter((a) => a.status === "waitlisted").length;
  const rejected   = applicants.filter((a) => a.status === "rejected").length;

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="rounded-xl border border-ui-border bg-ui-surface p-5 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-ui-text">{trial.title}</h2>
            <p className="text-sm text-ui-text-2">{trial.game}</p>
            {trial.positions.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {trial.positions.map((p) => (
                  <span key={p} className="rounded-full bg-ui-hover px-2 py-0.5 text-xs text-ui-text-2">{p}</span>
                ))}
              </div>
            )}
          </div>
          {canManage && (
            <div className="flex items-center gap-2">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleStatus(opt.value)}
                  disabled={updating || trial.status === opt.value}
                  className={`h-8 rounded-md border px-3 text-xs font-semibold transition cursor-pointer disabled:opacity-40 ${
                    trial.status === opt.value
                      ? "border-ui-text-2 bg-ui-hover text-ui-text"
                      : "border-ui-border text-ui-text-muted hover:border-ui-text-2 hover:text-ui-text-2"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Registration link — shown for draft (preview) and active (shareable) */}
        {trial.status !== "closed" && (
          <div className={`rounded-lg border px-3 py-2 ${trial.status === "active" ? "border-ui-border bg-ui-bg" : "border-dashed border-ui-border bg-ui-bg/50"}`}>
            {trial.status === "draft" && (
              <p className="text-[10px] text-ui-text-muted mb-1.5">Aktifkan trial agar link ini bisa diakses pendaftar.</p>
            )}
            <div className="flex items-center gap-2">
              <p className={`flex-1 truncate text-xs font-mono ${trial.status === "active" ? "text-ui-text-2" : "text-ui-text-muted"}`}>{registrationUrl}</p>
              {trial.status === "active" && (
                <button
                  type="button"
                  onClick={copyLink}
                  className="inline-flex items-center gap-1.5 rounded-md border border-ui-border px-2.5 py-1 text-xs text-ui-text-2 hover:bg-ui-hover cursor-pointer"
                >
                  {copied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
                  {copied ? "Tersalin" : "Salin"}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-5 gap-3 text-center">
          {[
            { label: "Total",    value: applicants.length, color: "text-ui-text" },
            { label: "Pending",  value: pending,           color: "text-ui-text-2" },
            { label: "Diterima", value: accepted,          color: "text-green-400" },
            { label: "Waitlist", value: waitlisted,        color: "text-yellow-400" },
            { label: "Ditolak",  value: rejected,          color: "text-red-400" },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border border-ui-border py-2">
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-ui-text-muted">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* View toggle + applicants */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-ui-text">
            Pendaftar{" "}
            <span className="text-ui-text-muted font-normal">
              ({roleFilter ? `${visibleApplicants.length}/${applicants.length}` : applicants.length})
            </span>
          </p>
          <div className="flex items-center gap-2">
            {uniqueRoles.length > 0 && (
              <CustomSelect
                value={roleFilter}
                options={roleOptions}
                onChange={setRoleFilter}
              />
            )}
            <div className="flex items-center rounded-md border border-ui-border p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              title="Tampilan Tabel"
              className={cn(
                "flex h-7 w-7 cursor-pointer items-center justify-center rounded transition",
                viewMode === "table" ? "bg-ui-hover text-ui-text" : "text-ui-text-muted hover:text-ui-text",
              )}
            >
              <List className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("pipeline")}
              title="Tampilan Pipeline"
              className={cn(
                "flex h-7 w-7 cursor-pointer items-center justify-center rounded transition",
                viewMode === "pipeline" ? "bg-ui-hover text-ui-text" : "text-ui-text-muted hover:text-ui-text",
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
          </div>
          </div>
        </div>

        {applicants.length === 0 ? (
          <div className="rounded-xl border border-ui-border bg-ui-surface py-12 text-center">
            <Users className="mx-auto h-8 w-8 text-ui-text-muted" />
            <p className="mt-3 text-sm text-ui-text-2">
              {trial.status === "active" ? "Belum ada pendaftar." : "Tidak ada pendaftar."}
            </p>
          </div>
        ) : visibleApplicants.length === 0 ? (
          <div className="rounded-xl border border-ui-border bg-ui-surface py-10 text-center">
            <Users className="mx-auto h-7 w-7 text-ui-text-muted" />
            <p className="mt-3 text-sm text-ui-text-2">Tidak ada pendaftar untuk role ini.</p>
          </div>
        ) : viewMode === "pipeline" ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {PIPELINE_COLS.map((col) => {
              const colApps = visibleApplicants.filter((a) => a.status === col.status);
              return (
                <div key={col.status} className="space-y-2">
                  <div className={cn("flex items-center gap-2 rounded-lg border px-3 py-2", col.color)}>
                    <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", col.dot)} />
                    <span className="text-xs font-semibold">{col.label}</span>
                    <span className="ml-auto text-[10px] opacity-60">{colApps.length}</span>
                  </div>
                  <div className="space-y-2">
                    {colApps.map((a) => (
                      <PipelineCard
                        key={a.id}
                        applicant={a}
                        canManage={canManage}
                        revalidatePaths={revalidatePaths}
                      />
                    ))}
                    {colApps.length === 0 && (
                      <div className="rounded-lg border border-dashed border-ui-border py-4 text-center">
                        <p className="text-[10px] text-ui-text-muted">Kosong</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-ui-border">
          <div className="min-w-[480px] bg-ui-surface">
            <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-4 border-b border-ui-border px-4 py-2">
              {["Identitas", "Kontak", "Game Info", "Status"].map((h) => (
                <p key={h} className="text-[10px] font-semibold uppercase tracking-wide text-ui-text-muted">{h}</p>
              ))}
            </div>
            {visibleApplicants.map((a) => (
              <ApplicantRow
                key={a.id}
                applicant={a}
                trialId={trial.id}
                canManage={canManage}
                revalidatePaths={revalidatePaths}
              />
            ))}
          </div>
          </div>
        )}
      </div>
    </div>
  );
};
export { TrialDetailClient };
