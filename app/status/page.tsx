"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useLayoutEffect,
  useRef,
  type ReactNode,
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
import BubbleButton from "../components/BubbleButton";

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

const STATUS_CARD_TIMESTAMP_DIVIDER_GAP_PX = 8;

function useTimestampDividerLeft(measureDep: string, gapPx: number) {
  const metaRowRef = useRef<HTMLDivElement>(null);
  const timestampRef = useRef<HTMLDivElement>(null);
  const [dividerLeftPx, setDividerLeftPx] = useState<number | null>(null);

  const update = useCallback(() => {
    const row = metaRowRef.current;
    const ts = timestampRef.current;
    if (!row || !ts) return;
    const pr = row.getBoundingClientRect();
    const tr = ts.getBoundingClientRect();
    setDividerLeftPx(Math.max(0, Math.round(tr.right - pr.left + gapPx)));
  }, [gapPx]);

  useLayoutEffect(() => {
    update();
    const ts = timestampRef.current;
    if (!ts) return;
    const ro = new ResizeObserver(() => update());
    ro.observe(ts);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [update, measureDep]);

  return {
    metaRowRef,
    timestampRef,
    dividerLeftPx: dividerLeftPx ?? 72,
  };
}

/** Feed status card meta: divider starts after timestamp width + gap (like questions list). */
function StatusCardFeedMetaRow({
  item,
  highlighted,
  children,
}: {
  item: FeedItem;
  highlighted: boolean;
  children: ReactNode;
}) {
  const { metaRowRef, timestampRef, dividerLeftPx } = useTimestampDividerLeft(
    `${item.id}:${item.createdAt}`,
    STATUS_CARD_TIMESTAMP_DIVIDER_GAP_PX,
  );

  return (
    <div
      ref={metaRowRef}
      className="relative mt-0 flex w-full min-w-0 flex-wrap items-center justify-between gap-1.5 pt-2 pb-1"
    >
      <div
        className={`absolute top-0 right-2 h-px ${
          highlighted
            ? "bg-amber-200 dark:bg-amber-700/60"
            : "bg-gray-100 dark:bg-gray-700"
        }`}
        style={{ left: dividerLeftPx }}
        aria-hidden
      />
      <div
        ref={timestampRef}
        className={`absolute left-0 -top-[8px] px-1 text-xs flex items-center gap-0.5 ${
          highlighted
            ? "bg-amber-50/90 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300"
            : "bg-white/80 dark:bg-gray-800/80 text-gray-400 dark:text-gray-500"
        }`}
      >
        <Clock size={12} />
        <span>{timeAgo(item.createdAt)}</span>
      </div>
      {children}
    </div>
  );
}

/** Status card author: question-detail pfp style (no border, gradient + initial); 40px (w-10 h-10). */
function StatusCardAuthorAvatar({
  avatarUrl,
  username,
}: {
  avatarUrl: string | null | undefined;
  username: string;
}) {
  const initial = username?.charAt(0).toUpperCase() ?? "";
  const inner = avatarUrl ? (
    <Image
      src={avatarUrl}
      alt={username || ""}
      width={40}
      height={40}
      className="size-10 shrink-0 rounded-full object-cover"
    />
  ) : (
    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50">
      <span className="text-base font-bold leading-none text-indigo-600 dark:text-indigo-400">
        {initial}
      </span>
    </div>
  );

  return <span className="inline-flex shrink-0">{inner}</span>;
}

/** Lock UI: minutes + seconds (mobile tooltip, desktop button). */
function formatCooldownLockMessage(nextPostAt: string): string {
  const remaining = Math.max(0, new Date(nextPostAt).getTime() - Date.now());
  if (remaining <= 0) return "נעול";
  const totalSecs = Math.ceil(remaining / 1000);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  if (mins === 0) return `נעול (${secs} שנ')`;
  if (secs === 0) return `נעול (${mins} דק')`;
  return `נעול (${mins} דק' ו-${secs} שנ')`;
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
  /** UI-only: replay star icon / ring animation on each click (does not affect star API logic). */
  const [starClickAnim, setStarClickAnim] = useState<Record<string, boolean>>(
    {},
  );
  const [sharingId, setSharingId] = useState<string | null>(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  /** Kept mounted briefly after close so exit animation can run (matches MobileNavDrawer). */
  const [historyModalRendered, setHistoryModalRendered] = useState(false);
  const [historyModalAnimOpen, setHistoryModalAnimOpen] = useState(false);
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
  /** Re-render every second while post cooldown active so lock text shows live seconds */
  const [, setCooldownTick] = useState(0);
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
  const starAnimClearTimersRef = useRef<
    Record<string, ReturnType<typeof setTimeout>>
  >({});

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

  useEffect(() => {
    const timers = starAnimClearTimersRef.current;
    return () => {
      Object.values(timers).forEach(clearTimeout);
    };
  }, []);

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

  useEffect(() => {
    const onOpenCreate = () => handleNewStatus();
    window.addEventListener("status:open-create", onOpenCreate);
    return () => window.removeEventListener("status:open-create", onOpenCreate);
  }, [handleNewStatus]);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("status:composer-state", {
        detail: { open: isComposerOpen },
      }),
    );
  }, [isComposerOpen]);

  useEffect(() => {
    const locked = Boolean(user && !canPost);
    const buildMessage = () =>
      locked && nextPostAt
        ? formatCooldownLockMessage(nextPostAt)
        : locked
          ? "נעול"
          : "";

    const emit = () => {
      window.dispatchEvent(
        new CustomEvent("status:post-lock-state", {
          detail: { locked, message: buildMessage() },
        }),
      );
    };

    emit();
    if (!locked) return;
    const id = setInterval(emit, 1000);
    return () => clearInterval(id);
  }, [user, canPost, nextPostAt]);

  useEffect(() => {
    if (!user || canPost || !nextPostAt) return;
    const id = setInterval(() => setCooldownTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [user, canPost, nextPostAt]);

  const toggleHistoryFromNavbar = useCallback(() => {
    if (!user) {
      handleAuthAction("login");
      return;
    }
    setHistoryModalOpen((open) => !open);
  }, [user, handleAuthAction]);

  useEffect(() => {
    const onToggleHistory = () => toggleHistoryFromNavbar();
    window.addEventListener("status:toggle-history", onToggleHistory);
    return () =>
      window.removeEventListener("status:toggle-history", onToggleHistory);
  }, [toggleHistoryFromNavbar]);

  useEffect(() => {
    let closeTimer: ReturnType<typeof setTimeout> | null = null;
    let raf1 = 0;
    let raf2 = 0;

    if (historyModalOpen) {
      setHistoryModalRendered(true);
      setHistoryModalAnimOpen(false);
      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setHistoryModalAnimOpen(true));
      });
    } else {
      setHistoryModalAnimOpen(false);
      closeTimer = setTimeout(() => setHistoryModalRendered(false), 300);
    }

    return () => {
      if (closeTimer) clearTimeout(closeTimer);
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [historyModalOpen]);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("status:history-state", {
        detail: { open: historyModalOpen },
      }),
    );
  }, [historyModalOpen]);

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
      setIsComposerOpen(false);
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
      className={`relative min-w-0 overflow-x-hidden overflow-y-visible rounded-2xl border px-4 pt-4 pb-5 transition-all ${
        highlighted
          ? "bg-amber-50/80 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700/50 shadow-md ring-2 ring-amber-200/50 dark:ring-amber-700/30"
          : "bg-white/80 dark:bg-gray-800/70 border-gray-200/50 dark:border-gray-700/50 shadow-md"
      }`}
    >
      <div
        className="absolute left-2 top-2 z-10"
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
      <p className="mb-3 min-w-0 max-w-full -translate-x-2 whitespace-pre-wrap break-words pl-6 text-gray-800 [overflow-wrap:anywhere] dark:text-gray-100">
        {item.content}
      </p>
      <StatusCardFeedMetaRow item={item} highlighted={highlighted}>
        <div className="flex min-w-0 max-w-full items-center gap-3">
          {item.author.username ? (
            <Link
              href={
                profile?.username &&
                item.author.username &&
                profile.username === item.author.username
                  ? "/profile"
                  : `/profile/${encodeURIComponent(item.author.username)}`
              }
              className="flex min-w-0 max-w-full items-center gap-3 transition-opacity hover:opacity-90"
            >
              <StatusCardAuthorAvatar
                avatarUrl={item.author.avatar_url}
                username={item.author.username}
              />
              <div className="min-w-0">
                <span className="block truncate font-medium text-gray-700 dark:text-gray-200">
                  {item.author.fullName || item.author.username}
                </span>
                <div className="text-xs text-gray-500 dark:text-gray-400 -mt-0.5">
                  {item.author.reputation ?? 0} מוניטין
                </div>
              </div>
            </Link>
          ) : (
            <>
              <StatusCardAuthorAvatar
                avatarUrl={item.author.avatar_url}
                username={item.author.username || ""}
              />
              <div className="min-w-0">
                <span className="block truncate font-medium text-gray-700 dark:text-gray-200">
                  {item.author.fullName || item.author.username}
                </span>
                <div className="text-xs text-gray-500 dark:text-gray-400 -mt-0.5">
                  {item.author.reputation ?? 0} מוניטין
                </div>
              </div>
            </>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => {
              const id = item.id;
              if (!item.starredByMe) {
                const prevT = starAnimClearTimersRef.current[id];
                if (prevT) clearTimeout(prevT);
                setStarClickAnim((m) => ({ ...m, [id]: true }));
                starAnimClearTimersRef.current[id] = setTimeout(() => {
                  setStarClickAnim((m) => {
                    const next = { ...m };
                    delete next[id];
                    return next;
                  });
                  delete starAnimClearTimersRef.current[id];
                }, 720);
              }
              void toggleStar(id);
            }}
            disabled={starringId === item.id}
            className={`relative isolate flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200 translate-y-[5px] overflow-visible active:scale-[0.96] motion-reduce:active:scale-100 motion-safe:transition-transform ${
              item.starredByMe
                ? "bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200"
                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-amber-50 dark:hover:bg-amber-900/30"
            }`}
          >
            <span className="relative z-10 inline-flex size-4 shrink-0 items-center justify-center overflow-visible">
              {starClickAnim[item.id] ? (
                <span
                  className="pointer-events-none absolute left-1/2 top-1/2 z-0 -translate-x-1/2 -translate-y-1/2"
                  aria-hidden
                >
                  <span className="absolute left-1/2 top-1/2 block -translate-x-1/2 -translate-y-1/2">
                    <svg
                      viewBox="0 0 24 24"
                      className="size-10 origin-center overflow-visible text-amber-400/80 dark:text-amber-300/70 motion-safe:animate-star-burst-ring"
                    >
                      <polygon
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.65"
                        strokeLinejoin="round"
                        points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26 12,2"
                      />
                    </svg>
                  </span>
                  <span className="absolute left-1/2 top-1/2 block -translate-x-1/2 -translate-y-1/2">
                    <svg
                      viewBox="0 0 24 24"
                      className="size-10 origin-center overflow-visible text-amber-400/65 dark:text-amber-300/55 motion-safe:animate-star-burst-ring-wave2"
                    >
                      <polygon
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.65"
                        strokeLinejoin="round"
                        points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26 12,2"
                      />
                    </svg>
                  </span>
                </span>
              ) : null}
              <Star
                size={16}
                className={`relative z-10 motion-safe:origin-center ${
                  item.starredByMe ? "fill-current" : ""
                } ${starClickAnim[item.id] ? "motion-safe:animate-star-wiggle" : ""}`}
              />
            </span>
            <span className="relative z-10 tabular-nums">
              {item.starsCount}
            </span>
          </button>
        </div>
      </StatusCardFeedMetaRow>
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

      <div className="hidden md:block">
        <NavHeader
          title="סטטוסים"
          wide
          onMenuClick={() => setIsDrawerOpen(!isDrawerOpen)}
          rightContent={
            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center gap-2">
                <BubbleButton
                  onClick={handleNewStatus}
                  disabled={Boolean(user && !canPost)}
                  size="sm"
                >
                  <span className="flex items-center gap-1">
                    {user && !canPost ? <Lock size={18} /> : <Plus size={18} />}
                    {user && !canPost && nextPostAt
                      ? formatCooldownLockMessage(nextPostAt)
                      : "סטטוס חדש"}
                  </span>
                </BubbleButton>
                {user && (
                  <BubbleButton
                    onClick={() => setHistoryModalOpen(true)}
                    size="sm"
                  >
                    <span className="flex items-center gap-1">
                      <History size={18} />
                      היסטוריה שלי
                    </span>
                  </BubbleButton>
                )}
              </div>
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
      </div>

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
          <div className="relative mr-auto mb-5 inline-grid grid-cols-3 rounded-2xl bg-white/38 dark:bg-slate-800/28 p-1 backdrop-blur-xl shadow-[0_12px_32px_rgba(15,23,42,0.08)] overflow-hidden after:absolute after:inset-0 after:rounded-2xl after:bg-gradient-to-tr after:from-transparent after:via-white/15 after:to-white/50 dark:after:via-white/5 dark:after:to-white/5 after:pointer-events-none">
            <div
              className="absolute top-1 bottom-1 right-1 rounded-[0.9rem] bg-gradient-to-br from-white/70 to-white/25 dark:from-white/10 dark:to-white/3 shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_10px_24px_rgba(15,23,42,0.12)] backdrop-blur-2xl transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] after:absolute after:inset-x-0 after:top-0 after:h-1/2 after:rounded-t-[0.9rem] after:bg-gradient-to-b after:from-white/70 after:to-transparent dark:after:from-white/10 after:pointer-events-none"
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
                className={`relative z-10 px-1.5 py-1.5 text-[12px] sm:text-[13px] font-medium rounded-[0.9rem] transition-all duration-200 active:scale-[0.98] ${
                  activeFilter === filter.id
                    ? "text-slate-900 dark:text-white"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
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

      {/* History modal — mobile layout + open/close motion matches MobileNavDrawer */}
      {historyModalRendered && (
        <div
          className={`fixed inset-0 z-[55] flex flex-col justify-end items-center p-0 transition-opacity duration-300 md:flex-row md:items-center md:justify-center md:p-4 ${
            historyModalAnimOpen
              ? "opacity-100"
              : "pointer-events-none opacity-0"
          }`}
        >
          <div
            className="absolute inset-0 bg-black/40 dark:bg-black/60 max-md:bg-transparent max-md:dark:bg-transparent"
            onClick={() => setHistoryModalOpen(false)}
            aria-hidden
          />
          <div
            className={`relative mx-auto mb-24 flex max-h-[82dvh] w-[92%] max-w-md transform flex-col overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-xl transition-transform duration-300 ease-out dark:border-gray-700 dark:bg-gray-800 md:mb-0 md:max-h-[85vh] md:w-full md:max-w-lg md:rounded-2xl ${
              historyModalAnimOpen
                ? "translate-y-0 scale-100"
                : "max-md:translate-y-12 max-md:scale-95"
            }`}
          >
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
