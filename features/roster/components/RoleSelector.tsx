"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { notify } from "@/features/dashboard/components/NotifyModal";
import { cn } from "@/lib/utils/cn";

import type { MemberRole } from "@/types/database";
import { updateRoleAction } from "../actions/updateRole";

const ROLE_OPTIONS: Array<{ value: MemberRole; label: string; color: string }> = [
  { value: "captain", label: "Captain",  color: "text-green-400"    },
  { value: "coach",   label: "Pelatih",  color: "text-purple-400"   },
  { value: "manager", label: "Manajer",  color: "text-blue-400"     },
  { value: "member",  label: "Member",   color: "text-ui-text-muted" },
];

interface RoleSelectorProps {
  orgSlug: string;
  memberId: string;
  currentRole: MemberRole;
  direction?: "up" | "down";
}

const RoleSelector = ({
  orgSlug,
  memberId,
  currentRole,
  direction = "down",
}: RoleSelectorProps) => {
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

  const selected = ROLE_OPTIONS.find((o) => o.value === currentRole);
  const isInteractive = hovered || open;

  function handleSelect(value: MemberRole) {
    if (value === currentRole) { setOpen(false); return; }
    startTransition(async () => {
      setOpen(false);
      const res = await updateRoleAction(orgSlug, memberId, value);
      if (res.ok) {
        notify.success(`Role diubah ke ${ROLE_OPTIONS.find((o) => o.value === value)?.label ?? value}`);
      } else {
        notify.error(res.message);
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
          "inline-flex h-7 w-24 cursor-pointer items-center justify-between gap-1.5 rounded-md px-2 text-xs transition-all duration-200 focus:outline-none disabled:opacity-50",
          isInteractive
            ? "border border-ui-border bg-ui-bg text-ui-text"
            : "border border-transparent bg-transparent",
        )}
      >
        <span
          className={cn(
            "font-semibold",
            isInteractive ? "text-ui-text" : (selected?.color ?? "text-ui-text-muted"),
          )}
        >
          {selected?.label ?? currentRole}
        </span>
        {pending ? (
          <Loader2 className="h-3 w-3 animate-spin text-ui-text-muted" />
        ) : (
          <svg
            className={cn(
              "h-3 w-3 shrink-0 text-ui-text-2 transition-all duration-200",
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
            "absolute left-0 z-50 w-32 rounded-md border border-ui-border bg-ui-bg py-1 shadow-xl",
            direction === "up" ? "bottom-full mb-1 origin-bottom-left" : "top-full mt-1 origin-top-left",
          )}
        >
          {ROLE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleSelect(opt.value)}
              className={cn(
                "flex w-full items-center justify-between px-3 py-2 text-left text-xs transition",
                currentRole === opt.value
                  ? "bg-ui-surface font-semibold text-ui-text"
                  : "text-ui-text hover:bg-ui-hover",
              )}
            >
              <span>{opt.label}</span>
              <span className={cn("font-mono text-[10px]", opt.color)}>
                {opt.value.slice(0, 3).toUpperCase()}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
export { RoleSelector };
