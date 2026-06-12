"use client";

import { Menu, X } from "lucide-react";
import { useState } from "react";
import { DashboardSidebarNav } from "@/components/layout/DashboardSidebarNav";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const DashboardMobileNav = ({ orgId }: { orgId?: string }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label="Buka menu"
        onClick={() => setOpen(true)}
        className="md:hidden flex h-8 w-8 cursor-pointer items-center justify-center rounded text-ui-text-2 transition hover:bg-ui-hover hover:text-ui-text"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed left-0 top-0 z-50 h-screen w-[280px] flex flex-col bg-ui-surface border-r border-ui-border text-sm transition-transform duration-200 md:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-12 shrink-0 items-center justify-between border-b border-ui-border px-4">
          <span className="text-sm font-semibold text-ui-text-dim">Menu</span>
          <button
            type="button"
            aria-label="Tutup menu"
            onClick={() => setOpen(false)}
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded text-ui-text-muted hover:text-ui-text"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {/* Clicking a nav link closes the drawer via navigation */}
        <div onClick={() => setOpen(false)} className="flex-1 overflow-y-auto">
          <DashboardSidebarNav orgId={orgId} />
        </div>
        <div className="flex shrink-0 items-center justify-between border-t border-ui-border px-4 py-3">
          <span className="text-sm text-ui-text-2">Tema</span>
          <ThemeToggle />
        </div>
      </div>
    </>
  );
};

export { DashboardMobileNav };
