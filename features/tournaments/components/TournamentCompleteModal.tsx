"use client";

import { AlertTriangle, Loader2, Trophy, X } from "lucide-react";
import { useState, useTransition } from "react";

import { NumberInput } from "@/components/ui/number-input";
import { useNotify } from "@/features/dashboard/components/NotifyModal";
import { completeTournamentAction } from "@/features/tournaments/actions";

interface TournamentCompleteModalProps {
  tournamentId: string;
  tournamentName: string;
  orgSlug: string;
  isPastStartDate: boolean;
  onClose: () => void;
  initialResult?: {
    placement: number | null;
    prize_earned: string | null;
    notes: string | null;
  } | null;
}

const COMMON_ROUNDS = [16, 32, 64, 128];

function formatRupiah(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("id-ID");
}

const TournamentCompleteModal = ({
  tournamentId,
  tournamentName,
  orgSlug,
  isPastStartDate,
  onClose,
  initialResult,
}: TournamentCompleteModalProps) => {
  const { success, error: notifyError } = useNotify();
  const [pending, startTransition] = useTransition();

  const [won, setWon] = useState(() => {
    if (initialResult) {
      return initialResult.placement !== null;
    }
    return true;
  });

  // Won fields
  const [placement, setPlacement] = useState(() => {
    if (initialResult && initialResult.placement !== null) {
      return String(initialResult.placement);
    }
    return "";
  });
  const [prizeRaw, setPrizeRaw] = useState(() => {
    if (initialResult && initialResult.prize_earned) {
      return initialResult.prize_earned;
    }
    return "";
  });
  const [prizeDisplay, setPrizeDisplay] = useState(() => {
    if (initialResult && initialResult.prize_earned) {
      return formatRupiah(initialResult.prize_earned);
    }
    return "";
  });

  // Eliminated fields
  const [eliminatedRound, setEliminatedRound] = useState<number | null>(() => {
    if (initialResult && initialResult.placement === null && initialResult.notes) {
      const match = initialResult.notes.match(/^Gugur babak (\d+)(?:\s*—\s*(.*))?$/);
      if (match) {
        const round = parseInt(match[1] || "", 10);
        if (COMMON_ROUNDS.includes(round)) {
          return round;
        }
      }
    }
    return null;
  });
  const [customRound, setCustomRound] = useState(() => {
    if (initialResult && initialResult.placement === null && initialResult.notes) {
      const match = initialResult.notes.match(/^Gugur babak (\d+)(?:\s*—\s*(.*))?$/);
      if (match) {
        const round = parseInt(match[1] || "", 10);
        if (!COMMON_ROUNDS.includes(round)) {
          return String(round);
        }
      }
    }
    return "";
  });

  const [notes, setNotes] = useState(() => {
    if (initialResult) {
      if (initialResult.placement === null && initialResult.notes) {
        const match = initialResult.notes.match(/^Gugur babak (\d+)(?:\s*—\s*(.*))?$/);
        if (match) {
          return match[2] ?? "";
        }
      }
      return initialResult.notes ?? "";
    }
    return "";
  });

  const [confirmEarly, setConfirmEarly] = useState(false);

  function handlePrizeChange(val: string) {
    const digits = val.replace(/\D/g, "");
    setPrizeRaw(digits);
    setPrizeDisplay(formatRupiah(val));
  }

  function handleSubmit() {
    if (!isPastStartDate && !confirmEarly) {
      setConfirmEarly(true);
      return;
    }

    const effectiveRound = eliminatedRound ?? (customRound ? parseInt(customRound, 10) : null);

    if (!won && !effectiveRound) {
      notifyError("Masukkan babak gugur terlebih dahulu.");
      return;
    }

    startTransition(async () => {
      const res = await completeTournamentAction(orgSlug, tournamentId, {
        won,
        placement: won && placement ? parseInt(placement, 10) : null,
        prizeEarned: won && prizeRaw ? prizeRaw : null,
        eliminatedRound: !won ? effectiveRound : null,
        notes: notes.trim() || null,
      });
      if (res.ok) {
        success(won ? "Selamat! Hasil turnamen berhasil dicatat." : "Turnamen selesai dicatat.");
        onClose();
      } else {
        notifyError(res.message);
      }
    });
  }

  if (confirmEarly) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="w-full max-w-sm rounded-xl border border-yellow-500/20 bg-ui-bg p-5 shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-yellow-500/10">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-ui-text">Turnamen belum dimulai</h3>
              <p className="text-xs text-ui-text-2">Yakin ingin menyelesaikan sekarang?</p>
            </div>
          </div>
          <p className="text-sm text-ui-text-2 mb-4">
            Tanggal turnamen belum tiba. Hasil tetap akan dicatat sesuai input Anda.
          </p>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setConfirmEarly(false)}
              className="h-9 rounded-md border border-ui-border px-4 text-xs font-medium text-ui-text-2 hover:bg-ui-hover cursor-pointer">
              Kembali
            </button>
            <button type="submit" disabled={pending}
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-yellow-400 px-4 text-xs font-semibold text-black hover:bg-yellow-300 disabled:opacity-50 cursor-pointer">
              {pending && <Loader2 className="h-3 w-3 animate-spin" />}
              Tetap Selesaikan
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className="w-full max-w-md rounded-xl border border-ui-border bg-ui-bg p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-yellow-500/10">
              <Trophy className="h-4.5 w-4.5 text-yellow-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-ui-text">Hasil Turnamen</h3>
              <p className="text-xs text-ui-text-muted truncate max-w-[220px]">{tournamentName}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-ui-text-muted hover:text-ui-text-2 cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Won / Eliminated toggle */}
        <div className="mb-5 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setWon(true)}
            className={`flex items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium transition cursor-pointer ${
              won
                ? "border-yellow-400/40 bg-yellow-400/10 text-yellow-300"
                : "border-ui-border text-ui-text-muted hover:border-[#3D3D3D] hover:text-ui-text-2"
            }`}
          >
            <Trophy className="h-4 w-4" />
            Menang / Juara
          </button>
          <button
            type="button"
            onClick={() => setWon(false)}
            className={`flex items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium transition cursor-pointer ${
              !won
                ? "border-ui-text-2/40 bg-ui-elevated text-ui-text"
                : "border-ui-border text-ui-text-muted hover:border-[#3D3D3D] hover:text-ui-text-2"
            }`}
          >
            Gugur / Tidak Menang
          </button>
        </div>

        <div className="space-y-4">
          {won ? (
            <>
              {/* Juara position */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ui-text-2">
                  Posisi Juara <span className="text-ui-text-muted">(misal: 1, 2, 3)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-yellow-400 z-10">Juara</span>
                  <NumberInput
                    min="1"
                    max="999"
                    value={placement}
                    onChange={(e) => setPlacement(e.target.value)}
                    placeholder="1"
                    className="bg-ui-bg pl-16 focus:border-yellow-400/50 h-10"
                  />
                </div>
              </div>

              {/* Prize amount */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ui-text-2">
                  Total Hadiah <span className="text-ui-text-muted">(Rp, opsional)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-ui-text-muted">Rp</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={prizeDisplay}
                    onChange={(e) => handlePrizeChange(e.target.value)}
                    placeholder="5.000.000"
                    className="h-10 w-full rounded-md border border-ui-border bg-ui-bg pl-9 pr-3 text-sm text-ui-text focus:border-yellow-400/50 focus:outline-none"
                  />
                </div>
                {prizeRaw && (
                  <p className="mt-1 text-xs text-yellow-400/70">
                    = Rp {Number(prizeRaw).toLocaleString("id-ID")}
                  </p>
                )}
              </div>
            </>
          ) : (
            /* Eliminated round */
            <div>
              <label className="mb-1.5 block text-xs font-medium text-ui-text-2">
                Gugur di babak penyisihan
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {COMMON_ROUNDS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => { setEliminatedRound(r); setCustomRound(""); }}
                    className={`h-8 rounded-md border px-3 text-xs font-medium transition cursor-pointer ${
                      eliminatedRound === r
                        ? "border-ui-text-2/50 bg-ui-hover text-ui-text"
                        : "border-ui-border text-ui-text-muted hover:border-[#3D3D3D] hover:text-ui-text-2"
                    }`}
                  >
                    Babak {r}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-ui-text-muted shrink-0">Lainnya:</span>
                <NumberInput
                  min="1"
                  value={customRound}
                  onChange={(e) => { setCustomRound(e.target.value); setEliminatedRound(null); }}
                  placeholder="misal: 8"
                  className="bg-ui-bg focus:border-ui-text-2/50 h-8 text-xs"
                  containerClassName="w-28 shrink-0"
                />
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ui-text-2">Catatan <span className="text-ui-text-muted">(opsional)</span></label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Misal: kalah di overtime, dll."
              className="h-9 w-full rounded-md border border-ui-border bg-ui-bg px-3 text-sm text-ui-text focus:border-ui-text-2/50 focus:outline-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose}
            className="h-9 rounded-md border border-ui-border px-4 text-xs font-medium text-ui-text-2 hover:bg-ui-hover cursor-pointer">
            Batal
          </button>
          <button type="submit" disabled={pending}
            className={`inline-flex h-9 items-center gap-1.5 rounded-md px-4 text-xs font-semibold transition disabled:opacity-50 cursor-pointer ${
              won
                ? "bg-yellow-400 text-black hover:bg-yellow-300"
                : "bg-ui-text text-ui-bg hover:bg-white"
            }`}>
            {pending && <Loader2 className="h-3 w-3 animate-spin" />}
            {won ? "Catat Kemenangan" : "Catat Hasil"}
          </button>
        </div>
      </form>
    </div>
  );
};
export { TournamentCompleteModal };
