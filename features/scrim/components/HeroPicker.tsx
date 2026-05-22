"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import { MLBB_HEROES, getHeroImageUrl } from "@/features/scrim/data/mlbb-heroes";
import { cn } from "@/lib/utils/cn";

// Deterministic fallback colour when image is unavailable
const AVATAR_COLOURS = [
  "bg-violet-500/30 text-violet-300",
  "bg-blue-500/30 text-blue-300",
  "bg-emerald-500/30 text-emerald-300",
  "bg-amber-500/30 text-amber-300",
  "bg-rose-500/30 text-rose-300",
  "bg-cyan-500/30 text-cyan-300",
  "bg-pink-500/30 text-pink-300",
];

function heroColour(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLOURS[h % AVATAR_COLOURS.length]!;
}

function HeroAvatar({ name, size = "sm" }: { name: string; size?: "sm" | "md" }) {
  const initials = name.slice(0, 2).toUpperCase();
  const sizeClass = size === "sm" ? "h-5 w-5" : "h-6 w-6";
  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full",
        sizeClass,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={getHeroImageUrl(name)}
        alt={name}
        className="h-full w-full object-cover"
        onError={(e) => {
          // Fallback: hide img, show initials bg
          const el = e.currentTarget;
          el.style.display = "none";
          const parent = el.parentElement;
          if (parent) {
            parent.classList.add(...heroColour(name).split(" "));
            const span = document.createElement("span");
            span.className = size === "sm" ? "text-[9px] font-bold" : "text-[10px] font-bold";
            span.textContent = initials;
            parent.appendChild(span);
          }
        }}
      />
    </div>
  );
}

interface HeroPickerProps {
  value: string;
  onChange: (hero: string) => void;
  placeholder?: string;
  /** Heroes already picked elsewhere in this game — hidden from dropdown */
  excludedHeroes?: Set<string>;
}

export function HeroPicker({
  value,
  onChange,
  placeholder = "Pilih hero…",
  excludedHeroes,
}: HeroPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const available = excludedHeroes
    ? MLBB_HEROES.filter((h) => !excludedHeroes.has(h))
    : MLBB_HEROES;

  const filtered = query.trim()
    ? available.filter((h) => h.toLowerCase().includes(query.toLowerCase()))
    : available;

  useEffect(() => {
    if (open) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  function select(hero: string) {
    onChange(hero);
    setOpen(false);
  }

  function clear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange("");
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex h-8 w-full cursor-pointer items-center gap-2 rounded-lg border px-2.5 text-left text-xs transition-colors",
          open
            ? "border-yellow-400/50 bg-[#1C1C1C]"
            : "border-[#2D2D2D] bg-[#1a1a1a] hover:border-[#3D3D3D]",
        )}
      >
        {value ? (
          <>
            <HeroAvatar name={value} size="sm" />
            <span className="flex-1 truncate font-medium text-[#E5E2E1]">{value}</span>
            <X
              className="h-3 w-3 shrink-0 text-[#6B6A68] hover:text-rose-400"
              onClick={clear}
            />
          </>
        ) : (
          <>
            <span className="h-5 w-5 shrink-0 rounded-full border border-dashed border-[#3D3D3D]" />
            <span className="flex-1 text-[#6B6A68]">{placeholder}</span>
            <ChevronDown className="h-3 w-3 shrink-0 text-[#6B6A68]" />
          </>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-[200] overflow-hidden rounded-xl border border-[#3A3A3A] bg-[#1C1C1C] shadow-[0_8px_32px_rgba(0,0,0,0.85)] ring-1 ring-white/[0.06]">
          {/* Search */}
          <div className="flex items-center gap-2 border-b border-[#2D2D2D] px-3 py-2.5">
            <Search className="h-3.5 w-3.5 shrink-0 text-[#6B6A68]" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari hero…"
              className="flex-1 bg-transparent text-xs text-[#E5E2E1] outline-none placeholder:text-[#6B6A68]"
            />
          </div>

          {/* Hero list */}
          <ul className="sidebar-scroll max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-4 text-center text-xs text-[#6B6A68]">
                Hero tidak ditemukan
              </li>
            ) : (
              filtered.map((hero) => (
                <li key={hero}>
                  <button
                    type="button"
                    onClick={() => select(hero)}
                    className={cn(
                      "flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-xs transition-colors hover:bg-[#252525]",
                      hero === value
                        ? "bg-yellow-400/10 text-yellow-300"
                        : "text-[#E5E2E1]",
                    )}
                  >
                    <HeroAvatar name={hero} size="md" />
                    {hero}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
