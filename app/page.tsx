//app/page.tsx
"use client";

import React, {
  useState,
  useEffect,
  useRef,
  Suspense,
  useLayoutEffect,
  useCallback,
} from "react";
import {
  MessageSquare,
  Users,
  HelpCircle,
  BookOpen,
  Home,
  LogIn,
  User,
  Eye,
  MessageCircle,
  Star,
  Clock,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "./components/AuthProvider";
import LoginModal from "./components/LoginModal";
import RegisterModal from "./components/RegisterModal";
import Drawer from "./components/Drawer";
import NavHeader from "./components/NavHeader";
import { isOnline } from "@/lib/utils";
import { usePresenceTick } from "./hooks/usePresenceTick";
import AuthStatusDisplay from "./components/AuthStatusDisplay";
import { SimpleThemeToggle } from "./components/SimpleThemeToggle";
import BubbleButton from "./components/BubbleButton";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";

// Development-only ProfileTestComponent
function ProfileTestComponent() {
  // Only show in development
  if (process.env.NODE_ENV === "production") return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        background: "rgba(0,0,0,0.9)",
        color: "white",
        padding: "10px",
        fontSize: "12px",
        zIndex: 9999,
        borderRadius: "0 5px 0 0",
      }}
    >
      🧪 Dev Debug Mode
    </div>
  );
}

interface TopQuestion {
  id: string;
  title: string;
  content: string;
  replies: number;
  views: number;
  createdAt: string;
  isAnswered?: boolean;
  author: {
    id: string;
    username: string;
    avatar_url: string | null;
    lastSeenAt?: string | null;
  };
  tags: string[];
}

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

/** Homepage top-question cards: detail-style pfp (no border, gradient + initial); 32px = former UserAvatar lgCard. */
function TopQuestionCardAuthorAvatar({
  avatarUrl,
  username,
  isOnline: authorIsOnline,
}: {
  avatarUrl: string | null;
  username: string;
  isOnline: boolean;
}) {
  const initial = username?.charAt(0).toUpperCase() ?? "";
  const inner = avatarUrl ? (
    <Image
      src={avatarUrl}
      alt={username || ""}
      width={32}
      height={32}
      className="size-8 shrink-0 rounded-full object-cover"
    />
  ) : (
    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50">
      <span className="text-sm font-bold leading-none text-indigo-600 dark:text-indigo-400">
        {initial}
      </span>
    </div>
  );

  if (authorIsOnline) {
    return (
      <span className="inline-flex size-8 shrink-0 rounded-full avatar-aura-online">
        <span className="block size-8 overflow-hidden rounded-full">
          {inner}
        </span>
      </span>
    );
  }

  return <span className="inline-flex shrink-0">{inner}</span>;
}

const TOP_QUESTION_TIMESTAMP_DIVIDER_GAP_PX = 8;

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

function TopQuestionCardMetaBar({
  question,
  profile,
  expandedTagsQuestionId,
  setExpandedTagsQuestionId,
}: {
  question: TopQuestion;
  profile: { username?: string | null } | null;
  expandedTagsQuestionId: string | null;
  setExpandedTagsQuestionId: React.Dispatch<
    React.SetStateAction<string | null>
  >;
}) {
  const { metaRowRef, timestampRef, dividerLeftPx } = useTimestampDividerLeft(
    `${question.id}:${question.createdAt}`,
    TOP_QUESTION_TIMESTAMP_DIVIDER_GAP_PX,
  );

  return (
    <div
      ref={metaRowRef}
      className="relative mt-1 flex flex-wrap items-center gap-2 pt-2 pb-1 text-[0.825rem] text-gray-500 dark:text-gray-400 sm:text-[0.9625rem]"
    >
      <div
        className="absolute top-0 right-0 h-px bg-gray-100 dark:bg-gray-700"
        style={{ left: dividerLeftPx }}
        aria-hidden
      />
      <div
        ref={timestampRef}
        className="absolute -left-2 sm:left-2 -top-[8px] px-1 bg-white dark:bg-gray-800 text-xs text-gray-400 dark:text-gray-500 flex items-center gap-0.5"
      >
        <Clock size={12} />
        <span>{timeAgo(question.createdAt)}</span>
      </div>
      {question.author.username ? (
        <Link
          href={
            profile?.username &&
            question.author.username &&
            profile.username === question.author.username
              ? "/profile"
              : `/profile/${encodeURIComponent(question.author.username)}`
          }
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-2 hover:opacity-90 transition-opacity shrink-0"
        >
          <TopQuestionCardAuthorAvatar
            avatarUrl={question.author.avatar_url}
            username={question.author.username}
            isOnline={isOnline(question.author.lastSeenAt)}
          />
        </Link>
      ) : (
        <>
          <TopQuestionCardAuthorAvatar
            avatarUrl={question.author.avatar_url}
            username={question.author.username || ""}
            isOnline={isOnline(question.author.lastSeenAt)}
          />
        </>
      )}
      <span className="text-[0.9075rem] font-semibold text-gray-600 dark:text-gray-300 sm:text-[1.059rem]">
        {question.author.username ? (
          <Link
            href={
              profile?.username &&
              question.author.username &&
              profile.username === question.author.username
                ? "/profile"
                : `/profile/${encodeURIComponent(question.author.username)}`
            }
            onClick={(e) => e.stopPropagation()}
            className="hover:underline font-inherit"
          >
            {question.author.username}
          </Link>
        ) : (
          "אנונימי"
        )}
      </span>
      <div className="ms-auto flex flex-col items-end gap-0.5 relative translate-x-2 sm:translate-x-4">
        <div className="flex translate-x-[2px] translate-y-1 items-center gap-2">
          <div className="flex items-center gap-0.5" title="תגובות">
            <MessageCircle size={15} />
            <span>{question.replies}</span>
          </div>
          <div className="flex items-center gap-0.5" title="צפיות">
            <Eye size={15} />
            <span>{question.views}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setExpandedTagsQuestionId((id) =>
              id === question.id ? null : question.id,
            );
          }}
          className="inline-flex -translate-x-[6px] sm:-translate-x-[4px] items-center gap-1 px-2 py-0.5 text-xs text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          aria-expanded={expandedTagsQuestionId === question.id}
          title={
            expandedTagsQuestionId === question.id ? "הסתר תגיות" : "הצג תגיות"
          }
        >
          <ChevronDown
            size={12}
            className={`transition-transform ${expandedTagsQuestionId === question.id ? "rotate-180" : ""}`}
          />
          הצג תגיות
        </button>
      </div>
    </div>
  );
}

