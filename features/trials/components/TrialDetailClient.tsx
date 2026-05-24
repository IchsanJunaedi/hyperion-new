"use client";

import { Check, Copy, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { useNotify } from "@/features/dashboard/components/NotifyModal";
import { updateTrialStatusAction } from "@/features/trials/actions";
import { ApplicantRow } from "@/features/trials/components/ApplicantRow";
import type { ApplicantRow as ApplicantRowType, TrialRow } from "@/features/trials/queries";

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

export function TrialDetailClient({ trial, applicants, canManage, appUrl, revalidatePaths }: TrialDetailClientProps) {
  const router = useRouter();
  const { success, error: notifyError } = useNotify();
  const [updating, startUpdate] = useTransition();
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      <div className="rounded-xl border border-[#2D2D2D] bg-[#202020] p-5 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-[#E5E2E1]">{trial.title}</h2>
            <p className="text-sm text-[#9B9A97]">{trial.game}</p>
            {trial.positions.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {trial.positions.map((p) => (
                  <span key={p} className="rounded-full bg-[#2C2C2C] px-2 py-0.5 text-xs text-[#9B9A97]">{p}</span>
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
                      ? "border-[#9B9A97] bg-[#2C2C2C] text-[#E5E2E1]"
                      : "border-[#2D2D2D] text-[#6B6A68] hover:border-[#9B9A97] hover:text-[#9B9A97]"
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
          <div className={`rounded-lg border px-3 py-2 ${trial.status === "active" ? "border-[#2D2D2D] bg-[#191919]" : "border-dashed border-[#2D2D2D] bg-[#191919]/50"}`}>
            {trial.status === "draft" && (
              <p className="text-[10px] text-[#6B6A68] mb-1.5">Aktifkan trial agar link ini bisa diakses pendaftar.</p>
            )}
            <div className="flex items-center gap-2">
              <p className={`flex-1 truncate text-xs font-mono ${trial.status === "active" ? "text-[#9B9A97]" : "text-[#6B6A68]"}`}>{registrationUrl}</p>
              {trial.status === "active" && (
                <button
                  type="button"
                  onClick={copyLink}
                  className="inline-flex items-center gap-1.5 rounded-md border border-[#2D2D2D] px-2.5 py-1 text-xs text-[#9B9A97] hover:bg-[#2C2C2C] cursor-pointer"
                >
                  {copied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
                  {copied ? "Tersalin" : "Salin"}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 text-center">
          {[
            { label: "Total",    value: applicants.length, color: "text-[#E5E2E1]" },
            { label: "Pending",  value: pending,           color: "text-[#9B9A97]" },
            { label: "Diterima", value: accepted,          color: "text-green-400" },
            { label: "Waitlist", value: waitlisted,        color: "text-yellow-400" },
            { label: "Ditolak",  value: rejected,          color: "text-red-400" },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border border-[#2D2D2D] py-2">
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-[#6B6A68]">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Applicant table */}
      <div className="rounded-xl border border-[#2D2D2D] bg-[#202020]">
        <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-4 border-b border-[#2D2D2D] px-4 py-2">
          {["Identitas", "Kontak", "Game Info", "Status"].map((h) => (
            <p key={h} className="text-[10px] font-semibold uppercase tracking-wide text-[#6B6A68]">{h}</p>
          ))}
        </div>

        {applicants.length === 0 ? (
          <div className="py-12 text-center">
            <Users className="mx-auto h-8 w-8 text-[#6B6A68]" />
            <p className="mt-3 text-sm text-[#9B9A97]">
              {trial.status === "active" ? "Belum ada pendaftar." : "Tidak ada pendaftar."}
            </p>
          </div>
        ) : (
          applicants.map((a) => (
            <ApplicantRow
              key={a.id}
              applicant={a}
              trialId={trial.id}
              canManage={canManage}
              revalidatePaths={revalidatePaths}
            />
          ))
        )}
      </div>
    </div>
  );
}
