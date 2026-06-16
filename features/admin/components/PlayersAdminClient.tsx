"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Users, Pencil } from "lucide-react";
import { togglePlayerPublicAction } from "@/features/admin/actions";
import type { AdminPlayerMember } from "@/features/admin/queries";
import { EditPlayerModal } from "./EditPlayerModal";

interface Props { members: AdminPlayerMember[]; }

const ROLE_COLOR: Record<string, string> = {
  captain: "text-purple-400",
  coach: "text-blue-400",
  manager: "text-green-400",
  member: "text-ui-text-2",
};

const PlayersAdminClient = ({ members: initial }: Props) => {
  const [members, setMembers] = useState(initial);
  const [, startTransition] = useTransition();
  const [editingPlayer, setEditingPlayer] = useState<AdminPlayerMember | null>(null);

  const handlePlayerSuccess = (memberId: string, updated: {
    display_name: string;
    avatar_url: string | null;
    is_public: boolean;
    jersey_number: number | null;
    position: string | null;
  }) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, ...updated } : m))
    );
  };

  const handleToggle = (id: string, current: boolean) => {
    const next = !current;
    setMembers((prev) => prev.map((m) => m.id === id ? { ...m, is_public: next } : m));
    startTransition(async () => {
      const result = await togglePlayerPublicAction(id, next);
      if (!result.ok) {
        toast.error((result as { ok: false; message: string }).message);
        setMembers((prev) => prev.map((m) => m.id === id ? { ...m, is_public: current } : m));
      } else {
        toast.success(next ? "Player ditampilkan publik" : "Player disembunyikan dari publik");
      }
    });
  };

  const grouped = members.reduce<Record<string, AdminPlayerMember[]>>((acc, m) => {
    const key = m.division_name ?? "Tanpa Divisi";
    return { ...acc, [key]: [...(acc[key] ?? []), m] };
  }, {});

  const publicCount = members.filter((m) => m.is_public).length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-black uppercase tracking-tight text-ui-text">Players Publik</h1>
        <p className="mt-1 text-xs text-ui-text-muted">
          Kontrol siapa yang tampil di halaman publik <span className="text-ui-text-2">/divisions</span>.
          Bio dan social links dikelola sendiri oleh player di workspace.
        </p>
        {publicCount > 0 && <p className="mt-1.5 text-xs font-semibold text-[#F5C400]">{publicCount} tampil publik</p>}
      </div>

      {members.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center border border-ui-border">
          <Users className="h-8 w-8 text-ui-border" />
          <p className="text-sm text-ui-text-muted">Belum ada anggota aktif.</p>
        </div>
      )}

      <div className="space-y-8">
        {Object.entries(grouped).map(([division, divMembers]) => (
          <div key={division}>
            <h2 className="mb-2 text-[11px] font-bold uppercase tracking-[0.3em] text-ui-text-muted">{division}</h2>
            <div className="space-y-1.5">
              {divMembers.map((m) => (
                <div key={m.id} className={`flex items-center gap-4 rounded border px-4 py-3 transition ${m.is_public ? "border-[#F5C400]/30 bg-[#F5C400]/5" : "border-ui-border bg-ui-bg"}`}>
                  {m.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.avatar_url} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ui-hover text-xs font-bold text-ui-text-muted">
                      {(m.display_name ?? "?").slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ui-text-dim">
                      {m.display_name ?? <span className="text-ui-text-muted">Unnamed</span>}
                    </p>
                    <div className="flex items-center gap-2 text-xs">
                      <span className={`font-medium capitalize ${ROLE_COLOR[m.role] ?? "text-ui-text-muted"}`}>{m.role}</span>
                      {m.position && <span className="text-ui-text-muted">· {m.position}</span>}
                      {m.jersey_number != null && <span className="text-ui-text-muted">· #{m.jersey_number}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setEditingPlayer(m)}
                      className="cursor-pointer rounded border border-ui-border p-1.5 text-ui-text-muted hover:bg-ui-hover hover:text-ui-text-dim transition"
                      title="Edit player info & visibilitas"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => handleToggle(m.id, m.is_public)}
                      className={`cursor-pointer px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider border transition ${m.is_public ? "border-[#F5C400] bg-[#F5C400] text-black" : "border-ui-border text-ui-text-muted hover:border-[#F5C400]/50 hover:text-[#F5C400]"}`}>
                      {m.is_public ? "Publik ✓" : "Publik"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {editingPlayer && (
        <EditPlayerModal
          member={editingPlayer}
          onClose={() => setEditingPlayer(null)}
          onSuccess={(updated) => handlePlayerSuccess(editingPlayer.id, updated)}
        />
      )}
    </div>
  );
};
export { PlayersAdminClient };
