"use client";

import { Eye, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { ConfirmDeleteDialog } from "@/features/dashboard/components/ConfirmDeleteDialog";
import { notify } from "@/features/dashboard/components/NotifyModal";
import { deleteOpponentProfileAction } from "@/features/scouting/actions";
import type { OpponentProfile } from "@/features/scouting/queries";

type RoleKey = "exp_laner" | "jungler" | "mid_laner" | "gold_laner" | "roamer";

const ROLE_LABELS: Record<RoleKey, string> = {
  exp_laner:  "EXP Laner",
  jungler:    "Jungler",
  mid_laner:  "Mid Laner",
  gold_laner: "Gold Laner",
  roamer:     "Roamer",
};

interface RoleEntry {
  nickname?: string;
  heroPool?: string[];
  habit?: string;
}

interface ProfileData {
  playstyle?: string;
  roster?: Partial<Record<RoleKey, RoleEntry>>;
}

interface ScoutingCardProps {
  profile: OpponentProfile;
  orgSlug?: string;
  onEdit?: () => void;
  onView?: () => void;
}

const ScoutingCard = ({ orgSlug, profile, onEdit, onView }: ScoutingCardProps) => {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const data = (profile.data ?? {}) as ProfileData;
  const roster = data.roster;
  const filledRoles = (Object.entries(ROLE_LABELS) as [RoleKey, string][]).filter(
    ([key]) => !!roster?.[key]?.nickname,
  );

  function handleDelete() {
    if (!orgSlug) return;
    startTransition(async () => {
      const res = await deleteOpponentProfileAction(orgSlug, profile.id);
      if (res.ok) {
        notify.success("Profil lawan dihapus");
        setDeleteOpen(false);
        router.refresh();
      } else {
        notify.error(res.message);
      }
    });
  }

  const isInteractive = !!onView;

  return (
    <>
      <div
        role={isInteractive ? "button" : undefined}
        tabIndex={isInteractive ? 0 : undefined}
        onClick={onView}
        onKeyDown={(e) => e.key === "Enter" && onView?.()}
        className={`group rounded-xl border border-[#2D2D2D] bg-[#202020] p-4 space-y-3 transition-all${isInteractive ? " cursor-pointer hover:border-[#3D3D3D] hover:bg-[#252525]" : ""}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Eye className="h-4 w-4 text-orange-400 shrink-0" />
            <h3 className="text-sm font-semibold text-[#E5E2E1] truncate">
              {profile.opponent_name}
            </h3>
          </div>
          {(onEdit || orgSlug) && (
            <div className="flex items-center gap-0.5 shrink-0">
              {onEdit && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onEdit(); }}
                  className="p-1.5 text-[#6B6A68] hover:text-[#9B9A97] transition cursor-pointer"
                  title="Edit profil"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              )}
              {orgSlug && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setDeleteOpen(true); }}
                  className="p-1.5 text-[#6B6A68] hover:text-red-400 transition cursor-pointer"
                  title="Hapus profil"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Playstyle */}
        {data.playstyle && (
          <p className="text-xs text-[#9B9A97] line-clamp-2">{data.playstyle}</p>
        )}

        {/* Roster nicknames */}
        {filledRoles.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-6 gap-y-1">
            {filledRoles.map(([key, label]) => (
              <div key={key} className="flex items-baseline gap-1.5 text-xs min-w-0">
                <span className="text-[#6B6A68] shrink-0">{label}</span>
                <span className="text-[#D4D4D4] truncate">{roster![key]!.nickname}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[#6B6A68]">Belum ada data roster</p>
        )}

        {isInteractive && (
          <p className="text-[10px] text-[#6B6A68] group-hover:text-[#9B9A97] transition-colors">
            Klik untuk lihat detail
          </p>
        )}
      </div>

      {orgSlug && (
        <ConfirmDeleteDialog
          open={deleteOpen}
          title="Hapus Profil Lawan"
          message={`Profil "${profile.opponent_name}" akan dihapus permanen.`}
          confirmPhrase="HAPUS"
          pending={pending}
          onConfirm={handleDelete}
          onCancel={() => setDeleteOpen(false)}
        />
      )}
    </>
  );
};

export { ScoutingCard };
