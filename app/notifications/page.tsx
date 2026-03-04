"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Bell,
  AlertTriangle,
  MessageCircle,
  Home,
  Users,
  MessageSquare,
  HelpCircle,
  BookOpen,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Drawer from "../components/Drawer";
import NavHeader from "../components/NavHeader";
import { useAuth } from "../components/AuthProvider";
import { formatRelativeTime } from "@/lib/utils";
import { useNotificationsRealtime } from "../hooks/useNotificationsRealtime";

type NotificationRow = {
  id: string;
  type: string;
  title: string;
  message: string;
  question_id?: string | null;
  answer_id?: string | null;
  status_id?: string | null;
  from_user_id?: string | null;
  is_read: boolean;
  created_at: string;
  metadata?: { activity_log_id?: string; question_id?: string } | null;
};

type ApiResponse = {
  notifications: NotificationRow[];
  limit: number;
  offset: number;
};

function getTypeLabel(type: string): string {
  switch (type) {
    case "question_answer":
      return "תשובה חדשה";
    case "question_vote":
      return "הצבעות על השאלה";
    case "question_removed":
      return "שאלה הוסרה";
    case "status_reply":
      return "תגובה על סטטוס";
    case "status_star":
      return "כוכב לסטטוס";
    case "status_leading":
      return "סטטוס מוביל";
    case "question_most_rated":
      return "שאלה מובילה";
    case "answer_comment":
      return "תגובה לתשובה";
    case "question_comment":
      return "תגובה לשאלה";
    case "question_removal_appeal_approved":
      return "ערעור התקבל";
    case "question_removal_appeal_rejected":
      return "ערעור נדחה";
    default:
      return "התראה";
  }
}

