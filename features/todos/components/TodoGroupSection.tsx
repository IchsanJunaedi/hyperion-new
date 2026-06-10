"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface Props {
  label: string;
  count: number;
  children: React.ReactNode;
}

const TodoGroupSection = ({ label, count, children }: Props) => {
  const [collapsed, setCollapsed] = useState(false);

  if (count === 0) return null;

  return (
    <div>
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        className="flex w-full cursor-pointer items-center gap-2 py-2 text-left"
      >
        <span className="text-[11px] font-semibold uppercase tracking-wide text-ui-text-muted">
          {label}
        </span>
        <span className="rounded bg-ui-hover px-1.5 py-0.5 text-[10px] font-medium text-ui-text-2">
          {count}
        </span>
        <span className="ml-1 flex-1 border-t border-ui-border" />
        <ChevronDown
          className={cn("h-3.5 w-3.5 text-ui-text-muted transition", collapsed && "-rotate-90")}
        />
      </button>
      {!collapsed && <div className="space-y-1.5 pb-3">{children}</div>}
    </div>
  );
};

export { TodoGroupSection };
