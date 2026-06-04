"use client";

import { LogIn, LogOut, User as UserIcon, UserPlus } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { logoutAction } from "@/lib/actions/auth";

export interface ProfileDropdownProps {
  /** When provided, the dropdown shows the authed UI. */
  authed?: {
    displayName: string;
    workspaceHref: string | null;
  };
}

const ProfileDropdown = ({ authed }: ProfileDropdownProps) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Profil"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/80 transition hover:bg-white/5 hover:text-white"
      >
        <UserIcon className="h-4 w-4" />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-11 z-50 w-56 overflow-hidden rounded-xl border border-white/10 bg-zinc-900/95 p-1 text-sm shadow-xl backdrop-blur"
        >
          {authed ? (
            <>
              <div className="px-3 py-2 text-xs uppercase tracking-wide text-white/50">
                Masuk sebagai
              </div>
              <div className="truncate px-3 pb-2 text-sm font-medium text-white">
                {authed.displayName}
              </div>
              <div className="my-1 border-t border-white/10" />
              {authed.workspaceHref ? (
                <Link
                  role="menuitem"
                  href={authed.workspaceHref}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-white/90 transition hover:bg-white/10"
                  onClick={() => setOpen(false)}
                >
                  <UserIcon className="h-4 w-4" />
                  Masuk ke Tim
                </Link>
              ) : (
                <Link
                  role="menuitem"
                  href="/onboarding/profile"
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-white/90 transition hover:bg-white/10"
                  onClick={() => setOpen(false)}
                >
                  <UserIcon className="h-4 w-4" />
                  Lengkapi Profil
                </Link>
              )}
              <form action={logoutAction}>
                <button
                  type="submit"
                  role="menuitem"
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-white/90 transition hover:bg-white/10"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                role="menuitem"
                href="/login"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-white/90 transition hover:bg-white/10"
                onClick={() => setOpen(false)}
              >
                <LogIn className="h-4 w-4" />
                Login
              </Link>
              <Link
                role="menuitem"
                href="/register"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-white/90 transition hover:bg-white/10"
                onClick={() => setOpen(false)}
              >
                <UserPlus className="h-4 w-4" />
                Daftar
              </Link>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
};
export { ProfileDropdown };
