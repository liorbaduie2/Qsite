"use client";

import {
  MessageCircle,
  Bell,
  Plus,
  Search,
  History,
  Lock,
  Menu,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/app/components/AuthProvider";
import { useNotificationsRealtime } from "@/app/hooks/useNotificationsRealtime";
import { createClient } from "@/lib/supabase/client";

const navShape = "/navbar-mobile.svg";

/** Question detail — matches `public/icons/write-answer-icon.svg` (fill → currentColor). */
function MobileNavWriteAnswerIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40.97 32.12"
      className={className}
      fill="currentColor"
      aria-hidden
    >
      <path d="M33.92,8.98l-.38.38.53.52c-.04-.3-.09-.6-.15-.9ZM22.77,0h-11.38C5,0,0,5.01,0,11.38v18.47c0,.68.46,1.6,1.14,2.05.22.22.68.22,1.13.22s.68,0,.92-.22l4.58-6.61h9.84v-2.89l15.61-15.61c-1.73-4.03-5.72-6.79-10.45-6.79ZM24.97,12.31c0,.51-.42.93-.92.93h-5.75c-.25,0-.46.2-.46.45v5.81c0,.51-.41.93-.92.93h-.62c-.51,0-.93-.42-.93-.93v-5.81c0-.25-.2-.45-.45-.45h-5.75c-.51,0-.92-.42-.92-.93v-.61c0-.51.41-.92.92-.92h5.75c.25,0,.45-.21.45-.46v-5.81c0-.51.42-.93.93-.93h.62c.51,0,.92.42.92.93v5.81c0,.25.21.46.46.46h5.75c.5,0,.92.41.92.92v.61Z" />
      <polygon points="40.97 9.36 37.26 13.07 34.07 9.88 33.54 9.36 33.92 8.98 37.26 5.65 40.97 9.36" />
      <polygon points="35.79 14.54 33.89 16.45 25.31 25.02 23.37 26.96 19.65 26.96 19.65 23.25 32.08 10.83 34.16 12.91 35.79 14.54" />
    </svg>
  );
}

/** Questions list — matches `public/icons/create-question.svg` (fill → currentColor). */
function MobileNavCreateQuestionIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 39.66 31.83"
      className={className}
      fill="currentColor"
      aria-hidden
    >
      <path d="M27.51,23.35h1.2c2.42,0,4.41-1.92,4.41-4.24v-1.36l-5.61,5.6ZM28.71,0H4.41C1.99,0,0,1.92,0,4.24v27.59l8.83-8.48h7.51v-1.91l13.06-13.06,1.37-1.36,2.35-2.35v-.43c0-2.32-1.99-4.24-4.41-4.24ZM16.76,20.1c-.35.34-.84.53-1.33.53-.99-.02-1.78-.78-1.8-1.75,0-.94.81-1.71,1.8-1.71h.01c1.02,0,1.8.73,1.83,1.63.01.5-.17.96-.51,1.3ZM18.85,10.96l-.62.53c-.65.42-1.11,1.11-1.26,1.89l-.02.41c-.03.49-.07,1.01-.07,1.57.02.1.01.18-.03.24h0s-.06.01-.13.01h-.08c-.16-.02-.32-.02-.48-.02h-.81c-.47,0-.96,0-1.41.02-.16,0-.16-.02-.16-.15-.05-1.37-.04-2.92.48-4.02.41-.75,1.02-1.38,1.77-1.83.63-.39,1.16-.85,1.62-1.4.63-.67.79-1.64.4-2.48-.56-.87-1.51-1.38-2.56-1.38h-.1c-1.47,0-2.72.95-3.08,2.31-.13.39-.14.39-.27.39-.07,0-.14-.01-.23-.01,0,0-2.13-.26-2.53-.32-.14-.01-.19-.03-.21-.05-.02-.03-.02-.08,0-.16.3-3.18,3.52-4.84,6.55-4.84h.15c1.59,0,3.16.53,4.41,1.5,1.04.86,1.65,2.12,1.69,3.43-.02,1.8-1.61,3.16-3.01,4.36Z" />
      <polygon points="39.66 8.38 35.95 12.09 32.76 8.9 32.23 8.38 32.61 8 35.95 4.66 39.66 8.38" />
      <polygon points="34.48 13.56 32.58 15.46 24 24.04 22.06 25.98 18.34 25.98 18.34 22.27 30.77 9.84 32.85 11.93 34.48 13.56" />
    </svg>
  );
}

