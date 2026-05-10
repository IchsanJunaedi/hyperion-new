"use client";

import { forwardRef } from "react";

import { cn } from "@/lib/utils/cn";

const GAME_OPTIONS = [
  { value: "mobile_legends", label: "Mobile Legends" },
  { value: "valorant", label: "Valorant" },
  { value: "pubg_mobile", label: "PUBG Mobile" },
  { value: "free_fire", label: "Free Fire" },
  { value: "dota_2", label: "Dota 2" },
  { value: "cs2", label: "Counter-Strike 2" },
] as const;

interface SupportedGameSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  /** Optional. Defaults render all games. */
  options?: ReadonlyArray<{ value: string; label: string }>;
}

export const SupportedGameSelect = forwardRef<
  HTMLSelectElement,
  SupportedGameSelectProps
>(({ className, options = GAME_OPTIONS, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      "disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  >
    {options.map((opt) => (
      <option key={opt.value} value={opt.value}>
        {opt.label}
      </option>
    ))}
  </select>
));
SupportedGameSelect.displayName = "SupportedGameSelect";

export { GAME_OPTIONS };
