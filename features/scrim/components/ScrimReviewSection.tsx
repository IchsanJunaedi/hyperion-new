"use client";

import { CheckCircle2, ClipboardCheck, Loader2, MessageSquarePlus } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { requestScrimReviewAction, submitScrimReviewAction } from "../actions";
import type { ScrimReviewRequest } from "../queries";

interface ScrimReviewSectionProps {
  orgSlug: string;
  scrimId: string;
  role: string | null;
  reviewRequest: ScrimReviewRequest | null;
  scrimCompleted: boolean;
}

const ScrimReviewSection = ({
  orgSlug,
  scrimId,
  role,
  reviewRequest: initial,
  scrimCompleted,
}: ScrimReviewSectionProps) => {
  const [reviewRequest, setReviewRequest] = useState(initial);
  const [notes, setNotes] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [requestPending, startRequest] = useTransition();
  const [reviewPending, startReview] = useTransition();

  const isCaptainOrMember = role === "captain" || role === "member";
  const isCoach = role === "coach";

  function handleRequest() {
    startRequest(async () => {
      const res = await requestScrimReviewAction(orgSlug, scrimId, notes);
      if (res.ok) {
        toast.success("Review berhasil diminta!");
        setReviewRequest({
          id: "",
          scrim_id: scrimId,
          requested_by: "",
          notes: notes || null,
          status: "pending",
          review_notes: null,
          reviewed_at: null,
          reviewed_by: null,
          created_at: new Date().toISOString(),
        });
        setShowForm(false);
        setNotes("");
      } else {
        toast.error(res.message);
      }
    });
  }

  function handleReview() {
    startReview(async () => {
      const res = await submitScrimReviewAction(orgSlug, scrimId, reviewNotes);
      if (res.ok) {
        toast.success("Review dikirim!");
        setReviewRequest((prev) =>
          prev
            ? { ...prev, status: "reviewed", review_notes: reviewNotes }
            : prev,
        );
        setShowReviewForm(false);
        setReviewNotes("");
      } else {
        toast.error(res.message);
      }
    });
  }

  if (!scrimCompleted) return null;

  return (
    <article className="rounded-2xl border border-white/10 bg-zinc-900/40 p-5 space-y-3">
      <div className="flex items-center gap-2">
        <ClipboardCheck className="h-4 w-4 text-blue-400" />
        <h2 className="text-sm font-semibold text-ui-text">Review Coach</h2>
        {reviewRequest?.status === "reviewed" && (
          <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-semibold text-green-400">
            Selesai
          </span>
        )}
        {reviewRequest?.status === "pending" && (
          <span className="rounded-full bg-yellow-500/10 px-2 py-0.5 text-[10px] font-semibold text-yellow-400">
            Menunggu
          </span>
        )}
      </div>

      {/* Reviewed state */}
      {reviewRequest?.status === "reviewed" && reviewRequest.review_notes && (
        <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4">
          <p className="text-xs text-green-400/70 mb-1">Catatan Coach:</p>
          <p className="text-sm text-ui-text whitespace-pre-wrap">
            {reviewRequest.review_notes}
          </p>
        </div>
      )}

      {/* Pending state */}
      {reviewRequest?.status === "pending" && reviewRequest.notes && (
        <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-3">
          <p className="text-xs text-yellow-400/70 mb-1">Catatan permintaan:</p>
          <p className="text-sm text-ui-text">{reviewRequest.notes}</p>
        </div>
      )}

      {/* Captain/member: request button */}
      {isCaptainOrMember && !reviewRequest && (
        <>
          {showForm ? (
            <div className="space-y-2">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Catatan untuk coach (opsional)"
                rows={2}
                className="w-full resize-none rounded-xl border border-white/10 bg-zinc-900/60 px-3 py-2 text-sm text-white/85 placeholder-white/30 focus:border-white/20 focus:outline-none"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={requestPending}
                  onClick={handleRequest}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-blue-500 px-4 text-xs font-semibold text-white hover:bg-blue-400 disabled:opacity-50 cursor-pointer"
                >
                  {requestPending && <Loader2 className="h-3 w-3 animate-spin" />}
                  Kirim Request
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="h-8 rounded-lg border border-white/10 px-3 text-xs text-ui-text-2 hover:bg-white/5 cursor-pointer"
                >
                  Batal
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-ui-text-2 hover:bg-white/5 hover:text-ui-text transition cursor-pointer"
            >
              <MessageSquarePlus className="h-3.5 w-3.5" />
              Minta review dari coach
            </button>
          )}
        </>
      )}

      {/* Coach: review form */}
      {isCoach && reviewRequest?.status === "pending" && (
        <>
          {showReviewForm ? (
            <div className="space-y-2">
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Catatan review untuk tim..."
                rows={4}
                className="w-full resize-none rounded-xl border border-white/10 bg-zinc-900/60 px-3 py-2 text-sm text-white/85 placeholder-white/30 focus:border-white/20 focus:outline-none"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={reviewPending || !reviewNotes.trim()}
                  onClick={handleReview}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-green-500 px-4 text-xs font-semibold text-white hover:bg-green-400 disabled:opacity-50 cursor-pointer"
                >
                  {reviewPending && <Loader2 className="h-3 w-3 animate-spin" />}
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Kirim Review
                </button>
                <button
                  type="button"
                  onClick={() => setShowReviewForm(false)}
                  className="h-8 rounded-lg border border-white/10 px-3 text-xs text-ui-text-2 hover:bg-white/5 cursor-pointer"
                >
                  Batal
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowReviewForm(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-500/10 border border-blue-500/20 px-3 py-2 text-xs text-blue-400 hover:bg-blue-500/20 transition cursor-pointer"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Tulis review
            </button>
          )}
        </>
      )}

      {!reviewRequest && !isCaptainOrMember && !isCoach && (
        <p className="text-xs text-ui-text-muted">Belum ada request review.</p>
      )}
    </article>
  );
};
export { ScrimReviewSection };
