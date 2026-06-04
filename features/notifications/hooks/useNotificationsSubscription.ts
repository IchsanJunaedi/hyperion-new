"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export type ConnectionStatus = "connected" | "disconnected" | "reconnecting";

const MAX_RETRIES = 5;

export function useNotificationsSubscription(userId: string) {
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Incrementing this triggers a clean teardown + fresh channel creation
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`notifications:user-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: ["notifications", userId],
          });
          queryClient.invalidateQueries({
            queryKey: ["unread-count", userId],
          });
        },
      )
      .subscribe((channelStatus) => {
        if (channelStatus === "SUBSCRIBED") {
          setStatus("connected");
          retryCountRef.current = 0;
        } else if (
          channelStatus === "CHANNEL_ERROR" ||
          channelStatus === "TIMED_OUT"
        ) {
          if (retryCountRef.current < MAX_RETRIES) {
            setStatus("reconnecting");
            retryCountRef.current += 1;
            const delay = Math.pow(2, retryCountRef.current) * 1000;
            // Increment retryKey so cleanup removes the broken channel
            // and the new effect creates a fresh one — avoids re-subscribing
            // on an already-errored channel which would leak duplicate listeners
            retryTimeoutRef.current = setTimeout(() => {
              setRetryKey((k) => k + 1);
            }, delay);
          } else {
            setStatus("disconnected");
          }
        }
      });

    channelRef.current = channel;

    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient, retryKey]);

  return { status };
}
