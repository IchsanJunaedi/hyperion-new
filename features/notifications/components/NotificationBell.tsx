"use client";

import { Bell } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { markAllNotificationsRead } from "../actions";
import { useUnreadCount } from "../hooks/useUnreadCount";
import { NotificationList } from "./NotificationList";

interface NotificationBellProps {
  userId: string;
  orgSlug: string;
}

export function NotificationBell({ userId, orgSlug }: NotificationBellProps) {
  const { data: unreadCount } = useUnreadCount(userId);
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  // Close popover on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Close popover on outside click
  useEffect(() => {
    if (!open) return;

    function handleMouseDown(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [open]);

  const count = unreadCount ?? 0;

  function getBadgeText(): string | null {
    if (count === 0) return null;
    if (count > 99) return "99+";
    return String(count);
  }

  const badgeText = getBadgeText();

  const ariaLabel =
    count === 0
      ? "Notifikasi"
      : `Notifikasi, ${count} belum dibaca`;

  async function handleMarkAllRead() {
    // Optimistic: set unread count to 0
    queryClient.setQueryData(["unread-count", userId], 0);

    // Optimistic: mark all notifications as read in cache
    queryClient.setQueryData(
      ["notifications", userId, 10],
      (old: Array<{ read_at: string | null }> | undefined) =>
        old?.map((n) => ({
          ...n,
          read_at: n.read_at ?? new Date().toISOString(),
        })),
    );

    const result = await markAllNotificationsRead();

    if (!result.ok) {
      // Revert on failure
      queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
      queryClient.invalidateQueries({ queryKey: ["unread-count", userId] });
      toast.error("Gagal menandai semua notifikasi");
    }
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-label={ariaLabel}
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-full p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
      >
        <Bell className="h-4 w-4" />
        {badgeText && (
          <span className="absolute -right-0.5 -top-0.5 flex min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 py-0.5 text-[10px] font-semibold leading-none text-white">
            {badgeText}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={popoverRef}
          className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-lg border border-white/5 bg-zinc-900 shadow-xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
            <h3 className="text-sm font-semibold text-white">Notifikasi</h3>
            <button
              type="button"
              disabled={!count}
              onClick={handleMarkAllRead}
              className="text-xs text-white/60 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Tandai semua dibaca
            </button>
          </div>

          {/* Notification list */}
          <NotificationList
            userId={userId}
            orgSlug={orgSlug}
            onClose={() => setOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
