"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface CustomSelectProps {
  value: string;
  options: Array<{ value: string; label: string; color?: string }>;
  onChange: (value: string) => void;
  disabled?: boolean;
  fullWidth?: boolean;
  placeholder?: string;
  className?: string;
}
 
const CustomSelect = ({
  value,
  options,
  onChange,
  disabled,
  fullWidth,
  placeholder,
  className,
}: CustomSelectProps) => {
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
    <div ref={ref} className={fullWidth ? "relative w-full" : "relative inline-block"}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={
          className
            ? className
            : fullWidth
            ? `flex h-10 w-full items-center justify-between rounded border border-ui-border bg-ui-bg px-3 text-sm text-ui-text focus:outline-none focus:border-[#4D4D4D] transition disabled:opacity-50 ${selected?.color ?? "text-ui-text"}`
            : `inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition border border-ui-border bg-ui-surface hover:bg-ui-hover disabled:opacity-50 ${selected?.color ?? "text-ui-text-dim"}`
        }
      >
        <span>{selected ? selected.label : (placeholder ?? value)}</span>
        <ChevronDown className={fullWidth ? "h-4 w-4 text-ui-text-2" : "h-3 w-3 text-ui-text-2"} />
      </button>

      {open && (
        <div
          className={
            fullWidth
              ? "absolute left-0 top-full z-50 mt-1 w-full max-h-60 overflow-y-auto rounded-lg border border-ui-border bg-ui-surface py-1 shadow-xl"
              : "absolute left-0 top-full z-50 mt-1 min-w-[120px] rounded-lg border border-ui-border bg-ui-surface py-1 shadow-xl"
          }
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`flex w-full items-center px-3 py-2 text-sm transition hover:bg-ui-hover ${
                opt.value === value ? "bg-ui-hover" : ""
              } ${opt.color ?? (fullWidth ? "text-ui-text" : "text-ui-text-dim")}`}
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
