"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { useNotificationsSubscription } from "../hooks/useNotificationsSubscription";

interface NotificationRealtimeProviderProps {
  userId: string;
  children: React.ReactNode;
}

export function NotificationRealtimeProvider({
  userId,
  children,
}: NotificationRealtimeProviderProps) {
  const { status } = useNotificationsSubscription(userId);
  const prevStatusRef = useRef(status);

  useEffect(() => {
    if (
      prevStatusRef.current !== "disconnected" &&
      status === "disconnected"
    ) {
      toast.error(
        "Update realtime tidak tersedia. Refresh halaman untuk data terbaru.",
      );
    }
    prevStatusRef.current = status;
  }, [status]);

  return (
    <>
      {status === "reconnecting" && (
        <div
          className="fixed bottom-4 right-4 z-50 h-3 w-3 rounded-full bg-yellow-400"
          title="Reconnecting..."
          aria-label="Sedang menghubungkan ulang"
        />
      )}
      {children}
    </>
  );
}
