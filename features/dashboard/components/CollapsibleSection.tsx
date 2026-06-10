"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface CollapsibleSectionProps {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

const CollapsibleSection = ({
  title,
  subtitle,
  defaultOpen = true,
  children,
}: CollapsibleSectionProps) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mb-3 flex w-full items-center justify-between text-left hover:opacity-80 transition"
      >
        <div>
          <h2 className="text-sm font-semibold text-ui-text">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-ui-text-2">{subtitle}</p>}
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-ui-text-2" />
        ) : (
          <ChevronDown className="h-4 w-4 text-ui-text-2" />
        )}
      </button>
      {open && children}
    </section>
  );
};
export { CollapsibleSection };
