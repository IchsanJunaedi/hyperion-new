"use client";

import { Coins, Leaf, Printer, Shield, Sword, X, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect } from "react";

import { getHeroImageUrl } from "@/features/scrim/data/mlbb-heroes";
import type { OpponentProfile } from "@/features/scouting/queries";

// ─── Types ────────────────────────────────────────────────────────────────────

type RoleKey = "exp_laner" | "jungler" | "mid_laner" | "gold_laner" | "roamer";

interface RoleEntry {
  nickname?: string;
  heroPool?: string[];
  habit?: string;
}

interface ProfileData {
  playstyle?: string;
  roster?: Partial<Record<RoleKey, RoleEntry>>;
}

const ROLE_CONFIG: Array<{ key: RoleKey; label: string; Icon: LucideIcon }> = [
  { key: "exp_laner",  label: "EXP Laner",  Icon: Sword  },
  { key: "jungler",   label: "Jungler",    Icon: Leaf   },
  { key: "mid_laner", label: "Mid Laner",  Icon: Zap    },
  { key: "gold_laner",label: "Gold Laner", Icon: Coins  },
  { key: "roamer",    label: "Roamer",     Icon: Shield },
];

// ─── Print helper ─────────────────────────────────────────────────────────────

function esc(s?: string): string {
  return (s ?? "—")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildPrintHtml(profile: OpponentProfile, data: ProfileData, baseUrl: string): string {
  const rolesHtml = ROLE_CONFIG.map(({ key, label }) => {
    const role = data.roster?.[key];
    const heroChips = (role?.heroPool ?? []).map((hero) => {
      const imgUrl = `${baseUrl}${getHeroImageUrl(hero)}`;
      return `<span style="display:inline-flex;align-items:center;gap:5px;
                            border:1px solid #ddd;border-radius:999px;
                            padding:3px 8px 3px 3px;font-size:12px;color:#222;
                            background:#fafafa;margin:2px;">
        <img src="${imgUrl}" alt="${esc(hero)}"
             style="width:20px;height:20px;border-radius:50%;object-fit:cover;
                    border:1px solid #e0e0e0;flex-shrink:0;" />
        ${esc(hero)}
      </span>`;
    }).join("") || "<span style='color:#999;font-size:13px;'>—</span>";

    return `
      <div style="margin-bottom:16px;padding-top:12px;border-top:1px solid #e0e0e0;">
        <p style="margin:0 0 8px;font-size:11px;font-weight:700;text-transform:uppercase;
                  letter-spacing:.07em;color:#555;">${label}</p>
        <p style="margin:3px 0;font-size:13px;">
          <span style="color:#777;">Nickname:</span> ${esc(role?.nickname)}
        </p>
        <div style="margin:6px 0 3px;">
          <span style="color:#777;font-size:13px;">Hero Pool:</span>
          <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px;">${heroChips}</div>
        </div>
        ${role?.habit
          ? `<p style="margin:6px 0 3px;font-size:13px;"><span style="color:#777;">Habit:</span> ${esc(role.habit)}</p>`
          : ""}
      </div>`;
  }).join("");

  return `<!DOCTYPE html><html lang="id"><head>
    <meta charset="utf-8">
    <title>Scouting — ${esc(profile.opponent_name)}</title>
    <style>
      *, *::before, *::after { box-sizing: border-box; }
      body { font-family: 'Segoe UI', Arial, sans-serif; padding: 32px 40px;
             color: #111; background: #fff; line-height: 1.5; }
      h1 { font-size: 22px; font-weight: 700; margin: 0 0 6px; }
      .playstyle { font-size: 13px; color: #444; background: #f5f5f5;
                   border-radius: 6px; padding: 10px 14px; margin-bottom: 20px; }
      h2 { font-size: 13px; font-weight: 700; text-transform: uppercase;
           letter-spacing: .07em; color: #333; margin: 20px 0 0; }
      @media print { @page { margin: 16mm; } img { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    </style>
  </head><body>
    <h1>${esc(profile.opponent_name)}</h1>
    ${data.playstyle
      ? `<div class="playstyle"><strong>Playstyle:</strong> ${esc(data.playstyle)}</div>`
      : ""}
    <h2>Roster Tim</h2>
    ${rolesHtml}
    <script>window.print(); window.onafterprint = function(){ window.close(); };</script>
  </body></html>`;
}

// ─── ScoutingDetailModal ──────────────────────────────────────────────────────

interface ScoutingDetailModalProps {
  profile: OpponentProfile;
  onClose: () => void;
}

const ScoutingDetailModal = ({ profile, onClose }: ScoutingDetailModalProps) => {
  const data = (profile.data ?? {}) as ProfileData;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  function handleExport() {
    const w = window.open("", "_blank");
    if (!w) return;
    const base = `${window.location.protocol}//${window.location.host}`;
    w.document.write(buildPrintHtml(profile, data, base));
    w.document.close();
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
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2D2D2D] px-6 py-5">
          <div className="min-w-0">
            <h3 className="text-base font-bold text-[#E5E2E1] truncate">
              {profile.opponent_name}
            </h3>
            {data.playstyle && (
              <p className="mt-0.5 text-xs text-[#9B9A97] line-clamp-1">{data.playstyle}</p>
            )}
          </div>
          <div className="flex items-center gap-2 ml-4 shrink-0">
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#2D2D2D] px-3 text-xs text-[#9B9A97] hover:bg-[#2C2C2C] hover:text-[#E5E2E1] transition-colors cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" />
              Export
            </button>
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer text-[#9B9A97] hover:text-[#E5E2E1]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="max-h-[80vh] overflow-y-auto p-6 space-y-4">
          {/* Playstyle section */}
          {data.playstyle && (
            <div className="rounded-lg border border-[#2D2D2D] bg-[#191919] px-4 py-3">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#6B6A68]">
                Playstyle Tim
              </p>
              <p className="text-sm text-[#E5E2E1]">{data.playstyle}</p>
            </div>
          )}

          {/* Role sections */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#6B6A68]">
              Roster Tim
            </h4>

            {ROLE_CONFIG.map(({ key, label, Icon }, idx) => {
              const role = data.roster?.[key];
              return (
                <div key={key} className="rounded-lg border border-[#2D2D2D] p-4 space-y-3">
                  {/* Role header */}
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#2C2C2C] text-xs font-medium text-[#9B9A97]">
                      {idx + 1}
                    </span>
                    <Icon className="h-4 w-4 text-[#9B9A97]" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#E5E2E1]">
                      {label}
                    </span>
                  </div>

                  {role?.nickname ? (
                    <>
                      {/* Nickname */}
                      <div className="flex items-baseline gap-2 text-sm">
                        <span className="text-xs text-[#6B6A68] shrink-0">Nickname</span>
                        <span className="text-[#D4D4D4] font-medium">{role.nickname}</span>
                      </div>

                      {/* Hero pool */}
                      {(role.heroPool?.length ?? 0) > 0 && (
                        <div>
                          <p className="mb-1.5 text-xs text-[#6B6A68]">Hero Pool</p>
                          <div className="flex flex-wrap gap-1.5">
                            {role.heroPool!.map((hero) => (
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
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Habit */}
                      {role.habit && (
                        <div>
                          <p className="mb-1 text-xs text-[#6B6A68]">Habit</p>
                          <p className="text-sm text-[#9B9A97]">{role.habit}</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-[#6B6A68]">Belum diisi</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export { ScoutingDetailModal };
