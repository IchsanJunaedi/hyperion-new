"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface DashboardNavLinkProps {
  href: string;
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
}

export function DashboardNavLink({ href, Icon, label }: DashboardNavLinkProps) {
  const pathname = usePathname();
  const active =
    href === "/dashboard" ? pathname === "/dashboard" : pathname?.startsWith(href);

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded px-3 py-1.5 text-sm transition ${
        active
          ? "bg-[#2C2C2C] font-medium text-[#D4D4D4]"
          : "text-[#9B9A97] hover:bg-[#2C2C2C] hover:text-[#D4D4D4]"
      }`}
    >
      <Icon className="h-[18px] w-[18px] shrink-0" />
      {label}
    </Link>
  );
}
