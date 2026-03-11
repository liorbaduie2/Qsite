"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useLayoutEffect,
  useRef,
} from "react";
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
  MoreVertical,
  Flag,
} from "lucide-react";
import { createPortal } from "react-dom";
import { useAuth } from "../components/AuthProvider";
import LoginModal from "../components/LoginModal";
import RegisterModal from "../components/RegisterModal";
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
    reputation?: number;
  };
  starredByMe: boolean;
  authorLikedByMe: boolean;
}

interface MyStatusItem {
  id: string;
  content: string;
  starsCount: number;
  sharedToProfile: boolean;
  isLegendary?: boolean;
  createdAt: string;
}

type StatusFilter = "all" | "topRated" | "likedProfiles";

const STATUS_FILTERS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "כל הסטטוסים" },
  { id: "topRated", label: "סטטוסים מובילים" },
  { id: "likedProfiles", label: "מפרופילים שאהבת" },
];

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
      reputation: 0,
    },
    starredByMe: false,
    authorLikedByMe: false,
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
      reputation: 0,
    },
    starredByMe: false,
    authorLikedByMe: false,
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
  const [openStatusMenuId, setOpenStatusMenuId] = useState<string | null>(null);
  const [statusMenuPosition, setStatusMenuPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [reportingStatus, setReportingStatus] = useState<FeedItem | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportError, setReportError] = useState("");
  const [activeFilter, setActiveFilter] = useState<StatusFilter>("all");
  const statusMenuRef = useRef<HTMLDivElement>(null);
  const statusMenuPortalRef = useRef<HTMLDivElement>(null);

  const { user, profile, loading: authLoading, signOut } = useAuth();
  const isGuest = !user;
  const {
    isLoginModalOpen,
    isRegisterModalOpen,
    setIsLoginModalOpen,
    handleAuthAction,
    closeLogin,
    closeRegister,
    canClose,
  } = useForcedAuthModal({ isGuest, authLoading });

  useEffect(() => {
    if (isLoginModalOpen || isRegisterModalOpen) {
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
    }
  }, [isLoginModalOpen, isRegisterModalOpen]);

  useLayoutEffect(() => {
    if (openStatusMenuId && statusMenuRef.current) {
      const rect = statusMenuRef.current.getBoundingClientRect();
      setStatusMenuPosition({ top: rect.bottom + 4, left: rect.left });
    } else {
      setStatusMenuPosition(null);
    }
  }, [openStatusMenuId]);

  useEffect(() => {
    if (!openStatusMenuId) return;
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node;
      const inTrigger = statusMenuRef.current?.contains(target) ?? false;
      const inPortal = statusMenuPortalRef.current?.contains(target) ?? false;
      if (!inTrigger && !inPortal) setOpenStatusMenuId(null);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [openStatusMenuId]);

  const handleOpenStatusReport = (item: FeedItem) => {
    setOpenStatusMenuId(null);
    if (!user) {
      handleAuthAction("login");
      return;
    }
    setReportingStatus(item);
    setReportReason("");
    setReportError("");
  };

  const handleSubmitStatusReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingStatus || reportSubmitting) return;

    setReportSubmitting(true);
    setReportError("");
    try {
      const res = await fetch("/api/report/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentType: "status",
          contentId: reportingStatus.id,
          description: reportReason.trim() || undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setReportError(data.error || "שגיאה בשליחת הדיווח");
        return;
      }

      setReportingStatus(null);
      setReportReason("");
      setReportError("");
    } catch {
      setReportError("שגיאה בחיבור לשרת");
    } finally {
      setReportSubmitting(false);
    }
  };

  const menuItems = [
    { label: "ראשי", icon: Home, href: "/" },
    { label: "סטטוסים", icon: Users, href: "/status", active: true },
    { label: "דיונים", icon: MessageSquare, href: "/discussions" },
    { label: "שאלות", icon: HelpCircle, href: "/questions" },
    { label: "סיפורים", icon: BookOpen, href: "/stories" },
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

  // Only refetch when user id actually changes (login/logout), not on tab visibility change
  const lastFetchedUserIdRef = React.useRef<
    string | null | "guest" | undefined
  >(undefined);
  useEffect(() => {
    if (authLoading && !user) return;
    const currentState = user?.id ?? "guest";
    if (lastFetchedUserIdRef.current === currentState) return;
    lastFetchedUserIdRef.current = currentState;
    fetchFeed();
  }, [user?.id, authLoading, fetchFeed]);

  const lastFetchedMeUserIdRef = React.useRef<
    string | null | "guest" | undefined
  >(undefined);
  useEffect(() => {
    const currentState = user?.id ?? "guest";
    if (lastFetchedMeUserIdRef.current === currentState) return;
    lastFetchedMeUserIdRef.current = currentState;
    fetchMe();
  }, [user?.id, fetchMe]);

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
    const statusFromFeed = feed.find((s) => s.id === statusId);
    const prevStarred = statusFromFeed?.starredByMe ?? false;
    const prevCount = statusFromFeed?.starsCount ?? 0;
    const optimisticStarred = !prevStarred;
    const optimisticCount = Math.max(
      0,
      prevCount + (optimisticStarred ? 1 : -1),
    );

    setStarringId(statusId);
    setFeed((prev) =>
      prev.map((s) =>
        s.id === statusId
          ? {
              ...s,
              starredByMe: optimisticStarred,
              starsCount: optimisticCount,
            }
          : s,
      ),
    );
    setMyActive((prev) =>
      prev?.id === statusId ? { ...prev, starsCount: optimisticCount } : prev,
    );
    setMyHistory((prev) =>
      prev.map((s) =>
        s.id === statusId ? { ...s, starsCount: optimisticCount } : s,
      ),
    );
    setAdminStarsModal((prev) =>
      prev?.statusId === statusId
        ? { ...prev, starsCount: optimisticCount }
        : prev,
    );

    try {
      const res = await fetch(`/api/status/${statusId}/star`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        const starred = data.starred === true;
        const authoritativeCount =
          typeof data.starsCount === "number" ? data.starsCount : undefined;
        const reconciledCount =
          authoritativeCount ?? Math.max(0, prevCount + (starred ? 1 : -1));
        setFeed((prev) =>
          prev.map((s) =>
            s.id === statusId
              ? { ...s, starredByMe: starred, starsCount: reconciledCount }
              : s,
          ),
        );
        setMyActive((prev) =>
          prev?.id === statusId
            ? { ...prev, starsCount: reconciledCount }
            : prev,
        );
        setMyHistory((prev) =>
          prev.map((s) =>
            s.id === statusId ? { ...s, starsCount: reconciledCount } : s,
          ),
        );
        setAdminStarsModal((prev) =>
          prev?.statusId === statusId
            ? { ...prev, starsCount: reconciledCount }
            : prev,
        );
      } else {
        setFeed((prev) =>
          prev.map((s) =>
            s.id === statusId
              ? { ...s, starredByMe: prevStarred, starsCount: prevCount }
              : s,
          ),
        );
        setMyActive((prev) =>
          prev?.id === statusId ? { ...prev, starsCount: prevCount } : prev,
        );
        setMyHistory((prev) =>
          prev.map((s) =>
            s.id === statusId ? { ...s, starsCount: prevCount } : s,
          ),
        );
        setAdminStarsModal((prev) =>
          prev?.statusId === statusId
            ? { ...prev, starsCount: prevCount }
            : prev,
        );
      }
    } catch {
      setFeed((prev) =>
        prev.map((s) =>
          s.id === statusId
            ? { ...s, starredByMe: prevStarred, starsCount: prevCount }
            : s,
        ),
      );
      setMyActive((prev) =>
        prev?.id === statusId ? { ...prev, starsCount: prevCount } : prev,
      );
      setMyHistory((prev) =>
        prev.map((s) =>
          s.id === statusId ? { ...s, starsCount: prevCount } : s,
        ),
      );
      setAdminStarsModal((prev) =>
        prev?.statusId === statusId ? { ...prev, starsCount: prevCount } : prev,
      );
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

  const activeFilterIndex = STATUS_FILTERS.findIndex(
    ({ id }) => id === activeFilter,
  );
  const filteredFeed =
    activeFilter === "topRated"
      ? feed.filter((item) => item.starsCount > 0)
      : activeFilter === "likedProfiles"
        ? feed.filter((item) => item.authorLikedByMe)
        : feed;
  const topStatusId = filteredFeed.length > 0 ? filteredFeed[0].id : null;
  const remainingStatuses = filteredFeed.filter((s) => s.id !== topStatusId);
  const topSectionTitle =
    activeFilter === "likedProfiles"
      ? "הסטטוס הבולט מפרופילים שאהבת"
      : "סטטוס מוביל";
  const emptyFilterMessage =
    activeFilter === "topRated"
      ? "אין עדיין סטטוסים מובילים."
      : activeFilter === "likedProfiles"
        ? user
          ? "אין כרגע סטטוסים מפרופילים שאהבת."
          : "יש להתחבר כדי לראות סטטוסים מפרופילים שאהבת."
        : "אין עדיין סטטוסים. היה הראשון לפרסם.";
  const renderStatusCard = (
    item: FeedItem,
    { highlighted = false }: { highlighted?: boolean } = {},
  ) => (
    <div
      key={item.id}
      className={`relative rounded-2xl border p-4 transition-all ${
        highlighted
          ? "bg-amber-50/80 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700/50 shadow-lg ring-2 ring-amber-200/50 dark:ring-amber-700/30"
          : "bg-white/80 dark:bg-gray-800/70 border-gray-200/50 dark:border-gray-700/50"
      }`}
    >
      <div
        className="absolute left-2 top-2"
        ref={openStatusMenuId === item.id ? statusMenuRef : undefined}
      >
        <button
          type="button"
          onClick={() =>
            setOpenStatusMenuId((id) => (id === item.id ? null : item.id))
          }
          className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          aria-label="תפריט סטטוס"
        >
          <MoreVertical size={18} />
        </button>
      </div>
      <p className="text-gray-800 dark:text-gray-100 whitespace-pre-wrap mb-2">
        {item.content}
      </p>
      <div className="relative flex items-center justify-between flex-wrap gap-1.5 pt-2 mt-0">
        <div
          className={`absolute top-0 right-0 left-[90px] h-px ${
            highlighted
              ? "bg-amber-200 dark:bg-amber-700/60"
              : "bg-gray-100 dark:bg-gray-700"
          }`}
          aria-hidden
        />
        <div
          className={`absolute left-0 -top-[10px] px-2 text-xs flex items-center gap-1 ${
            highlighted
              ? "bg-amber-50/90 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300"
              : "bg-white/80 dark:bg-gray-800/80 text-gray-400 dark:text-gray-500"
          }`}
        >
          <Clock size={12} />
          <span>{timeAgo(item.createdAt)}</span>
        </div>
        <div className="flex items-center gap-3">
          {item.author.username ? (
            <Link
              href={
                profile?.username &&
                item.author.username &&
                profile.username === item.author.username
                  ? "/profile"
                  : `/profile/${encodeURIComponent(item.author.username)}`
              }
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
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-200">
                  {item.author.fullName || item.author.username}
                </span>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {item.author.reputation ?? 0} מוניטין
                </div>
              </div>
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
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-200">
                  {item.author.fullName || item.author.username}
                </span>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {item.author.reputation ?? 0} מוניטין
                </div>
              </div>
            </>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => toggleStar(item.id)}
            disabled={starringId === item.id}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors translate-y-[5px] ${
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
        </div>
      </div>
    </div>
  );

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
        title="סטטוסים"
        wide
        onMenuClick={() => setIsDrawerOpen(!isDrawerOpen)}
        rightContent={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleNewStatus}
              disabled={Boolean(user && !canPost)}
              className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 shadow-lg ${
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
            {user && (
              <button
                type="button"
                onClick={() => setHistoryModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-gray-800/70 hover:bg-white dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-md hover:shadow-lg transition-all font-medium text-gray-800 dark:text-gray-100"
              >
                <History size={18} />
                היסטוריה שלי
              </button>
            )}
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
        onOpenLoginModal={() => {
          setIsDrawerOpen(false);
          setIsLoginModalOpen(true);
        }}
      />

      <main className="max-w-6xl mx-auto px-5 py-8">
        <div className="mb-8">
          <div className="relative grid grid-cols-3 rounded-2xl border border-gray-200/70 dark:border-gray-700/70 bg-white/70 dark:bg-gray-800/60 p-1 mb-5 shadow-sm overflow-hidden">
            <div
              className="absolute top-1 bottom-1 right-1 rounded-xl transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] bg-black/10 dark:bg-white/10"
              style={{
                width: "calc((100% - 0.5rem) / 3)",
                transform: `translateX(-${activeFilterIndex * 100}%)`,
              }}
              aria-hidden
            />
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setActiveFilter(filter.id)}
                className={`relative z-10 px-3 py-2.5 text-[13px] sm:text-sm font-medium rounded-xl transition-all duration-200 active:scale-[0.98] ${
                  activeFilter === filter.id
                    ? "text-gray-900 dark:text-white"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
          {feedLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 dark:border-indigo-400" />
            </div>
          ) : filteredFeed.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-white/60 dark:bg-gray-800/60 rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
              {emptyFilterMessage}
            </div>
          ) : (
            <div className="space-y-6">
              {topStatusId &&
                (() => {
                  const topItem = filteredFeed.find(
                    (s) => s.id === topStatusId,
                  );
                  if (!topItem) return null;

                  return (
                    <div>
                      <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-300 mb-3 flex items-center gap-2">
                        <Star size={16} fill="currentColor" />
                        {topSectionTitle}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {renderStatusCard(topItem, { highlighted: true })}
                      </div>
                    </div>
                  );
                })()}

              {remainingStatuses.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {remainingStatuses.map((item) => renderStatusCard(item))}
                </div>
              )}
            </div>
          )}

          {/* Status menu portal */}
          {openStatusMenuId &&
            statusMenuPosition &&
            (() => {
              const selectedItem = feed.find((s) => s.id === openStatusMenuId);
              if (!selectedItem) return null;
              return createPortal(
                <div
                  ref={statusMenuPortalRef}
                  className="fixed min-w-[140px] py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50"
                  style={{
                    top: statusMenuPosition.top,
                    left: statusMenuPosition.left,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => handleOpenStatusReport(selectedItem)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-right text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Flag size={14} />
                    דווח
                  </button>
                  {profile?.is_moderator && (
                    <button
                      type="button"
                      onClick={() => {
                        setOpenStatusMenuId(null);
                        openAdminStars(selectedItem.id);
                      }}
                      disabled={adminStarsLoading}
                      className="w-full flex items-center gap-2 px-3 py-2 text-right text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                    >
                      <Shield size={14} />
                      מי סימן
                    </button>
                  )}
                </div>,
                document.body,
              );
            })()}
        </div>
      </main>

      {/* Report status modal */}
      {reportingStatus && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          dir="rtl"
        >
          <div
            className="absolute inset-0 bg-black/40 dark:bg-black/60"
            onClick={() => {
              if (!reportSubmitting) {
                setReportingStatus(null);
                setReportReason("");
                setReportError("");
              }
            }}
          />
          <form
            onSubmit={handleSubmitStatusReport}
            className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 max-w-md w-full border border-gray-200 dark:border-gray-700"
          >
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">
              דווח על סטטוס
            </h3>
            {reportError && (
              <p className="text-sm text-red-600 dark:text-red-400 mb-3">
                {reportError}
              </p>
            )}
            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-2">
              סיבה (לא חובה)
            </label>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none"
              rows={4}
              maxLength={2000}
              placeholder="תאר בקצרה את הבעיה..."
            />
            <div className="flex gap-3 justify-end mt-4">
              <button
                type="button"
                onClick={() => {
                  setReportingStatus(null);
                  setReportReason("");
                  setReportError("");
                }}
                disabled={reportSubmitting}
                className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                ביטול
              </button>
              <button
                type="submit"
                disabled={reportSubmitting}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {reportSubmitting ? "..." : "שלח דיווח"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Fixed "סטטוס חדש" button - mobile only (matches כתוב תשובה in question details) */}
      {!isComposerOpen && user && (
        <button
          type="button"
          onClick={handleNewStatus}
          disabled={!canPost}
          className={`md:hidden fixed left-6 bottom-8 z-40 flex items-center gap-2 px-5 py-3 rounded-full transition-all duration-300 shadow-xl font-medium ${
            canPost
              ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 hover:shadow-2xl hover:scale-105"
              : "bg-red-600 text-white opacity-90 disabled:cursor-not-allowed"
          }`}
        >
          {canPost ? (
            <>
              <Plus size={18} />
              סטטוס חדש
            </>
          ) : (
            <>
              <Lock size={18} />
              {nextPostAt
                ? `נעול (${cooldownRemaining(nextPostAt)} דק')`
                : "נעול"}
            </>
          )}
        </button>
      )}

      {/* New status modal (matches כתוב תשובה layout in question details) */}
      {user && isComposerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          dir="rtl"
        >
          <div
            className="absolute inset-0 bg-black/40 dark:bg-black/60"
            onClick={() => setIsComposerOpen(false)}
          />
          <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden rounded-2xl shadow-2xl bg-white text-gray-900 dark:bg-slate-900 dark:text-gray-100">
            <form
              onSubmit={handlePost}
              className="flex-1 flex flex-col min-h-0"
            >
              <div className="relative flex-1 flex flex-col min-h-0 bg-gray-50 dark:bg-slate-800">
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="מה קורה?"
                  rows={4}
                  className="w-full px-6 pt-6 pb-8 bg-transparent text-gray-900 placeholder-gray-500 dark:text-gray-100 dark:placeholder-gray-400 border-none outline-none resize-y min-h-[6.5rem]"
                  maxLength={500}
                  disabled={posting}
                  autoFocus
                />
                <span className="absolute bottom-2 left-6 text-xs text-gray-500 dark:text-slate-400 pointer-events-none">
                  {newContent.length}/500 תווים
                </span>
              </div>

              {postError && (
                <div className="mx-6 mb-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-red-700 text-sm dark:bg-red-900/40 dark:border-red-700 dark:text-red-100">
                  {postError}
                </div>
              )}

              <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 bg-gray-50 dark:border-slate-700/80 dark:bg-slate-900/90">
                <button
                  type="button"
                  onClick={() => setIsComposerOpen(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 dark:text-slate-300 dark:hover:text-white"
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
                        href={
                          profile?.username &&
                          u.username &&
                          profile.username === u.username
                            ? "/profile"
                            : `/profile/${encodeURIComponent(u.username)}`
                        }
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

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={closeLogin}
        onSwitchToRegister={() => {
          closeLogin();
          handleAuthAction("register");
        }}
        canClose={canClose}
      />
      <RegisterModal
        isOpen={isRegisterModalOpen}
        onClose={closeRegister}
        onSwitchToLogin={() => {
          closeRegister();
          setIsLoginModalOpen(true);
        }}
        canClose={false}
      />
    </div>
  );
}
