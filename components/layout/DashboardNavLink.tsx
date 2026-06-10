"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface DashboardNavLinkProps {
  href: string;
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
}

const DashboardNavLink = ({ href, Icon, label }: DashboardNavLinkProps) => {
  const pathname = usePathname();
  const active =
    href === "/dashboard" ? pathname === "/dashboard" : pathname?.startsWith(href);

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded px-3 py-1.5 text-sm transition ${
        active
          ? "bg-ui-hover font-medium text-ui-text-dim"
          : "text-ui-text-2 hover:bg-ui-hover hover:text-ui-text-dim"
      }`}
    >
      <Icon className="h-[18px] w-[18px] shrink-0" />
      {label}
    </Link>
  );
};
export { DashboardNavLink };
