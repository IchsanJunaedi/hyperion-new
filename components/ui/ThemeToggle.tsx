"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

import { cn } from "@/lib/utils/cn";

interface ThemeToggleProps {
  /** "full" shows a sliding pill with both icons; "icon" is a compact single button. */
  variant?: "full" | "icon";
  className?: string;
}

const ThemeToggle = ({ variant = "full", className }: ThemeToggleProps) => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const current = (theme === "system" ? resolvedTheme : theme) ?? "dark";
  const isDark = current === "dark";

  // Avoid hydration mismatch — render a neutral placeholder until mounted.
  if (!mounted) {
    return (
      <div
        className={cn(
          variant === "full" ? "h-9 w-[72px]" : "h-9 w-9",
          "rounded-full border border-ui-border bg-ui-elevated",
          className,
        )}
        aria-hidden
      />
    );
  }

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={() => setTheme(isDark ? "light" : "dark")}
        aria-label={isDark ? "Aktifkan mode terang" : "Aktifkan mode gelap"}
        className={cn(
          "group relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-ui-border bg-ui-elevated text-ui-text-2 transition-colors hover:bg-ui-hover hover:text-ui-text",
          className,
        )}
      >
        <Sun
          className={cn(
            "absolute h-[18px] w-[18px] transition-all duration-300",
            isDark ? "scale-0 -rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100",
          )}
        />
        <Moon
          className={cn(
            "absolute h-[18px] w-[18px] transition-all duration-300",
            isDark ? "scale-100 rotate-0 opacity-100" : "scale-0 rotate-90 opacity-0",
          )}
        />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Aktifkan mode terang" : "Aktifkan mode gelap"}
      role="switch"
      aria-checked={isDark}
      className={cn(
        "group relative inline-flex h-9 w-[72px] cursor-pointer items-center rounded-full border border-ui-border bg-ui-elevated p-1 transition-colors hover:border-ui-hover-strong",
        className,
      )}
    >
      {/* Sliding knob */}
      <span
        className={cn(
          "absolute top-1 left-1 flex h-7 w-7 items-center justify-center rounded-full bg-ui-bg shadow-sm transition-transform duration-300 ease-out",
          isDark ? "translate-x-0" : "translate-x-[36px]",
        )}
      >
        <Sun
          className={cn(
            "absolute h-4 w-4 text-amber-500 transition-all duration-300",
            isDark ? "scale-0 -rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100",
          )}
        />
        <Moon
          className={cn(
            "absolute h-4 w-4 text-indigo-300 transition-all duration-300",
            isDark ? "scale-100 rotate-0 opacity-100" : "scale-0 rotate-90 opacity-0",
          )}
        />
      </span>
      {/* Static track icons */}
      <span className="flex w-full items-center justify-between px-[7px] text-ui-text-muted">
        <Moon className={cn("h-3.5 w-3.5 transition-opacity", isDark ? "opacity-0" : "opacity-60")} />
        <Sun className={cn("h-3.5 w-3.5 transition-opacity", isDark ? "opacity-60" : "opacity-0")} />
      </span>
    </button>
  );
};

export { ThemeToggle };
