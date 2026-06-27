"use client";

import { Loader2 } from "lucide-react";
import { useState, useTransition } from "react";

import { useNotify } from "@/features/dashboard/components/NotifyModal";
import { createTournamentAction, updateTournamentAction } from "@/features/tournaments/actions";
import type { Tournament } from "@/features/tournaments/queries";
import { CustomSelect } from "@/features/dashboard/components/CustomSelect";

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

function toDatetimeLocal(isoString?: string | null): string {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

const TournamentForm = ({ orgSlug, divisionId, tournament, onSuccess }: TournamentFormProps) => {
  const isEdit = !!tournament;
  const [pending, startTransition] = useTransition();
  const { success, error } = useNotify();

  const [name, setName] = useState(tournament?.name ?? "");
  const [organizer, setOrganizer] = useState(tournament?.organizer ?? "");
  const [startDate, setStartDate] = useState(tournament?.start_date ?? "");
  const [startTime, setStartTime] = useState(tournament?.start_time ?? "");
  const [endDate, setEndDate] = useState(tournament?.end_date ?? "");
  const [prizePool, setPrizePool] = useState(tournament?.prize_pool ?? "");
  const [registrationFee, setRegistrationFee] = useState(tournament?.registration_fee ?? "");
  const [registrationUrl, setRegistrationUrl] = useState(tournament?.registration_url ?? "");
  const [notes, setNotes] = useState(tournament?.notes ?? "");
  const [registrationDeadline, setRegistrationDeadline] = useState(
    tournament?.registration_deadline ? toDatetimeLocal(tournament.registration_deadline) : "",
  );
  const [deadlineError, setDeadlineError] = useState<string | null>(null);

  const [locationType, setLocationType] = useState<"online" | "offline" | "hybrid" | "">(
    (tournament?.location_type as "online" | "offline" | "hybrid" | undefined) ?? ""
  );
  const [location, setLocation] = useState(tournament?.location ?? "");
  const [onlinePlatform, setOnlinePlatform] = useState((tournament as { online_platform?: string | null } | undefined)?.online_platform ?? "");

  // Max datetime-local value = start_date at 23:59 (user can only pick up to a moment before start_date)
  const deadlineMax = startDate ? `${startDate}T23:58` : undefined;

  function handleStartDateChange(val: string) {
    setStartDate(val);
    if (registrationDeadline && val && registrationDeadline >= `${val}T00:00`) {
      setRegistrationDeadline("");
      setDeadlineError(null);
    }
  }

  function handleDeadlineChange(val: string) {
    setRegistrationDeadline(val);
    if (startDate && val >= `${startDate}T00:00`) {
      setDeadlineError("Batas pendaftaran harus sebelum tanggal mulai turnamen");
    } else {
      setDeadlineError(null);
    }
  }

  function handleSubmit() {
    const payload = {
      ...(isEdit ? { tournament_id: tournament.id } : {}),
      division_id: divisionId,
      name,
      organizer: organizer || undefined,
      start_date: startDate,
      start_time: startTime || undefined,
      end_date: endDate || undefined,
      prize_pool: prizePool || undefined,
      registration_fee: registrationFee || undefined,
      registration_url: registrationUrl || undefined,
      notes: notes || undefined,
      registration_deadline: registrationDeadline || undefined,
      location_type: locationType || undefined,
      location: location || undefined,
      online_platform: onlinePlatform || undefined,
    };

    startTransition(async () => {
      const res = isEdit
        ? await updateTournamentAction(orgSlug, payload)
        : await createTournamentAction(orgSlug, payload);
      if (res.ok) {
        success(isEdit ? "Turnamen diperbarui!" : "Turnamen ditambahkan!");
        if (!isEdit && "id" in res) {
          window.location.href = `/${orgSlug}/tournaments/${res.id}`;
        }
        onSuccess?.();
      } else {
        error(res.message);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs text-ui-text-2 mb-1 block">Nama Turnamen *</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-9 w-full rounded-md border border-ui-border bg-ui-surface px-3 text-sm text-ui-text focus:border-yellow-400/50 focus:outline-none"
        />
      </div>

      <div>
        <label className="text-xs text-ui-text-2 mb-1 block">Penyelenggara</label>
        <input
          value={organizer}
          onChange={(e) => setOrganizer(e.target.value)}
          className="h-9 w-full rounded-md border border-ui-border bg-ui-surface px-3 text-sm text-ui-text focus:border-yellow-400/50 focus:outline-none"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs text-ui-text-2 mb-1 block">Tanggal Mulai *</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => handleStartDateChange(e.target.value)}
            className="h-9 w-full rounded-md border border-ui-border bg-ui-surface px-3 text-sm text-ui-text focus:border-yellow-400/50 focus:outline-none"
          />
        </div>
        <div>
          <label className="text-xs text-ui-text-2 mb-1 block">Jam Mulai <span className="text-ui-text-muted">(opsional, untuk reminder H-1)</span></label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="h-9 w-full rounded-md border border-ui-border bg-ui-surface px-3 text-sm text-ui-text focus:border-yellow-400/50 focus:outline-none"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs text-ui-text-2 mb-1 block">Tanggal Selesai</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="h-9 w-full rounded-md border border-ui-border bg-ui-surface px-3 text-sm text-ui-text focus:border-yellow-400/50 focus:outline-none"
          />
        </div>
        <div>
          <label className="text-xs text-ui-text-2 mb-1 block">Batas Pendaftaran / Pembayaran *</label>
          <input
            type="datetime-local"
            value={registrationDeadline}
            max={deadlineMax}
            onChange={(e) => handleDeadlineChange(e.target.value)}
            className={`h-9 w-full rounded-md border bg-ui-surface px-3 text-sm text-ui-text focus:outline-none ${
              deadlineError
                ? "border-red-500/60 focus:border-red-500"
                : "border-ui-border focus:border-yellow-400/50"
            }`}
          />
          {deadlineError && (
            <p className="mt-1 text-[11px] text-red-400">{deadlineError}</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs text-ui-text-2 mb-1 block">Prize Pool (Rp)</label>
          <input
            value={prizePool}
            onChange={(e) => setPrizePool(formatNumber(e.target.value))}
            inputMode="numeric"
            className="h-9 w-full rounded-md border border-ui-border bg-ui-surface px-3 text-sm text-ui-text focus:border-yellow-400/50 focus:outline-none"
          />
        </div>
        <div>
          <label className="text-xs text-ui-text-2 mb-1 block">Biaya Registrasi (Rp)</label>
          <input
            value={registrationFee}
            onChange={(e) => setRegistrationFee(formatNumber(e.target.value))}
            inputMode="numeric"
            className="h-9 w-full rounded-md border border-ui-border bg-ui-surface px-3 text-sm text-ui-text focus:border-yellow-400/50 focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="text-xs text-ui-text-2 mb-1 block">URL Registrasi</label>
        <input
          value={registrationUrl}
          onChange={(e) => setRegistrationUrl(e.target.value)}
          className="h-9 w-full rounded-md border border-ui-border bg-ui-surface px-3 text-sm text-ui-text focus:border-yellow-400/50 focus:outline-none"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs text-ui-text-2 mb-1.5 block">Tipe Lokasi</label>
          <CustomSelect
            value={locationType}
            onChange={(val) => setLocationType(val as "online" | "offline" | "hybrid" | "")}
            options={[
              { value: "", label: "Pilih tipe lokasi..." },
              { value: "online", label: "Online" },
              { value: "offline", label: "Offline" },
              { value: "hybrid", label: "Hybrid (Online + Offline)" },
            ]}
          />
        </div>
        <div>
          <label className="text-xs text-ui-text-2 mb-1 block">
            {locationType === "hybrid" ? "Venue / Lokasi Offline" : "Detail Lokasi"}
          </label>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="h-9 w-full rounded-md border border-ui-border bg-ui-surface px-3 text-sm text-ui-text focus:border-yellow-400/50 focus:outline-none"
          />
        </div>
      </div>

      {locationType === "hybrid" && (
        <div>
          <label className="text-xs text-ui-text-2 mb-1 block">Platform / Link Online</label>
          <input
            value={onlinePlatform}
            onChange={(e) => setOnlinePlatform(e.target.value)}
            className="h-9 w-full rounded-md border border-ui-border bg-ui-surface px-3 text-sm text-ui-text focus:border-yellow-400/50 focus:outline-none"
          />
        </div>
      )}

      {/* Stages timeline and WA blast removed from new tournament form */}

      <div>
        <label className="text-xs text-ui-text-2 mb-1 block">Catatan</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-ui-border bg-ui-surface px-3 py-2 text-sm text-ui-text focus:border-yellow-400/50 focus:outline-none resize-none"
        />
      </div>

      <button
        type="button"
        disabled={pending || !name || !startDate || !!deadlineError}
        onClick={handleSubmit}
        className="inline-flex h-9 items-center gap-1.5 rounded-md bg-yellow-400 px-4 text-xs font-semibold text-black hover:bg-yellow-300 disabled:opacity-50 cursor-pointer"
      >
        {pending && <Loader2 className="h-3 w-3 animate-spin" />}
        {isEdit ? "Simpan" : "Tambah Turnamen"}
      </button>
    </div>
  );
};
export { TournamentForm };
