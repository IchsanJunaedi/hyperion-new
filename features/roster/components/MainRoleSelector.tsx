"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { notify } from "@/features/dashboard/components/NotifyModal";
import { cn } from "@/lib/utils/cn";

import { updateMainRoleAction, type MainRole } from "../actions/updateMainRole";

interface MainRoleSelectorProps {
  orgSlug: string;
  memberId: string;
  currentMainRole: MainRole;
  direction?: "up" | "down";
}

const ROLE_OPTIONS: Array<{ value: MainRole; label: string; shortLabel: string; color: string }> = [
  { value: "exp_lane",  label: "EXP Lane",   shortLabel: "EXP",    color: "text-amber-400"   },
  { value: "jungler",   label: "Jungler",     shortLabel: "JGL",    color: "text-violet-400"  },
  { value: "mid_lane",  label: "Mid Lane",    shortLabel: "MID",    color: "text-cyan-400"    },
  { value: "gold_lane", label: "Gold Lane",   shortLabel: "GOLD",   color: "text-yellow-400"  },
  { value: "roamer",    label: "Roamer",      shortLabel: "ROAM",   color: "text-rose-400"    },
];

const MainRoleSelector = ({
  orgSlug,
  memberId,
  currentMainRole,
  direction = "down",
}: MainRoleSelectorProps) => {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const selected = ROLE_OPTIONS.find((o) => o.value === currentMainRole);
  const isInteractive = hovered || open;

  function handleSelect(value: MainRole) {
    if (value === currentMainRole) { setOpen(false); return; }
    startTransition(async () => {
      setOpen(false);
      const res = await updateMainRoleAction(orgSlug, memberId, value);
      if (res.ok) {
        notify.success(
          value
            ? `Role ingame diubah ke ${ROLE_OPTIONS.find((o) => o.value === value)?.label}`
            : "Role ingame dihapus",
        );
      } else {
        notify.error(res.message ?? "Gagal mengubah role ingame");
      }
    });
  }

  return (
    <div ref={ref} className="relative inline-block text-left">
      <button
        type="button"
        disabled={pending}
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={cn(
          "inline-flex h-8 w-28 cursor-pointer items-center justify-between gap-1.5 rounded-md px-2.5 text-xs transition-all duration-200 focus:outline-none disabled:opacity-50",
          isInteractive
            ? "border border-[#2D2D2D] bg-[#141414] text-white"
            : "border border-transparent bg-transparent",
        )}
      >
        <span
          className={cn(
            isInteractive ? "font-medium text-white" : (selected?.color ?? "text-white/30 italic"),
          )}
        >
          {selected?.shortLabel ?? "—"}
        </span>
        {pending ? (
          <Loader2 className="h-3 w-3 animate-spin text-white/40" />
        ) : (
          <svg
            className={cn(
              "h-3 w-3 text-white/55 transition-all duration-200",
              isInteractive ? "opacity-100" : "opacity-0",
            )}
            style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {open && (
        <div
          className={cn(
          "absolute left-0 z-50 w-36 rounded-md border border-[#2D2D2D] bg-[#141414] py-1 shadow-xl",
          direction === "up" ? "bottom-full mb-1 origin-bottom-left" : "top-full mt-1 origin-top-left",
        )}
        >
          {/* Clear option */}
          <button
            type="button"
            onClick={() => handleSelect(null)}
            className={cn(
              "flex w-full items-center px-3 py-2 text-left text-xs transition",
              currentMainRole === null
                ? "bg-[#1C1C1C] text-white/50"
                : "text-white/40 hover:bg-[#1A1A1A] hover:text-white/60",
            )}
          >
            — Tidak ada —
          </button>
          {ROLE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleSelect(opt.value)}
              className={cn(
                "flex w-full items-center justify-between px-3 py-2 text-left text-xs transition",
                currentMainRole === opt.value
                  ? "bg-[#1C1C1C] font-medium text-white"
                  : "text-white/70 hover:bg-[#1A1A1A] hover:text-white",
              )}
            >
              <span>{opt.label}</span>
              <span className={`font-mono text-[10px] ${opt.color}`}>{opt.shortLabel}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Read-only badge for contexts where editing isn't allowed
const MainRoleBadge = ({ mainRole }: { mainRole: MainRole }) => {
  const opt = ROLE_OPTIONS.find((o) => o.value === mainRole);
  return (
    <div className="inline-flex h-8 w-28 items-center px-2.5">
      <span className={opt ? `text-xs font-semibold ${opt.color}` : "text-xs text-white/20"}>
        {opt?.shortLabel ?? "—"}
      </span>
    </div>
  );
};
export { MainRoleSelector, MainRoleBadge };
