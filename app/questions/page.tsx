"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  MessageSquare,
  Users,
  HelpCircle,
  BookOpen,
  Home,
  Plus,
  Search,
  Eye,
  MessageCircle,
  ArrowUp,
  ArrowDown,
  Star,
  Crown,
  User,
  LogIn,
  ChevronDown,
  Clock,
} from "lucide-react";
import { useAuth } from "../components/AuthProvider";
import LoginModal from "../components/LoginModal";
import RegisterModal from "../components/RegisterModal";
import { useForcedAuthModal } from "../components/useForcedAuthModal";
import Drawer from "../components/Drawer";
import NavHeader from "../components/NavHeader";
import NewQuestionModal from "../components/NewQuestionModal";
import { UserAvatar } from "../components/UserAvatar";
import { isOnline } from "@/lib/utils";
import { usePresenceTick } from "../hooks/usePresenceTick";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Question {
  id: string;
  title: string;
  content: string;
  author: {
    id: string;
    username: string;
    avatar_url: string | null;
    lastSeenAt?: string | null;
  };
  replies: number;
  votes: number;
  views: number;
  createdAt: string;
  tags: string[];
  isAnswered: boolean;
  isTopOfWeek?: boolean;
}

const MOCK_QUESTIONS: Question[] = [
  {
    id: "mock-1",
    title: "כאן תופיע שאלה אמיתית לאחר התחברות",
    content: "",
    author: {
      id: "mock-author-1",
      username: "example_user",
      avatar_url: null,
    },
    replies: 3,
    votes: 12,
    views: 120,
    createdAt: new Date().toISOString(),
    tags: ["JavaScript", "React"],
    isAnswered: true,
    isTopOfWeek: true,
  },
  {
    id: "mock-2",
    title: "שאלה לדוגמה על קריירה ופיתוח",
    content: "",
    author: {
      id: "mock-author-2",
      username: "dev_example",
      avatar_url: null,
    },
    replies: 1,
    votes: 5,
    views: 42,
    createdAt: new Date().toISOString(),
    tags: ["קריירה", "פיתוח"],
    isAnswered: false,
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

const QuestionsPage = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isNewQuestionModalOpen, setIsNewQuestionModalOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("weekly_top");
  const [filterTag, setFilterTag] = useState("הכל");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [userVotes, setUserVotes] = useState<Record<string, 1 | -1 | 0>>({});
  const [updatingVoteIds, setUpdatingVoteIds] = useState<
    Record<string, boolean>
  >({});
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);
  const tagDropdownRef = useRef<HTMLDivElement>(null);
  const voteRequestsRef = useRef(new Set<string>());

  const { user, profile, loading: authLoading, signOut } = useAuth();
  const userId = user?.id ?? null;
  const router = useRouter();
  usePresenceTick(); // re-evaluate isOnline every 30s

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

  const menuItems = [
    { label: "ראשי", icon: Home, href: "/" },
    { label: "סטטוסים", icon: Users, href: "/status" },
    { label: "דיונים", icon: MessageSquare, href: "/discussions" },
    { label: "שאלות", icon: HelpCircle, href: "/questions", active: true },
    { label: "סיפורים", icon: BookOpen, href: "/stories" },
  ];

  const allTags = [
    "הכל",
    "תכנות",
    "עיצוב",
    "קריירה",
    "לימודים",
    "טכנולוגי",
    "פיתוח",
    "React",
    "Vue",
    "JavaScript",
    "CSS",
    "HTML",
  ];

  const fetchQuestions = useCallback(async () => {
    // For guests, show only mock questions and do not hit the real API
    if (!userId && !authLoading) {
      setFetchError(null);
      setQuestions(MOCK_QUESTIONS);
      setUserVotes({});
      setLoadingQuestions(false);
      return;
    }

    // While auth state is still resolving, wait before deciding what to fetch
    if (!userId) {
      return;
    }

    setLoadingQuestions(true);
    setFetchError(null);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.set("search", searchTerm);
      if (filterTag && filterTag !== "הכל") params.set("tag", filterTag);
      params.set("sort", sortBy);
      params.set("includeUserVotes", "1");

      const res = await fetch(`/api/questions?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        setFetchError(data.error || "שגיאה בטעינת השאלות");
        return;
      }

      setQuestions(data.questions || []);
      setUserVotes(data.userVotes || {});
    } catch {
      setFetchError("שגיאה בחיבור לשרת");
    } finally {
      setLoadingQuestions(false);
    }
  }, [searchTerm, filterTag, sortBy, userId, authLoading]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  useEffect(() => {
    if (!tagDropdownOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setTagDropdownOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [tagDropdownOpen]);

  useEffect(() => {
    if (!tagDropdownOpen) return;
    const onClick = (e: MouseEvent) => {
      if (
        tagDropdownRef.current &&
        !tagDropdownRef.current.contains(e.target as Node)
      ) {
        setTagDropdownOpen(false);
      }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [tagDropdownOpen]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleNewQuestion = () => {
    if (!user) {
      handleAuthAction("login");
      return;
    }
    setIsNewQuestionModalOpen(true);
  };

  const handleVote = async (
    event: React.MouseEvent,
    questionId: string,
    voteType: 1 | -1,
  ) => {
    event.stopPropagation();

    if (!user) {
      handleAuthAction("login");
      return;
    }

    if (voteRequestsRef.current.has(questionId)) return;

    const currentQuestion = questions.find((question) => question.id === questionId);
    if (!currentQuestion) return;

    const previousVote = userVotes[questionId] ?? 0;
    const optimisticVote = previousVote === voteType ? 0 : voteType;
    const previousVotesCount = currentQuestion.votes;
    const optimisticVotesCount =
      previousVotesCount + (optimisticVote - previousVote);

    voteRequestsRef.current.add(questionId);
    setUpdatingVoteIds((prev) => ({ ...prev, [questionId]: true }));
    setQuestions((prev) =>
      prev.map((question) =>
        question.id === questionId
          ? { ...question, votes: optimisticVotesCount }
          : question,
      ),
    );
    setUserVotes((prev) => ({
      ...prev,
      [questionId]: optimisticVote,
    }));
    try {
      const res = await fetch(`/api/questions/${questionId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voteType }),
      });
      const data = await res.json();

      if (!res.ok) {
        setQuestions((prev) =>
          prev.map((question) =>
            question.id === questionId
              ? { ...question, votes: previousVotesCount }
              : question,
          ),
        );
        setUserVotes((prev) => ({
          ...prev,
          [questionId]: previousVote,
        }));
        return;
      }

      const resolvedVote =
        data.userVote === 1 || data.userVote === -1 ? data.userVote : 0;

      setQuestions((prev) =>
        prev.map((q) =>
          q.id === questionId ? { ...q, votes: data.votes ?? q.votes } : q,
        ),
      );

      setUserVotes((prev) => ({
        ...prev,
        [questionId]: resolvedVote,
      }));
    } catch {
      setQuestions((prev) =>
        prev.map((question) =>
          question.id === questionId
            ? { ...question, votes: previousVotesCount }
            : question,
        ),
      );
      setUserVotes((prev) => ({
        ...prev,
        [questionId]: previousVote,
      }));
    } finally {
      voteRequestsRef.current.delete(questionId);
      setUpdatingVoteIds((prev) => {
        const next = { ...prev };
        delete next[questionId];
        return next;
      });
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen relative bg-slate-50 dark:bg-slate-900 text-gray-900 dark:text-gray-100"
      dir="rtl"
      style={{ fontFamily: "Assistant, system-ui, sans-serif" }}
    >
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_20%_80%,rgba(99,102,241,0.1)_0%,transparent_50%),radial-gradient(circle_at_80%_20%,rgba(139,92,246,0.1)_0%,transparent_50%),radial-gradient(circle_at_40%_40%,rgba(236,72,153,0.05)_0%,transparent_50%)] dark:bg-[radial-gradient(circle_at_20%_80%,rgba(99,102,241,0.08)_0%,transparent_50%),radial-gradient(circle_at_80%_20%,rgba(139,92,246,0.08)_0%,transparent_50%)]" />

      <NavHeader
        title="שאלות ותשובות"
        wide
        onMenuClick={() => setIsDrawerOpen(!isDrawerOpen)}
        rightContent={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsSearchOpen((prev) => !prev)}
              className="flex items-center justify-center p-2.5 text-gray-700 dark:text-gray-200 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-300"
              aria-expanded={isSearchOpen}
              aria-label={isSearchOpen ? "סגור חיפוש" : "חפש שאלות"}
            >
              <Search size={20} />
            </button>
            <button
              type="button"
              onClick={handleNewQuestion}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl font-medium"
            >
              <Plus size={18} />
              שאלה חדשה
            </button>
            {!user && (
              <>
                <button
                  onClick={() => handleAuthAction("login")}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-200 bg-white/60 dark:bg-gray-700/60 rounded-lg hover:bg-white/80 dark:hover:bg-gray-700/80 transition-all duration-300 border border-indigo-200 dark:border-indigo-800 hover:border-indigo-300 dark:hover:border-indigo-700"
                >
                  <LogIn size={16} /> התחברות
                </button>
                <button
                  onClick={() => handleAuthAction("register")}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl"
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

      {/* Main Content */}
      <main className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-5 sm:py-6 md:py-8">
        {/* Search and Filter — compact bar (visible when user clicks "חפש שאלות") */}
        {isSearchOpen && (
          <div className="mb-5 relative z-10">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center rounded-2xl border border-gray-200/50 dark:border-gray-700/50 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm shadow-xl p-3 sm:p-4">
              <div className="flex-1 relative min-w-0 flex items-center rounded-xl border border-gray-200/50 dark:border-gray-700/50 bg-gray-50/80 dark:bg-gray-900/50 focus-within:ring-2 focus-within:ring-indigo-500/40 dark:focus-within:ring-indigo-400/50 transition-shadow">
                <Search
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-400 pointer-events-none"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="חפש שאלות..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-10 pr-10 pl-3 text-sm border-0 bg-transparent text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-400 focus:outline-none rounded-xl"
                />
              </div>
              <div className="flex gap-2 sm:gap-2">
                <div className="relative" ref={tagDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setTagDropdownOpen((o) => !o)}
                    className="h-10 min-w-0 flex-1 sm:flex-none sm:w-36 flex items-center justify-between gap-2 px-3 rounded-xl border border-gray-200/80 dark:border-gray-600/80 bg-gray-50/80 dark:bg-gray-900/50 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 focus:ring-2 focus:ring-indigo-500/40 dark:focus:ring-indigo-400/50 focus:border-transparent cursor-pointer"
                  >
                    <span className="truncate">{filterTag}</span>
                    <ChevronDown
                      size={18}
                      className="text-gray-500 dark:text-gray-400 shrink-0"
                    />
                  </button>
                  {tagDropdownOpen && (
                    <div className="absolute top-full end-5 mt-1 py-1 w-30 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg z-50 max-h-64 overflow-y-auto">
                      {allTags.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            setFilterTag(tag);
                            setTagDropdownOpen(false);
                          }}
                          className={`w-full flex items-center gap-2 px-4 py-2.5 text-right text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 ${filterTag === tag ? "bg-gray-100 dark:bg-gray-700" : ""}`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="h-10 pl-8 pr-3 text-sm rounded-xl border border-gray-200/80 dark:border-gray-600/80 bg-gray-50/80 dark:bg-gray-900/50 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500/40 dark:focus:ring-indigo-400/50 focus:border-transparent cursor-pointer min-w-0 flex-1 sm:flex-none sm:w-40 [color-scheme:light] dark:[color-scheme:dark] appearance-none bg-no-repeat bg-[length:1rem] bg-[left_0.75rem_center]"
                  style={{
                    backgroundImage:
                      "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")",
                  }}
                >
                  <option value="weekly_top">שאלת השבוע</option>
                  <option value="newest">חדש</option>
                  <option value="oldest">ישן</option>
                  <option value="votes">הכי מצוינות</option>
                  <option value="replies">הכי פופולריות</option>
                  <option value="views">הכי נצפות</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Questions List */}
        <div className="space-y-3">
          {loadingQuestions ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
            </div>
          ) : fetchError ? (
            <div className="text-center py-12">
              <div className="text-red-400 dark:text-red-500 mb-4">
                <HelpCircle size={48} className="mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-2">
                {fetchError}
              </h3>
              <button
                onClick={fetchQuestions}
                className="mt-4 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg"
              >
                נסה שוב
              </button>
            </div>
          ) : questions.length > 0 ? (
            questions.map((question) => (
              <div
                key={question.id}
                role="button"
                tabIndex={0}
                onClick={() => router.push(`/questions/${question.id}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    router.push(`/questions/${question.id}`);
                  }
                }}
                className="block bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-[1.01] group cursor-pointer"
              >
                {question.isTopOfWeek && (
                  <div className="flex items-center gap-2 text-xs font-medium text-amber-700 dark:text-amber-300 px-4 pt-2 pb-0.5">
                    <Crown
                      size={14}
                      className="text-amber-500 dark:text-amber-300"
                    />
                    <span>שאלת השבוע</span>
                  </div>
                )}
                {/* Card row: voting (left) | content (right) — same layout as index */}
                <div className="flex flex-row" style={{ direction: "ltr" }}>
                  {/* Vote column */}
                  <div className="flex flex-col items-center justify-center gap-0.5 w-10 min-w-[40px] sm:min-w-[48px] sm:w-12 px-1 sm:px-2 border-r border-gray-200/80 dark:border-gray-600/80 bg-gray-50/80 dark:bg-gray-900/50 shrink-0 self-stretch">
                    <button
                      type="button"
                      onClick={(e) => handleVote(e, question.id, 1)}
                      disabled={!!updatingVoteIds[question.id]}
                      className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-md p-1.5 transition-colors [touch-action:manipulation]"
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
                      onClick={(e) => handleVote(e, question.id, -1)}
                      disabled={!!updatingVoteIds[question.id]}
                      className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-md p-1.5 transition-colors [touch-action:manipulation]"
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
                        {question.tags.length > 0 &&
                          question.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800"
                            >
                              {tag}
                            </span>
                          ))}
                        {question.tags.length > 3 && (
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            +{question.tags.length - 3}
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
                      <div className="absolute left-2 -top-[10px] px-2 bg-white dark:bg-gray-800 text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
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
                            size="lg"
                            isOnline={isOnline(question.author.lastSeenAt)}
                          />
                        </Link>
                      ) : (
                        <>
                          <UserAvatar
                            avatarUrl={question.author.avatar_url}
                            username={question.author.username}
                            size="lg"
                            isOnline={isOnline(question.author.lastSeenAt)}
                          />
                        </>
                      )}
                      <span className="text-[0.9075rem] font-medium text-gray-600 dark:text-gray-300 sm:text-[1.059rem]">
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
                            className="hover:underline"
                          >
                            {question.author.username}
                          </Link>
                        ) : (
                          "אנונימי"
                        )}
                      </span>
                      <div className="flex items-center gap-2" title="תגובות">
                        <MessageCircle size={15} />
                        <span>{question.replies}</span>
                      </div>
                      <div className="flex items-center gap-2" title="צפיות">
                        <Eye size={15} />
                        <span>{question.views}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 dark:text-gray-500 mb-4">
                <HelpCircle size={48} className="mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">
                אין שאלות עדיין
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                היה הראשון לשאול שאלה ולהתחיל את השיח
              </p>
              <button
                onClick={handleNewQuestion}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                שאל שאלה חדשה
              </button>
            </div>
          )}
        </div>
      </main>

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

      {isNewQuestionModalOpen && (
        <NewQuestionModal
          isOpen={isNewQuestionModalOpen}
          onClose={() => setIsNewQuestionModalOpen(false)}
          onQuestionCreated={fetchQuestions}
        />
      )}
    </div>
  );
};

export default QuestionsPage;
