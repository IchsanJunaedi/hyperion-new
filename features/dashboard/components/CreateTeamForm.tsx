"use client";

import { Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { createTeamWithDivisionsAction } from "../actions";

interface CreateTeamFormProps {
  existingDivisions: Array<{ id: string; name: string }>;
}

export function CreateTeamForm({ existingDivisions }: CreateTeamFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [divisionError, setDivisionError] = useState<string | null>(null);
  const [teamName, setTeamName] = useState("");
  const [selectedDivisionIds, setSelectedDivisionIds] = useState<string[]>([]);

  function toggleDivision(divId: string) {
    setDivisionError(null);
    setSelectedDivisionIds((prev) =>
      prev.includes(divId) ? prev.filter((d) => d !== divId) : [...prev, divId],
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    setDivisionError(null);
    if (!teamName.trim()) {
      setError("Nama tim wajib diisi");
      return;
    }
    if (existingDivisions.length > 0 && selectedDivisionIds.length === 0) {
      setDivisionError("Pilih minimal satu divisi");
      return;
    }

    startTransition(async () => {
      setError(null);
      setDivisionError(null);
      const res = await createTeamWithDivisionsAction({
        name: teamName.trim(),
        divisionIds: selectedDivisionIds,
      });
      if (res.ok) {
        toast.success("Tim berhasil dibuat!");
        setTeamName("");
        setSelectedDivisionIds([]);
        router.refresh();
      } else {
        setError(res.message);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label className="text-xs font-medium text-white/70">Nama Tim</label>
        <input
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          required
          maxLength={80}
          className="h-10 w-full rounded-md border border-white/10 bg-zinc-900 px-3 text-sm text-white focus:border-yellow-400 focus:outline-none"
        />
      </div>

      {existingDivisions.length > 0 && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-white/70">Pilih Divisi</label>
          <div className="flex flex-wrap gap-2">
            {existingDivisions.map((div) => {
              const selected = selectedDivisionIds.includes(div.id);
              return (
                <button
                  key={div.id}
                  type="button"
                  onClick={() => toggleDivision(div.id)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    selected
                      ? "bg-yellow-400 text-black"
                      : "bg-white/5 text-white/60 hover:bg-white/10"
                  }`}
                >
                  {div.name}
                </button>
              );
            })}
          </div>
          {divisionError && (
            <p className="text-xs text-rose-400">{divisionError}</p>
          )}
          <p className="text-[10px] text-white/40">
            Klik untuk pilih. Buat divisi baru di halaman "Kelola Divisi".
          </p>
        </div>
      )}

      {error && (
        <p className="rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-10 items-center gap-2 rounded-md bg-yellow-400 px-4 text-sm font-semibold text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Buat Tim
      </button>
    </form>
  );
}
