"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  MessageSquare,
  HelpCircle,
  BookOpen,
  Home,
  Star,
  User,
  LogIn,
  Clock,
  Share2,
  CheckCircle,
  History,
  X,
  Shield,
  Plus,
  Lock,
} from "lucide-react";
import { useAuth } from "../components/AuthProvider";
import AuthModal from "../components/AuthModal";
import { useForcedAuthModal } from "../components/useForcedAuthModal";
import Drawer from "../components/Drawer";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import NavHeader from "../components/NavHeader";

interface FeedItem {
  id: string;
  content: string;
  starsCount: number;
  createdAt: string;
  author: {
    id: string;
    username: string;
    fullName?: string | null;
    avatar_url?: string | null;
  };
  starredByMe: boolean;
}

interface MyStatusItem {
  id: string;
  content: string;
  starsCount: number;
  sharedToProfile: boolean;
  isLegendary?: boolean;
  createdAt: string;
}

const MOCK_FEED: FeedItem[] = [
  {
    id: "mock-status-1",
    content: "כאן תראה עדכוני סטטוס אמיתיים לאחר שתתחבר למערכת.",
    starsCount: 3,
    createdAt: new Date().toISOString(),
    author: {
      id: "mock-user-1",
      username: "community_member",
      fullName: "משתמש לדוגמה",
      avatar_url: undefined,
    },
    starredByMe: false,
  },
  {
    id: "mock-status-2",
    content: "סטטוס לדוגמה נוסף שמדגים את הפורמט של הפיד.",
    starsCount: 1,
    createdAt: new Date().toISOString(),
    author: {
      id: "mock-user-2",
      username: "another_member",
      fullName: "חבר קהילה",
      avatar_url: undefined,
    },
    starredByMe: false,
  },
];

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffMins < 1) return "הרגע";
  if (diffMins < 60) return `לפני ${diffMins} דקות`;
  if (diffHours < 24) return `לפני ${diffHours} שעות`;
  if (diffDays < 30) return `לפני ${diffDays} ימים`;
  return date.toLocaleDateString("he-IL");
}

function cooldownRemaining(nextPostAt: string): string {
  const remaining = new Date(nextPostAt).getTime() - Date.now();
  if (remaining <= 0) return "0";
  const mins = Math.ceil(remaining / 60000);
  return String(mins);
}

