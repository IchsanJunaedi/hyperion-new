"use client";

import { Loader2, Search, Swords } from "lucide-react";
import { useEffect, useState, useTransition } from "react";

import { CustomSelect } from "@/features/dashboard/components/CustomSelect";
import { useNotify } from "@/features/dashboard/components/NotifyModal";
import { createScrimRequestAction } from "@/features/matchmaking/actions";

interface Team {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
}

interface FindOpponentButtonProps {
  orgSlug: string;
  divisions: Array<{ id: string; name: string }>;
  matchableTeams: Team[];
  activeDivisionId: string | null;
}

const FindOpponentButton = ({
  orgSlug,
  divisions,
  matchableTeams,
  activeDivisionId,
}: FindOpponentButtonProps) => {
  const [open, setOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [divisionId, setDivisionId] = useState(activeDivisionId ?? divisions[0]?.id ?? "");
  const [message, setMessage] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [format, setFormat] = useState("bo3");
  const [pending, startTransition] = useTransition();
  const { success, error } = useNotify();

  useEffect(() => {
    if (activeDivisionId) setDivisionId(activeDivisionId);
  }, [activeDivisionId]);

  function handleSubmit() {
    if (!selectedTeam) {
      error("Pilih tim lawan terlebih dahulu");
      return;
    }
    startTransition(async () => {
      const res = await createScrimRequestAction(orgSlug, {
        to_org_id: selectedTeam,
        division_id: divisionId,
        message: message || undefined,
        preferred_time: preferredTime || undefined,
        format,
      });
      if (res.ok) {
        success("Request scrim terkirim!");
        setOpen(false);
        setSelectedTeam("");
        setMessage("");
        setPreferredTime("");
      } else {
        error(res.message);
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 items-center gap-2 rounded-md border border-white/10 bg-ui-surface px-4 text-sm font-medium text-ui-text transition hover:bg-ui-hover cursor-pointer"
      >
        <Search className="h-4 w-4" />
        Cari Lawan
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-ui-border bg-ui-bg p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-4">
              <Swords className="h-5 w-5 text-yellow-400" />
              <h2 className="text-lg font-bold text-ui-text">Cari Lawan Scrim</h2>
            </div>

            <div className="space-y-4">
              {/* Division */}
              <div>
                <label className="text-xs text-ui-text-2 mb-1 block">Divisi</label>
                <CustomSelect
                  value={divisionId}
                  options={divisions.map((d) => ({ value: d.id, label: d.name }))}
                  onChange={setDivisionId}
                />
              </div>

              {/* Team selection */}
              <div>
                <label className="text-xs text-ui-text-2 mb-1 block">Tim Lawan</label>
                {matchableTeams.length === 0 ? (
                  <p className="text-xs text-ui-text-muted">Tidak ada tim lain di divisi yang sama.</p>
                ) : (
                  <div className="max-h-40 overflow-y-auto rounded-lg border border-ui-border bg-ui-surface">
                    {matchableTeams.map((team) => (
                      <button
                        key={team.id}
                        type="button"
                        onClick={() => setSelectedTeam(team.id)}
                        className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-ui-hover cursor-pointer ${
                          selectedTeam === team.id ? "bg-ui-hover text-ui-text" : "text-ui-text-2"
                        }`}
                      >
                        {team.logo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={team.logo_url} alt="" className="h-4 w-4 rounded object-cover" />
                        ) : (
                          <div className="h-4 w-4 rounded bg-ui-hover-strong grid place-items-center text-[8px] font-semibold text-ui-text">
                            {team.name.slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        {team.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Format */}
              <div>
                <label className="text-xs text-ui-text-2 mb-1 block">Format</label>
                <CustomSelect
                  value={format}
                  options={[
                    { value: "bo1", label: "BO1" },
                    { value: "bo3", label: "BO3" },
                    { value: "bo5", label: "BO5" },
                    { value: "scrimmage", label: "Scrimmage" },
                  ]}
                  onChange={setFormat}
                />
              </div>

              {/* Preferred time */}
              <div>
                <label className="text-xs text-ui-text-2 mb-1 block">Waktu preferensi (opsional)</label>
                <input
                  type="datetime-local"
                  value={preferredTime}
                  onChange={(e) => setPreferredTime(e.target.value)}
                  className="h-9 w-full rounded-md border border-ui-border bg-ui-surface px-3 text-sm text-ui-text focus:border-yellow-400/50 focus:outline-none"
                />
              </div>

              {/* Message */}
              <div>
                <label className="text-xs text-ui-text-2 mb-1 block">Pesan (opsional)</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={2}
                  maxLength={500}
                  placeholder="Contoh: Mau scrim santai malam ini?"
                  className="w-full rounded-md border border-ui-border bg-ui-surface px-3 py-2 text-sm text-ui-text placeholder:text-ui-text-muted focus:border-yellow-400/50 focus:outline-none resize-none"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="h-9 rounded-md border border-ui-border px-4 text-xs font-medium text-ui-text-2 hover:bg-ui-hover cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={pending || !selectedTeam}
                onClick={handleSubmit}
                className="inline-flex h-9 items-center gap-1.5 rounded-md bg-yellow-400 px-4 text-xs font-semibold text-black hover:bg-yellow-300 disabled:opacity-50 cursor-pointer"
              >
                {pending && <Loader2 className="h-3 w-3 animate-spin" />}
                Kirim Request
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
export { FindOpponentButton };
