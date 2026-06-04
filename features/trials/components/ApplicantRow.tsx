"use client";

import { Check, ChevronDown, MessageSquare, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { ConfirmDeleteDialog } from "@/features/dashboard/components/ConfirmDeleteDialog";
import { useNotify } from "@/features/dashboard/components/NotifyModal";
import { ApplicantDetailModal } from "@/features/trials/components/ApplicantDetailModal";
import { updateApplicantStatusAction, deleteApplicantAction } from "@/features/trials/actions";
import type { ApplicantRow as ApplicantRowType } from "@/features/trials/queries";
import { cn } from "@/lib/utils/cn";

const STATUS_OPTIONS = [
  { value: "pending",    label: "Pending",  color: "text-[#9B9A97] bg-[#2C2C2C]" },
  { value: "accepted",   label: "Diterima", color: "text-green-400 bg-green-500/15" },
  { value: "waitlisted", label: "Waitlist", color: "text-yellow-400 bg-yellow-500/15" },
  { value: "rejected",   label: "Ditolak",  color: "text-red-400 bg-red-500/15" },
] as const;

interface ApplicantRowProps {
  applicant: ApplicantRowType;
  trialId: string;
  canManage: boolean;
  revalidatePaths: string[];
}

const ApplicantRow = ({ applicant, trialId, canManage, revalidatePaths }: ApplicantRowProps) => {
  const router = useRouter();
  const { success, error: notifyError } = useNotify();
  const [dropOpen, setDropOpen] = useState(false);
  const [updating, startUpdate] = useTransition();
  const [deleting, startDelete] = useTransition();
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [showNotes, setShowNotes] = useState(!!applicant.notes);
  const [notesValue, setNotesValue] = useState(applicant.notes ?? "");
  const [notesSaving, startNotesSave] = useTransition();
  const [detailOpen, setDetailOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  const currentStatus = STATUS_OPTIONS.find((s) => s.value === applicant.status) ?? STATUS_OPTIONS[0];

  useEffect(() => {
    if (!dropOpen) return;
    function handle(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [dropOpen]);

  function handleStatus(val: string) {
    setDropOpen(false);
    startUpdate(async () => {
      const res = await updateApplicantStatusAction(
        applicant.id, trialId, val as ApplicantRowType["status"],
        notesValue || undefined, revalidatePaths,
      );
      if (res.ok) { success("Status diperbarui"); router.refresh(); }
      else notifyError(res.message);
    });
  }

  function handleSaveNotes() {
    startNotesSave(async () => {
      const res = await updateApplicantStatusAction(
        applicant.id, trialId, applicant.status,
        notesValue || undefined, revalidatePaths,
      );
      if (res.ok) success("Catatan disimpan");
      else notifyError(res.message);
    });
  }

  function handleDelete() {
    startDelete(async () => {
      const res = await deleteApplicantAction(applicant.id, trialId, revalidatePaths);
      if (res.ok) { success("Pendaftar dihapus"); router.refresh(); }
      else notifyError(res.message);
      setConfirmDeleteOpen(false);
    });
  }

  return (
    <>
      <div className="border-b border-[#2D2D2D] last:border-0">
        <div
          role="button"
          tabIndex={0}
          onClick={() => setDetailOpen(true)}
          onKeyDown={(e) => e.key === "Enter" && setDetailOpen(true)}
          className="grid grid-cols-[1fr_1fr_1fr_auto] gap-4 items-start px-4 py-3 text-sm cursor-pointer hover:bg-[#2C2C2C] transition-colors"
        >

          {/* Identitas */}
          <div className="space-y-0.5">
            <p className="font-medium text-[#E5E2E1]">{applicant.name}</p>
            <p className="text-xs text-[#9B9A97]">{applicant.ign}</p>
            <p className="text-xs text-[#6B6A68]">
              {applicant.age} th{applicant.city ? ` · ${applicant.city}` : ""}
            </p>
            <p className="text-xs text-[#6B6A68]">
              {applicant.is_free_agent ? "Free agent" : "Masih di tim"}
            </p>
          </div>

          {/* Kontak */}
          <div className="space-y-0.5">
            <p className="text-xs text-[#9B9A97]">{applicant.phone}</p>
            <p className="text-xs text-[#6B6A68] truncate">{applicant.email}</p>
            {applicant.social_media && (
              <p className="text-xs text-[#6B6A68] truncate">{applicant.social_media}</p>
            )}
          </div>

          {/* Game Info */}
          <div className="space-y-0.5">
            <p className="text-xs font-medium text-[#E5E2E1]">{applicant.role_applied}</p>
            <p className="text-xs text-[#9B9A97]">
              {applicant.rank}{applicant.win_rate ? ` · ${applicant.win_rate}% WR` : ""}
            </p>
            {applicant.game_id && (
              <p className="text-xs text-[#6B6A68] truncate">
                ID: {applicant.game_id}
                {applicant.game_nickname ? ` (${applicant.game_nickname})` : ""}
              </p>
            )}
            {(applicant.hero_pool?.length ?? 0) > 0 && (
              <p className="text-xs text-[#6B6A68] truncate">
                {applicant.hero_pool!.slice(0, 3).join(", ")}
                {(applicant.hero_pool?.length ?? 0) > 3 ? ` +${applicant.hero_pool!.length - 3}` : ""}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 pt-0.5" onClick={(e) => e.stopPropagation()}>
            {canManage ? (
              <div ref={dropRef} className="relative">
                <button
                  type="button"
                  onClick={() => setDropOpen((v) => !v)}
                  disabled={updating}
                  className={cn("inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-semibold cursor-pointer", currentStatus.color)}
                >
                  {currentStatus.label}
                  <ChevronDown className="h-3 w-3" />
                </button>
                {dropOpen && (
                  <div className="absolute right-0 top-full z-50 mt-1 w-36 rounded-lg border border-[#2D2D2D] bg-[#202020] py-1 shadow-xl">
                    {STATUS_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleStatus(opt.value)}
                        className="flex w-full items-center justify-between px-3 py-1.5 text-xs hover:bg-[#2C2C2C] cursor-pointer"
                      >
                        <span className={opt.color.split(" ")[0]}>{opt.label}</span>
                        {applicant.status === opt.value && <Check className="h-3 w-3 text-[#9B9A97]" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <span className={cn("inline-flex h-7 items-center rounded-full px-2.5 text-[11px] font-semibold", currentStatus.color)}>
                {currentStatus.label}
              </span>
            )}

            {canManage && (
              <>
                <button
                  type="button"
                  onClick={() => setShowNotes((v) => !v)}
                  title="Catatan internal"
                  className={cn("text-[#6B6A68] hover:text-[#9B9A97] cursor-pointer", showNotes && "text-yellow-400 hover:text-yellow-300")}
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDeleteOpen(true)}
                  disabled={deleting}
                  className="text-[#6B6A68] hover:text-red-400 cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                <ConfirmDeleteDialog
                  open={confirmDeleteOpen}
                  title="Hapus Pendaftar"
                  message={`Hapus pendaftar ${applicant.name}? Tindakan ini tidak bisa dibatalkan.`}
                  confirmPhrase="HAPUS"
                  pending={deleting}
                  onConfirm={handleDelete}
                  onCancel={() => setConfirmDeleteOpen(false)}
                />
              </>
            )}
          </div>
        </div>

        {/* Inline notes editor */}
        {showNotes && canManage && (
          <div className="border-t border-[#2D2D2D]/50 bg-[#191919] px-4 py-2.5">
            <div className="flex items-start gap-2">
              <textarea
                value={notesValue}
                onChange={(e) => setNotesValue(e.target.value)}
                placeholder="Catatan internal tentang pendaftar ini…"
                rows={2}
                className="flex-1 resize-none rounded-md border border-[#2D2D2D] bg-[#141414] px-3 py-1.5 text-xs text-[#E5E2E1] placeholder-[#6B6A68] focus:border-white/20 focus:outline-none"
              />
              <button
                type="button"
                disabled={notesSaving}
                onClick={handleSaveNotes}
                className="shrink-0 rounded-md bg-[#2C2C2C] px-2.5 py-1.5 text-[10px] font-medium text-[#9B9A97] transition hover:bg-[#353434] hover:text-[#E5E2E1] disabled:opacity-50 cursor-pointer"
              >
                {notesSaving ? "..." : "Simpan"}
              </button>
            </div>
          </div>
        )}
      </div>

      {detailOpen && (
        <ApplicantDetailModal applicant={applicant} onClose={() => setDetailOpen(false)} />
      )}
    </>
  );
};

export { ApplicantRow };
