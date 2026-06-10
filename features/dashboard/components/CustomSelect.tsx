"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface CustomSelectProps {
  value: string;
  options: Array<{ value: string; label: string; color?: string }>;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const CustomSelect = ({ value, options, onChange, disabled }: CustomSelectProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition border border-ui-border bg-ui-surface hover:bg-ui-hover disabled:opacity-50 ${selected?.color ?? "text-ui-text-dim"}`}
      >
        {selected?.label ?? value}
        <ChevronDown className="h-3 w-3 text-ui-text-2" />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 min-w-[120px] rounded-lg border border-ui-border bg-ui-surface py-1 shadow-xl">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`flex w-full items-center px-3 py-1.5 text-xs transition hover:bg-ui-hover ${
                opt.value === value ? "bg-ui-hover" : ""
              } ${opt.color ?? "text-ui-text-dim"}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
export { CustomSelect };