export default function NotificationsPage() {
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const router = useRouter();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const limit = 20;

  const { unreadCount, lastEvent } = useNotificationsRealtime(user?.id);

  const menuItems = [
    { label: "ראשי", icon: Home, href: "/" },
    { label: "סטטוסים", icon: Users, href: "/status" },
    { label: "דיונים", icon: MessageSquare, href: "/discussions" },
    { label: "שאלות", icon: HelpCircle, href: "/questions" },
    { label: "סיפורים", icon: BookOpen, href: "/stories" },
  ];

  const fetchNotifications = useCallback(
    async (opts?: { append?: boolean; nextOffset?: number }) => {
      if (!user && !authLoading) {
        setNotifications([]);
        setLoading(false);
        return;
      }
      if (!user) return;

      const currentOffset =
        typeof opts?.nextOffset === "number" ? opts.nextOffset : 0;
      const append = opts?.append ?? false;

      try {
        if (!append) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }
        const res = await fetch(
          `/api/notifications?limit=${limit}&offset=${currentOffset}`,
        );
        const data: ApiResponse = await res.json();
        if (!res.ok) {
          setError(data as unknown as string);
          return;
        }
        const rows = Array.isArray(data.notifications)
          ? data.notifications
          : [];
        setNotifications((prev) =>
          append ? [...prev, ...rows] : rows,
        );
        setOffset(currentOffset);
        setHasMore(rows.length === limit);
      } catch {
        setError("שגיאה בטעינת ההתראות");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [user, authLoading],
  );

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (!lastEvent || !user) return;
    if (lastEvent.eventType === "INSERT") {
      // New notification arrived – refresh the first page in the background
      fetchNotifications();
    }
  }, [lastEvent, user, fetchNotifications]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) return;
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true })),
      );
    } catch {
      // ignore
    }
  };

  const handleNotificationClick = async (n: NotificationRow) => {
    let targetHref: string | null = null;

    if (n.question_id) {
      if (n.type === "question_answer" && n.answer_id) {
        targetHref = `/questions/${n.question_id}?answerId=${encodeURIComponent(
          n.answer_id,
        )}`;
      } else {
        targetHref = `/questions/${n.question_id}`;
      }
    } else if (n.type === "question_removed" && n.metadata?.activity_log_id) {
      targetHref = `/appeal/question-deletion?activity_log_id=${encodeURIComponent(
        n.metadata.activity_log_id,
      )}`;
    } else if (n.status_id) {
      targetHref = "/status";
    } else if (
      n.type === "question_removal_appeal_approved" &&
      n.metadata?.question_id
    ) {
      targetHref = `/questions/${n.metadata.question_id}`;
    }

    try {
      if (!n.is_read) {
        const res = await fetch(`/api/notifications/${n.id}/read`, {
          method: "PATCH",
        });
        if (res.ok) {
          setNotifications((prev) =>
            prev.map((row) =>
              row.id === n.id ? { ...row, is_read: true } : row,
            ),
          );
        }
      }
    } catch {
      // ignore
    }

    if (targetHref) {
      router.push(targetHref);
    }
  };

  const headerRight = (
    <>
      {user && (
        <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
          <span>לא נקראו:</span>
          <span className="font-semibold">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        </div>
      )}
      <button
        type="button"
        onClick={handleMarkAllRead}
        className="text-xs sm:text-sm px-3 py-1.5 rounded-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        סמן הכל כנקרא
      </button>
    </>
  );

  return (
    <div
      className="min-h-screen bg-slate-50 dark:bg-slate-900 text-gray-900 dark:text-gray-100"
      dir="rtl"
    >
      <NavHeader
        title="התראות"
        wide
        onMenuClick={() => setIsDrawerOpen(!isDrawerOpen)}
        rightContent={headerRight}
      />

      <Drawer
        isDrawerOpen={isDrawerOpen}
        setIsDrawerOpen={setIsDrawerOpen}
        menuItems={menuItems}
        user={user}
        profile={profile}
        onSignOut={handleSignOut}
      />

      <main className="max-w-3xl mx-auto px-4 sm:px-5 py-6 sm:py-8">
        <div className="mb-4 flex items-center gap-2">
          <Bell className="text-indigo-500" size={20} />
          <h2 className="text-lg sm:text-xl font-semibold">
            ההתראות האחרונות שלך
          </h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 dark:border-indigo-400" />
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 text-sm">
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-white/80 dark:bg-gray-800/70 border border-gray-200/70 dark:border-gray-700/70 rounded-2xl">
            <MessageCircle className="mx-auto mb-3 opacity-60" size={28} />
            <p>אין התראות כרגע.</p>
          </div>
        ) : (
          <>
            <ul className="space-y-2">
              {notifications.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => handleNotificationClick(n)}
                    className={`w-full text-right flex items-start gap-3 rounded-2xl border px-4 py-3 sm:px-5 sm:py-4 transition-colors ${
                      n.is_read
                        ? "bg-white/70 dark:bg-gray-800/70 border-gray-200/70 dark:border-gray-700/70"
                        : "bg-indigo-50/80 dark:bg-indigo-950/30 border-indigo-200/80 dark:border-indigo-700/80"
                    }`}
                  >
                    <div className="mt-1">
                      <span
                        className={`inline-flex items-center justify-center w-2 h-2 rounded-full ${
                          n.is_read
                            ? "bg-gray-300 dark:bg-gray-600"
                            : "bg-indigo-500 dark:bg-indigo-400"
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                          {getTypeLabel(n.type)}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                          {formatRelativeTime(n.created_at)}
                        </span>
                      </div>
                      <div className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {n.title}
                      </div>
                      {n.message && (
                        <div className="mt-0.5 text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                          {n.message}
                        </div>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>

            {hasMore && (
              <div className="flex justify-center mt-6">
                <button
                  type="button"
                  disabled={loadingMore}
                  onClick={() =>
                    fetchNotifications({
                      append: true,
                      nextOffset: offset + limit,
                    })
                  }
                  className="px-4 py-2 rounded-full text-sm font-medium bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-60"
                >
                  {loadingMore ? "טוען..." : "טען עוד"}
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

