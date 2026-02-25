"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  MessageSquare,
  Users,
  HelpCircle,
  BookOpen,
  Home,
  Plus,
  Search,
  Filter,
  Eye,
  MessageCircle,
  ArrowUp,
  ArrowDown,
  Star,
  Crown,
  User,
  LogIn,
} from "lucide-react";
import { useAuth } from "../components/AuthProvider";
import AuthModal from "../components/AuthModal";
import { useForcedAuthModal } from "../components/useForcedAuthModal";
import Drawer from "../components/Drawer";
import NavHeader from "../components/NavHeader";
import NewQuestionModal from "../components/NewQuestionModal";
import Image from "next/image";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("weekly_top");
  const [filterTag, setFilterTag] = useState("הכל");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [userVotes, setUserVotes] = useState<Record<string, 1 | -1 | 0>>({});
  const [updatingVoteId, setUpdatingVoteId] = useState<string | null>(null);

  const { user, profile, loading: authLoading, signOut } = useAuth();
  const router = useRouter();

  const isGuest = !user;
  const {
    modalProps: authModalProps,
    handleAuthAction,
  } = useForcedAuthModal({ isGuest, authLoading });

  const menuItems = [
    { label: "ראשי", icon: Home, href: "/" },
    { label: "סטטוסי", icon: Users, href: "/status" },
    { label: "דיוני", icon: MessageSquare, href: "/discussions" },
    { label: "שאלות", icon: HelpCircle, href: "/questions", active: true },
    { label: "סיפורי", icon: BookOpen, href: "/stories" },
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
    if (!user && !authLoading) {
      setFetchError(null);
      setQuestions(MOCK_QUESTIONS);
      setLoadingQuestions(false);
      return;
    }

    // While auth state is still resolving, wait before deciding what to fetch
    if (!user) {
      return;
    }

    setLoadingQuestions(true);
    setFetchError(null);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.set("search", searchTerm);
      if (filterTag && filterTag !== "הכל") params.set("tag", filterTag);
      params.set("sort", sortBy);

      const res = await fetch(`/api/questions?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        setFetchError(data.error || "שגיאה בטעינת השאלות");
        return;
      }

      setQuestions(data.questions || []);
    } catch {
      setFetchError("שגיאה בחיבור לשרת");
    } finally {
      setLoadingQuestions(false);
    }
  }, [searchTerm, filterTag, sortBy, user, authLoading]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

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

    setUpdatingVoteId(questionId);
    try {
      const res = await fetch(`/api/questions/${questionId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voteType }),
      });
      const data = await res.json();

      if (!res.ok) {
        // Silently fail for now; optionally surface error to user
        return;
      }

      setQuestions((prev) =>
        prev.map((q) =>
          q.id === questionId ? { ...q, votes: data.votes ?? q.votes } : q,
        ),
      );

      setUserVotes((prev) => ({
        ...prev,
        [questionId]: voteType,
      }));
    } catch {
      // Network/server error – leave UI as-is
    } finally {
      setUpdatingVoteId(null);
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
      />

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-5 py-8">
        <div className="mb-8 text-center">
          <h2 className="text-4xl font-bold text-gray-800 dark:text-gray-100 mb-4 leading-tight">
            שאלות ותשובות
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
            מקום לשאול שאלות, לחלוק ידע ולקבל עזרה מהקהילה
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-8">
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="חפש שאלות..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pr-11 pl-4 py-3 border border-gray-300/50 dark:border-gray-600/50 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm transition-all duration-300 text-gray-800 dark:text-gray-200"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter
                  size={20}
                  className="text-gray-500 dark:text-gray-400"
                />
                <select
                  value={filterTag}
                  onChange={(e) => setFilterTag(e.target.value)}
                  className="px-4 py-3 border border-gray-300/50 dark:border-gray-600/50 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm transition-all duration-300 text-gray-800 dark:text-gray-200"
                >
                  {allTags.map((tag) => (
                    <option key={tag} value={tag}>
                      {tag}
                    </option>
                  ))}
                </select>
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 border border-gray-300/50 dark:border-gray-600/50 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm transition-all duration-300 text-gray-800 dark:text-gray-200"
              >
                <option value="weekly_top">שאלת השבוע תחילה</option>
                <option value="newest">החדשות ביותר</option>
                <option value="oldest">הישנות ביותר</option>
                <option value="votes">הכי מצוינות</option>
                <option value="replies">הכי פופולריות</option>
                <option value="views">הכי נצפות</option>
              </select>
            </div>
          </div>
        </div>

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
                  <div className="flex items-center gap-2 text-xs font-medium text-amber-700 dark:text-amber-300 px-4 pt-3 pb-1">
                    <Crown
                      size={14}
                      className="text-amber-500 dark:text-amber-300"
                    />
                    <span>שאלת השבוע</span>
                  </div>
                )}
                {/* Card row: voting (left) | content (right) — use LTR so left/right match spec */}
                <div
                  className="flex flex-row min-h-[120px]"
                  style={{ direction: "ltr" }}
                >
                  {/* Left: vertical voting column */}
                  <div className="flex flex-col items-center justify-center gap-0.5 min-w-[64px] py-4 px-3 border-r border-gray-200/80 dark:border-gray-600/80 bg-gray-50/80 dark:bg-gray-900/50">
                    <button
                      type="button"
                      onClick={(e) => handleVote(e, question.id, 1)}
                      disabled={updatingVoteId === question.id}
                      className="p-1.5 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                    >
                      <ArrowUp
                        size={20}
                        className={
                          (userVotes[question.id] === 1
                            ? "text-indigo-600 dark:text-indigo-400"
                            : "text-gray-400 dark:text-gray-500") +
                          " group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors"
                        }
                      />
                    </button>
                    <span className="font-bold text-lg text-gray-800 dark:text-gray-100 py-0.5 select-none">
                      {question.votes}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleVote(e, question.id, -1)}
                      disabled={updatingVoteId === question.id}
                      className="p-1.5 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                    >
                      <ArrowDown
                        size={20}
                        className={
                          (userVotes[question.id] === -1
                            ? "text-indigo-600 dark:text-indigo-400"
                            : "text-gray-400 dark:text-gray-500") +
                          " group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors"
                        }
                      />
                    </button>
                  </div>

                  {/* Right: main content area */}
                  <div
                    className="flex-1 min-w-0 flex flex-col justify-between pr-6 pl-4 py-4 text-right"
                    style={{ direction: "rtl" }}
                  >
                    {/* Title + tags */}
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
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
                      <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300 leading-snug">
                        {question.title}
                      </h3>
                    </div>

                    {/* Bottom: pfp, username, time (right), then comments, views */}
                    <div className="flex items-center justify-start gap-3 text-sm text-gray-500 dark:text-gray-400 mt-2 pt-2 border-t border-gray-100 dark:border-gray-700/70">
                      {question.author.username ? (
                        <Link
                          href={`/profile/${encodeURIComponent(question.author.username)}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-2 hover:opacity-90 transition-opacity flex-shrink-0"
                        >
                          {question.author.avatar_url ? (
                            <Image
                              src={question.author.avatar_url}
                              alt={question.author.username}
                              width={40}
                              height={40}
                              className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-600"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center">
                              <User size={20} className="text-white" />
                            </div>
                          )}
                        </Link>
                      ) : (
                        <>
                          {question.author.avatar_url ? (
                            <Image
                              src={question.author.avatar_url}
                              alt=""
                              width={40}
                              height={40}
                              className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-600 flex-shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                              <User size={20} className="text-white" />
                            </div>
                          )}
                        </>
                      )}
                      <span className="font-medium text-gray-600 dark:text-gray-300">
                        {question.author.username ? (
                          <Link
                            href={`/profile/${encodeURIComponent(question.author.username)}`}
                            onClick={(e) => e.stopPropagation()}
                            className="hover:underline"
                          >
                            {question.author.username}
                          </Link>
                        ) : (
                          "אנונימי"
                        )}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                        {timeAgo(question.createdAt)}
                      </span>
                      <div className="flex items-center gap-1" title="תגובות">
                        <MessageCircle size={14} />
                        <span>{question.replies}</span>
                      </div>
                      <div className="flex items-center gap-1" title="צפיות">
                        <Eye size={14} />
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

      <AuthModal {...authModalProps} />

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
