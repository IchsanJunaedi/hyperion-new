"use client";

import { Users } from "lucide-react";

interface ManagerDivisionListProps {
  divisions: Array<{
    id: string;
    name: string;
    isActive: boolean;
    memberCount: number;
  }>;
}

const ManagerDivisionList = ({ divisions }: ManagerDivisionListProps) => {
  if (divisions.length === 0) {
    return (
      <p className="rounded-lg border border-ui-border bg-white/[0.02] px-4 py-8 text-center text-sm text-ui-text-muted">
        Belum ada divisi di tim kamu.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {divisions.map((div) => (
        <div
          key={div.id}
          className="flex items-center justify-between rounded-lg border border-ui-border bg-white/[0.02] px-4 py-3"
        >
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-ui-text">{div.name}</span>
            {!div.isActive && (
              <span className="rounded-full bg-ui-elevated px-2 py-0.5 text-[10px] text-ui-text-muted">Arsip</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-ui-text-2">
            <Users className="h-3.5 w-3.5" />
            {div.memberCount} member
          </div>
        </div>
      ))}
    </div>
  );
};
export { ManagerDivisionList };
