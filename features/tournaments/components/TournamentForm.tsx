"use client";

import { Loader2 } from "lucide-react";
import { useState, useTransition } from "react";

import { useNotify } from "@/features/dashboard/components/NotifyModal";
import { createTournamentAction, updateTournamentAction } from "@/features/tournaments/actions";
import type { Tournament } from "@/features/tournaments/queries";

interface TournamentFormProps {
  orgSlug: string;
  divisionId: string;
  tournament?: Tournament;
  onSuccess?: () => void;
}

function formatNumber(value: string): string {
  const num = value.replace(/\D/g, "");
  if (!num) return "";
  return Number(num).toLocaleString("id-ID");
}

function parseNumber(formatted: string): string {
  return formatted.replace(/\./g, "");
}

export function TournamentForm({ orgSlug, divisionId, tournament, onSuccess }: TournamentFormProps) {
  const isEdit = !!tournament;
  const [pending, startTransition] = useTransition();
  const { success, error } = useNotify();

  const [name, setName] = useState(tournament?.name ?? "");
  const [organizer, setOrganizer] = useState(tournament?.organizer ?? "");
  const [startDate, setStartDate] = useState(tournament?.start_date ?? "");
  const [endDate, setEndDate] = useState(tournament?.end_date ?? "");
  const [prizePool, setPrizePool] = useState(tournament?.prize_pool ?? "");
  const [registrationFee, setRegistrationFee] = useState(tournament?.registration_fee ?? "");
  const [registrationDeadline, setRegistrationDeadline] = useState(
    tournament?.registration_deadline ? tournament.registration_deadline.slice(0, 16) : "",
  );
  const [registrationUrl, setRegistrationUrl] = useState(tournament?.registration_url ?? "");
  const [link, setLink] = useState(tournament?.link ?? "");
  const [isRegistered, setIsRegistered] = useState(tournament?.is_registered ?? false);
  const [notes, setNotes] = useState(tournament?.notes ?? "");

  function handleSubmit() {
    const payload = {
      ...(isEdit ? { tournament_id: tournament.id } : {}),
      division_id: divisionId,
      name,
      organizer: organizer || undefined,
      start_date: startDate,
      end_date: endDate || undefined,
      prize_pool: prizePool || undefined,
      registration_fee: registrationFee || undefined,
      registration_deadline: registrationDeadline || undefined,
      registration_url: registrationUrl || undefined,
      link: link || undefined,
      is_registered: isRegistered,
      notes: notes || undefined,
    };

    startTransition(async () => {
      const res = isEdit
        ? await updateTournamentAction(orgSlug, payload)
        : await createTournamentAction(orgSlug, payload);
      if (res.ok) {
        success(isEdit ? "Turnamen diperbarui!" : "Turnamen ditambahkan!");
        onSuccess?.();
      } else {
        error(res.message);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs text-[#9B9A97] mb-1 block">Nama Turnamen *</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-9 w-full rounded-md border border-[#2D2D2D] bg-[#202020] px-3 text-sm text-[#E5E2E1] focus:border-yellow-400/50 focus:outline-none"
        />
      </div>

      <div>
        <label className="text-xs text-[#9B9A97] mb-1 block">Penyelenggara</label>
        <input
          value={organizer}
          onChange={(e) => setOrganizer(e.target.value)}
          className="h-9 w-full rounded-md border border-[#2D2D2D] bg-[#202020] px-3 text-sm text-[#E5E2E1] focus:border-yellow-400/50 focus:outline-none"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs text-[#9B9A97] mb-1 block">Tanggal Mulai *</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="h-9 w-full rounded-md border border-[#2D2D2D] bg-[#202020] px-3 text-sm text-[#E5E2E1] focus:border-yellow-400/50 focus:outline-none"
          />
        </div>
        <div>
          <label className="text-xs text-[#9B9A97] mb-1 block">Tanggal Selesai</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="h-9 w-full rounded-md border border-[#2D2D2D] bg-[#202020] px-3 text-sm text-[#E5E2E1] focus:border-yellow-400/50 focus:outline-none"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs text-[#9B9A97] mb-1 block">Prize Pool (Rp)</label>
          <input
            value={prizePool}
            onChange={(e) => setPrizePool(formatNumber(e.target.value))}
            inputMode="numeric"
            className="h-9 w-full rounded-md border border-[#2D2D2D] bg-[#202020] px-3 text-sm text-[#E5E2E1] focus:border-yellow-400/50 focus:outline-none"
          />
        </div>
        <div>
          <label className="text-xs text-[#9B9A97] mb-1 block">Biaya Registrasi (Rp)</label>
          <input
            value={registrationFee}
            onChange={(e) => setRegistrationFee(formatNumber(e.target.value))}
            inputMode="numeric"
            className="h-9 w-full rounded-md border border-[#2D2D2D] bg-[#202020] px-3 text-sm text-[#E5E2E1] focus:border-yellow-400/50 focus:outline-none"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs text-[#9B9A97] mb-1 block">Deadline Registrasi</label>
          <input
            type="datetime-local"
            value={registrationDeadline}
            onChange={(e) => setRegistrationDeadline(e.target.value)}
            className="h-9 w-full rounded-md border border-[#2D2D2D] bg-[#202020] px-3 text-sm text-[#E5E2E1] focus:border-yellow-400/50 focus:outline-none"
          />
        </div>
        <div>
          <label className="text-xs text-[#9B9A97] mb-1 block">Link Turnamen</label>
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            className="h-9 w-full rounded-md border border-[#2D2D2D] bg-[#202020] px-3 text-sm text-[#E5E2E1] focus:border-yellow-400/50 focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="text-xs text-[#9B9A97] mb-1 block">URL Registrasi</label>
        <input
          value={registrationUrl}
          onChange={(e) => setRegistrationUrl(e.target.value)}
          className="h-9 w-full rounded-md border border-[#2D2D2D] bg-[#202020] px-3 text-sm text-[#E5E2E1] focus:border-yellow-400/50 focus:outline-none"
        />
      </div>

      <div>
        <label className="text-xs text-[#9B9A97] mb-1 block">Catatan</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-[#2D2D2D] bg-[#202020] px-3 py-2 text-sm text-[#E5E2E1] focus:border-yellow-400/50 focus:outline-none resize-none"
        />
      </div>

      {/* Status registrasi - hanya muncul setelah form terisi */}
      {(registrationUrl || link) && (
        <div className="flex items-center gap-2 pt-2 border-t border-[#2D2D2D]">
          <input
            type="checkbox"
            id="is_registered"
            checked={isRegistered}
            onChange={(e) => setIsRegistered(e.target.checked)}
            className="h-4 w-4 rounded border-[#2D2D2D] bg-[#202020] accent-yellow-400"
          />
          <label htmlFor="is_registered" className="text-sm text-[#E5E2E1]">
            Sudah terdaftar
          </label>
        </div>
      )}

      <button
        type="button"
        disabled={pending || !name || !startDate}
        onClick={handleSubmit}
        className="inline-flex h-9 items-center gap-1.5 rounded-md bg-yellow-400 px-4 text-xs font-semibold text-black hover:bg-yellow-300 disabled:opacity-50 cursor-pointer"
      >
        {pending && <Loader2 className="h-3 w-3 animate-spin" />}
        {isEdit ? "Simpan" : "Tambah Turnamen"}
      </button>
    </div>
  );
}
