"use client";

import { Coins, Leaf, Loader2, Search, Shield, Sword, X, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { notify } from "@/features/dashboard/components/NotifyModal";

import {
  createOpponentProfileAction,
  updateOpponentProfileAction,
} from "@/features/scouting/actions";
import type { OpponentProfile } from "@/features/scouting/queries";
import { getHeroImageUrl, MLBB_HEROES } from "@/features/scrim/data/mlbb-heroes";

// ─── Types ────────────────────────────────────────────────────────────────────

type RoleKey = "exp_laner" | "jungler" | "mid_laner" | "gold_laner" | "roamer";

interface RoleData {
  nickname: string;
  heroPool: string[];
  habit: string;
}

type RosterState = Record<RoleKey, RoleData>;

const EMPTY_ROLE: RoleData = { nickname: "", heroPool: [], habit: "" };

const ROLE_CONFIG: Array<{ key: RoleKey; label: string; Icon: LucideIcon; index: number }> = [
  { key: "jungler",   label: "Jungler",    Icon: Leaf,   index: 1 },
  { key: "mid_laner", label: "Mid Laner",  Icon: Zap,    index: 2 },
  { key: "roamer",    label: "Roamer",     Icon: Shield, index: 3 },
  { key: "gold_laner",label: "Gold Laner", Icon: Coins,  index: 4 },
  { key: "exp_laner", label: "EXP Laner",  Icon: Sword,  index: 5 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseRoleData(raw: unknown): RoleData {
  if (!raw || typeof raw !== "object") return { ...EMPTY_ROLE };
  const r = raw as Record<string, unknown>;
  return {
    nickname: typeof r.nickname === "string" ? r.nickname : "",
    heroPool: Array.isArray(r.heroPool) ? (r.heroPool as string[]) : [],
    habit:    typeof r.habit    === "string" ? r.habit    : "",
  };
}

function initRoster(profileData: Record<string, unknown>): RosterState {
  const raw = profileData.roster as Record<string, unknown> | undefined;
  return {
    exp_laner:  parseRoleData(raw?.exp_laner),
    jungler:    parseRoleData(raw?.jungler),
    mid_laner:  parseRoleData(raw?.mid_laner),
    gold_laner: parseRoleData(raw?.gold_laner),
    roamer:     parseRoleData(raw?.roamer),
  };
}

// ─── HeroPicker ───────────────────────────────────────────────────────────────

interface HeroPickerProps {
  selected: string[];
  onChange: (next: string[]) => void;
}

const HeroPicker = ({ selected, onChange }: HeroPickerProps) => {
  const [search, setSearch] = useState("");

  const filtered =
    search.trim().length > 0
      ? MLBB_HEROES.filter(
          (h) =>
            h.toLowerCase().includes(search.toLowerCase()) &&
            !selected.includes(h),
        ).slice(0, 8)
      : [];

  const add = (hero: string) => {
    if (!selected.includes(hero)) onChange([...selected, hero]);
    setSearch("");
  };

  const remove = (hero: string) => onChange(selected.filter((h) => h !== hero));

  return (
    <div className="space-y-2">
      {/* Search input */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#6B6A68]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari hero..."
          className="h-9 w-full rounded-md border border-[#2D2D2D] bg-[#191919] pl-9 pr-3 text-sm text-[#E5E2E1] placeholder:text-[#6B6A68] focus:border-[#9B9A97] focus:outline-none"
        />
      </div>

      {/* Result list */}
      {filtered.length > 0 && (
        <div className="divide-y divide-[#2D2D2D] overflow-hidden rounded-md border border-[#2D2D2D] bg-[#191919]">
          {filtered.map((hero) => (
            <button
              key={hero}
              type="button"
              onClick={() => add(hero)}
              className="flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-left text-sm text-[#E5E2E1] transition-colors hover:bg-[#2C2C2C]"
            >
              <div className="h-6 w-6 shrink-0 overflow-hidden rounded-full border border-white/10 bg-zinc-800">
                <img
                  src={getHeroImageUrl(hero)}
                  alt={hero}
                  className="h-full w-full object-cover"
                />
              </div>
              {hero}
            </button>
          ))}
        </div>
      )}

      {/* Selected chips */}
      {selected.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((hero) => (
            <span
              key={hero}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#2D2D2D] bg-[#2C2C2C] px-2 py-1 text-xs text-[#D4D4D4]"
            >
              <div className="h-4 w-4 shrink-0 overflow-hidden rounded-full border border-white/10 bg-zinc-800">
                <img
                  src={getHeroImageUrl(hero)}
                  alt={hero}
                  className="h-full w-full object-cover"
                />
              </div>
              {hero}
              <button
                type="button"
                onClick={() => remove(hero)}
                className="cursor-pointer text-[#6B6A68] transition-colors hover:text-[#E5E2E1]"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      ) : (
        search.trim().length === 0 && (
          <p className="text-xs text-[#6B6A68]">Ketik nama hero di atas untuk mencari.</p>
        )
      )}
    </div>
  );
};

// ─── RoleSection ──────────────────────────────────────────────────────────────

interface RoleSectionProps {
  config: (typeof ROLE_CONFIG)[number];
  data: RoleData;
  onUpdate: (patch: Partial<RoleData>) => void;
}

const RoleSection = ({ config, data, onUpdate }: RoleSectionProps) => {
  const { Icon, label, index } = config;
  return (
    <div className="rounded-lg border border-[#2D2D2D] p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#2C2C2C] text-xs font-medium text-[#9B9A97]">
          {index}
        </span>
        <Icon className="h-4 w-4 text-[#9B9A97]" />
        <span className="text-xs font-semibold uppercase tracking-wider text-[#E5E2E1]">
          {label}
        </span>
      </div>

      {/* Nickname */}
      <div>
        <label className="mb-1 block text-xs text-[#9B9A97]">
          Nickname <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          required
          value={data.nickname}
          onChange={(e) => onUpdate({ nickname: e.target.value })}
          className="h-9 w-full rounded-md border border-[#2D2D2D] bg-[#191919] px-3 text-sm text-[#E5E2E1] placeholder:text-[#6B6A68] focus:border-[#9B9A97] focus:outline-none"
        />
      </div>

      {/* Hero Pool */}
      <div>
        <label className="mb-1 block text-xs text-[#9B9A97]">Hero Pool</label>
        <HeroPicker
          selected={data.heroPool}
          onChange={(heroes) => onUpdate({ heroPool: heroes })}
        />
      </div>

      {/* Habit */}
      <div>
        <label className="mb-1 block text-xs text-[#9B9A97]">Habit</label>
        <textarea
          rows={2}
          value={data.habit}
          onChange={(e) => onUpdate({ habit: e.target.value })}
          className="w-full resize-none rounded-md border border-[#2D2D2D] bg-[#191919] px-3 py-2 text-sm text-[#E5E2E1] placeholder:text-[#6B6A68] focus:border-[#9B9A97] focus:outline-none"
        />
      </div>
    </div>
  );
};

// ─── ScoutingFormModal ────────────────────────────────────────────────────────

interface ScoutingFormModalProps {
  orgSlug: string;
  profile?: OpponentProfile;
  onClose: () => void;
}

const ScoutingFormModal = ({ orgSlug, profile, onClose }: ScoutingFormModalProps) => {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!profile;
  const existingData = (profile?.data ?? {}) as Record<string, unknown>;

  const [teamName, setTeamName] = useState(profile?.opponent_name ?? "");
  const [playstyle, setPlaystyle] = useState((existingData.playstyle as string) ?? "");
  const [roster, setRoster] = useState<RosterState>(() => initRoster(existingData));

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const updateRole = (key: RoleKey) => (patch: Partial<RoleData>) => {
    setRoster((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  };

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const payload = {
      opponent_name: teamName.trim(),
      data: {
        playstyle: playstyle.trim() || undefined,
        roster: Object.fromEntries(
          ROLE_CONFIG.map(({ key }) => [
            key,
            {
              nickname: roster[key].nickname.trim(),
              heroPool: roster[key].heroPool,
              habit:    roster[key].habit.trim() || undefined,
            },
          ]),
        ),
      },
    };

    startTransition(async () => {
      setError(null);
      const res = isEdit
        ? await updateOpponentProfileAction(orgSlug, { profile_id: profile.id, ...payload })
        : await createOpponentProfileAction(orgSlug, payload);

      if (res.ok) {
        notify.success(isEdit ? "Profil lawan diperbarui" : "Profil lawan disimpan");
        onClose();
        router.refresh();
      } else {
        setError(res.message);
      }
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="my-4 w-full max-w-2xl overflow-hidden rounded-xl border border-[#2D2D2D] bg-[#202020] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky header */}
        <div className="flex items-center justify-between border-b border-[#2D2D2D] bg-[#202020] px-6 py-5">
          <h3 className="text-base font-bold text-[#E5E2E1]">
            {isEdit ? "Edit Profil Lawan" : "Tambah Profil Lawan"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer text-[#9B9A97] hover:text-[#E5E2E1]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="max-h-[80vh] overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-6 p-6">
            {/* ── Section 1: Team Info ── */}
            <section className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#6B6A68]">
                Informasi Tim
              </h4>

              <div>
                <label className="mb-1 block text-xs text-[#9B9A97]">
                  Nama Tim Lawan <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="h-10 w-full rounded-md border border-[#2D2D2D] bg-[#191919] px-3 text-sm text-[#E5E2E1] placeholder:text-[#6B6A68] focus:border-[#9B9A97] focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-[#9B9A97]">Playstyle Tim</label>
                <textarea
                  rows={2}
                  value={playstyle}
                  onChange={(e) => setPlaystyle(e.target.value)}
                  className="w-full resize-none rounded-md border border-[#2D2D2D] bg-[#191919] px-3 py-2 text-sm text-[#E5E2E1] placeholder:text-[#6B6A68] focus:border-[#9B9A97] focus:outline-none"
                />
              </div>
            </section>

            {/* ── Section 2: Roster ── */}
            <section className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#6B6A68]">
                Roster Tim — Semua Role Wajib Diisi
              </h4>

              {ROLE_CONFIG.map((config) => (
                <RoleSection
                  key={config.key}
                  config={config}
                  data={roster[config.key]}
                  onUpdate={updateRole(config.key)}
                />
              ))}
            </section>

            {error && (
              <p className="rounded border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                {error}
              </p>
            )}

            {/* Footer */}
            <div className="flex justify-end gap-3 border-t border-[#2D2D2D] pt-4">
              <button
                type="button"
                onClick={onClose}
                className="h-9 cursor-pointer rounded-md border border-[#2D2D2D] px-4 text-sm text-[#9B9A97] transition-colors hover:bg-[#2C2C2C]"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={pending}
                className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md bg-[#E5E2E1] px-4 text-sm font-semibold text-[#191919] transition-colors hover:bg-white disabled:opacity-50"
              >
                {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {isEdit ? "Simpan Perubahan" : "Simpan Profil"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export { ScoutingFormModal };
