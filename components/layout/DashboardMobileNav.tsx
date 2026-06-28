"use client";

import { Menu, X, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import { DashboardSidebarNav } from "@/components/layout/DashboardSidebarNav";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { DashboardSettingsButton } from "@/components/layout/DashboardSettingsButton";
import { dashboardLogoutAction } from "@/lib/actions/auth";

interface DashboardMobileNavProps {
  orgId?: string;
  userId?: string;
  displayName?: string;
  avatarUrl?: string | null;
  email?: string | null;
}

const DashboardMobileNav = ({
  orgId,
  userId,
  displayName = "Owner",
  avatarUrl,
  email,
}: DashboardMobileNavProps) => {
  const [open, setOpen] = useState(false);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

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
        className={`fixed inset-y-0 left-0 z-50 w-[280px] flex flex-col bg-ui-surface border-r border-ui-border text-sm transition-transform duration-200 md:hidden ${
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

        {/* Settings, Theme, and User Footer */}
        <div className="border-t border-ui-border px-2 py-3 shrink-0 space-y-0.5">
          {userId && (
            <DashboardSettingsButton userId={userId} orgId={orgId ?? ""} />
          )}
          <div className="flex items-center justify-between rounded px-3 py-1.5">
            <span className="text-sm text-ui-text-2">Tema</span>
            <ThemeToggle />
          </div>

          {/* User profile footer */}
          {userId && (
            <div className="border-t border-ui-border mt-3 pt-3 flex items-center gap-3 rounded px-2 py-2">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="h-5 w-5 rounded-full object-cover"
                />
              ) : (
                <div className="grid h-5 w-5 place-items-center rounded-full bg-ui-hover-strong text-[10px] font-semibold text-ui-text-dim">
                  {displayName.slice(0, 2).toUpperCase()}
                </div>
              )}
              <p className="min-w-0 flex-1 truncate text-xs text-ui-text-2">
                {email ?? displayName}
              </p>
              <form action={dashboardLogoutAction}>
                <button
                  type="submit"
                  aria-label="Logout"
                  className="rounded p-1.5 text-ui-text-2 transition hover:bg-ui-hover hover:text-ui-text-dim"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export { DashboardMobileNav };
