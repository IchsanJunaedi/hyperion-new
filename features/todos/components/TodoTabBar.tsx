"use client";

import { cn } from "@/lib/utils/cn";
import type { TodoTab } from "../types";

const TABS: { value: TodoTab; label: string; ownerOnly?: boolean }[] = [
  { value: "all", label: "Semua" },
  { value: "smart", label: "Smart" },
  { value: "manual", label: "Manual" },
  { value: "assigned_out", label: "Assigned Out", ownerOnly: true },
];

interface Props {
  activeTab: TodoTab;
  isOwner: boolean;
  onChange: (tab: TodoTab) => void;
}

const TodoTabBar = ({ activeTab, isOwner, onChange }: Props) => (
  <div className="flex gap-0 border-b border-ui-border">
    {TABS.filter((t) => !t.ownerOnly || isOwner).map((tab) => (
      <button
        key={tab.value}
        type="button"
        onClick={() => onChange(tab.value)}
        className={cn(
          "-mb-px cursor-pointer border-b-2 px-4 py-2 text-sm transition",
          activeTab === tab.value
            ? "border-ui-text-dim text-ui-text-dim"
            : "border-transparent text-ui-text-2 hover:text-ui-text-dim",
        )}
      >
        {tab.label}
      </button>
    ))}
  </div>
);

export { TodoTabBar };
