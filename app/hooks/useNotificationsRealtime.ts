"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface NotificationsRealtimeEvent {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  old: any;
  eventType: "INSERT" | "UPDATE" | "DELETE";
}

export function useNotificationsRealtime(userId: string | null | undefined) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastEvent, setLastEvent] =
    useState<NotificationsRealtimeEvent | null>(null);

  useEffect(() => {
    if (!userId) {
      setUnreadCount(0);
      return;
    }

    let cancelled = false;
    async function fetchInitial() {
      try {
        const res = await fetch("/api/notifications/unread-count");
        const data = await res.json();
        if (!cancelled && res.ok && typeof data.count === "number") {
          setUnreadCount(data.count);
        }
      } catch {
        if (!cancelled) {
          setUnreadCount(0);
        }
      }
    }

    fetchInitial();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const event = payload as unknown as NotificationsRealtimeEvent;
          setLastEvent(event);

          if (event.eventType === "INSERT") {
            if (event.new && event.new.is_read === false) {
              setUnreadCount((c) => c + 1);
            }
          } else if (event.eventType === "UPDATE") {
            const wasUnread = event.old?.is_read === false;
            const nowRead = event.new?.is_read === true;
            if (wasUnread && nowRead) {
              setUnreadCount((c) => Math.max(0, c - 1));
            }
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return { unreadCount, setUnreadCount, lastEvent };
}

