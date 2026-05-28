"use client";

import { Loader2 } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { createTeamWithDivisionsAction } from "../actions";
import { useNotify } from "./NotifyModal";

interface CreateTeamFormProps {
  existingDivisions: Array<{ id: string; name: string }>;
}

const CreateTeamForm = ({ existingDivisions }: CreateTeamFormProps) => {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [teamName, setTeamName] = useState("");
  const [selectedDivisionIds, setSelectedDivisionIds] = useState<string[]>([]);
  const { success, error: notifyError } = useNotify();

  // Deduplicate divisions by name
  const uniqueDivisions = useMemo(() => {
    const seen = new Set<string>();
    return existingDivisions.filter((d) => {
      if (seen.has(d.name)) return false;
      seen.add(d.name);
      return true;
    });
  }, [existingDivisions]);

  const noDivisions = uniqueDivisions.length === 0;

  function toggleDivision(divId: string) {
    setSelectedDivisionIds((prev) =>
      prev.includes(divId) ? prev.filter((d) => d !== divId) : [...prev, divId],
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    if (!teamName.trim()) {
      setError("Nama tim wajib diisi");
      return;
    }
    if (selectedDivisionIds.length === 0) {
      notifyError("Pilih minimal 1 divisi untuk membuat tim");
      return;
    }

    startTransition(async () => {
      setError(null);
      const res = await createTeamWithDivisionsAction({
        name: teamName.trim(),
        divisionIds: selectedDivisionIds,
      });
      if (res.ok) {
        success("Tim berhasil dibuat!");
        setTeamName("");
        setSelectedDivisionIds([]);
        router.refresh();
      } else {
        notifyError(res.message);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {noDivisions && (
        <p className="rounded border border-[#2D2D2D] bg-[#2C2C2C] px-3 py-2 text-sm text-[#9B9A97]">
          Buat divisi terlebih dahulu di halaman &quot;Kelola Divisi&quot; sebelum membuat tim.
        </p>
      )}

      <div className="space-y-1">
        <label className="text-xs font-medium text-[#9B9A97]">Nama Tim</label>
        <input
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          required
          disabled={noDivisions}
          maxLength={80}
          className="h-10 w-full rounded border border-[#2D2D2D] bg-[#191919] px-3 text-sm text-[#E5E2E1] focus:border-[#D4D4D4] focus:outline-none disabled:opacity-40"
        />
      </div>

      {uniqueDivisions.length > 0 && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-[#9B9A97]">Pilih Divisi</label>
          <div className="flex flex-wrap gap-2">
            {uniqueDivisions.map((div) => {
              const selected = selectedDivisionIds.includes(div.id);
              return (
                <button
                  key={div.id}
                  type="button"
                  onClick={() => toggleDivision(div.id)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    selected
                      ? "bg-[#E5E2E1] text-[#191919]"
                      : "bg-[#2C2C2C] text-[#9B9A97] hover:bg-[#353434]"
                  }`}
                >
                  {div.name}
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-[#6B6A68]">
            Klik untuk pilih. Buat divisi baru di &quot;Kelola Divisi&quot;.
          </p>
        </div>
      )}

      {error && (
        <p className="rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || noDivisions || selectedDivisionIds.length === 0}
        className="inline-flex h-9 items-center gap-2 rounded px-4 text-sm font-medium bg-[#E5E2E1] text-[#191919] hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Buat Tim
      </button>
    </form>
  );
};
export { CreateTeamForm };