export default function StatusPage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [myActive, setMyActive] = useState<MyStatusItem | null>(null);
  const [myHistory, setMyHistory] = useState<MyStatusItem[]>([]);
  const [canPost, setCanPost] = useState(true);
  const [nextPostAt, setNextPostAt] = useState<string | null>(null);
  const [myLoading, setMyLoading] = useState(true);
  const [newContent, setNewContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const [starringId, setStarringId] = useState<string | null>(null);
  const [sharingId, setSharingId] = useState<string | null>(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [adminStarsModal, setAdminStarsModal] = useState<{
    statusId: string;
    users: {
      id: string;
      username: string;
      fullName?: string | null;
      avatar_url?: string | null;
      starredAt: string;
    }[];
    starsCount: number;
  } | null>(null);
  const [adminStarsLoading, setAdminStarsLoading] = useState(false);
  const [isComposerOpen, setIsComposerOpen] = useState(false);

  const { user, profile, loading: authLoading, signOut } = useAuth();
  const isGuest = !user;
  const { modalProps: authModalProps, handleAuthAction } = useForcedAuthModal({
    isGuest,
    authLoading,
  });

  const menuItems = [
    { label: "ראשי", icon: Home, href: "/" },
    { label: "סטטוסי", icon: Users, href: "/status", active: true },
    { label: "דיוני", icon: MessageSquare, href: "/discussions" },
    { label: "שאלות", icon: HelpCircle, href: "/questions" },
    { label: "סיפורי", icon: BookOpen, href: "/stories" },
  ];

  const fetchFeed = useCallback(async () => {
    // For guests, do not hit the real API – show mock feed only
    if (!user && !authLoading) {
      setFeed(MOCK_FEED);
      setFeedLoading(false);
      return;
    }

    // While auth state is resolving, wait
    if (!user) {
      return;
    }

    setFeedLoading(true);
    try {
      const res = await fetch("/api/status");
      const data = await res.json();
      if (res.ok) setFeed(data.feed || []);
    } catch {
      setFeed([]);
    } finally {
      setFeedLoading(false);
    }
  }, [user, authLoading]);

  const fetchMe = useCallback(async () => {
    if (!user) {
      setMyActive(null);
      setMyHistory([]);
      setCanPost(true);
      setNextPostAt(null);
      setMyLoading(false);
      return;
    }
    setMyLoading(true);
    try {
      const res = await fetch("/api/status/me");
      const data = await res.json();
      if (res.ok) {
        setMyActive(data.active || null);
        setMyHistory(data.history || []);
        setCanPost(data.canPost !== false);
        setNextPostAt(data.nextPostAt || null);
      }
    } catch {
      setMyActive(null);
      setMyHistory([]);
    } finally {
      setMyLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  // Real-time: subscribe to user_statuses updates so star count syncs for all viewers
  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    const channel = supabase
      .channel("status-stars-realtime")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "user_statuses",
        },
        (payload) => {
          const newRow = payload.new as { id?: string; stars_count?: number };
          if (!newRow?.id || newRow.stars_count === undefined) return;
          const id = newRow.id;
          const starsCount = Number(newRow.stars_count);
          setFeed((prev) =>
            prev.map((s) => (s.id === id ? { ...s, starsCount } : s)),
          );
          setMyActive((prev) =>
            prev?.id === id ? { ...prev, starsCount } : prev,
          );
          setMyHistory((prev) =>
            prev.map((s) => (s.id === id ? { ...s, starsCount } : s)),
          );
          setAdminStarsModal((prev) =>
            prev?.statusId === id ? { ...prev, starsCount } : prev,
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error("Error signing out:", err);
    }
  };

  const handleNewStatus = () => {
    if (!user) {
      handleAuthAction("login");
      return;
    }
    if (!canPost) {
      // Locked by cooldown – do not open composer, button itself indicates remaining time
      return;
    }
    setIsComposerOpen((prev) => !prev);
  };

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = newContent.trim();
    if (!content) return;
    if (!user) {
      handleAuthAction("login");
      return;
    }
    if (!canPost) {
      setPostError("המתן לסיום זמן ההמתנה בין פרסומים");
      return;
    }
    setPosting(true);
    setPostError(null);
    try {
      const res = await fetch("/api/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPostError(data.error || "שגיאה בפרסום");
        if (data.nextPostAt) {
          setNextPostAt(data.nextPostAt);
          setCanPost(false);
        }
        return;
      }
      setNewContent("");
      setCanPost(false);
      if (data.nextPostAt) setNextPostAt(data.nextPostAt);
      fetchFeed();
      fetchMe();
    } catch {
      setPostError("שגיאה בחיבור לשרת");
    } finally {
      setPosting(false);
    }
  };

  const toggleStar = async (statusId: string) => {
    if (!user) {
      handleAuthAction("login");
      return;
    }
    setStarringId(statusId);
    try {
      const res = await fetch(`/api/status/${statusId}/star`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        const starred = data.starred === true;
        const authoritativeCount =
          typeof data.starsCount === "number" ? data.starsCount : undefined;
        setFeed((prev) =>
          prev.map((s) =>
            s.id === statusId
              ? {
                  ...s,
                  starredByMe: starred,
                  starsCount:
                    authoritativeCount ??
                    Math.max(0, s.starsCount + (starred ? 1 : -1)),
                }
              : s,
          ),
        );
        setMyActive((prev) =>
          prev?.id === statusId
            ? {
                ...prev,
                starsCount:
                  authoritativeCount ??
                  Math.max(0, prev.starsCount + (starred ? 1 : -1)),
              }
            : prev,
        );
        setMyHistory((prev) =>
          prev.map((s) =>
            s.id === statusId
              ? {
                  ...s,
                  starsCount:
                    authoritativeCount ??
                    Math.max(0, s.starsCount + (starred ? 1 : -1)),
                }
              : s,
          ),
        );
        setAdminStarsModal((prev) =>
          prev?.statusId === statusId
            ? {
                ...prev,
                starsCount:
                  authoritativeCount ??
                  Math.max(0, prev.starsCount + (starred ? 1 : -1)),
              }
            : prev,
        );
      }
    } finally {
      setStarringId(null);
    }
  };

  const openAdminStars = async (statusId: string) => {
    if (!profile?.is_moderator) return;
    setAdminStarsLoading(true);
    setAdminStarsModal(null);
    try {
      const res = await fetch(`/api/admin/status/${statusId}/stars`);
      const data = await res.json();
      if (res.ok)
        setAdminStarsModal({
          statusId,
          users: data.users || [],
          starsCount: data.starsCount ?? 0,
        });
    } finally {
      setAdminStarsLoading(false);
    }
  };

  const toggleShare = async (statusId: string, current: boolean) => {
    if (!user) {
      handleAuthAction("login");
      return;
    }
    setSharingId(statusId);
    try {
      const res = await fetch(`/api/status/${statusId}/share`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ share: !current }),
      });
      if (res.ok) {
        const newVal = !current;
        setMyActive((a) =>
          a?.id === statusId ? { ...a, sharedToProfile: newVal } : a,
        );
        setMyHistory((h) =>
          h.map((s) =>
            s.id === statusId ? { ...s, sharedToProfile: newVal } : s,
          ),
        );
        if (newVal) {
          setMyActive((a) =>
            a && a.id !== statusId ? { ...a, sharedToProfile: false } : a,
          );
          setMyHistory((h) =>
            h.map((s) =>
              s.id !== statusId ? { ...s, sharedToProfile: false } : s,
            ),
          );
        }
      }
    } finally {
      setSharingId(null);
    }
  };

  const topStatusId = feed.length > 0 ? feed[0].id : null;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen relative bg-slate-50 dark:bg-slate-900 text-gray-900 dark:text-gray-100"
      dir="rtl"
      style={{ fontFamily: "Assistant, system-ui, sans-serif" }}
    >
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_20%_80%,rgba(99,102,241,0.1)_0%,transparent_50%),radial-gradient(circle_at_80%_20%,rgba(139,92,246,0.1)_0%,transparent_50%)] dark:bg-[radial-gradient(circle_at_20%_80%,rgba(99,102,241,0.08)_0%,transparent_50%),radial-gradient(circle_at_80%_20%,rgba(139,92,246,0.08)_0%,transparent_50%)]" />

      <NavHeader
        title="סטטוסי"
        wide
        onMenuClick={() => setIsDrawerOpen(!isDrawerOpen)}
        rightContent={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleNewStatus}
              disabled={Boolean(user && !canPost)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 shadow-lg ${
                user && !canPost
                  ? "bg-red-600 text-white hover:bg-red-700 disabled:opacity-100 disabled:cursor-not-allowed"
                  : "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 hover:shadow-xl"
              }`}
            >
              {user && !canPost ? <Lock size={18} /> : <Plus size={18} />}
              {user && !canPost && nextPostAt
                ? `נעול (${cooldownRemaining(nextPostAt)} דק')`
                : "סטטוס חדש"}
            </button>
            {!user && (
              <>
                <button
                  onClick={() => handleAuthAction("login")}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-200 bg-white/60 dark:bg-gray-700/60 rounded-lg hover:bg-white/80 dark:hover:bg-gray-700/80 border border-indigo-200 dark:border-indigo-800"
                >
                  <LogIn size={16} /> התחברות
                </button>
                <button
                  onClick={() => handleAuthAction("register")}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 shadow-lg"
                >
                  <User size={16} /> הרשמה
                </button>
              </>
            )}
          </div>
        }
      />

      <Drawer
        isDrawerOpen={isDrawerOpen}
        setIsDrawerOpen={setIsDrawerOpen}
        menuItems={menuItems}
        user={user}
        profile={profile}
        onSignOut={handleSignOut}
      />

      <main className="max-w-6xl mx-auto px-5 py-8">
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Star size={22} className="text-amber-500 dark:text-amber-400" />
            פיד סטטוסים
          </h2>
          {feedLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 dark:border-indigo-400" />
            </div>
          ) : feed.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-white/60 dark:bg-gray-800/60 rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
              אין עדיין סטטוסים. היה הראשון לפרסם.
            </div>
          ) : (
            <div className="space-y-4">
              {feed.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-2xl border p-5 transition-all ${
                    item.id === topStatusId
                      ? "bg-amber-50/80 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700/50 shadow-lg ring-2 ring-amber-200/50 dark:ring-amber-700/30"
                      : "bg-white/80 dark:bg-gray-800/70 border-gray-200/50 dark:border-gray-700/50"
                  }`}
                >
                  {item.id === topStatusId && (
                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-semibold mb-3">
                      <Star size={18} fill="currentColor" /> סטטוס מוביל
                    </div>
                  )}
                  <p className="text-gray-800 dark:text-gray-100 whitespace-pre-wrap mb-4">
                    {item.content}
                  </p>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      {item.author.username ? (
                        <Link
                          href={`/profile/${encodeURIComponent(item.author.username)}`}
                          className="flex items-center gap-3 hover:opacity-90 transition-opacity"
                        >
                          {item.author.avatar_url ? (
                            <Image
                              src={item.author.avatar_url}
                              alt=""
                              width={28}
                              height={28}
                              className="w-7 h-7 rounded-full object-cover border border-gray-200 dark:border-gray-600"
                            />
                          ) : (
                            <div className="w-7 h-7 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center">
                              <User size={14} className="text-white" />
                            </div>
                          )}
                          <span className="font-medium text-gray-700 dark:text-gray-200">
                            {item.author.fullName || item.author.username}
                          </span>
                        </Link>
                      ) : (
                        <>
                          {item.author.avatar_url ? (
                            <Image
                              src={item.author.avatar_url}
                              alt=""
                              width={28}
                              height={28}
                              className="w-7 h-7 rounded-full object-cover border border-gray-200 dark:border-gray-600"
                            />
                          ) : (
                            <div className="w-7 h-7 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center">
                              <User size={14} className="text-white" />
                            </div>
                          )}
                          <span className="font-medium text-gray-700 dark:text-gray-200">
                            {item.author.fullName || item.author.username}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {timeAgo(item.createdAt)}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleStar(item.id)}
                        disabled={starringId === item.id}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          item.starredByMe
                            ? "bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-amber-50 dark:hover:bg-amber-900/30"
                        }`}
                      >
                        <Star
                          size={16}
                          className={item.starredByMe ? "fill-current" : ""}
                        />
                        {item.starsCount}
                      </button>
                      {profile?.is_moderator && (
                        <button
                          type="button"
                          onClick={() => openAdminStars(item.id)}
                          disabled={adminStarsLoading}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/50"
                          title="צפה במי סימן בכוכב"
                        >
                          <Shield size={14} />
                          מי סימן?
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {user && (myActive || myHistory.length > 0) && (
          <div className="mt-8">
            <button
              type="button"
              onClick={() => setHistoryModalOpen(true)}
              className="flex items-center gap-2 px-5 py-3 bg-white/80 dark:bg-gray-800/70 hover:bg-white dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-md hover:shadow-lg transition-all font-medium text-gray-800 dark:text-gray-100"
            >
              <History size={20} />
              היסטוריית סטטוסים (
              {[myActive, ...myHistory].filter(Boolean).length})
            </button>
          </div>
        )}
      </main>

      {/* New status modal */}
      {user && isComposerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 dark:bg-black/60"
            onClick={() => setIsComposerOpen(false)}
          />
          <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden rounded-2xl shadow-2xl bg-slate-900 text-gray-100">
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-l from-indigo-700 via-indigo-800 to-slate-900">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/60">
                  <MessageSquare
                    className="text-indigo-600 dark:text-indigo-400"
                    size={20}
                  />
                </div>
                <div className="text-right">
                  <h2 className="text-lg font-bold text-white">סטטוס חדש</h2>
                  <p className="text-xs text-slate-200/70">
                    שתף מה קורה איתך עכשיו
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsComposerOpen(false)}
                className="p-2 rounded-lg text-slate-200 hover:bg-slate-800/70"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handlePost}
              className="flex-1 flex flex-col min-h-0"
            >
              <div className="relative flex-1 flex flex-col min-h-0 bg-slate-800">
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="מה קורה?"
                  className="w-full flex-1 px-6 pt-6 pb-8 bg-transparent text-gray-100 placeholder-gray-400 border-none outline-none resize-none min-h-[120px]"
                  maxLength={500}
                  disabled={posting}
                />
                <span className="absolute bottom-2 left-6 text-xs text-slate-400 pointer-events-none">
                  {newContent.length}/500 תווים
                </span>
              </div>

              {postError && (
                <div className="mx-6 mb-2 rounded-lg bg-red-900/40 border border-red-700 px-3 py-2 text-red-100 text-sm">
                  {postError}
                </div>
              )}

              <div className="flex items-center justify-between px-6 py-3 border-t border-slate-700/80 bg-slate-900/90">
                <button
                  type="button"
                  onClick={() => setIsComposerOpen(false)}
                  className="px-4 py-2 text-sm text-slate-300 hover:text-white"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  disabled={!newContent.trim() || posting}
                  className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {posting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      שולח...
                    </>
                  ) : (
                    "פרסום סטטוס"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History modal */}
      {historyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 dark:bg-black/60"
            onClick={() => setHistoryModalOpen(false)}
          />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-l from-indigo-50 to-white dark:from-indigo-900/30 dark:to-gray-800">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <History size={22} />
                היסטוריית הסטטוסים שלי
              </h3>
              <button
                onClick={() => setHistoryModalOpen(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {myActive && (
                <div className="rounded-xl border-2 border-indigo-200 dark:border-indigo-700/50 bg-indigo-50/60 dark:bg-indigo-900/20 p-4">
                  <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 mb-2 block">
                    פעיל בפיד
                  </span>
                  <p className="text-gray-800 dark:text-gray-100 whitespace-pre-wrap mb-3">
                    {myActive.content}
                  </p>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {timeAgo(myActive.createdAt)}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {myActive.starsCount} כוכבים
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          toggleShare(myActive.id, myActive.sharedToProfile)
                        }
                        disabled={sharingId === myActive.id}
                        className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                          myActive.sharedToProfile
                            ? "bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                        }`}
                      >
                        {myActive.sharedToProfile ? (
                          <CheckCircle size={14} />
                        ) : (
                          <Share2 size={14} />
                        )}
                        {myActive.sharedToProfile
                          ? "מוצג בפרופיל"
                          : "שתף לפרופיל"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {myHistory.map((s) => (
                <div
                  key={s.id}
                  className={`rounded-xl border p-4 ${s.isLegendary ? "border-amber-300 dark:border-amber-700/50 bg-amber-50/60 dark:bg-amber-900/20" : "border-gray-200 dark:border-gray-600 bg-gray-50/60 dark:bg-gray-700/50"}`}
                >
                  {s.isLegendary && (
                    <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 mb-2 flex items-center gap-1">
                      <Star size={12} className="fill-current" /> אגדה
                    </span>
                  )}
                  <p className="text-gray-700 dark:text-gray-200 whitespace-pre-wrap text-sm mb-2">
                    {s.content}
                  </p>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {timeAgo(s.createdAt)}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {s.starsCount} כוכבים
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleShare(s.id, s.sharedToProfile)}
                        disabled={sharingId === s.id}
                        className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                          s.sharedToProfile
                            ? "bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                        }`}
                      >
                        {s.sharedToProfile ? (
                          <CheckCircle size={14} />
                        ) : (
                          <Share2 size={14} />
                        )}
                        {s.sharedToProfile ? "מוצג בפרופיל" : "שתף לפרופיל"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Admin: who starred modal */}
      {adminStarsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 dark:bg-black/60"
            onClick={() => setAdminStarsModal(null)}
          />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-indigo-50 dark:bg-indigo-900/30">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Shield size={20} />
                מי סימן בכוכב ({adminStarsModal.starsCount})
              </h3>
              <button
                onClick={() => setAdminStarsModal(null)}
                className="p-2 hover:bg-white/60 dark:hover:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {adminStarsModal.users.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  עדיין אין כוכבים.
                </p>
              ) : (
                adminStarsModal.users.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50"
                  >
                    {u.username ? (
                      <Link
                        href={`/profile/${encodeURIComponent(u.username)}`}
                        className="flex items-center gap-3 hover:opacity-90 transition-opacity flex-1 min-w-0"
                      >
                        {u.avatar_url ? (
                          <Image
                            src={u.avatar_url}
                            alt=""
                            width={36}
                            height={36}
                            className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-indigo-200 dark:bg-indigo-800 flex items-center justify-center flex-shrink-0">
                            <User
                              size={18}
                              className="text-indigo-700 dark:text-indigo-300"
                            />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-gray-800 dark:text-gray-100">
                            {u.fullName || u.username}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            @{u.username}
                          </p>
                        </div>
                      </Link>
                    ) : (
                      <>
                        {u.avatar_url ? (
                          <Image
                            src={u.avatar_url}
                            alt=""
                            width={36}
                            height={36}
                            className="w-9 h-9 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-indigo-200 dark:bg-indigo-800 flex items-center justify-center">
                            <User
                              size={18}
                              className="text-indigo-700 dark:text-indigo-300"
                            />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-800 dark:text-gray-100">
                            {u.fullName || u.username}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            @{u.username}
                          </p>
                        </div>
                      </>
                    )}
                    <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
                      {timeAgo(u.starredAt)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <AuthModal {...authModalProps} />
    </div>
  );
}
