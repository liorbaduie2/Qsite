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
} from "lucide-react";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

const navShape = "/navbar-mobile.svg";

interface MobileNavbarProps {
  onMenuClick?: () => void;
}

export function MobileNavbar({ onMenuClick }: MobileNavbarProps) {
  const [messageCount] = useState(4);
  const [statusComposerOpen, setStatusComposerOpen] = useState(false);
  const [statusHistoryOpen, setStatusHistoryOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [statusPostLock, setStatusPostLock] = useState<{
    locked: boolean;
    message: string;
  }>({ locked: false, message: "" });
  /** Lock / shake / red tooltip only after user taps + while cooldown active */
  const [showStatusLockFeedback, setShowStatusLockFeedback] = useState(false);
  const [lockFeedbackNonce, setLockFeedbackNonce] = useState(0);
  const pathname = usePathname() || "";
  const router = useRouter();

  useEffect(() => {
    if (!pathname.startsWith("/status")) {
      setStatusComposerOpen(false);
      setStatusHistoryOpen(false);
      setStatusPostLock({ locked: false, message: "" });
      setShowStatusLockFeedback(false);
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
  const useBackInsteadOfMenu = isOnChatPage || isOnNotificationsPage;
  const leftButtonIcon = useBackInsteadOfMenu ? ArrowRight : Menu;
  const leftButtonLabel = useBackInsteadOfMenu ? "חזרה" : "Menu";

  const searchSlotIcon = isOnStatusPage ? History : Search;
  const searchSlotLabel = isOnStatusPage ? "היסטוריה שלי" : "Search";

  const navItems = [
    { id: "menu", icon: leftButtonIcon, label: leftButtonLabel },
    { id: "search", icon: searchSlotIcon, label: searchSlotLabel },
    { id: "add", icon: Plus, label: "Add", isCenter: true },
    { id: "notifications", icon: Bell, label: "Notifications" },
    {
      id: "messages",
      icon: MessageCircle,
      label: "Messages",
      badge: messageCount,
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
                    }
                  } else if (item.id === "messages") {
                    router.push("/chat");
                  } else if (item.id === "home") {
                    router.push("/");
                  } else if (item.id === "notifications") {
                    router.push("/notifications");
                  }
                }}
                className={`relative flex items-center justify-center transition-all ${
                  isCenterButton
                    ? "w-16 h-16 -mt-6 translate-y-[10%]"
                    : "w-12 h-12"
                }`}
                aria-label={item.label}
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
                  <CenterIcon
                    className={
                      isCenterButton
                        ? `w-8 h-8 ${
                            statusPostLockedVisual
                              ? "text-red-600 dark:text-red-400"
                              : statusCreatePressed
                                ? "text-pink-400/50 dark:text-indigo-300"
                                : "text-gray-400 dark:text-slate-400"
                          }`
                        : `w-6 h-6 ${isActive || statusHistoryHighlighted || mobileMenuHighlighted ? "text-pink-400/50 dark:text-indigo-300" : "text-gray-400 dark:text-slate-400"}`
                    }
                    strokeWidth={2.5}
                  />
                </span>

                {/* Badge for messages */}
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-2.5 end-1 z-10 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-red-500 px-0.5 text-[10px] font-bold leading-none tabular-nums text-white dark:border-slate-800">
                    {item.badge}
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