interface MobileNavbarProps {
  onMenuClick?: () => void;
}

export function MobileNavbar({ onMenuClick }: MobileNavbarProps) {
  const { user } = useAuth();
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  const { unreadCount: notificationUnreadCount } = useNotificationsRealtime(
    user?.id,
  );
  const [statusComposerOpen, setStatusComposerOpen] = useState(false);
  const [statusHistoryOpen, setStatusHistoryOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [questionsSearchOpen, setQuestionsSearchOpen] = useState(false);
  const [statusPostLock, setStatusPostLock] = useState<{
    locked: boolean;
    message: string;
  }>({ locked: false, message: "" });
  /** Lock / shake / red tooltip only after user taps + while cooldown active */
  const [showStatusLockFeedback, setShowStatusLockFeedback] = useState(false);
  const [lockFeedbackNonce, setLockFeedbackNonce] = useState(0);
  const pathname = usePathname() || "";
  const router = useRouter();

  const fetchChatUnreadCount = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await fetch("/api/chat/unread-count");
      const data = await res.json();
      if (res.ok && typeof data.count === "number")
        setChatUnreadCount(data.count);
    } catch {
      // ignore
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) {
      setChatUnreadCount(0);
      return;
    }
    fetchChatUnreadCount();
  }, [user?.id, pathname, fetchChatUnreadCount]);

  useEffect(() => {
    if (user?.id && mobileDrawerOpen) {
      fetchChatUnreadCount();
    }
  }, [user?.id, mobileDrawerOpen, fetchChatUnreadCount]);

  useEffect(() => {
    if (!user?.id) return;
    const supabase = createClient();
    const channel = supabase
      .channel("mobile-navbar-chat-unread")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        () => {
          fetchChatUnreadCount();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchChatUnreadCount]);

  useEffect(() => {
    if (!pathname.startsWith("/status")) {
      setStatusComposerOpen(false);
      setStatusHistoryOpen(false);
      setStatusPostLock({ locked: false, message: "" });
      setShowStatusLockFeedback(false);
    }
  }, [pathname]);

  useEffect(() => {
    if (pathname !== "/questions") {
      setQuestionsSearchOpen(false);
    }
  }, [pathname]);

  useEffect(() => {
    if (!statusPostLock.locked) {
      setShowStatusLockFeedback(false);
    }
  }, [statusPostLock.locked]);

  useEffect(() => {
    if (!showStatusLockFeedback) return;
    const t = setTimeout(() => setShowStatusLockFeedback(false), 4000);
    return () => clearTimeout(t);
  }, [showStatusLockFeedback, lockFeedbackNonce]);

  useEffect(() => {
    const onComposerState = (e: Event) => {
      const ce = e as CustomEvent<{ open?: boolean }>;
      if (typeof ce.detail?.open === "boolean") {
        setStatusComposerOpen(ce.detail.open);
      }
    };
    window.addEventListener("status:composer-state", onComposerState);
    return () =>
      window.removeEventListener("status:composer-state", onComposerState);
  }, []);

  useEffect(() => {
    const onHistoryState = (e: Event) => {
      const ce = e as CustomEvent<{ open?: boolean }>;
      if (typeof ce.detail?.open === "boolean") {
        setStatusHistoryOpen(ce.detail.open);
      }
    };
    window.addEventListener("status:history-state", onHistoryState);
    return () =>
      window.removeEventListener("status:history-state", onHistoryState);
  }, []);

  useEffect(() => {
    const onDrawerState = (e: Event) => {
      const ce = e as CustomEvent<{ open?: boolean }>;
      if (typeof ce.detail?.open === "boolean") {
        setMobileDrawerOpen(ce.detail.open);
      }
    };
    window.addEventListener("mobile-nav-drawer-state", onDrawerState);
    return () =>
      window.removeEventListener("mobile-nav-drawer-state", onDrawerState);
  }, []);

  useEffect(() => {
    const onQuestionsSearchState = (e: Event) => {
      const ce = e as CustomEvent<{ open?: boolean }>;
      if (typeof ce.detail?.open === "boolean") {
        setQuestionsSearchOpen(ce.detail.open);
      }
    };
    window.addEventListener("questions:search-state", onQuestionsSearchState);
    return () =>
      window.removeEventListener(
        "questions:search-state",
        onQuestionsSearchState,
      );
  }, []);

  useEffect(() => {
    const onPostLockState = (e: Event) => {
      const ce = e as CustomEvent<{ locked?: boolean; message?: string }>;
      setStatusPostLock({
        locked: Boolean(ce.detail?.locked),
        message:
          typeof ce.detail?.message === "string" ? ce.detail.message : "",
      });
    };
    window.addEventListener("status:post-lock-state", onPostLockState);
    return () =>
      window.removeEventListener("status:post-lock-state", onPostLockState);
  }, []);

  // Determine active tab based on current path
  let activeTab = "home";
  if (pathname.startsWith("/chat")) activeTab = "messages";
  else if (pathname.startsWith("/notifications")) activeTab = "notifications";
  else if (pathname.startsWith("/search")) activeTab = "search";

  const isOnChatPage = pathname.startsWith("/chat");
  const isOnNotificationsPage = pathname.startsWith("/notifications");
  const isOnStatusPage = pathname.startsWith("/status");
  /** Questions list only — not /questions/[id] */
  const isOnQuestionsListPage = pathname === "/questions";
  /** Single-question view: /questions/[id] (not /questions list) */
  const isOnQuestionDetailPage = /^\/questions\/[^/]+/.test(pathname);
  const useBackInsteadOfMenu =
    isOnChatPage || isOnNotificationsPage || isOnQuestionDetailPage;
  /** Avoid leaving /notifications in history when using bottom nav (e.g. notif → chat → back). */
  const navigateFromMobileNav = (path: string) => {
    if (isOnNotificationsPage) router.replace(path);
    else router.push(path);
  };
  const leftButtonIcon = useBackInsteadOfMenu ? ArrowRight : Menu;
  const leftButtonLabel = useBackInsteadOfMenu ? "חזרה" : "Menu";

  const searchSlotIcon = isOnStatusPage ? History : Search;
  const searchSlotLabel = isOnStatusPage ? "היסטוריה שלי" : "Search";

  const addCenterIcon: LucideIcon | typeof MobileNavWriteAnswerIcon =
    isOnQuestionDetailPage
      ? MobileNavWriteAnswerIcon
      : isOnQuestionsListPage
        ? MobileNavCreateQuestionIcon
        : Plus;

  const navItems: {
    id: string;
    icon: LucideIcon | typeof MobileNavWriteAnswerIcon;
    label: string;
    isCenter?: boolean;
    badge?: number;
  }[] = [
    { id: "menu", icon: leftButtonIcon, label: leftButtonLabel },
    { id: "search", icon: searchSlotIcon, label: searchSlotLabel },
    { id: "add", icon: addCenterIcon, label: "Add", isCenter: true },
    {
      id: "notifications",
      icon: Bell,
      label: "Notifications",
      badge: user ? notificationUnreadCount : undefined,
    },
    {
      id: "messages",
      icon: MessageCircle,
      label: "Messages",
      badge: user ? chatUnreadCount : undefined,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 overflow-visible px-4 pb-[max(0px,env(safe-area-inset-bottom))] pt-2 md:hidden pointer-events-none">
      <style>{`
        @keyframes status-nav-lock-shake {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          20% { transform: translateX(-1.5px) rotate(-11deg); }
          40% { transform: translateX(1.5px) rotate(11deg); }
          60% { transform: translateX(-1px) rotate(-7deg); }
          80% { transform: translateX(1px) rotate(7deg); }
        }
        .status-nav-lock-shake {
          transform-origin: center center;
          animation: status-nav-lock-shake 0.65s ease-in-out infinite;
        }
      `}</style>

      {/* SVG Filters for precise masking of drop-shadows so they don't break backdrop-blur */}
      <svg width="0" height="0" className="absolute pointer-events-none">
        <filter id="nav-shadow-light" colorInterpolationFilters="sRGB">
          <feDropShadow
            in="SourceGraphic"
            dx="0"
            dy="-1"
            stdDeviation="2"
            floodColor="rgba(99,102,241,0.13)"
            result="s1"
          />
          <feDropShadow
            in="SourceGraphic"
            dx="0"
            dy="1"
            stdDeviation="2.5"
            floodColor="rgba(15,23,42,0.1)"
            result="s2"
          />
          <feMerge result="shadows">
            <feMergeNode in="s1" />
            <feMergeNode in="s2" />
          </feMerge>
          <feComposite in="shadows" in2="SourceGraphic" operator="out" />
        </filter>
        <filter id="nav-shadow-dark" colorInterpolationFilters="sRGB">
          <feDropShadow
            in="SourceGraphic"
            dx="0"
            dy="-1"
            stdDeviation="2.5"
            floodColor="rgba(139,92,246,0.15)"
            result="s1"
          />
          <feDropShadow
            in="SourceGraphic"
            dx="0"
            dy="2"
            stdDeviation="3.5"
            floodColor="rgba(0,0,0,0.34)"
            result="s2"
          />
          <feMerge result="shadows">
            <feMergeNode in="s1" />
            <feMergeNode in="s2" />
          </feMerge>
          <feComposite in="shadows" in2="SourceGraphic" operator="out" />
        </filter>
      </svg>

      <div className="relative mx-auto max-w-md h-24 overflow-visible pointer-events-auto">
        {/* Shadow casters: rendered as siblings behind the glass so they don't break the backdrop-filter */}
        <div
          className="absolute inset-0 w-full h-full pointer-events-none block dark:hidden"
          style={{ filter: "url(#nav-shadow-light)" }}
        >
          <div
            className="w-full h-full bg-black"
            style={{
              WebkitMaskImage: navShape ? `url(${navShape})` : undefined,
              WebkitMaskSize: "100% 100%",
              WebkitMaskRepeat: "no-repeat",
              maskImage: navShape ? `url(${navShape})` : undefined,
              maskSize: "100% 100%",
              maskRepeat: "no-repeat",
              borderRadius: navShape ? undefined : "24px",
            }}
          />
        </div>
        <div
          className="absolute inset-0 w-full h-full pointer-events-none hidden dark:block"
          style={{ filter: "url(#nav-shadow-dark)" }}
        >
          <div
            className="w-full h-full bg-black"
            style={{
              WebkitMaskImage: navShape ? `url(${navShape})` : undefined,
              WebkitMaskSize: "100% 100%",
              WebkitMaskRepeat: "no-repeat",
              maskImage: navShape ? `url(${navShape})` : undefined,
              maskSize: "100% 100%",
              maskRepeat: "no-repeat",
              borderRadius: navShape ? undefined : "24px",
            }}
          />
        </div>

        {/* Custom shape: glass base + purple top glow (aligned with BubbleButton / status page) */}
        <div
          className="absolute inset-0 w-full h-full bg-white/[0.66] backdrop-blur-[1.5px] backdrop-saturate-[1.2] dark:bg-slate-800/[0.62]"
          style={{
            WebkitMaskImage: navShape ? `url(${navShape})` : undefined,
            WebkitMaskSize: "100% 100%",
            WebkitMaskRepeat: "no-repeat",
            maskImage: navShape ? `url(${navShape})` : undefined,
            maskSize: "100% 100%",
            maskRepeat: "no-repeat",
            borderRadius: navShape ? undefined : "24px",
          }}
        >
          {/* Purple dot at top center — square frame + circle gradient (not a horizontal streak) */}
          <div
            className="pointer-events-none absolute left-[calc(50%-12px)] top-0 size-[clamp(150px,46vw,220px)] -translate-x-1/2 -translate-y-[52%] rounded-full opacity-90 dark:opacity-[0.92]"
            style={{
              background:
                "radial-gradient(circle at 50% 50%, rgba(167, 139, 250, 0.48) 0%, rgba(139, 92, 246, 0.2) 36%, transparent 62%)",
              filter: "blur(16px)",
            }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute left-[calc(50%-90px)] top-10 size-[clamp(100px,28vw,130px)] -translate-x-1/2 -translate-y-[42%] rounded-full opacity-90 dark:opacity-100 bg-[radial-gradient(circle_at_50%_50%,rgba(167,139,250,0.32)_0%,rgba(99,102,241,0.12)_45%,transparent_68%)] dark:bg-[radial-gradient(circle_at_50%_50%,rgba(167,139,250,0.26)_0%,rgba(139,92,246,0.14)_48%,transparent_72%)]"
            aria-hidden
          />
          {/* Strong pink — bottom-left corner of bar */}
          <div
            className="pointer-events-none absolute bottom-0 left-0 size-[clamp(95px,34vw,160px)] -translate-x-[46%] translate-y-[30%] rounded-full opacity-90 dark:opacity-[0.78] bg-[radial-gradient(circle_at_50%_50%,rgba(251,182,206,0.3)_0%,rgba(244,114,182,0.22)_36%,rgba(236,72,153,0.14)_52%,rgba(219,39,119,0.08)_64%,transparent_78%)] dark:bg-[radial-gradient(circle_at_50%_50%,rgba(251,182,206,0.22)_0%,rgba(244,114,182,0.18)_38%,rgba(236,72,153,0.12)_54%,rgba(219,39,119,0.07)_66%,transparent_80%)]"
            style={{ filter: "blur(11px)" }}
            aria-hidden
          />
          {/* Soft blue / sky accent — left of the coral hotspot */}
          <div
            className="pointer-events-none absolute bottom-0 left-[72%] size-[clamp(100px,36vw,170px)] -translate-x-1/2 translate-y-[12%] rounded-full opacity-90 dark:opacity-[0.85] bg-[radial-gradient(circle_at_50%_50%,rgba(147,197,253,0.38)_0%,rgba(99,102,241,0.2)_42%,rgba(125,211,252,0.14)_56%,transparent_74%)] dark:bg-[radial-gradient(circle_at_50%_50%,rgba(147,197,253,0.28)_0%,rgba(99,102,241,0.16)_46%,rgba(56,189,248,0.1)_60%,transparent_78%)]"
            style={{ filter: "blur(12px)" }}
            aria-hidden
          />
          {/* Pink–coral / peach accent — trailing side (e.g. left-[105%]) */}
          <div
            className="pointer-events-none absolute bottom-0 left-[90%] size-[clamp(110px,40vw,190px)] -translate-x-1/2 translate-y-[40%] rounded-full opacity-90 dark:opacity-[0.88] bg-[radial-gradient(circle_at_50%_50%,rgba(255,168,148,0.4)_0%,rgba(255,120,98,0.22)_40%,rgba(251,146,60,0.14)_54%,transparent_72%)] dark:bg-[radial-gradient(circle_at_50%_50%,rgba(255,178,158,0.3)_0%,rgba(255,130,108,0.16)_44%,rgba(251,146,60,0.11)_58%,transparent_76%)]"
            style={{ filter: "blur(14px)" }}
            aria-hidden
          />
          {/* Light glass sheen (status filter pill–style) */}
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.07] to-white/[0.22] dark:via-white/[0.03] dark:to-white/[0.05]"
            aria-hidden
          />
        </div>

        {/* Navigation Items */}
        <div className="relative flex items-center justify-between px-6 h-full pt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isCenterButton = item.isCenter;
            const statusCreatePressed =
              isCenterButton &&
              isOnStatusPage &&
              item.id === "add" &&
              statusComposerOpen;
            const statusHistoryHighlighted =
              !isCenterButton &&
              isOnStatusPage &&
              item.id === "search" &&
              statusHistoryOpen;
            const questionsSearchHighlighted =
              !isCenterButton &&
              isOnQuestionsListPage &&
              item.id === "search" &&
              questionsSearchOpen;
            const mobileMenuHighlighted =
              !isCenterButton &&
              item.id === "menu" &&
              !useBackInsteadOfMenu &&
              mobileDrawerOpen;
            const statusPostLockedVisual =
              isCenterButton &&
              isOnStatusPage &&
              item.id === "add" &&
              statusPostLock.locked &&
              showStatusLockFeedback;
            const CenterIcon =
              statusPostLockedVisual && item.id === "add" ? Lock : Icon;
            const centerIconClassName = isCenterButton
              ? `w-8 h-8 ${
                  statusPostLockedVisual
                    ? "text-red-600 dark:text-red-400"
                    : statusCreatePressed
                      ? "text-pink-400/50 dark:text-indigo-300"
                      : "text-gray-400 dark:text-slate-400"
                }`
              : `w-6 h-6 ${isActive || statusHistoryHighlighted || questionsSearchHighlighted || mobileMenuHighlighted ? "text-pink-400/50 dark:text-indigo-300" : "text-gray-400 dark:text-slate-400"}`;
            const isCustomQuestionSvg =
              item.id === "add" &&
              !statusPostLockedVisual &&
              (CenterIcon === MobileNavWriteAnswerIcon ||
                CenterIcon === MobileNavCreateQuestionIcon);

            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === "menu") {
                    if (useBackInsteadOfMenu) {
                      router.back();
                    } else if (onMenuClick) {
                      onMenuClick();
                    }
                  } else if (item.id === "search") {
                    if (isOnStatusPage) {
                      window.dispatchEvent(
                        new CustomEvent("status:toggle-history"),
                      );
                    } else if (isOnQuestionsListPage) {
                      window.dispatchEvent(
                        new CustomEvent("questions:toggle-search"),
                      );
                    }
                  } else if (item.id === "add") {
                    if (pathname.startsWith("/status")) {
                      if (statusPostLock.locked) {
                        setShowStatusLockFeedback(true);
                        setLockFeedbackNonce((n) => n + 1);
                      }
                      window.dispatchEvent(
                        new CustomEvent("status:open-create"),
                      );
                    } else if (isOnQuestionsListPage) {
                      window.dispatchEvent(
                        new CustomEvent("questions:open-create"),
                      );
                    } else if (isOnQuestionDetailPage) {
                      window.dispatchEvent(
                        new CustomEvent("question-detail:open-answer"),
                      );
                    }
                  } else if (item.id === "messages") {
                    navigateFromMobileNav("/chat");
                  } else if (item.id === "home") {
                    navigateFromMobileNav("/");
                  } else if (item.id === "notifications") {
                    router.push("/notifications");
                  }
                }}
                className={`relative flex items-center justify-center transition-all ${
                  isCenterButton
                    ? "w-16 h-16 -mt-6 translate-y-[10%]"
                    : "w-12 h-12"
                }`}
                aria-label={
                  item.id === "search" && isOnQuestionsListPage
                    ? questionsSearchOpen
                      ? "סגור חיפוש"
                      : "חפש שאלות"
                    : item.id === "add" && isOnQuestionDetailPage
                      ? "כתוב תשובה"
                      : item.id === "add" && isOnQuestionsListPage
                        ? "שאלה חדשה"
                        : item.label
                }
              >
                {statusPostLockedVisual && statusPostLock.message ? (
                  <div
                    className="pointer-events-none absolute bottom-[calc(100%+2px)] left-1/2 z-30 w-max max-w-[min(92vw,260px)] -translate-x-1/2 rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-center text-xs font-semibold leading-tight text-red-800 shadow-lg dark:border-red-800 dark:bg-red-950/95 dark:text-red-100"
                    role="status"
                  >
                    {statusPostLock.message}
                  </div>
                ) : null}

                {/* Circular plate + bottom hotspot when toggled / locked */}
                <div
                  className="absolute inset-0 overflow-hidden rounded-full border border-gray-200/90 bg-white/95 shadow-sm transition-colors duration-200 dark:border-slate-600 dark:bg-slate-700/95"
                  aria-hidden
                >
                  {statusPostLockedVisual ? (
                    <div
                      className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_95%_55%_at_50%_100%,rgba(248,113,113,0.45)_0%,rgba(239,68,68,0.18)_42%,transparent_68%)] dark:bg-[radial-gradient(ellipse_95%_55%_at_50%_100%,rgba(248,113,113,0.35)_0%,rgba(239,68,68,0.14)_44%,transparent_70%)]"
                      aria-hidden
                    />
                  ) : statusCreatePressed ||
                    statusHistoryHighlighted ||
                    questionsSearchHighlighted ||
                    mobileMenuHighlighted ||
                    (isActive && !isCenterButton) ? (
                    <div
                      className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_125%_72%_at_50%_100%,rgba(244,114,182,0.14)_0%,rgba(236,72,153,0.07)_32%,rgba(251,182,206,0.03)_58%,transparent_82%)] dark:bg-[radial-gradient(ellipse_95%_55%_at_50%_100%,rgba(165,180,252,0.4)_0%,rgba(99,102,241,0.22)_42%,transparent_68%)]"
                      aria-hidden
                    />
                  ) : null}
                </div>

                {/* Icon */}
                <span
                  className={`relative z-10 inline-flex ${statusPostLockedVisual ? "status-nav-lock-shake" : ""}`}
                >
                  {isCustomQuestionSvg ? (
                    <CenterIcon
                      className={`${centerIconClassName} translate-x-0.5`}
                    />
                  ) : (
                    <CenterIcon
                      className={centerIconClassName}
                      strokeWidth={2.5}
                    />
                  )}
                </span>

                {/* Unread badges — match Drawer.tsx (chat row: bg-[#6633cc], 99+) */}
                {item.badge != null && item.badge > 0 && (
                  <span className="absolute -top-2.5 end-1 z-10 flex h-5 min-w-[1.25rem] max-w-[2.75rem] items-center justify-center rounded-full bg-[#6633cc] px-1 text-[10px] font-medium leading-none tabular-nums text-white">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
