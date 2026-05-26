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
}

const COMMON_ROUNDS = [16, 32, 64, 128];

function formatRupiah(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("id-ID");
}

export function TournamentCompleteModal({
  tournamentId,
  tournamentName,
  orgSlug,
  isPastStartDate,
  onClose,
}: TournamentCompleteModalProps) {
  const { success, error: notifyError } = useNotify();
  const [pending, startTransition] = useTransition();

  const [won, setWon] = useState(true);

  // Won fields
  const [placement, setPlacement] = useState("");
  const [prizeDisplay, setPrizeDisplay] = useState("");
  const [prizeRaw, setPrizeRaw] = useState("");

  // Eliminated fields
  const [eliminatedRound, setEliminatedRound] = useState<number | null>(null);
  const [customRound, setCustomRound] = useState("");

  const [notes, setNotes] = useState("");
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
        <div className="w-full max-w-sm rounded-xl border border-yellow-500/20 bg-[#191919] p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-3 mb-3">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-yellow-500/10">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#E5E2E1]">Turnamen belum dimulai</h3>
              <p className="text-xs text-[#9B9A97]">Yakin ingin menyelesaikan sekarang?</p>
            </div>
          </div>
          <p className="text-sm text-[#9B9A97] mb-4">
            Tanggal turnamen belum tiba. Hasil tetap akan dicatat sesuai input Anda.
          </p>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setConfirmEarly(false)}
              className="h-9 rounded-md border border-[#2D2D2D] px-4 text-xs font-medium text-[#9B9A97] hover:bg-[#2C2C2C] cursor-pointer">
              Kembali
            </button>
            <button type="button" disabled={pending} onClick={handleSubmit}
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-yellow-400 px-4 text-xs font-semibold text-black hover:bg-yellow-300 disabled:opacity-50 cursor-pointer">
              {pending && <Loader2 className="h-3 w-3 animate-spin" />}
              Tetap Selesaikan
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl border border-[#2D2D2D] bg-[#191919] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-yellow-500/10">
              <Trophy className="h-4.5 w-4.5 text-yellow-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#E5E2E1]">Hasil Turnamen</h3>
              <p className="text-xs text-[#6B6A68] truncate max-w-[220px]">{tournamentName}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-[#6B6A68] hover:text-[#9B9A97] cursor-pointer">
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
                : "border-[#2D2D2D] text-[#6B6A68] hover:border-[#3D3D3D] hover:text-[#9B9A97]"
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
                ? "border-[#9B9A97]/40 bg-white/5 text-[#E5E2E1]"
                : "border-[#2D2D2D] text-[#6B6A68] hover:border-[#3D3D3D] hover:text-[#9B9A97]"
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
                <label className="mb-1.5 block text-xs font-medium text-[#9B9A97]">
                  Posisi Juara <span className="text-[#6B6A68]">(misal: 1, 2, 3)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-yellow-400 z-10">Juara</span>
                  <NumberInput
                    min="1"
                    max="999"
                    value={placement}
                    onChange={(e) => setPlacement(e.target.value)}
                    placeholder="1"
                    className="bg-[#141414] pl-16 focus:border-yellow-400/50 h-10"
                  />
                </div>
              </div>

              {/* Prize amount */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#9B9A97]">
                  Total Hadiah <span className="text-[#6B6A68]">(Rp, opsional)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#6B6A68]">Rp</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={prizeDisplay}
                    onChange={(e) => handlePrizeChange(e.target.value)}
                    placeholder="5.000.000"
                    className="h-10 w-full rounded-md border border-[#2D2D2D] bg-[#141414] pl-9 pr-3 text-sm text-[#E5E2E1] focus:border-yellow-400/50 focus:outline-none"
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
              <label className="mb-1.5 block text-xs font-medium text-[#9B9A97]">
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
                        ? "border-[#9B9A97]/50 bg-white/10 text-[#E5E2E1]"
                        : "border-[#2D2D2D] text-[#6B6A68] hover:border-[#3D3D3D] hover:text-[#9B9A97]"
                    }`}
                  >
                    Babak {r}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#6B6A68] shrink-0">Lainnya:</span>
                <NumberInput
                  min="1"
                  value={customRound}
                  onChange={(e) => { setCustomRound(e.target.value); setEliminatedRound(null); }}
                  placeholder="misal: 8"
                  className="bg-[#141414] focus:border-[#9B9A97]/50 h-8 text-xs"
                  containerClassName="w-28 shrink-0"
                />
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#9B9A97]">Catatan <span className="text-[#6B6A68]">(opsional)</span></label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Misal: kalah di overtime, dll."
              className="h-9 w-full rounded-md border border-[#2D2D2D] bg-[#141414] px-3 text-sm text-[#E5E2E1] focus:border-[#9B9A97]/50 focus:outline-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose}
            className="h-9 rounded-md border border-[#2D2D2D] px-4 text-xs font-medium text-[#9B9A97] hover:bg-[#2C2C2C] cursor-pointer">
            Batal
          </button>
          <button type="button" disabled={pending} onClick={handleSubmit}
            className={`inline-flex h-9 items-center gap-1.5 rounded-md px-4 text-xs font-semibold transition disabled:opacity-50 cursor-pointer ${
              won
                ? "bg-yellow-400 text-black hover:bg-yellow-300"
                : "bg-[#E5E2E1] text-[#191919] hover:bg-white"
            }`}>
            {pending && <Loader2 className="h-3 w-3 animate-spin" />}
            {won ? "Catat Kemenangan" : "Catat Hasil"}
          </button>
        </div>
      </div>
    </div>
  );
}