function ForumHomepage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [topQuestions, setTopQuestions] = useState<TopQuestion[]>([]);
  const [loadingTopQuestions, setLoadingTopQuestions] = useState(true);
  const [topQuestionsError, setTopQuestionsError] = useState<string | null>(
    null,
  );

  const { user, profile, loading, signOut } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  usePresenceTick(); // re-evaluate isOnline every 30s
  const [expandedTagsQuestionId, setExpandedTagsQuestionId] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (isRegisterModalOpen || isLoginModalOpen) {
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
    }
  }, [isRegisterModalOpen, isLoginModalOpen]);

  // Open login popup when arriving with ?modal=login (e.g. from "התחברות" in תפריט ניווט on other pages)
  useEffect(() => {
    if (loading) return;
    if (searchParams.get("modal") === "login" && !user) {
      setIsLoginModalOpen(true);
      router.replace("/", { scroll: false });
    }
  }, [searchParams, user, loading, router]);

  const menuItems = [
    { label: "ראשי", icon: Home, href: "/", active: true },
    { label: "סטטוסים", icon: Users, href: "/status" },
    { label: "דיונים", icon: MessageSquare, href: "/discussions" },
    { label: "שאלות", icon: HelpCircle, href: "/questions" },
    { label: "סיפורים", icon: BookOpen, href: "/stories" },
  ];

  useEffect(() => {
    async function loadTopQuestions() {
      setLoadingTopQuestions(true);
      setTopQuestionsError(null);
      try {
        const params = new URLSearchParams({
          sort: "votes",
          limit: "5",
        });

        const res = await fetch(`/api/questions?${params.toString()}`);
        const data = await res.json();

        if (!res.ok) {
          setTopQuestionsError(data.error || "שגיאה בטעינת השאלות המובילות");
          return;
        }

        setTopQuestions(data.questions || []);
      } catch {
        setTopQuestionsError("שגיאה בטעינת השאלות המובילות");
      } finally {
        setLoadingTopQuestions(false);
      }
    }

    loadTopQuestions();
  }, [user?.id]);

  const handleLogin = () => setIsLoginModalOpen(true);
  const handleRegister = () => setIsRegisterModalOpen(true);

  const closeLoginModal = () => setIsLoginModalOpen(false);
  const closeRegisterModal = () => setIsRegisterModalOpen(false);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-slate-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100"
      dir="rtl"
      style={{ fontFamily: "'Assistant', 'Heebo', system-ui, sans-serif" }}
    >
      <NavHeader
        title=""
        titleContent={
          <img src="/פטפטו.svg" alt="פטפטו" className="h-8 sm:h-9 w-auto" />
        }
        wide
        hideMenuOnMobile
        onMenuClick={() => setIsDrawerOpen(!isDrawerOpen)}
        topContent={
          !user ? (
            <AuthStatusDisplay
              className="bg-white/90 dark:bg-gray-800/90 border-b border-gray-200 dark:border-gray-700"
              showOnlyErrors={true}
            />
          ) : undefined
        }
        rightContent={
          <>
            <div className="hidden sm:block">
              <SimpleThemeToggle />
            </div>
            {!user && (
              <div className="flex flex-wrap items-center gap-2">
                <BubbleButton onClick={handleLogin} size="sm">
                  <span className="flex items-center gap-1 sm:gap-2">
                    <LogIn size={18} className="shrink-0" />
                    התחברות
                  </span>
                </BubbleButton>
                <BubbleButton
                  onClick={handleRegister}
                  size="sm"
                  tone="purpleTint"
                >
                  <span className="flex items-center gap-1 sm:gap-2">
                    <User size={18} className="shrink-0" />
                    הרשמה
                  </span>
                </BubbleButton>
              </div>
            )}
          </>
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
        headerExtra={<SimpleThemeToggle size="sm" className="shrink-0" />}
      />

      <main className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-5 sm:py-6 md:py-8">
        <section className="mt-2 sm:mt-4">
          <div className="flex flex-row items-center justify-between gap-2 mb-3 sm:mb-4">
            <h3 className="min-w-0 truncate text-xl font-semibold text-gray-800 dark:text-gray-100 sm:text-2xl">
              השאלות המדורגות ביותר
            </h3>
            <Link
              href="/questions"
              className="shrink-0 text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
            >
              צפה בכל השאלות
            </Link>
          </div>

          {loadingTopQuestions ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 dark:border-indigo-400" />
            </div>
          ) : topQuestionsError ? (
            <div className="text-center py-6">
              <p className="text-sm text-red-500 dark:text-red-400 mb-2">
                {topQuestionsError}
              </p>
            </div>
          ) : topQuestions.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                עדיין אין שאלות, תהיה הראשון לשאול שאלה!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {topQuestions.map((question) => {
                const isInteractive = !!user;
                return (
                  <div
                    key={question.id}
                    role={isInteractive ? "button" : undefined}
                    tabIndex={isInteractive ? 0 : -1}
                    onClick={
                      isInteractive
                        ? () => router.push(`/questions/${question.id}`)
                        : undefined
                    }
                    onKeyDown={
                      isInteractive
                        ? (e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              router.push(`/questions/${question.id}`);
                            }
                          }
                        : undefined
                    }
                    className={`block overflow-x-hidden overflow-y-visible rounded-2xl border border-gray-200/50 dark:border-gray-700/50 bg-white/70 shadow-md backdrop-blur-sm transition-all duration-300 hover:shadow-lg group dark:bg-gray-800/70 ${
                      isInteractive
                        ? "cursor-pointer hover:scale-[1.01]"
                        : "cursor-default"
                    }`}
                  >
                    <div
                      className="flex min-w-0 flex-1 flex-col gap-2 overflow-x-hidden overflow-y-visible px-3 pt-2 pb-3 sm:px-4 sm:pt-3 sm:pb-3 sm:pr-6 text-right"
                      dir="rtl"
                    >
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          {question.isAnswered && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-700">
                              <Star
                                size={12}
                                className="ml-1"
                                fill="currentColor"
                              />
                              נענתה
                            </span>
                          )}
                        </div>
                        <h3 className="text-[1.1rem] font-bold leading-snug text-gray-800 break-words transition-colors duration-300 group-hover:text-indigo-600 dark:text-gray-100 dark:group-hover:text-indigo-400 sm:text-[1.2375rem]">
                          {question.title}
                        </h3>
                      </div>

                      <TopQuestionCardMetaBar
                        question={question}
                        profile={profile}
                        expandedTagsQuestionId={expandedTagsQuestionId}
                        setExpandedTagsQuestionId={setExpandedTagsQuestionId}
                      />
                      {/* Tags (when expanded) - below meta bar like Question page */}
                      {expandedTagsQuestionId === question.id && (
                        <div className="mt-[-5px] flex flex-wrap gap-1.5">
                          {question.tags.length > 0 ? (
                            question.tags.map((tag) => (
                              <Link
                                key={tag}
                                href={`/questions?tag=${encodeURIComponent(tag)}`}
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-700 hover:bg-indigo-200 dark:hover:bg-indigo-900/70 transition-colors"
                              >
                                {tag}
                              </Link>
                            ))
                          ) : (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              אין תגיות
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={closeLoginModal}
        onSwitchToRegister={() => {
          closeLoginModal();
          setIsRegisterModalOpen(true);
        }}
      />

      <RegisterModal
        isOpen={isRegisterModalOpen}
        onClose={closeRegisterModal}
        onSwitchToLogin={() => {
          closeRegisterModal();
          setIsLoginModalOpen(true);
        }}
      />

      <ProfileTestComponent />

      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Assistant:wght@300;400;600;700&family=Heebo:wght@400;500;700&display=swap");
      `}</style>
    </div>
  );
}

const fallback = (
  <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
  </div>
);

export default function Page() {
  return (
    <Suspense fallback={fallback}>
      <ForumHomepage />
    </Suspense>
  );
}
