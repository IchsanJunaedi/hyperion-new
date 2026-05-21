"use client";

import { useRouter, usePathname } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { notify } from "@/features/dashboard/components/NotifyModal";

import { markNotificationRead } from "../actions";
import { formatRelative } from "@/lib/utils/format";

interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string | null;
  ref_type: string | null;
  ref_id: string | null;
  read_at: string | null;
  created_at: string;
  [key: string]: unknown;
}

interface NotificationItemProps {
  notification: Notification;
  userId: string;
  orgSlug: string;
  onNavigate: () => void;
}

function resolveRoute(
  orgSlug: string,
  refType: string,
  refId: string,
): string | null {
  switch (refType) {
    case "scrim":
      return `/${orgSlug}/scrim/${refId}`;
    case "announcement":
      return `/${orgSlug}/announcements/${refId}`;
    case "tournament":
      return `/${orgSlug}/tournaments/${refId}`;
    default:
      return null;
  }
}

export function NotificationItem({
  notification,
  userId,
  orgSlug,
  onNavigate,
}: NotificationItemProps) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();

  const isUnread = notification.read_at === null;

  async function handleClick() {
    // 1. Mark as read (optimistic) if unread
    if (isUnread) {
      // Optimistically update notification list
      queryClient.setQueryData(
         ["notifications", userId, 10],
        (old: Notification[] | undefined) =>
          old?.map((n) =>
            n.id === notification.id
              ? { ...n, read_at: new Date().toISOString() }
              : n,
          ),
      );

      // Optimistically decrement unread count
      queryClient.setQueryData(
        ["unread-count", userId],
        (old: number | undefined) => Math.max(0, (old ?? 1) - 1),
      );

      // Call server action
      const result = await markNotificationRead(notification.id);

      if (!result.ok) {
        // Revert on failure
        queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
        queryClient.invalidateQueries({ queryKey: ["unread-count", userId] });
        notify.error("Gagal menandai notifikasi");
      }
    }

    // 2. Navigate if ref_type and ref_id exist, always close popup
    onNavigate();
    if (notification.ref_type && notification.ref_id) {
      const targetOrgSlug =
        (notification.organizations as { slug: string } | null)?.slug || orgSlug;
      const route = resolveRoute(targetOrgSlug, notification.ref_type, notification.ref_id);
      if (route) {
        if (pathname?.startsWith("/dashboard")) {
          notify.info("Beralih ke halaman workspace...");
        }
        router.push(route);
      }
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`cursor-pointer flex w-full gap-3 px-4 py-3 text-left transition hover:bg-white/[0.05] ${
        isUnread ? "bg-white/[0.03]" : ""
      }`}
    >
      {/* Unread indicator dot */}
      <div className="flex shrink-0 items-start pt-1.5">
        {isUnread ? (
          <span className="h-2 w-2 rounded-full bg-blue-500" />
        ) : (
          <span className="h-2 w-2" />
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className="line-clamp-1 text-sm font-medium text-white">
          {notification.title}
        </p>
        {notification.body && (
          <p className="line-clamp-2 text-xs text-white/60">
            {notification.body}
          </p>
        )}
        <p className="mt-1 text-xs text-white/40">
          {formatRelative(notification.created_at)}
        </p>
      </div>
    </button>
  );
}
