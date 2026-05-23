"use client";

import { Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  createOpponentProfileAction,
  updateOpponentProfileAction,
} from "@/features/scouting/actions";
import type { OpponentProfile } from "@/features/scouting/queries";

interface ScoutingFormModalProps {
  orgSlug: string;
  profile?: OpponentProfile;
  onClose: () => void;
}

export function ScoutingFormModal({ orgSlug, profile, onClose }: ScoutingFormModalProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!profile;
  const data = (profile?.data ?? {}) as Record<string, unknown>;

  // Controlled tag inputs
  const [heroPool, setHeroPool] = useState<string>(
    ((data.hero_pool as string[]) ?? []).join(", "),
  );
  const [usernames, setUsernames] = useState<string>(
    ((data.usernames as string[]) ?? []).join(", "),
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  function parseTags(raw: string): string[] {
    return raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    const payload = {
      opponent_name: fd.get("opponent_name") as string,
      data: {
        team_name: (fd.get("team_name") as string) || undefined,
        high_rank: (fd.get("high_rank") as string) || undefined,
        current_rank: (fd.get("current_rank") as string) || undefined,
        playstyle: (fd.get("playstyle") as string) || undefined,
        weaknesses: (fd.get("weaknesses") as string) || undefined,
        notes: (fd.get("notes") as string) || undefined,
        hero_pool: parseTags(heroPool),
        usernames: parseTags(usernames),
      },
    };

    startTransition(async () => {
      setError(null);
      const res = isEdit
        ? await updateOpponentProfileAction(orgSlug, {
            profile_id: profile.id,
            ...payload,
          })
        : await createOpponentProfileAction(orgSlug, payload);

      if (res.ok) {
        toast.success(isEdit ? "Profil lawan diperbarui" : "Profil lawan disimpan");
        onClose();
        router.refresh();
      } else {
        setError(res.message);
      }
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl border border-[#2D2D2D] bg-[#202020] p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-[#E5E2E1]">
            {isEdit ? "Edit Profil Lawan" : "Tambah Profil Lawan"}
          </h3>
          <button type="button" onClick={onClose} className="text-[#9B9A97] hover:text-[#E5E2E1]">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-[#9B9A97] mb-1">
              Nama Lawan / Tim <span className="text-red-400">*</span>
            </label>
            <input
              name="opponent_name"
              required
              defaultValue={profile?.opponent_name ?? ""}
              placeholder="Team Alpha"
              className="h-10 w-full rounded-md border border-[#2D2D2D] bg-[#191919] px-3 text-sm text-[#E5E2E1] focus:border-[#9B9A97] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs text-[#9B9A97] mb-1">Nama Tim Lengkap</label>
            <input
              name="team_name"
              defaultValue={(data.team_name as string) ?? ""}
              placeholder="Team Alpha Esports"
              className="h-10 w-full rounded-md border border-[#2D2D2D] bg-[#191919] px-3 text-sm text-[#E5E2E1] focus:border-[#9B9A97] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#9B9A97] mb-1">High Rank</label>
              <input
                name="high_rank"
                defaultValue={(data.high_rank as string) ?? ""}
                placeholder="Mythical Glory"
                className="h-10 w-full rounded-md border border-[#2D2D2D] bg-[#191919] px-3 text-sm text-[#E5E2E1] focus:border-[#9B9A97] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-[#9B9A97] mb-1">Current Rank</label>
              <input
                name="current_rank"
                defaultValue={(data.current_rank as string) ?? ""}
                placeholder="Mythic"
                className="h-10 w-full rounded-md border border-[#2D2D2D] bg-[#191919] px-3 text-sm text-[#E5E2E1] focus:border-[#9B9A97] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-[#9B9A97] mb-1">
              Hero / Champion Pool{" "}
              <span className="text-[#6B6A68]">(pisahkan dengan koma)</span>
            </label>
            <input
              value={heroPool}
              onChange={(e) => setHeroPool(e.target.value)}
              placeholder="Fanny, Gusion, Lancelot"
              className="h-10 w-full rounded-md border border-[#2D2D2D] bg-[#191919] px-3 text-sm text-[#E5E2E1] focus:border-[#9B9A97] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs text-[#9B9A97] mb-1">
              Username In-Game{" "}
              <span className="text-[#6B6A68]">(pisahkan dengan koma)</span>
            </label>
            <input
              value={usernames}
              onChange={(e) => setUsernames(e.target.value)}
              placeholder="AlphaPlayer, AlphaTwo"
              className="h-10 w-full rounded-md border border-[#2D2D2D] bg-[#191919] px-3 text-sm text-[#E5E2E1] focus:border-[#9B9A97] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs text-[#9B9A97] mb-1">Playstyle</label>
            <textarea
              name="playstyle"
              rows={2}
              defaultValue={(data.playstyle as string) ?? ""}
              placeholder="Agresif early game, suka invade jungle..."
              className="w-full rounded-md border border-[#2D2D2D] bg-[#191919] px-3 py-2 text-sm text-[#E5E2E1] focus:border-[#9B9A97] focus:outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-xs text-[#9B9A97] mb-1">Kelemahan</label>
            <textarea
              name="weaknesses"
              rows={2}
              defaultValue={(data.weaknesses as string) ?? ""}
              placeholder="Lemah terhadap CC chain, roaming lambat..."
              className="w-full rounded-md border border-[#2D2D2D] bg-[#191919] px-3 py-2 text-sm text-[#E5E2E1] focus:border-[#9B9A97] focus:outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-xs text-[#9B9A97] mb-1">Catatan</label>
            <textarea
              name="notes"
              rows={2}
              defaultValue={(data.notes as string) ?? ""}
              placeholder="Info tambahan..."
              className="w-full rounded-md border border-[#2D2D2D] bg-[#191919] px-3 py-2 text-sm text-[#E5E2E1] focus:border-[#9B9A97] focus:outline-none resize-none"
            />
          </div>

          {error && (
            <p className="text-xs text-red-400 rounded border border-red-500/20 bg-red-500/10 px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-9 rounded-md border border-[#2D2D2D] px-4 text-sm text-[#9B9A97] hover:bg-[#2C2C2C] cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex h-9 items-center gap-2 rounded-md bg-[#E5E2E1] px-4 text-sm font-semibold text-[#191919] hover:bg-white disabled:opacity-50 cursor-pointer"
            >
              {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {isEdit ? "Simpan Perubahan" : "Tambah Profil"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
