"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Users } from "lucide-react";
import { togglePlayerPublicAction } from "@/features/admin/actions";
import type { AdminPlayerMember } from "@/features/admin/queries";

interface Props { members: AdminPlayerMember[]; }

const ROLE_COLOR: Record<string, string> = {
  captain: "text-purple-400",
  coach: "text-blue-400",
  manager: "text-green-400",
  member: "text-[#9B9A97]",
};

const PlayersAdminClient = ({ members: initial }: Props) => {
  const [members, setMembers] = useState(initial);
  const [, startTransition] = useTransition();

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
        <h1 className="text-xl font-black uppercase tracking-tight text-white">Players Publik</h1>
        <p className="mt-1 text-xs text-[#6B6A68]">
          Kontrol siapa yang tampil di halaman publik <span className="text-white/50">/divisions</span>.
          Bio dan social links dikelola sendiri oleh player di workspace.
        </p>
        {publicCount > 0 && <p className="mt-1.5 text-xs font-semibold text-[#F5C400]">{publicCount} tampil publik</p>}
      </div>

      {members.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center border border-[#2D2D2D]">
          <Users className="h-8 w-8 text-[#2D2D2D]" />
          <p className="text-sm text-[#6B6A68]">Belum ada anggota aktif.</p>
        </div>
      )}

      <div className="space-y-8">
        {Object.entries(grouped).map(([division, divMembers]) => (
          <div key={division}>
            <h2 className="mb-2 text-[11px] font-bold uppercase tracking-[0.3em] text-white/40">{division}</h2>
            <div className="space-y-1.5">
              {divMembers.map((m) => (
                <div key={m.id} className={`flex items-center gap-4 rounded border px-4 py-3 transition ${m.is_public ? "border-[#F5C400]/30 bg-[#1a1800]" : "border-[#2D2D2D] bg-[#141414]"}`}>
                  {m.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.avatar_url} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2C2C2C] text-xs font-bold text-[#6B6A68]">
                      {(m.display_name ?? "?").slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#D4D4D4]">
                      {m.display_name ?? <span className="text-[#6B6A68]">Unnamed</span>}
                    </p>
                    <div className="flex items-center gap-2 text-xs">
                      <span className={`font-medium capitalize ${ROLE_COLOR[m.role] ?? "text-[#6B6A68]"}`}>{m.role}</span>
                      {m.position && <span className="text-[#6B6A68]">· {m.position}</span>}
                      {m.jersey_number != null && <span className="text-[#6B6A68]">· #{m.jersey_number}</span>}
                    </div>
                  </div>
                  <button onClick={() => handleToggle(m.id, m.is_public)}
                    className={`shrink-0 cursor-pointer px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider border transition ${m.is_public ? "border-[#F5C400] bg-[#F5C400] text-black" : "border-[#2D2D2D] text-[#6B6A68] hover:border-[#F5C400]/50 hover:text-[#F5C400]"}`}>
                    {m.is_public ? "Publik ✓" : "Publik"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export { PlayersAdminClient };
