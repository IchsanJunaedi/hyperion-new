"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Pencil, Check, X } from "lucide-react";
import { toggleDivisionPublic, updateDivisionPublicInfo } from "@/features/admin/actions";
import type { DivisionWithMembers } from "@/features/admin/queries";

const ROLE_LABEL: Record<string, string> = {
  captain: "Captain",
  member: "Member",
  coach: "Coach",
};

const ROLE_COLOR: Record<string, string> = {
  captain: "text-purple-400",
  member: "text-[#9B9A97]",
  coach: "text-blue-400",
};

interface EditState {
  description: string;
  logo_url: string;
}

const DivisionCard = ({ division }: { division: DivisionWithMembers }) => {
  const [isPublic, setIsPublic] = useState(division.is_public);
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [editState, setEditState] = useState<EditState>({
    description: division.description ?? "",
    logo_url: division.logo_url ?? "",
  });
  const [savePending, startSave] = useTransition();

  const handleToggle = () => {
    const next = !isPublic;
    setIsPublic(next);
    startTransition(async () => {
      const result = await toggleDivisionPublic(division.id, next);
      if (!result.ok) {
        setIsPublic(!next);
        toast.error(result.message);
      } else {
        toast.success(next ? "Division ditampilkan di public" : "Division disembunyikan dari public");
      }
    });
  };

  const handleSaveInfo = () => {
    startSave(async () => {
      const result = await updateDivisionPublicInfo(division.id, {
        description: editState.description.trim() || null,
        logo_url: editState.logo_url.trim() || null,
      });
      if (!result.ok) {
        toast.error(result.message);
      } else {
        toast.success("Info diperbarui");
        setEditing(false);
      }
    });
  };

  const players = division.members.filter((m) => m.role === "captain" || m.role === "member");
  const coaches = division.members.filter((m) => m.role === "coach");

  return (
    <div className="border border-[#2D2D2D] bg-[#141414]">
      {/* Header */}
      <div className="flex items-center gap-4 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded border border-white/10 bg-[#1E1E1E]">
          {editState.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={editState.logo_url} alt={division.name} className="h-full w-full object-contain" />
          ) : (
            <span className="text-xs font-black text-white/30">{division.name.slice(0, 2).toUpperCase()}</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-bold text-[#E5E2E1]">{division.name}</p>
          <p className="text-xs text-[#6B6A68]">
            {division.game} · {division.members.length} anggota
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="cursor-pointer rounded p-1.5 text-[#6B6A68] transition hover:bg-[#2C2C2C] hover:text-[#D4D4D4]"
            title="Edit info publik"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>

          {/* Toggle */}
          <button
            type="button"
            onClick={handleToggle}
            disabled={isPending}
            className={`relative inline-flex h-5 w-9 cursor-pointer items-center rounded-full transition-colors disabled:opacity-50 ${
              isPublic ? "bg-[#F5C400]" : "bg-[#2D2D2D]"
            }`}
            title={isPublic ? "Sembunyikan dari public" : "Tampilkan di public"}
          >
            <span
              className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
                isPublic ? "translate-x-[18px]" : "translate-x-[3px]"
              }`}
            />
          </button>
          <span className={`text-xs font-semibold ${isPublic ? "text-[#F5C400]" : "text-[#6B6A68]"}`}>
            {isPublic ? "Public" : "Hidden"}
          </span>
        </div>
      </div>

      {/* Inline edit form */}
      {editing && (
        <div className="border-t border-[#2D2D2D] bg-[#111111] px-4 py-3 space-y-2">
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[#6B6A68]">
              Deskripsi
            </label>
            <textarea
              value={editState.description}
              onChange={(e) => setEditState((s) => ({ ...s, description: e.target.value }))}
              rows={2}
              placeholder="Deskripsi singkat division ini..."
              className="w-full resize-none rounded border border-[#2D2D2D] bg-[#191919] px-3 py-2 text-sm text-[#E5E2E1] placeholder-[#6B6A68] focus:border-[#F5C400]/50 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[#6B6A68]">
              Logo URL
            </label>
            <input
              type="text"
              value={editState.logo_url}
              onChange={(e) => setEditState((s) => ({ ...s, logo_url: e.target.value }))}
              placeholder="https://..."
              className="w-full rounded border border-[#2D2D2D] bg-[#191919] px-3 py-2 text-sm text-[#E5E2E1] placeholder-[#6B6A68] focus:border-[#F5C400]/50 focus:outline-none"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={handleSaveInfo}
              disabled={savePending}
              className="flex cursor-pointer items-center gap-1.5 rounded bg-[#F5C400] px-3 py-1.5 text-xs font-bold text-black transition hover:bg-yellow-300 disabled:opacity-50"
            >
              <Check className="h-3 w-3" />
              Simpan
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setEditState({ description: division.description ?? "", logo_url: division.logo_url ?? "" });
              }}
              className="flex cursor-pointer items-center gap-1.5 rounded border border-[#2D2D2D] px-3 py-1.5 text-xs font-semibold text-[#9B9A97] transition hover:bg-[#2C2C2C]"
            >
              <X className="h-3 w-3" />
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Members */}
      {division.members.length > 0 && (
        <div className="border-t border-[#2D2D2D] px-4 py-3 space-y-3">
          {players.length > 0 && (
            <div>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#6B6A68]">
                Pemain ({players.length})
              </p>
              <div className="space-y-1">
                {players.map((m) => (
                  <div key={m.user_id} className="flex items-center gap-2">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#2C2C2C] text-[9px] font-bold text-white/40">
                      {m.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={m.avatar_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        (m.display_name ?? "?").slice(0, 1).toUpperCase()
                      )}
                    </div>
                    <span className="text-xs text-[#E5E2E1]">{m.display_name ?? "—"}</span>
                    <span className={`text-[10px] ${ROLE_COLOR[m.role]}`}>{ROLE_LABEL[m.role]}</span>
                    {m.jersey_number != null && (
                      <span className="text-[10px] text-[#6B6A68]">#{m.jersey_number}</span>
                    )}
                    {m.position && (
                      <span className="text-[10px] text-[#6B6A68]">· {m.position}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {coaches.length > 0 && (
            <div>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#6B6A68]">
                Pelatih ({coaches.length})
              </p>
              <div className="space-y-1">
                {coaches.map((m) => (
                  <div key={m.user_id} className="flex items-center gap-2">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#2C2C2C] text-[9px] font-bold text-blue-400/60">
                      {m.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={m.avatar_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        (m.display_name ?? "?").slice(0, 1).toUpperCase()
                      )}
                    </div>
                    <span className="text-xs text-[#E5E2E1]">{m.display_name ?? "—"}</span>
                    <span className="text-[10px] text-blue-400">Coach</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface Props {
  divisions: DivisionWithMembers[];
}

const DivisionsAdminClient = ({ divisions }: Props) => {
  if (divisions.length === 0) {
    return (
      <div className="rounded border border-[#2D2D2D] bg-[#141414] py-16 text-center">
        <p className="text-sm text-[#6B6A68]">Belum ada division.</p>
        <p className="mt-1 text-xs text-[#6B6A68]/60">Buat division di workspace terlebih dahulu.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-black uppercase tracking-tight text-white">Divisions</h1>
        <p className="text-xs text-[#6B6A68]">Data otomatis dari workspace · toggle untuk tampilkan di public</p>
      </div>
      <div className="space-y-2">
        {divisions.map((division) => (
          <DivisionCard key={division.id} division={division} />
        ))}
      </div>
    </div>
  );
};
export { DivisionsAdminClient };
