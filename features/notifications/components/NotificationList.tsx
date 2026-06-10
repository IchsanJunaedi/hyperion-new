"use client";

import { useNotifications } from "../hooks/useNotifications";
import { NotificationItem } from "./NotificationItem";

interface NotificationListProps {
  userId: string;
  orgSlug: string;
  limit?: number;
  onClose: () => void;
}

const NotificationList = ({ userId, orgSlug, limit = 10, onClose }: NotificationListProps) => {
  const { data, isLoading, isError } = useNotifications(userId, limit);

  if (isLoading) {
    return (
      <div className="scroll-premium max-h-96 overflow-y-auto p-4">
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse space-y-2">
              <div className="h-3 w-3/4 rounded bg-ui-hover" />
              <div className="h-2 w-full rounded bg-ui-elevated" />
              <div className="h-2 w-1/3 rounded bg-ui-elevated" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="scroll-premium max-h-96 overflow-y-auto p-4">
        <p className="text-center text-sm text-red-400">
          Gagal memuat notifikasi
        </p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="scroll-premium max-h-96 overflow-y-auto p-4">
        <p className="text-center text-sm text-ui-text-2">
          Belum ada notifikasi
        </p>
      </div>
    );
  }

  return (
    <div className="scroll-premium max-h-96 overflow-y-auto">
      {data.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          userId={userId}
          orgSlug={orgSlug}
          onNavigate={onClose}
        />
      ))}
    </div>
  );
};
export { NotificationList };
