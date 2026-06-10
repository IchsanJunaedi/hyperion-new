"use client";

import { Loader2 } from "lucide-react";
import { useTransition, useState, useRef, useEffect } from "react";
import { notify } from "@/features/dashboard/components/NotifyModal";

import type { MemberAvailability } from "@/types/database";
import { updateAvailabilityAction } from "../actions/updateAvailability";

interface AvailabilitySelectorProps {
  orgSlug: string;
  memberId: string;
  currentAvailability: MemberAvailability;
  direction?: "up" | "down";
}

const OPTIONS: Array<{ value: MemberAvailability; label: string; dotColor: string }> = [
  { value: "active", label: "Aktif", dotColor: "bg-green-500" },
  { value: "hiatus", label: "Hiatus", dotColor: "bg-amber-500" },
  { value: "unavailable", label: "Tidak Tersedia", dotColor: "bg-red-500" },
];

const AvailabilitySelector = ({
  orgSlug,
  memberId,
  currentAvailability,
  direction = "down",
}: AvailabilitySelectorProps) => {
  const [pending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const currentOption = OPTIONS.find((opt) => opt.value === currentAvailability) ?? OPTIONS[0];

  const handleSelect = (value: MemberAvailability) => {
    if (value === currentAvailability) {
      setIsOpen(false);
      return;
    }

    startTransition(async () => {
      setIsOpen(false);
      const res = await updateAvailabilityAction(orgSlug, memberId, value);
      if (res.ok) {
        notify.success("Status ketersediaan diperbarui");
      } else {
        notify.error(res.message);
      }
    });
  };

  // Determine active visual state (hovered or open)
  const isInteractive = isHovered || isOpen;

  // Set color for flat text state
  const statusTextColor = 
    currentAvailability === "active"
      ? "text-green-500 font-semibold"
      : currentAvailability === "hiatus"
      ? "text-amber-500 font-semibold"
      : "text-red-500 font-semibold";

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        type="button"
        disabled={pending}
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`inline-flex h-8 w-36 items-center justify-between gap-2 rounded-md px-3 text-xs transition-all duration-200 focus:outline-none disabled:opacity-50 ${
          isInteractive
            ? "border border-ui-border bg-ui-bg text-ui-text cursor-pointer"
            : "border border-transparent bg-transparent cursor-pointer"
        }`}
      >
        <span className={isInteractive ? "text-ui-text font-medium" : statusTextColor}>
          {currentOption?.label ?? "Aktif"}
        </span>
        
        {pending ? (
          <Loader2 className="h-3 w-3 animate-spin text-white/40" />
        ) : (
          <svg
            className={`h-3 w-3 text-white/55 transition-all duration-200 ${
              isInteractive ? "opacity-100 scale-100" : "opacity-0 scale-75 pointer-events-none"
            }`}
            style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {isOpen && (
        <div
          className={`absolute right-0 z-50 w-36 rounded-md border border-ui-border bg-ui-bg shadow-xl backdrop-blur-md focus:outline-none py-1 ${
            direction === "up"
              ? "bottom-full mb-1 origin-bottom-right"
              : "top-full mt-1 origin-top-right"
          }`}
        >
          {OPTIONS.map((opt) => {
            const active = opt.value === currentAvailability;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelect(opt.value)}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition duration-150 ${
                  active
                    ? "bg-ui-surface text-ui-text font-medium"
                    : "text-white/70 hover:bg-ui-hover hover:text-ui-text"
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${opt.dotColor}`} />
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
export { AvailabilitySelector };
