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
    <nav className="fixed bottom-0 left-0 right-0 px-4 pb-0 pt-2 z-50 md:hidden pointer-events-none">
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
      <div className="relative mx-auto max-w-md h-24 pointer-events-auto">
        {/* Custom Shape Background */}
        <div className="absolute inset-0 w-full h-full drop-shadow-[0_-4px_10px_rgba(0,0,0,0.05)] dark:drop-shadow-[0_-4px_12px_rgba(0,0,0,0.2)]">
          {/* Gradient Overlay */}
          <div
            className="absolute inset-0 w-full h-full bg-white dark:bg-slate-800"
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

                <div className="absolute inset-0 rounded-full">
                  {/* Button background circle */}
                  <div className="absolute inset-0 rounded-full bg-white transition-all dark:bg-slate-700" />

                  {/* Outline (cutout effect matching background) */}
                  <div className="absolute inset-0 rounded-full border-8 border-white transition-all dark:border-slate-800" />

                  {/* Icon background circle with outline — same grays as side nav items */}
                  <div
                    className={`absolute inset-0 rounded-full border-2 border-gray-100 bg-transparent transition-all dark:border-slate-600 dark:bg-transparent ${
                      statusPostLockedVisual
                        ? "border-red-200 bg-red-50 dark:border-red-800/50 dark:bg-red-950/40"
                        : statusCreatePressed ||
                            statusHistoryHighlighted ||
                            mobileMenuHighlighted ||
                            (isActive && !isCenterButton)
                          ? "border-indigo-200 bg-indigo-50 dark:border-slate-500 dark:bg-slate-600/50"
                          : ""
                    }`}
                    style={{ margin: "2px" }}
                  />
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
                                ? "text-indigo-600 dark:text-indigo-400"
                                : "text-gray-400 dark:text-slate-400"
                          }`
                        : `w-6 h-6 ${isActive || statusHistoryHighlighted || mobileMenuHighlighted ? "text-indigo-600 dark:text-indigo-400" : "text-gray-400 dark:text-slate-400"}`
                    }
                    strokeWidth={2.5}
                  />
                </span>

                {/* Badge for messages */}
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-white dark:border-slate-800">
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
