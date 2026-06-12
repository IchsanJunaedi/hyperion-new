"use client";

import Link from "next/link";
import { cn } from "@/lib/utils/cn";

interface OrgSwitcherProps {
  orgs: Array<{ id: string; name: string }>;
  currentOrgId: string;
  basePath: string;
  year?: number;
  month?: number;
  showAllOption?: boolean;
}

const OrgSwitcher = ({ orgs, currentOrgId, basePath, year, month, showAllOption }: OrgSwitcherProps) => {
  if (orgs.length <= 1) return null;

  const items = showAllOption ? [{ id: "all", name: "Semua" }, ...orgs] : orgs;

  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((org) => {
        const active = org.id === currentOrgId;
        
        const params = new URLSearchParams();
        params.set("org", org.id);
        if (year !== undefined) params.set("year", String(year));
        if (month !== undefined) params.set("month", String(month));
        
        return (
          <Link
            key={org.id}
            href={`${basePath}?${params.toString()}`}
            className={cn(
              "inline-flex h-8 items-center rounded-full px-3 text-xs font-medium transition",
              active
                ? "bg-ui-text text-ui-bg"
                : "bg-ui-hover text-ui-text-2 hover:bg-ui-hover-strong hover:text-ui-text-dim",
            )}
          >
            {org.name}
          </Link>
        );
      })}
    </div>
  );
};
export { OrgSwitcher };
