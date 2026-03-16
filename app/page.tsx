//app/page.tsx
"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
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
  ArrowUp,
  ArrowDown,
  Star,
  Clock,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "./components/AuthProvider";
import LoginModal from "./components/LoginModal";
import RegisterModal from "./components/RegisterModal";
import Drawer from "./components/Drawer";
import NavHeader from "./components/NavHeader";
import { UserAvatar } from "./components/UserAvatar";
import { isOnline } from "@/lib/utils";
import { usePresenceTick } from "./hooks/usePresenceTick";
import AuthStatusDisplay from "./components/AuthStatusDisplay";
import { SimpleThemeToggle } from "./components/SimpleThemeToggle";
import Link from "next/link";
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
  votes: number;
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
  const [userVotes, setUserVotes] = useState<Record<string, 1 | -1 | 0>>({});
  const [updatingVoteIds, setUpdatingVoteIds] = useState<
    Record<string, boolean>
  >({});
  const [expandedTagsQuestionId, setExpandedTagsQuestionId] = useState<
    string | null
  >(null);
  const voteRequestsRef = useRef(new Set<string>());
  const isGuest = !user;

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
        if (user?.id) {
          params.set("includeUserVotes", "1");
        }

        const res = await fetch(`/api/questions?${params.toString()}`);
        const data = await res.json();

        if (!res.ok) {
          setTopQuestionsError(data.error || "שגיאה בטעינת השאלות המובילות");
          return;
        }

        setTopQuestions(data.questions || []);
        setUserVotes(user?.id ? data.userVotes || {} : {});
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

  const handleVote = async (
    event: React.MouseEvent,
    questionId: string,
    voteType: 1 | -1,
  ) => {
    event.stopPropagation();
    if (!user) {
      handleLogin();
      return;
    }
    if (voteRequestsRef.current.has(questionId)) return;

    const currentQuestion = topQuestions.find(
      (question) => question.id === questionId,
    );
    if (!currentQuestion) return;

    const previousVote = userVotes[questionId] ?? 0;
    const optimisticVote = previousVote === voteType ? 0 : voteType;
    const previousVotesCount = currentQuestion.votes;
    const optimisticVotesCount =
      previousVotesCount + (optimisticVote - previousVote);

    voteRequestsRef.current.add(questionId);
    setUpdatingVoteIds((prev) => ({ ...prev, [questionId]: true }));
    setTopQuestions((prev) =>
      prev.map((question) =>
        question.id === questionId
          ? { ...question, votes: optimisticVotesCount }
          : question,
      ),
    );
    setUserVotes((prev) => ({ ...prev, [questionId]: optimisticVote }));
    try {
      const res = await fetch(`/api/questions/${questionId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voteType }),
      });
      const data = await res.json();
      if (!res.ok) {
        setTopQuestions((prev) =>
          prev.map((question) =>
            question.id === questionId
              ? { ...question, votes: previousVotesCount }
              : question,
          ),
        );
        setUserVotes((prev) => ({ ...prev, [questionId]: previousVote }));
        return;
      }
      const resolvedVote =
        data.userVote === 1 || data.userVote === -1 ? data.userVote : 0;
      setTopQuestions((prev) =>
        prev.map((question) =>
          question.id === questionId
            ? { ...question, votes: data.votes ?? question.votes }
            : question,
        ),
      );
      setUserVotes((prev) => ({ ...prev, [questionId]: resolvedVote }));
    } catch {
      setTopQuestions((prev) =>
        prev.map((question) =>
          question.id === questionId
            ? { ...question, votes: previousVotesCount }
            : question,
        ),
      );
      setUserVotes((prev) => ({ ...prev, [questionId]: previousVote }));
    } finally {
      voteRequestsRef.current.delete(questionId);
      setUpdatingVoteIds((prev) => {
        const next = { ...prev };
        delete next[questionId];
        return next;
      });
    }
  };
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
                <button
                  onClick={handleLogin}
                  className="flex items-center gap-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-white/60 dark:bg-gray-700/60 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-200 transition-all duration-300 hover:border-indigo-300 hover:bg-white/80 dark:hover:bg-gray-700/80 sm:gap-2 sm:px-4 sm:py-2 sm:text-base"
                >
                  <LogIn size={18} className="shrink-0" /> <span>התחברות</span>
                </button>
                <button
                  onClick={handleRegister}
                  className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-3 py-2.5 text-sm text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:from-indigo-700 hover:to-purple-700 dark:from-indigo-500 dark:to-purple-500 dark:hover:from-indigo-600 dark:hover:to-purple-600 sm:gap-2 sm:px-4 sm:py-2 sm:text-base"
                >
                  <User size={18} className="shrink-0" /> <span>הרשמה</span>
                </button>
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
                    className={`block bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden hover:shadow-2xl transition-all duration-300 group ${
                      isInteractive
                        ? "hover:scale-[1.01] cursor-pointer"
                        : "cursor-default"
                    }`}
                  >
                    {/* Card row: voting (left) | content (right) — same layout as questions page (mobile + desktop) */}
                    <div className="flex flex-row" style={{ direction: "ltr" }}>
                      {/* Vote column */}
                      <div className="flex flex-col items-center justify-center gap-0.5 w-10 min-w-[40px] sm:min-w-[48px] sm:w-12 px-1 sm:px-2 border-r border-gray-200/80 dark:border-gray-600/80 bg-gray-50/80 dark:bg-gray-900/50 shrink-0 self-stretch">
                        <button
                          type="button"
                          onClick={
                            user
                              ? (e) => handleVote(e, question.id, 1)
                              : undefined
                          }
                          disabled={isGuest || !!updatingVoteIds[question.id]}
                          className={`min-h-[36px] min-w-[36px] flex items-center justify-center rounded-md p-1.5 transition-colors [touch-action:manipulation] ${
                            isGuest
                              ? "cursor-not-allowed opacity-60"
                              : "hover:bg-indigo-100 active:bg-indigo-200 dark:hover:bg-indigo-900/50 dark:active:bg-indigo-800/50"
                          }`}
                        >
                          <ArrowUp
                            size={25}
                            className={
                              userVotes[question.id] === 1
                                ? "text-indigo-600 dark:text-indigo-400"
                                : "text-gray-400 dark:text-gray-500"
                            }
                          />
                        </button>
                        <span className="font-bold text-base text-gray-800 dark:text-gray-100 py-0.5 select-none">
                          {question.votes}
                        </span>
                        <button
                          type="button"
                          onClick={
                            user
                              ? (e) => handleVote(e, question.id, -1)
                              : undefined
                          }
                          disabled={isGuest || !!updatingVoteIds[question.id]}
                          className={`min-h-[36px] min-w-[36px] flex items-center justify-center rounded-md p-1.5 transition-colors [touch-action:manipulation] ${
                            isGuest
                              ? "cursor-not-allowed opacity-60"
                              : "hover:bg-indigo-100 active:bg-indigo-200 dark:hover:bg-indigo-900/50 dark:active:bg-indigo-800/50"
                          }`}
                        >
                          <ArrowDown
                            size={25}
                            className={
                              userVotes[question.id] === -1
                                ? "text-indigo-600 dark:text-indigo-400"
                                : "text-gray-400 dark:text-gray-500"
                            }
                          />
                        </button>
                      </div>

                      {/* Main content area */}
                      <div
                        className="flex-1 min-w-0 flex flex-col gap-2 px-3 pt-2 pb-0 overflow-hidden sm:px-4 sm:pt-3 sm:pb-2 sm:pr-6 text-right"
                        style={{ direction: "rtl" }}
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
                          <h3 className="text-[1.1rem] font-bold leading-snug text-gray-800 line-clamp-2 transition-colors duration-300 group-hover:text-indigo-600 dark:text-gray-100 dark:group-hover:text-indigo-400 sm:text-[1.2375rem]">
                            {question.title}
                          </h3>
                        </div>

                        <div className="relative flex flex-wrap items-center gap-2 pt-2 mt-1 text-[0.825rem] text-gray-500 dark:text-gray-400 sm:text-[0.9625rem]">
                          <div
                            className="absolute top-0 right-0 left-[110px] h-px bg-gray-100 dark:bg-gray-700"
                            aria-hidden
                          />
                          <div className="absolute left-2 -top-[8px] px-2 bg-white dark:bg-gray-800 text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
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
                              <UserAvatar
                                avatarUrl={question.author.avatar_url}
                                username={question.author.username}
                                size="lgCard"
                                isOnline={isOnline(question.author.lastSeenAt)}
                              />
                            </Link>
                          ) : (
                            <>
                              <UserAvatar
                                avatarUrl={question.author.avatar_url}
                                username={question.author.username}
                                size="lgCard"
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
                          <div
                            className="flex items-center gap-2"
                            title="תגובות"
                          >
                            <MessageCircle size={15} />
                            <span>{question.replies}</span>
                          </div>
                          <div
                            className="flex items-center gap-2"
                            title="צפיות"
                          >
                            <Eye size={15} />
                            <span>{question.views}</span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedTagsQuestionId((id) =>
                                id === question.id ? null : question.id,
                              );
                            }}
                            className="inline-flex items-center gap-1 px-2 py-0.5 text-xs text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors ms-auto -translate-x-[-12px]"
                            aria-expanded={
                              expandedTagsQuestionId === question.id
                            }
                            title={
                              expandedTagsQuestionId === question.id
                                ? "הסתר תגיות"
                                : "הצג תגיות"
                            }
                          >
                            <ChevronDown
                              size={12}
                              className={`transition-transform ${expandedTagsQuestionId === question.id ? "rotate-180" : ""}`}
                            />
                            הצג תגיות
                          </button>
                        </div>
                        {/* Tags (when expanded) - below meta bar like Question page */}
                        {expandedTagsQuestionId === question.id && (
                          <div className="flex gap-1.5 flex-wrap mt-3 -translate-y-[12px] sm:-translate-y-[7px]">
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

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
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
