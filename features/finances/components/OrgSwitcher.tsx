"use client";

import Link from "next/link";
import { cn } from "@/lib/utils/cn";

interface OrgSwitcherProps {
  orgs: Array<{ id: string; name: string }>;
  currentOrgId: string;
  basePath: string;
  year?: number;
  month?: number;
}

const OrgSwitcher = ({ orgs, currentOrgId, basePath, year, month }: OrgSwitcherProps) => {
  if (orgs.length <= 1) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {orgs.map((org) => {
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
                ? "bg-[#E5E2E1] text-[#191919]"
                : "bg-[#2C2C2C] text-[#9B9A97] hover:bg-[#353535] hover:text-[#D4D4D4]",
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
