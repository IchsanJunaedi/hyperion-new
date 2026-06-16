"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Pencil, Check, X } from "lucide-react";
import { toggleDivisionPublic, updateDivisionPublicInfo, createGalleryEntry, deleteGalleryEntry } from "@/features/admin/actions";
import type { DivisionWithMembers, DivisionMember, DivisionAchievement } from "@/features/admin/queries";
import { EditPlayerModal } from "./EditPlayerModal";

const ROLE_LABEL: Record<string, string> = {
  captain: "Captain",
  member: "Member",
  coach: "Coach",
};

const ROLE_COLOR: Record<string, string> = {
  captain: "text-purple-400",
  member: "text-ui-text-2",
  coach: "text-blue-400",
};

interface EditState {
  description: string;
  logo_url: string;
}

const DivisionCard = ({ division }: { division: DivisionWithMembers }) => {
  const [members, setMembers] = useState(division.members);
  const [isPublic, setIsPublic] = useState(division.is_public);
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [editState, setEditState] = useState<EditState>({
    description: division.description ?? "",
    logo_url: division.logo_url ?? "",
  });
  const [savePending, startSave] = useTransition();
  const [editingPlayer, setEditingPlayer] = useState<DivisionMember | null>(null);

  const [achievements, setAchievements] = useState<DivisionAchievement[]>(division.achievements || []);
  const [newAch, setNewAch] = useState({ title: "", placementStr: "", date: "" });
  const [achPending, startAchTransition] = useTransition();

  const handleAddAchievement = () => {
    if (!newAch.title || !newAch.date) {
      toast.error("Judul dan Tanggal/Tahun wajib diisi");
      return;
    }
    const placement = newAch.placementStr ? parseInt(newAch.placementStr, 10) : null;
    const slug = `${newAch.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`;
    
    startAchTransition(async () => {
      const result = await createGalleryEntry({
        slug,
        title: newAch.title,
        division: division.name,
        tournament_date: newAch.date,
        position: placement ? `Juara ${placement}` : "Champion",
        status: "published",
        logo_url: null,
        preview_images: [],
        description: "",
        sort_order: 0,
        organization_id: division.organization_id,
        division_id: division.id,
        placement,
      });

      if (!result.ok) {
        toast.error(result.message);
      } else {
        toast.success("Prestasi berhasil ditambahkan");
        setAchievements((prev) => [
          ...prev,
          {
            id: slug,
            title: newAch.title,
            placement,
            tournament_date: newAch.date,
            description: "",
            organization_id: division.organization_id,
            division_id: division.id,
          }
        ]);
        setNewAch({ title: "", placementStr: "", date: "" });
      }
    });
  };

  const handleDeleteAchievement = (achId: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus prestasi ini?")) return;
    startAchTransition(async () => {
      const result = await deleteGalleryEntry(achId);
      if (!result.ok) {
        toast.error(result.message);
      } else {
        toast.success("Prestasi berhasil dihapus");
        setAchievements((prev) => prev.filter((a) => a.id !== achId));
      }
    });
  };

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
        setMembers((prev) => prev.map((m) => ({ ...m, is_public: next })));
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

  const players = members.filter((m) => m.role === "captain" || m.role === "member");
  const coaches = members.filter((m) => m.role === "coach");

  return (
    <div className="border border-ui-border bg-ui-bg">
      {/* Header */}
      <div className="flex items-center gap-4 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded border border-ui-border bg-ui-surface">
          {editState.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={editState.logo_url} alt={division.name} className="h-full w-full object-contain" />
          ) : (
            <span className="text-xs font-black text-ui-text-muted">{division.name.slice(0, 2).toUpperCase()}</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-bold text-ui-text">{division.name}</p>
          <p className="text-xs text-ui-text-muted">
            {division.game} · {members.length} anggota
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="cursor-pointer rounded p-1.5 text-ui-text-muted transition hover:bg-ui-hover hover:text-ui-text-dim"
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
              isPublic ? "bg-[#F5C400]" : "bg-ui-border"
            }`}
            title={isPublic ? "Sembunyikan dari public" : "Tampilkan di public"}
          >
            <span
              className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
                isPublic ? "translate-x-[18px]" : "translate-x-[3px]"
              }`}
            />
          </button>
          <span className={`text-xs font-semibold ${isPublic ? "text-[#F5C400]" : "text-ui-text-muted"}`}>
            {isPublic ? "Public" : "Hidden"}
          </span>
        </div>
      </div>

      {/* Inline edit form */}
      {editing && (
        <div className="border-t border-ui-border bg-ui-bg px-4 py-3 space-y-2">
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-ui-text-muted">
              Deskripsi
            </label>
            <textarea
              value={editState.description}
              onChange={(e) => setEditState((s) => ({ ...s, description: e.target.value }))}
              rows={2}
              placeholder="Deskripsi singkat division ini..."
              className="w-full resize-none rounded border border-ui-border bg-ui-bg px-3 py-2 text-sm text-ui-text placeholder-ui-text-muted focus:border-[#F5C400]/50 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-ui-text-muted">
              Logo URL
            </label>
            <input
              type="text"
              value={editState.logo_url}
              onChange={(e) => setEditState((s) => ({ ...s, logo_url: e.target.value }))}
              placeholder="https://..."
              className="w-full rounded border border-ui-border bg-ui-bg px-3 py-2 text-sm text-ui-text placeholder-ui-text-muted focus:border-[#F5C400]/50 focus:outline-none"
            />
          </div>

          {/* Achievements Section */}
          <div className="border-t border-ui-border pt-3 mt-3">
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-ui-text">
              Prestasi Tim
            </h4>
            
            {/* List existing */}
            {achievements.length > 0 ? (
              <div className="mb-3 space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {achievements.map((ach) => (
                  <div key={ach.id} className="flex items-center justify-between rounded bg-ui-surface p-2 text-xs">
                    <div>
                      <span className="font-bold text-white">
                        {ach.placement ? `#${ach.placement} ` : ""}
                      </span>
                      <span className="text-ui-text-dim">{ach.title} ({ach.tournament_date})</span>
                    </div>
                    <button
                      type="button"
                      disabled={achPending}
                      onClick={() => handleDeleteAchievement(ach.id)}
                      className="cursor-pointer text-red-400 hover:text-red-300 disabled:opacity-50 text-[10px] uppercase font-bold px-1 py-0.5 rounded hover:bg-red-500/10"
                    >
                      Hapus
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mb-3 text-xs text-ui-text-muted">Belum ada prestasi tim.</p>
            )}

            {/* Add New Achievement form */}
            <div className="rounded border border-ui-border bg-ui-surface/30 p-3 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#F5C400]">
                Tambah Prestasi Baru
              </p>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <input
                    type="text"
                    placeholder="Nama Turnamen / Pencapaian (Contoh: Juara 1 - RRQ Mabar)"
                    value={newAch.title}
                    onChange={(e) => setNewAch((s) => ({ ...s, title: e.target.value }))}
                    className="w-full rounded border border-ui-border bg-ui-bg px-2 py-1 text-xs text-ui-text placeholder-ui-text-muted focus:border-[#F5C400]/50 focus:outline-none"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Tahun (e.g. 2025)"
                    value={newAch.date}
                    onChange={(e) => setNewAch((s) => ({ ...s, date: e.target.value }))}
                    className="w-full rounded border border-ui-border bg-ui-bg px-2 py-1 text-xs text-ui-text placeholder-ui-text-muted focus:border-[#F5C400]/50 focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-2 items-center">
                <div className="w-1/3">
                  <input
                    type="number"
                    min={1}
                    max={10}
                    placeholder="Placement (1, 2, 3)"
                    value={newAch.placementStr}
                    onChange={(e) => setNewAch((s) => ({ ...s, placementStr: e.target.value }))}
                    className="w-full rounded border border-ui-border bg-ui-bg px-2 py-1 text-xs text-ui-text placeholder-ui-text-muted focus:border-[#F5C400]/50 focus:outline-none"
                  />
                </div>
                <div className="w-2/3 text-right">
                  <button
                    type="button"
                    disabled={achPending}
                    onClick={handleAddAchievement}
                    className="cursor-pointer rounded bg-[#F5C400]/10 border border-[#F5C400]/30 text-[#F5C400] px-3 py-1 text-xs font-bold transition hover:bg-[#F5C400] hover:text-black disabled:opacity-50"
                  >
                    + Tambah Prestasi
                  </button>
                </div>
              </div>
            </div>
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
              className="flex cursor-pointer items-center gap-1.5 rounded border border-ui-border px-3 py-1.5 text-xs font-semibold text-ui-text-2 transition hover:bg-ui-hover"
            >
              <X className="h-3 w-3" />
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Members */}
      {members.length > 0 && (
        <div className="border-t border-ui-border px-4 py-3 space-y-3">
          {players.length > 0 && (
            <div>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-ui-text-muted">
                Pemain ({players.length})
              </p>
              <div className="space-y-1">
                {players.map((m) => (
                  <div key={m.user_id} className="flex items-center justify-between py-0.5">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-ui-hover text-[9px] font-bold text-ui-text-muted">
                        {m.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={m.avatar_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          (m.display_name ?? "?").slice(0, 1).toUpperCase()
                        )}
                      </div>
                      <span className="text-xs text-ui-text">{m.display_name ?? "—"}</span>
                      <span className={`text-[10px] ${ROLE_COLOR[m.role]}`}>{ROLE_LABEL[m.role]}</span>
                      {m.jersey_number != null && (
                        <span className="text-[10px] text-ui-text-muted">#{m.jersey_number}</span>
                      )}
                      {m.position && (
                        <span className="text-[10px] text-ui-text-muted">· {m.position}</span>
                      )}
                      <span className={`text-[9px] px-1 rounded-sm font-semibold uppercase tracking-wider ${
                        m.is_public ? "bg-[#F5C400]/15 text-[#F5C400]" : "bg-ui-border text-ui-text-muted"
                      }`}>
                        {m.is_public ? "Publik" : "Hidden"}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setEditingPlayer(m)}
                      className="cursor-pointer rounded p-1 text-ui-text-muted hover:bg-ui-hover hover:text-ui-text-dim transition"
                      title="Edit player info & visibilitas"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {coaches.length > 0 && (
            <div>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-ui-text-muted">
                Pelatih ({coaches.length})
              </p>
              <div className="space-y-1">
                {coaches.map((m) => (
                  <div key={m.user_id} className="flex items-center justify-between py-0.5">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-ui-hover text-[9px] font-bold text-blue-400/60">
                        {m.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={m.avatar_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          (m.display_name ?? "?").slice(0, 1).toUpperCase()
                        )}
                      </div>
                      <span className="text-xs text-ui-text">{m.display_name ?? "—"}</span>
                      <span className="text-[10px] text-blue-400">Coach</span>
                      <span className={`text-[9px] px-1 rounded-sm font-semibold uppercase tracking-wider ${
                        m.is_public ? "bg-[#F5C400]/15 text-[#F5C400]" : "bg-ui-border text-ui-text-muted"
                      }`}>
                        {m.is_public ? "Publik" : "Hidden"}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setEditingPlayer(m)}
                      className="cursor-pointer rounded p-1 text-ui-text-muted hover:bg-ui-hover hover:text-ui-text-dim transition"
                      title="Edit player info & visibilitas"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

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

interface Props {
  divisions: DivisionWithMembers[];
}

const DivisionsAdminClient = ({ divisions }: Props) => {
  if (divisions.length === 0) {
    return (
      <div className="rounded border border-ui-border bg-ui-bg py-16 text-center">
        <p className="text-sm text-ui-text-muted">Belum ada division.</p>
        <p className="mt-1 text-xs text-ui-text-muted/60">Buat division di workspace terlebih dahulu.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-black uppercase tracking-tight text-ui-text">Divisions</h1>
        <p className="text-xs text-ui-text-muted">Data otomatis dari workspace · toggle untuk tampilkan di public</p>
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
