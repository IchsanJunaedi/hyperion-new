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
        className={`group rounded-xl border border-ui-border bg-ui-surface p-4 space-y-3 transition-all${isInteractive ? " cursor-pointer hover:border-[#3D3D3D] hover:bg-ui-elevated" : ""}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Eye className="h-4 w-4 text-orange-400 shrink-0" />
            <h3 className="text-sm font-semibold text-ui-text truncate">
              {profile.opponent_name}
            </h3>
          </div>
          {(onEdit || orgSlug) && (
            <div className="flex items-center gap-0.5 shrink-0">
              {onEdit && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onEdit(); }}
                  className="p-1.5 text-ui-text-muted hover:text-ui-text-2 transition cursor-pointer"
                  title="Edit profil"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              )}
              {orgSlug && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setDeleteOpen(true); }}
                  className="p-1.5 text-ui-text-muted hover:text-red-400 transition cursor-pointer"
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
          <p className="text-xs text-ui-text-2 line-clamp-2">{data.playstyle}</p>
        )}

        {/* Roster nicknames */}
        {filledRoles.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-6 gap-y-1">
            {filledRoles.map(([key, label]) => (
              <div key={key} className="flex items-baseline gap-1.5 text-xs min-w-0">
                <span className="text-ui-text-muted shrink-0">{label}</span>
                <span className="text-ui-text-dim truncate">{roster![key]!.nickname}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-ui-text-muted">Belum ada data roster</p>
        )}

        {isInteractive && (
          <p className="text-[10px] text-ui-text-muted group-hover:text-ui-text-2 transition-colors">
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
