"use client";

import React, {
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
  useRef,
} from "react";
import { createPortal } from "react-dom";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  MessageSquare,
  Users,
  HelpCircle,
  BookOpen,
  Home,
  ArrowUp,
  ArrowDown,
  Star,
  User,
  LogIn,
  Eye,
  MessageCircle,
  Clock,
  ChevronRight,
  ChevronDown,
  Shield,
  ChevronUp,
  CheckCircle,
  Pencil,
  X,
  Plus,
  Reply,
  MoreVertical,
  Trash2,
  FileQuestion,
  Flag,
  CornerDownLeft,
} from "lucide-react";
import { useAuth } from "../../components/AuthProvider";
import LoginModal from "../../components/LoginModal";
import RegisterModal from "../../components/RegisterModal";
import Drawer from "../../components/Drawer";
import NavHeader from "../../components/NavHeader";
import BubbleButton from "../../components/BubbleButton";
import { isOnline } from "@/lib/utils";
import { normalizeTagName } from "@/lib/tag-matching";
import { usePresenceTick } from "../../hooks/usePresenceTick";

interface QuestionDetail {
  id: string;
  title: string;
  content: string;
  votes: number;
  replies: number;
  views: number;
  answers: number;
  isAnswered: boolean;
  isPinned: boolean;
  isClosed: boolean;
  createdAt: string;
  updatedAt: string;
  lastActivityAt: string;
  userVote: 1 | -1 | 0;
  author: {
    id: string;
    username: string;
    avatar_url: string | null;
    reputation: number;
    lastSeenAt?: string | null;
  };
  tags: string[];
}

interface Answer {
  id: string;
  content: string;
  votes: number;
  isAccepted: boolean;
  isEdited: boolean;
  createdAt: string;
  parentAnswerId?: string | null;
  userVote: 1 | -1 | 0;
  author: {
    id: string;
    username: string;
    avatar_url: string | null;
    reputation: number;
    lastSeenAt?: string | null;
  };
}

interface ThreadReply extends Answer {
  replyTargetUsername: string | null;
}

interface AnswerThread {
  root: Answer;
  replies: ThreadReply[];
}

const MOCK_QUESTION: QuestionDetail = {
  id: "mock-question",
  title: "שאלה לדוגמה – התחבר כדי לראות תוכן אמיתי",
  content:
    "לאחר ההתחברות תוכל לראות כאן את השאלה המלאה והתשובות האמיתיות מהקהילה.",
  votes: 0,
  replies: 2,
  views: 0,
  answers: 2,
  isAnswered: false,
  isPinned: false,
  isClosed: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  lastActivityAt: new Date().toISOString(),
  userVote: 0,
  author: {
    id: "mock-author",
    username: "example_user",
    avatar_url: null,
    reputation: 0,
  },
  tags: ["דוגמה"],
};

const MOCK_ANSWERS: Answer[] = [
  {
    id: "mock-answer-1",
    content:
      "זו תשובה לדוגמה. אחרי שתתחבר תוכל לראות כאן תשובות אמיתיות של משתמשים.",
    votes: 0,
    isAccepted: false,
    isEdited: false,
    createdAt: new Date().toISOString(),
    parentAnswerId: null,
    userVote: 0,
    author: {
      id: "mock-user-1",
      username: "helper_user",
      avatar_url: null,
      reputation: 0,
    },
  },
  {
    id: "mock-answer-2",
    content: "תשובת דוגמה נוספת כדי להמחיש את מבנה הדיון.",
    votes: 0,
    isAccepted: false,
    isEdited: false,
    createdAt: new Date().toISOString(),
    parentAnswerId: null,
    userVote: 0,
    author: {
      id: "mock-user-2",
      username: "another_helper",
      avatar_url: null,
      reputation: 0,
    },
  },
];

interface VoteUserEntry {
  userId: string;
  username: string;
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

function sortByCreatedAt<T extends { createdAt: string }>(items: T[]): T[] {
  return items.sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

function buildAnswerThreads(flat: Answer[]): AnswerThread[] {
  const byId = new Map(flat.map((answer) => [answer.id, answer]));
  const rootIds = new Map<string, string>();

  const resolveRootId = (answer: Answer): string => {
    const cachedRootId = rootIds.get(answer.id);
    if (cachedRootId) return cachedRootId;

    let current = answer;
    const lineage: string[] = [];
    const seen = new Set<string>();

    while (current.parentAnswerId && !seen.has(current.id)) {
      seen.add(current.id);
      lineage.push(current.id);
      const parent = byId.get(current.parentAnswerId);
      if (!parent) break;
      current = parent;
    }

    rootIds.set(current.id, current.id);
    lineage.forEach((id) => rootIds.set(id, current.id));

    return current.id;
  };

  const roots = sortByCreatedAt(
    flat.filter(
      (answer) => !answer.parentAnswerId || !byId.has(answer.parentAnswerId),
    ),
  );

  const threadsByRootId = new Map<string, AnswerThread>(
    roots.map((root) => [root.id, { root, replies: [] }]),
  );

  flat.forEach((answer) => {
    if (!answer.parentAnswerId) return;

    const parent = byId.get(answer.parentAnswerId);
    if (!parent) return;

    const rootId = resolveRootId(answer);
    if (rootId === answer.id) return;

    const thread = threadsByRootId.get(rootId);
    if (!thread) return;

    thread.replies.push({
      ...answer,
      replyTargetUsername: parent.parentAnswerId
        ? parent.author.username
        : null,
    });
  });

  threadsByRootId.forEach((thread) => {
    sortByCreatedAt(thread.replies);
  });

  return roots.map(
    (root) => threadsByRootId.get(root.id) ?? { root, replies: [] },
  );
}

/** Question & answer author pfp: composer-style (no border, gradient + initial); 26px. */
function AnswerCardAuthorAvatar({
  avatarUrl,
  username,
  isOnline,
}: {
  avatarUrl: string | null;
  username: string | null | undefined;
  isOnline: boolean;
}) {
  const initial = username?.charAt(0).toUpperCase() ?? "";
  const inner = avatarUrl ? (
    <Image
      src={avatarUrl}
      alt={username ?? ""}
      width={26}
      height={26}
      className="size-[26px] shrink-0 rounded-full object-cover"
    />
  ) : (
    <div className="flex size-[26px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50">
      <span className="text-xs font-bold leading-none text-indigo-600 dark:text-indigo-400">
        {initial}
      </span>
    </div>
  );

  if (isOnline) {
    return (
      <span className="inline-flex size-[26px] shrink-0 rounded-full avatar-aura-online">
        <span className="block size-[26px] overflow-hidden rounded-full">
          {inner}
        </span>
      </span>
    );
  }

  return <span className="inline-flex shrink-0">{inner}</span>;
}

export default function QuestionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [question, setQuestion] = useState<QuestionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [answers, setAnswers] = useState<Answer[]>([]);
  const [answersLoading, setAnswersLoading] = useState(true);
  const [answerContent, setAnswerContent] = useState("");
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [answerError, setAnswerError] = useState<string | null>(null);

  const [isAnswerPanelOpen, setIsAnswerPanelOpen] = useState(false);

  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const replyingToIdRef = useRef<string | null>(null);
  replyingToIdRef.current = replyingToId;
  const [replyContent, setReplyContent] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  const [questionMenuOpen, setQuestionMenuOpen] = useState(false);
  const [openAnswerMenuId, setOpenAnswerMenuId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editCurrentTag, setEditCurrentTag] = useState("");
  const [editTagMatches, setEditTagMatches] = useState<string[]>([]);
  const [showTagsExpanded, setShowTagsExpanded] = useState(false);
  const editTagMatchesAbortRef = useRef<AbortController | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [deletionReason, setDeletionReason] = useState("");
  const [removing, setRemoving] = useState(false);
  const [showRequestRemovalModal, setShowRequestRemovalModal] = useState(false);
  const [requestRemovalReason, setRequestRemovalReason] = useState("");
  const [submittingRemovalRequest, setSubmittingRemovalRequest] =
    useState(false);
  const [reportingAnswer, setReportingAnswer] = useState<Answer | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportError, setReportError] = useState("");
  const [showVoteDetailsModal, setShowVoteDetailsModal] = useState(false);
  const [voteDetailsLoading, setVoteDetailsLoading] = useState(false);
  const [voteDetailsError, setVoteDetailsError] = useState<string | null>(null);
  const [voteDetails, setVoteDetails] = useState<{
    upvotes: VoteUserEntry[];
    downvotes: VoteUserEntry[];
  }>({
    upvotes: [],
    downvotes: [],
  });
  const [showAnswerVoteDetailsModal, setShowAnswerVoteDetailsModal] =
    useState(false);
  const [answerVoteDetailsAnswerId, setAnswerVoteDetailsAnswerId] = useState<
    string | null
  >(null);
  const [answerVoteDetailsLoading, setAnswerVoteDetailsLoading] =
    useState(false);
  const [answerVoteDetailsError, setAnswerVoteDetailsError] = useState<
    string | null
  >(null);
  const [answerVoteDetails, setAnswerVoteDetails] = useState<{
    upvotes: VoteUserEntry[];
    downvotes: VoteUserEntry[];
  }>({
    upvotes: [],
    downvotes: [],
  });
  const [updatingVoteIds, setUpdatingVoteIds] = useState<
    Record<string, boolean>
  >({});
  const questionMenuRef = useRef<HTMLDivElement>(null);
  const questionMenuPortalRef = useRef<HTMLDivElement>(null);
  const [questionMenuPosition, setQuestionMenuPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const answerMenuRef = useRef<HTMLDivElement>(null);
  const answerMenuPortalRef = useRef<HTMLDivElement>(null);
  const [answerMenuPosition, setAnswerMenuPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const voteRequestsRef = useRef(new Set<string>());
  const searchParams = useSearchParams();
  const [hasScrolledToAnswer, setHasScrolledToAnswer] = useState(false);

  const router = useRouter();
  const {
    user,
    profile,
    userPermissions,
    loading: authLoading,
    signOut,
  } = useAuth();
  const userId = user?.id ?? null;
  const isGuest = !user;
  usePresenceTick(); // re-evaluate isOnline() every 30s so indicators update when users go offline

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

  const canEditAny = !!userPermissions?.can_edit_delete_content;
  const isAuthor = !!user && !!question && user.id === question.author.id;
  const authorRep = profile?.reputation ?? 0;
  const canEditOwn = isAuthor && authorRep > 50;
  const canEdit = question && user && (canEditAny || canEditOwn);
  const canRemove =
    question &&
    user &&
    (userPermissions?.role === "owner" || userPermissions?.role === "guardian");
  const canRequestRemoval =
    question && user && userPermissions?.role === "admin";
  const canViewVotes =
    question &&
    user &&
    (userPermissions?.role === "owner" ||
      userPermissions?.role === "guardian" ||
      userPermissions?.role === "admin");

  useLayoutEffect(() => {
    if (questionMenuOpen && questionMenuRef.current) {
      const rect = questionMenuRef.current.getBoundingClientRect();
      setQuestionMenuPosition({ top: rect.bottom + 4, left: rect.left });
    } else {
      setQuestionMenuPosition(null);
    }
  }, [questionMenuOpen]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      const inTrigger = questionMenuRef.current?.contains(target) ?? false;
      const inPortal = questionMenuPortalRef.current?.contains(target) ?? false;
      if (!inTrigger && !inPortal) {
        setQuestionMenuOpen(false);
      }
    }
    if (questionMenuOpen) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [questionMenuOpen]);

  useLayoutEffect(() => {
    if (openAnswerMenuId && answerMenuRef.current) {
      const rect = answerMenuRef.current.getBoundingClientRect();
      setAnswerMenuPosition({ top: rect.bottom + 4, left: rect.left });
    } else {
      setAnswerMenuPosition(null);
    }
  }, [openAnswerMenuId]);

  useEffect(() => {
    if (!openAnswerMenuId) return;
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node;
      const inTrigger = answerMenuRef.current?.contains(target) ?? false;
      const inPortal = answerMenuPortalRef.current?.contains(target) ?? false;
      if (!inTrigger && !inPortal) {
        setOpenAnswerMenuId(null);
      }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [openAnswerMenuId]);

  useEffect(() => {
    async function fetchEditTagMatches() {
      const query = normalizeTagName(editCurrentTag);
      if (!isEditMode || !query || editTags.length >= 5) {
        setEditTagMatches([]);
        return;
      }
      editTagMatchesAbortRef.current?.abort();
      const controller = new AbortController();
      editTagMatchesAbortRef.current = controller;
      try {
        const params = new URLSearchParams({
          query,
          exclude: editTags.join(","),
        });
        const res = await fetch(`/api/tags?${params.toString()}`, {
          signal: controller.signal,
        });
        const data = await res.json();
        if (res.ok && Array.isArray(data.tags)) {
          setEditTagMatches(data.tags);
        } else {
          setEditTagMatches([]);
        }
      } catch {
        setEditTagMatches([]);
      } finally {
        if (editTagMatchesAbortRef.current === controller) {
          editTagMatchesAbortRef.current = null;
        }
      }
    }
    const t = setTimeout(fetchEditTagMatches, 200);
    return () => {
      clearTimeout(t);
      editTagMatchesAbortRef.current?.abort();
    };
  }, [isEditMode, editCurrentTag, editTags]);

  useEffect(() => {
    async function fetchQuestion() {
      if (!id) return;

      // For guests, do not load the real question – show mock content only
      if (!userId && !authLoading) {
        setError(null);
        setQuestion(MOCK_QUESTION);
        setLoading(false);
        return;
      }

      // While auth state is still resolving, wait
      if (!userId) {
        return;
      }

      try {
        const res = await fetch(`/api/questions/${id}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "שגיאה בטעינת השאלה");
          return;
        }

        setQuestion(data.question);
      } catch {
        setError("שגיאה בחיבור לשרת");
      } finally {
        setLoading(false);
      }
    }

    fetchQuestion();
  }, [id, userId, authLoading]);

  const fetchAnswers = useCallback(async () => {
    if (!id) return;

    // For guests, show only mock answers
    if (!userId && !authLoading) {
      setAnswers(MOCK_ANSWERS);
      setAnswersLoading(false);
      return;
    }

    if (!userId) {
      return;
    }

    setAnswersLoading(true);
    try {
      const res = await fetch(`/api/questions/${id}/answers`);
      const data = await res.json();
      if (res.ok) {
        setAnswers(data.answers || []);
      }
    } catch {
      // silent fail, answers section will just show empty
    } finally {
      setAnswersLoading(false);
    }
  }, [id, userId, authLoading]);

  useEffect(() => {
    fetchAnswers();
  }, [fetchAnswers]);

  const setVoteLoading = useCallback((voteKey: string, isLoading: boolean) => {
    setUpdatingVoteIds((prev) => {
      if (isLoading) {
        return { ...prev, [voteKey]: true };
      }

      const next = { ...prev };
      delete next[voteKey];
      return next;
    });
  }, []);

  const handleQuestionVote = async (voteType: 1 | -1) => {
    if (!id) return;

    if (!user) {
      handleAuthAction("login");
      return;
    }

    const currentQuestion = question;
    if (!currentQuestion) return;

    const previousVote = currentQuestion.userVote ?? 0;
    const optimisticVote = previousVote === voteType ? 0 : voteType;
    const previousVotesCount = currentQuestion.votes;
    const optimisticVotesCount =
      previousVotesCount + (optimisticVote - previousVote);
    const voteKey = `question:${id}`;
    if (voteRequestsRef.current.has(voteKey)) return;

    voteRequestsRef.current.add(voteKey);
    setVoteLoading(voteKey, true);
    setQuestion((current) =>
      current
        ? {
            ...current,
            votes: optimisticVotesCount,
            userVote: optimisticVote,
          }
        : current,
    );
    try {
      const res = await fetch(`/api/questions/${id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voteType }),
      });
      const data = await res.json();

      if (!res.ok) {
        setQuestion((current) =>
          current
            ? {
                ...current,
                votes: previousVotesCount,
                userVote: previousVote,
              }
            : current,
        );
        return;
      }

      const resolvedVote =
        data.userVote === 1 || data.userVote === -1 ? data.userVote : 0;
      setQuestion((currentQuestion) =>
        currentQuestion
          ? {
              ...currentQuestion,
              votes: data.votes ?? currentQuestion.votes,
              userVote: resolvedVote,
            }
          : currentQuestion,
      );
    } catch {
      setQuestion((current) =>
        current
          ? {
              ...current,
              votes: previousVotesCount,
              userVote: previousVote,
            }
          : current,
      );
    } finally {
      voteRequestsRef.current.delete(voteKey);
      setVoteLoading(voteKey, false);
    }
  };

  const handleAnswerVote = async (answerId: string, voteType: 1 | -1) => {
    if (!id) return;

    if (!user) {
      handleAuthAction("login");
      return;
    }

    const currentAnswer = answers.find((answer) => answer.id === answerId);
    if (!currentAnswer) return;

    const previousVote = currentAnswer.userVote ?? 0;
    const optimisticVote = previousVote === voteType ? 0 : voteType;
    const previousVotesCount = currentAnswer.votes;
    const optimisticVotesCount =
      previousVotesCount + (optimisticVote - previousVote);
    const voteKey = `answer:${answerId}`;
    if (voteRequestsRef.current.has(voteKey)) return;

    voteRequestsRef.current.add(voteKey);
    setVoteLoading(voteKey, true);
    setAnswers((prev) =>
      prev.map((answer) =>
        answer.id === answerId
          ? {
              ...answer,
              votes: optimisticVotesCount,
              userVote: optimisticVote,
            }
          : answer,
      ),
    );
    try {
      const res = await fetch(`/api/questions/${id}/answers/${answerId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voteType }),
      });
      const data = await res.json();

      if (!res.ok) {
        setAnswers((prev) =>
          prev.map((answer) =>
            answer.id === answerId
              ? {
                  ...answer,
                  votes: previousVotesCount,
                  userVote: previousVote,
                }
              : answer,
          ),
        );
        return;
      }

      const resolvedVote =
        data.userVote === 1 || data.userVote === -1 ? data.userVote : 0;
      setAnswers((prev) =>
        prev.map((answer) =>
          answer.id === answerId
            ? {
                ...answer,
                votes: data.votes ?? answer.votes,
                userVote: resolvedVote,
              }
            : answer,
        ),
      );
    } catch {
      setAnswers((prev) =>
        prev.map((answer) =>
          answer.id === answerId
            ? {
                ...answer,
                votes: previousVotesCount,
                userVote: previousVote,
              }
            : answer,
        ),
      );
    } finally {
      voteRequestsRef.current.delete(voteKey);
      setVoteLoading(voteKey, false);
    }
  };

  const handleOpenAnswerReport = (answer: Answer) => {
    setOpenAnswerMenuId(null);

    if (!user) {
      handleAuthAction("login");
      return;
    }

    setReportingAnswer(answer);
    setReportReason("");
    setReportError("");
  };

  const handleSubmitAnswerReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingAnswer || reportSubmitting) return;

    setReportSubmitting(true);
    setReportError("");
    try {
      const res = await fetch("/api/report/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentType: "answer",
          contentId: reportingAnswer.id,
          description: reportReason.trim() || undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setReportError(data.error || "שגיאה בשליחת הדיווח");
        return;
      }

      setReportingAnswer(null);
      setReportReason("");
      setReportError("");
    } catch {
      setReportError("שגיאה בחיבור לשרת");
    } finally {
      setReportSubmitting(false);
    }
  };

  const handleOpenVoteDetails = async () => {
    if (!id) return;

    setQuestionMenuOpen(false);
    setShowVoteDetailsModal(true);
    setVoteDetailsLoading(true);
    setVoteDetailsError(null);
    setVoteDetails({ upvotes: [], downvotes: [] });
    try {
      const res = await fetch(`/api/questions/${id}/votes`);
      const data = await res.json();

      if (!res.ok) {
        setVoteDetailsError(data.error || "שגיאה בטעינת פרטי ההצבעות");
        return;
      }

      setVoteDetails({
        upvotes: Array.isArray(data.upvotes) ? data.upvotes : [],
        downvotes: Array.isArray(data.downvotes) ? data.downvotes : [],
      });
    } catch {
      setVoteDetailsError("שגיאה בחיבור לשרת");
    } finally {
      setVoteDetailsLoading(false);
    }
  };

  const handleOpenAnswerVoteDetails = async (answer: Answer) => {
    if (!id) return;

    setOpenAnswerMenuId(null);
    setAnswerVoteDetailsAnswerId(answer.id);
    setShowAnswerVoteDetailsModal(true);
    setAnswerVoteDetailsLoading(true);
    setAnswerVoteDetailsError(null);
    setAnswerVoteDetails({ upvotes: [], downvotes: [] });
    try {
      const res = await fetch(
        `/api/questions/${id}/answers/${answer.id}/votes`,
      );
      const data = await res.json();

      if (!res.ok) {
        setAnswerVoteDetailsError(data.error || "שגיאה בטעינת פרטי ההצבעות");
        return;
      }

      setAnswerVoteDetails({
        upvotes: Array.isArray(data.upvotes) ? data.upvotes : [],
        downvotes: Array.isArray(data.downvotes) ? data.downvotes : [],
      });
    } catch {
      setAnswerVoteDetailsError("שגיאה בחיבור לשרת");
    } finally {
      setAnswerVoteDetailsLoading(false);
    }
  };

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answerContent.trim()) return;

    if (!user) {
      handleAuthAction("login");
      return;
    }

    setSubmittingAnswer(true);
    setAnswerError(null);
    try {
      const res = await fetch(`/api/questions/${id}/answers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: answerContent.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setAnswerError(data.error || "שגיאה בשליחת התשובה");
        return;
      }

      setAnswerContent("");
      setIsAnswerPanelOpen(false);
      fetchAnswers();
    } catch {
      setAnswerError("שגיאה בחיבור לשרת");
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const answerThreads = React.useMemo(
    () => buildAnswerThreads(answers),
    [answers],
  );
  const selectedAnswerForVoteDetails = answerVoteDetailsAnswerId
    ? (answers.find((answer) => answer.id === answerVoteDetailsAnswerId) ??
      null)
    : null;

  useEffect(() => {
    if (!id || !answers.length || hasScrolledToAnswer) return;
    const answerId = searchParams.get("answerId");
    if (!answerId) return;
    const el = document.getElementById(`answer-${answerId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setHasScrolledToAnswer(true);
    }
  }, [id, answers.length, searchParams, hasScrolledToAnswer]);

  const handleSubmitReply = async (
    e: React.FormEvent,
    parentAnswerId: string,
  ) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    if (!user) {
      handleAuthAction("login");
      return;
    }
    setSubmittingReply(true);
    setReplyError(null);
    try {
      const res = await fetch(`/api/questions/${id}/answers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyContent.trim(), parentAnswerId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setReplyError(data.error || "שגיאה בשליחת התגובה");
        return;
      }
      setReplyContent("");
      setReplyingToId(null);
      fetchAnswers();
    } catch {
      setReplyError("שגיאה בחיבור לשרת");
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleAuthAction = (mode: "login" | "register") => {
    if (mode === "login") {
      setIsRegisterModalOpen(false);
      setIsLoginModalOpen(true);
    } else {
      setIsLoginModalOpen(false);
      setIsRegisterModalOpen(true);
    }
  };

  /** Only one of create-answer vs reply composer may be active; latest action wins. */
  const openCreateAnswerComposer = useCallback(() => {
    setReplyingToId(null);
    setReplyContent("");
    setReplyError(null);
    setIsAnswerPanelOpen(true);
  }, []);

  const openReplyToAnswer = useCallback((answerId: string) => {
    if (replyingToIdRef.current !== answerId) setReplyContent("");
    setIsAnswerPanelOpen(false);
    setAnswerError(null);
    setReplyError(null);
    setReplyingToId(answerId);
  }, []);

  const openAnswerPanelForMobileNav = useCallback(() => {
    if (!question) return;
    if (!user) {
      setIsRegisterModalOpen(false);
      setIsLoginModalOpen(true);
      return;
    }
    openCreateAnswerComposer();
  }, [question, user, openCreateAnswerComposer]);

  useEffect(() => {
    const onOpenAnswer = () => {
      openAnswerPanelForMobileNav();
    };
    window.addEventListener("question-detail:open-answer", onOpenAnswer);
    return () =>
      window.removeEventListener("question-detail:open-answer", onOpenAnswer);
  }, [openAnswerPanelForMobileNav]);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("question-detail:reply-sheet-state", {
        detail: { open: Boolean(replyingToId) || isAnswerPanelOpen },
      }),
    );
  }, [replyingToId, isAnswerPanelOpen]);

  useEffect(() => {
    return () => {
      window.dispatchEvent(
        new CustomEvent("question-detail:reply-sheet-state", {
          detail: { open: false },
        }),
      );
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error("Error signing out:", err);
    }
  };

  const handleStartEdit = () => {
    if (question) {
      setEditTitle(question.title);
      setEditContent(question.content);
      setEditTags([...question.tags]);
      setIsEditMode(true);
      setQuestionMenuOpen(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditTitle("");
    setEditContent("");
    setEditTags([]);
    setEditCurrentTag("");
    setEditTagMatches([]);
  };

  const handleEditTagAdd = (tag: string) => {
    const trimmed = normalizeTagName(tag);
    if (trimmed && !editTags.includes(trimmed) && editTags.length < 5) {
      setEditTags([...editTags, trimmed]);
      setEditCurrentTag("");
      setEditTagMatches([]);
    }
  };

  const handleEditTagRemove = (tag: string) => {
    setEditTags(editTags.filter((t) => t !== tag));
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !id ||
      !editTitle.trim() ||
      editTitle.trim().length < 5 ||
      !editContent.trim() ||
      editTags.length === 0 ||
      editCurrentTag.trim()
    )
      return;
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/questions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle.trim(),
          content: editContent.trim(),
          tags: editTags,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "שגיאה בעדכון השאלה");
        return;
      }
      setQuestion((q) =>
        q
          ? {
              ...q,
              title: editTitle.trim(),
              content: editContent.trim(),
              tags: [...editTags],
            }
          : null,
      );
      handleCancelEdit();
    } catch {
      alert("שגיאה בחיבור לשרת");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleConfirmRemove = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!id) return;
    const reason = deletionReason.trim();
    if (!reason) {
      alert("נא לציין סיבת ההסרה");
      return;
    }
    setRemoving(true);
    try {
      const res = await fetch(`/api/questions/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "שגיאה בהסרת השאלה");
        return;
      }
      setDeletionReason("");
      router.push("/questions");
    } catch {
      alert("שגיאה בחיבור לשרת");
    } finally {
      setRemoving(false);
      setShowRemoveConfirm(false);
      setQuestionMenuOpen(false);
    }
  };

  const handleOpenRequestRemoval = () => {
    setRequestRemovalReason("");
    setShowRequestRemovalModal(true);
    setQuestionMenuOpen(false);
  };

  const handleSubmitRequestRemoval = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSubmittingRemovalRequest(true);
    try {
      const res = await fetch(`/api/questions/${id}/request-removal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: requestRemovalReason.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "שגיאה בשליחת הבקשה");
        return;
      }
      setShowRequestRemovalModal(false);
      setRequestRemovalReason("");
    } catch {
      alert("שגיאה בחיבור לשרת");
    } finally {
      setSubmittingRemovalRequest(false);
    }
  };

  // If a non‑logged‑in user lands directly on a question page,
  // immediately show the login modal and treat the page as restricted.
  useEffect(() => {
    if (!authLoading && isGuest) {
      setIsLoginModalOpen(true);
      setIsRegisterModalOpen(false);
    }
  }, [authLoading, isGuest]);

  if (authLoading || loading) {
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

      <div className="hidden md:block">
        <NavHeader
          title="שאלות ותשובות"
          wide
          onMenuClick={() => setIsDrawerOpen(!isDrawerOpen)}
          rightContent={
            !user ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleAuthAction("login")}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-200 bg-white/60 dark:bg-gray-700/60 rounded-lg hover:bg-white/80 dark:hover:bg-gray-700/80 transition-all duration-300 border border-indigo-200 dark:border-indigo-800 hover:border-indigo-300 dark:hover:border-indigo-700"
                >
                  <LogIn size={16} />
                  התחברות
                </button>
                <button
                  onClick={() => handleAuthAction("register")}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <User size={16} />
                  הרשמה
                </button>
              </div>
            ) : question && !isAnswerPanelOpen ? (
              <BubbleButton onClick={openCreateAnswerComposer} size="sm">
                <span className="flex items-center gap-1">
                  <Plus size={18} />
                  כתוב תשובה
                </span>
              </BubbleButton>
            ) : undefined
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

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-5 relative max-md:pt-[max(1rem,env(safe-area-inset-top))] md:pt-4 max-md:pb-[calc(9rem+env(safe-area-inset-bottom))] md:pb-8">
        {/* Back Button */}
        <Link
          href="/questions"
          className="absolute -right-12 xl:-right-16 top-8 p-3 bg-white/80 dark:bg-gray-800/70 backdrop-blur-sm rounded-full shadow-md border border-gray-200/50 dark:border-gray-700/50 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-all hover:scale-105 hidden md:flex items-center justify-center z-10"
          title="חזרה לשאלות"
        >
          <ChevronRight size={24} />
        </Link>

        {error ? (
          <div className="text-center py-16">
            <HelpCircle
              size={48}
              className="mx-auto text-red-400 dark:text-red-500 mb-4"
            />
            <h3 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-2">
              {error}
            </h3>
            <Link
              href="/questions"
              className="inline-block mt-4 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg"
            >
              חזרה לשאלות
            </Link>
          </div>
        ) : question ? (
          <div className="space-y-4">
            {/* Question Card */}
            <div className="bg-white/80 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
              <div className="flex">
                {/* Vote sidebar */}
                <div className="flex flex-col items-center justify-center gap-0.5 pl-1.5 pr-2 py-1.5 sm:pl-2 sm:pr-3 sm:py-2 bg-gray-50/80 dark:bg-gray-700/50 border-l border-gray-200/50 dark:border-gray-600/50">
                  <button
                    type="button"
                    onClick={() => void handleQuestionVote(1)}
                    disabled={!!updatingVoteIds[`question:${question.id}`]}
                    className="p-1 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <ArrowUp
                      size={18}
                      className={
                        question.userVote === 1
                          ? "text-indigo-600 dark:text-indigo-400"
                          : "text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                      }
                    />
                  </button>
                  <span className="font-bold text-base text-gray-800 dark:text-gray-100">
                    {question.votes}
                  </span>
                  <button
                    type="button"
                    onClick={() => void handleQuestionVote(-1)}
                    disabled={!!updatingVoteIds[`question:${question.id}`]}
                    className="p-1 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <ArrowDown
                      size={18}
                      className={
                        question.userVote === -1
                          ? "text-indigo-600 dark:text-indigo-400"
                          : "text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                      }
                    />
                  </button>
                  {question.isAnswered && (
                    <div
                      className="mt-1.5 p-1 bg-green-100 dark:bg-green-900/50 rounded-full"
                      title="נענתה"
                    >
                      <Star
                        size={14}
                        className="text-green-600 dark:text-green-400"
                        fill="currentColor"
                      />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 pt-1.5 pl-6 pr-3 pb-4">
                  {/* Status badges */}
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    {question.isAnswered && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-700">
                        נענתה
                      </span>
                    )}
                    {question.isPinned && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-700">
                        נעוצה
                      </span>
                    )}
                    {question.isClosed && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-700">
                        סגורה
                      </span>
                    )}
                  </div>

                  {/* Title row: title + three-dots menu aligned */}
                  {isEditMode ? (
                    <form onSubmit={handleSaveEdit} className="mb-3 space-y-3">
                      <div className="flex items-center gap-3 mb-1.5">
                        <input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="flex-1 min-w-0 text-[1.2rem] md:text-2xl font-bold text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2"
                          placeholder="כותרת (לפחות 5 תווים)"
                          minLength={5}
                          required
                        />
                        {(canEdit ||
                          canRemove ||
                          canRequestRemoval ||
                          canViewVotes) && (
                          <div
                            className="relative flex-shrink-0"
                            ref={questionMenuRef}
                            style={{ transform: "translateX(-5px)" }}
                          >
                            <button
                              type="button"
                              onClick={() => setQuestionMenuOpen((o) => !o)}
                              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                              aria-label="תפריט שאלה"
                            >
                              <MoreVertical size={20} />
                            </button>
                          </div>
                        )}
                      </div>
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full min-h-[120px] text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 resize-y"
                        placeholder="תוכן השאלה"
                        required
                      />
                      {/* Tag editing - catalog only */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          תגיות
                        </label>
                        <div className="flex flex-wrap items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg">
                          {editTags.map((tag) => (
                            <span
                              key={tag}
                              className="group flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-200 rounded-md font-semibold text-sm"
                            >
                              {tag}
                              <button
                                type="button"
                                onClick={() => handleEditTagRemove(tag)}
                                className="p-0.5 opacity-50 group-hover:opacity-100 hover:bg-indigo-200 dark:hover:bg-indigo-800 rounded-full transition-opacity"
                              >
                                <X size={14} />
                              </button>
                            </span>
                          ))}
                          {editTags.length < 5 && (
                            <input
                              type="text"
                              value={editCurrentTag}
                              onChange={(e) =>
                                setEditCurrentTag(e.target.value)
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  const exact = editTagMatches.find(
                                    (t) =>
                                      normalizeTagName(t) ===
                                      normalizeTagName(editCurrentTag),
                                  );
                                  if (exact) handleEditTagAdd(exact);
                                }
                              }}
                              placeholder="חפש תגית קיימת..."
                              className="flex-1 bg-transparent p-1.5 min-w-[120px] focus:outline-none text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                            />
                          )}
                        </div>
                        {editCurrentTag.trim() && (
                          <div className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 overflow-hidden">
                            {editTagMatches.length > 0 ? (
                              editTagMatches.map((tag) => (
                                <button
                                  key={tag}
                                  type="button"
                                  onClick={() => handleEditTagAdd(tag)}
                                  className="w-full px-3 py-2 text-right text-sm text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                  {tag}
                                </button>
                              ))
                            ) : (
                              <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                                לא נמצאו תגיות תואמות בקטלוג
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={
                            savingEdit ||
                            editTitle.trim().length < 5 ||
                            !editContent.trim() ||
                            editTags.length === 0 ||
                            !!editCurrentTag.trim()
                          }
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
                        >
                          {savingEdit ? "שומר..." : "שמור"}
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-500"
                        >
                          ביטול
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex items-center gap-3 mb-1">
                      <h1 className="flex-1 min-w-0 text-[1.2rem] md:text-2xl font-bold text-gray-900 dark:text-gray-100 leading-snug">
                        {question.title}
                      </h1>
                      {(canEdit ||
                        canRemove ||
                        canRequestRemoval ||
                        canViewVotes) && (
                        <div
                          className="relative flex-shrink-0"
                          ref={questionMenuRef}
                          style={{ transform: "translateX(-10px)" }}
                        >
                          <button
                            type="button"
                            onClick={() => setQuestionMenuOpen((o) => !o)}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                            aria-label="תפריט שאלה"
                          >
                            <MoreVertical size={20} />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Content body (only when not editing) */}
                  {!isEditMode && (
                    <div className="prose prose-gray max-w-none mb-2 text-gray-700 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                      {question.content}
                    </div>
                  )}

                  {/* Meta bar */}
                  <div className="relative flex items-center justify-between pt-3 mt-1">
                    <div
                      className="absolute top-0 right-0 left-[110px] h-px bg-gray-100 dark:bg-gray-700"
                      aria-hidden
                    />
                    <div className="absolute -left-[2px] -top-[10px] px-2 bg-white dark:bg-gray-800 text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                      <Clock size={12} />
                      <span>{timeAgo(question.createdAt)}</span>
                    </div>
                    {/* Author */}
                    <div className="flex items-center gap-3">
                      {question.author.username ||
                      user?.id === question.author.id ? (
                        <Link
                          href={
                            user?.id === question.author.id
                              ? "/profile"
                              : `/profile/${encodeURIComponent(question.author.username)}`
                          }
                          className="flex items-center gap-3 hover:opacity-90 transition-opacity"
                        >
                          <AnswerCardAuthorAvatar
                            avatarUrl={question.author.avatar_url}
                            username={
                              question.author.username || profile?.username
                            }
                            isOnline={isOnline(question.author.lastSeenAt)}
                          />
                          <div>
                            <span className="font-semibold text-gray-800 dark:text-gray-100">
                              {question.author.username || profile?.username}
                            </span>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {question.author.reputation} מוניטין
                            </div>
                          </div>
                        </Link>
                      ) : (
                        <>
                          <AnswerCardAuthorAvatar
                            avatarUrl={question.author.avatar_url}
                            username={question.author.username}
                            isOnline={isOnline(question.author.lastSeenAt)}
                          />
                          <div>
                            <span className="font-semibold text-gray-800 dark:text-gray-100">
                              {question.author.username}
                            </span>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {question.author.reputation} מוניטין
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Stats + Show Tags */}
                    <div className="flex flex-col items-end gap-0 text-sm text-gray-500 dark:text-gray-400 ml-2.5 translate-y-[3px]">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1" title="תגובות">
                          <MessageCircle size={15} />
                          <span>{question.replies}</span>
                        </div>
                        <div className="flex items-center gap-1" title="צפיות">
                          <Eye size={15} />
                          <span>{question.views}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowTagsExpanded((v) => !v)}
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 -mt-0.5 translate-x-[-10px] md:translate-x-[-10px] text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        aria-expanded={showTagsExpanded}
                        title={showTagsExpanded ? "הסתר תגיות" : "הצג תגיות"}
                      >
                        <ChevronDown
                          size={14}
                          className={`transition-transform ${showTagsExpanded ? "rotate-180" : ""}`}
                        />
                        הצג תגיות
                      </button>
                    </div>
                  </div>
                  {/* Tags (shown when הצג תגיות is expanded) */}
                  {showTagsExpanded && (
                    <div className="flex gap-2 mt-3 flex-wrap">
                      {question.tags.length > 0 ? (
                        question.tags.map((tag) => (
                          <Link
                            key={tag}
                            href={`/questions?tag=${encodeURIComponent(tag)}`}
                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-700 hover:bg-indigo-200 dark:hover:bg-indigo-900/70 transition-colors"
                          >
                            {tag}
                          </Link>
                        ))
                      ) : (
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          אין תגיות
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {questionMenuOpen &&
              questionMenuPosition &&
              createPortal(
                <div
                  ref={questionMenuPortalRef}
                  className="fixed min-w-[180px] py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50"
                  style={{
                    top: questionMenuPosition.top,
                    left: questionMenuPosition.left,
                  }}
                >
                  {canEdit && (
                    <button
                      type="button"
                      onClick={handleStartEdit}
                      className="w-full flex items-center gap-2 px-3 py-2 text-right text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Pencil size={16} />
                      ערוך שאלה
                    </button>
                  )}
                  {canRemove && (
                    <button
                      type="button"
                      onClick={() => {
                        setDeletionReason("");
                        setShowRemoveConfirm(true);
                        setQuestionMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-right text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 size={16} />
                      הסר שאלה
                    </button>
                  )}
                  {canRequestRemoval && (
                    <button
                      type="button"
                      onClick={handleOpenRequestRemoval}
                      className="w-full flex items-center gap-2 px-3 py-2 text-right text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <FileQuestion size={16} />
                      בקשת הסרה
                    </button>
                  )}
                  {canViewVotes && (
                    <button
                      type="button"
                      onClick={handleOpenVoteDetails}
                      className="w-full flex items-center gap-2 px-3 py-2 text-right text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Eye size={16} />
                      צפה בהצבעות
                    </button>
                  )}
                </div>,
                document.body,
              )}

            {openAnswerMenuId &&
              answerMenuPosition &&
              (() => {
                const selectedAnswer = answers.find(
                  (a) => a.id === openAnswerMenuId,
                );
                if (!selectedAnswer) return null;
                return createPortal(
                  <div
                    ref={answerMenuPortalRef}
                    className="fixed min-w-[140px] py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50"
                    style={{
                      top: answerMenuPosition.top,
                      left: answerMenuPosition.left,
                    }}
                  >
                    {canViewVotes && (
                      <button
                        type="button"
                        onClick={() =>
                          handleOpenAnswerVoteDetails(selectedAnswer)
                        }
                        className="w-full flex items-center gap-2 px-3 py-2 text-right text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <Eye size={14} />
                        צפה בהצבעות
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleOpenAnswerReport(selectedAnswer)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-right text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Flag size={14} />
                      דווח
                    </button>
                  </div>,
                  document.body,
                );
              })()}

            {/* Answers Section */}
            <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2">
                <MessageCircle
                  size={22}
                  className="text-indigo-500 dark:text-indigo-400"
                />
                תשובות ({answerThreads.length})
                {answers.length > answerThreads.length && (
                  <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                    ({answers.length} כולל תגובות)
                  </span>
                )}
              </h2>

              {answersLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
                </div>
              ) : answerThreads.length > 0 ? (
                <div className="space-y-2.5 sm:space-y-3">
                  {(() => {
                    const q = question!;
                    function renderAnswerCard(
                      node: Answer,
                      {
                        compact = false,
                        anchorId,
                        replyTargetUsername = null,
                      }: {
                        compact?: boolean;
                        anchorId?: string;
                        replyTargetUsername?: string | null;
                      } = {},
                    ): React.ReactNode {
                      const isOP = node.author.id === q.author.id;
                      return (
                        <div
                          id={anchorId}
                          className={`relative rounded-xl border transition-all ${
                            compact
                              ? "p-2.5 sm:p-3 bg-gray-50/80 dark:bg-gray-700/55 border-gray-200/60 dark:border-gray-600/60"
                              : "p-3"
                          } ${
                            node.isAccepted && !compact
                              ? "bg-green-50/60 dark:bg-green-900/20 border-green-200 dark:border-green-700/50"
                              : !compact
                                ? "bg-white/60 dark:bg-gray-700/50 border-gray-200/50 dark:border-gray-600/50"
                                : ""
                          }`}
                        >
                          <div
                            className={`flex items-start ${compact ? "gap-1.5 sm:gap-2" : "gap-2"}`}
                          >
                            <div
                              className={`flex flex-col items-center gap-0.5 flex-shrink-0 ${compact ? "min-w-[27px] sm:min-w-[29px]" : "min-w-[33px]"}`}
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  void handleAnswerVote(node.id, 1)
                                }
                                disabled={
                                  !!updatingVoteIds[`answer:${node.id}`]
                                }
                                className="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors disabled:opacity-50"
                              >
                                <ArrowUp
                                  size={compact ? 19 : 20}
                                  className={
                                    node.userVote === 1
                                      ? "text-indigo-600 dark:text-indigo-400"
                                      : "text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400"
                                  }
                                />
                              </button>
                              <span className="font-bold text-gray-700 dark:text-gray-200 text-sm">
                                {node.votes}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  void handleAnswerVote(node.id, -1)
                                }
                                disabled={
                                  !!updatingVoteIds[`answer:${node.id}`]
                                }
                                className="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors disabled:opacity-50"
                              >
                                <ArrowDown
                                  size={compact ? 19 : 20}
                                  className={
                                    node.userVote === -1
                                      ? "text-indigo-600 dark:text-indigo-400"
                                      : "text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400"
                                  }
                                />
                              </button>
                              {node.isAccepted && !compact && (
                                <CheckCircle
                                  size={16}
                                  className="text-green-600 dark:text-green-400 mt-0.5"
                                  fill="currentColor"
                                />
                              )}
                            </div>
                            <div
                              className={`flex-1 min-w-0 ${compact ? "pl-8 sm:pl-9" : "pl-9"}`}
                            >
                              <div
                                className="absolute left-2 top-2"
                                ref={
                                  openAnswerMenuId === node.id
                                    ? answerMenuRef
                                    : undefined
                                }
                              >
                                <button
                                  type="button"
                                  onClick={() =>
                                    setOpenAnswerMenuId((currentId) =>
                                      currentId === node.id ? null : node.id,
                                    )
                                  }
                                  className="p-1 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                                  aria-label="תפריט תשובה"
                                >
                                  <MoreVertical size={compact ? 14 : 16} />
                                </button>
                              </div>
                              <div
                                className={`text-gray-700 dark:text-gray-200 leading-relaxed whitespace-pre-wrap ${compact ? "mb-1.5 sm:mb-2" : "mb-2"}`}
                              >
                                {replyTargetUsername && (
                                  <span
                                    className="inline-flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500"
                                    style={{ transform: "translateY(1px)" }}
                                  >
                                    <CornerDownLeft size={12} />
                                    {replyTargetUsername}{" "}
                                  </span>
                                )}
                                {node.content}
                              </div>

                              <div className="relative flex items-center justify-between flex-wrap gap-1.5 mt-1 pt-2">
                                <div
                                  className="absolute top-0 right-0 left-[70px] h-px bg-gray-100 dark:bg-gray-700"
                                  aria-hidden
                                />
                                <div className="absolute left-[-30px] -top-[10px] px-2 bg-white/90 dark:bg-gray-800/90 text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                                  <Clock size={12} />
                                  <span>{timeAgo(node.createdAt)}</span>
                                </div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {node.author.username ||
                                  user?.id === node.author.id ? (
                                    <Link
                                      href={
                                        user?.id === node.author.id
                                          ? "/profile"
                                          : `/profile/${encodeURIComponent(node.author.username)}`
                                      }
                                      className="flex items-center gap-2 hover:opacity-90 transition-opacity"
                                    >
                                      <AnswerCardAuthorAvatar
                                        avatarUrl={node.author.avatar_url}
                                        username={node.author.username}
                                        isOnline={isOnline(
                                          node.author.lastSeenAt,
                                        )}
                                      />
                                      <div className="flex items-center gap-2">
                                        <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm">
                                          {node.author.username ||
                                            (user?.id === node.author.id
                                              ? profile?.username
                                              : null)}
                                        </span>
                                        <span className="text-xs text-gray-400 dark:text-gray-500">
                                          {node.author.reputation} מוניטין
                                        </span>
                                      </div>
                                    </Link>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <AnswerCardAuthorAvatar
                                        avatarUrl={node.author.avatar_url}
                                        username={node.author.username}
                                        isOnline={isOnline(
                                          node.author.lastSeenAt,
                                        )}
                                      />
                                      <div className="flex items-center gap-2">
                                        <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm">
                                          {node.author.username}
                                        </span>
                                        <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                                          <Shield size={10} />
                                          {node.author.reputation} מוניטין
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                  {isOP && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-200 border border-blue-200 dark:border-blue-700">
                                      השואל
                                    </span>
                                  )}
                                  {node.isEdited && (
                                    <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-0.5">
                                      <Pencil size={10} />
                                      נערך
                                    </span>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!user) {
                                      handleAuthAction("login");
                                      return;
                                    }
                                    openReplyToAnswer(node.id);
                                  }}
                                  className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium flex-shrink-0 ms-auto mt-3 ml-[-20px]"
                                >
                                  <MessageSquare size={compact ? 12 : 14} />
                                  הגב
                                </button>
                              </div>

                              {replyingToId === node.id && (
                                <form
                                  onSubmit={(e) =>
                                    handleSubmitReply(e, node.id)
                                  }
                                  className={`hidden md:block border-t border-gray-100 dark:border-gray-700 ${compact ? "mt-3 pt-3" : "mt-4 pt-4"}`}
                                >
                                  <textarea
                                    value={replyContent}
                                    onChange={(e) =>
                                      setReplyContent(e.target.value)
                                    }
                                    placeholder={`מגיב ל-${node.author.username || "משתמש"}`}
                                    className="w-full min-h-[80px] p-3 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 resize-none"
                                    autoFocus
                                    required
                                  />
                                  {replyError && (
                                    <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-300 text-sm">
                                      {replyError}
                                    </div>
                                  )}
                                  <div className="flex items-center gap-2 mt-2">
                                    <button
                                      type="submit"
                                      disabled={
                                        !replyContent.trim() || submittingReply
                                      }
                                      className="flex items-center gap-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      {submittingReply ? (
                                        <>
                                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                          שולח...
                                        </>
                                      ) : (
                                        <>
                                          <ChevronUp size={14} />
                                          שלח תגובה
                                        </>
                                      )}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setReplyingToId(null);
                                        setReplyContent("");
                                        setReplyError(null);
                                      }}
                                      className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg text-sm"
                                    >
                                      ביטול
                                    </button>
                                  </div>
                                </form>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    }

                    function renderReplyItem(
                      reply: ThreadReply,
                      isLastReply: boolean,
                    ): React.ReactNode {
                      return (
                        <div key={reply.id} className="relative pr-2.5 sm:pr-3">
                          <div
                            aria-hidden="true"
                            className={`pointer-events-none absolute right-0 w-px rounded-full bg-indigo-200/80 dark:bg-indigo-800/75 ${
                              isLastReply
                                ? "top-0 h-4"
                                : "top-0 -bottom-2 sm:-bottom-2.5"
                            }`}
                          />
                          <div
                            aria-hidden="true"
                            className="pointer-events-none absolute right-0 top-4 h-px w-2.5 sm:w-3 bg-indigo-200/80 dark:bg-indigo-800/75"
                          />
                          {renderAnswerCard(reply, {
                            compact: true,
                            anchorId: `answer-${reply.id}`,
                            replyTargetUsername: reply.replyTargetUsername,
                          })}
                        </div>
                      );
                    }

                    function renderTopLevelAnswer(
                      thread: AnswerThread,
                    ): React.ReactNode {
                      return (
                        <div
                          key={thread.root.id}
                          className="space-y-2 sm:space-y-2.5"
                        >
                          {renderAnswerCard(thread.root, {
                            anchorId: `answer-${thread.root.id}`,
                          })}
                          {thread.replies.length > 0 && (
                            <div className="relative mr-3 sm:mr-4 md:mr-5 space-y-2 sm:space-y-2.5">
                              {thread.replies.map((reply, index) =>
                                renderReplyItem(
                                  reply,
                                  index === thread.replies.length - 1,
                                ),
                              )}
                            </div>
                          )}
                        </div>
                      );
                    }

                    return answerThreads.map((thread) =>
                      renderTopLevelAnswer(thread),
                    );
                  })()}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-400 dark:text-gray-500">
                  <MessageCircle
                    size={36}
                    className="mx-auto mb-2 opacity-50"
                  />
                  <p className="text-gray-500 dark:text-gray-400">
                    אין תשובות עדיין. היה הראשון לענות!
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </main>

      {/* Mobile reply textfield island */}
      {replyingToId && (
        <div className="md:hidden fixed inset-x-0 bottom-0 z-50 px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.1)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
          <form
            onSubmit={(e) => handleSubmitReply(e, replyingToId)}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-1.5">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder={`מגיב ל-${answers.find((a) => a.id === replyingToId)?.author?.username || "משתמש"}`}
                className="w-full min-h-[80px] px-3 pt-3 pb-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 resize-none"
                autoFocus
                required
              />
              {replyError && (
                <div className="p-2 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
                  {replyError}
                </div>
              )}
            </div>
            <div className="flex w-full min-w-0 items-center justify-between gap-2">
              <div className="flex min-w-0 max-w-[min(100%,12rem)] items-center gap-2">
                {profile?.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt={profile?.username ?? ""}
                    width={36}
                    height={36}
                    className="h-9 w-9 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50">
                    <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                      {profile?.username?.charAt(0).toUpperCase() ?? ""}
                    </span>
                  </div>
                )}
                <span className="truncate text-xs font-semibold text-gray-800 dark:text-gray-100">
                  {profile?.username ?? "משתמש"}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="submit"
                  disabled={!replyContent.trim() || submittingReply}
                  className="inline-flex shrink-0 items-center justify-center gap-1 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submittingReply ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      שולח...
                    </>
                  ) : (
                    <>
                      <ChevronUp size={14} strokeWidth={2.25} />
                      הגב
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setReplyingToId(null);
                    setReplyContent("");
                    setReplyError(null);
                  }}
                  className="shrink-0 px-3 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg text-xs font-medium"
                >
                  ביטול
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Remove question confirmation */}
      {showRemoveConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          dir="rtl"
        >
          <div
            className="absolute inset-0 bg-black/40 dark:bg-black/60"
            onClick={() => !removing && setShowRemoveConfirm(false)}
          />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 max-w-md w-full border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
              הסרת שאלה
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-3">
              האם אתה בטוח שברצונך להסיר את השאלה? יוצרה יקבל הודעה הכוללת את
              סיבת ההסרה ויוכל להגיש ערעור.
            </p>
            <form onSubmit={handleConfirmRemove} className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                סיבת ההסרה (חובה)
              </label>
              <textarea
                value={deletionReason}
                onChange={(e) => setDeletionReason(e.target.value)}
                className="w-full min-h-[80px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-y"
                placeholder="נא להסביר מדוע השאלה מוסרת..."
                required
              />
            </form>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => !removing && setShowRemoveConfirm(false)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg font-medium"
              >
                ביטול
              </button>
              <button
                type="button"
                onClick={() => handleConfirmRemove()}
                disabled={removing || !deletionReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                {removing ? "מסיר..." : "הסר שאלה"}
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request removal modal (שומר סף) */}
      {showRequestRemovalModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          dir="rtl"
        >
          <div
            className="absolute inset-0 bg-black/40 dark:bg-black/60"
            onClick={() =>
              !submittingRemovalRequest && setShowRequestRemovalModal(false)
            }
          />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 max-w-md w-full border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
              בקשת הסרת שאלה
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              בקשתך תישלח לפאנל הניהול. בעלים או ממונה מוסמך יאשרו או ידחו את
              ההסרה.
            </p>
            <form onSubmit={handleSubmitRequestRemoval}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                סיבה (אופציונלי)
              </label>
              <textarea
                value={requestRemovalReason}
                onChange={(e) => setRequestRemovalReason(e.target.value)}
                className="w-full min-h-[80px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-y"
                placeholder="הסבר קצר לבקשת ההסרה..."
              />
              <div className="flex gap-3 justify-end mt-4">
                <button
                  type="button"
                  onClick={() => setShowRequestRemovalModal(false)}
                  disabled={submittingRemovalRequest}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg font-medium"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  disabled={submittingRemovalRequest}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
                >
                  {submittingRemovalRequest ? "שולח..." : "שלח בקשת הסרה"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showVoteDetailsModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          dir="rtl"
        >
          <div
            className="absolute inset-0 bg-black/40 dark:bg-black/60"
            onClick={() => setShowVoteDetailsModal(false)}
          />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 max-w-lg w-full border border-gray-200 dark:border-gray-700 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                פרטי הצבעות
              </h3>
              <button
                type="button"
                onClick={() => setShowVoteDetailsModal(false)}
                className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X size={18} />
              </button>
            </div>

            {voteDetailsLoading ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 dark:border-indigo-400" />
              </div>
            ) : voteDetailsError ? (
              <div className="text-sm text-red-600 dark:text-red-400">
                {voteDetailsError}
              </div>
            ) : (
              <div className="space-y-6">
                <section>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    הצבעות בעד ({voteDetails.upvotes.length})
                  </h4>
                  <div className="space-y-2">
                    {voteDetails.upvotes.length > 0 ? (
                      voteDetails.upvotes.map((entry) => (
                        <div
                          key={`upvote-${entry.userId}`}
                          className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm text-gray-700 dark:text-gray-200"
                        >
                          {entry.username}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        אין הצבעות בעד עדיין.
                      </p>
                    )}
                  </div>
                </section>

                <section>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    הצבעות נגד ({voteDetails.downvotes.length})
                  </h4>
                  <div className="space-y-2">
                    {voteDetails.downvotes.length > 0 ? (
                      voteDetails.downvotes.map((entry) => (
                        <div
                          key={`downvote-${entry.userId}`}
                          className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm text-gray-700 dark:text-gray-200"
                        >
                          {entry.username}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        אין הצבעות נגד עדיין.
                      </p>
                    )}
                  </div>
                </section>
              </div>
            )}
          </div>
        </div>
      )}

      {showAnswerVoteDetailsModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          dir="rtl"
        >
          <div
            className="absolute inset-0 bg-black/40 dark:bg-black/60"
            onClick={() => {
              setShowAnswerVoteDetailsModal(false);
              setAnswerVoteDetailsAnswerId(null);
            }}
          />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 max-w-lg w-full border border-gray-200 dark:border-gray-700 max-h-[80vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  פרטי הצבעות לתשובה
                </h3>
                {selectedAnswerForVoteDetails && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 truncate">
                    {selectedAnswerForVoteDetails.content}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAnswerVoteDetailsModal(false);
                  setAnswerVoteDetailsAnswerId(null);
                }}
                className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X size={18} />
              </button>
            </div>

            {answerVoteDetailsLoading ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 dark:border-indigo-400" />
              </div>
            ) : answerVoteDetailsError ? (
              <div className="text-sm text-red-600 dark:text-red-400">
                {answerVoteDetailsError}
              </div>
            ) : (
              <div className="space-y-6">
                <section>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    הצבעות בעד ({answerVoteDetails.upvotes.length})
                  </h4>
                  <div className="space-y-2">
                    {answerVoteDetails.upvotes.length > 0 ? (
                      answerVoteDetails.upvotes.map((entry) => (
                        <div
                          key={`answer-upvote-${entry.userId}`}
                          className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm text-gray-700 dark:text-gray-200"
                        >
                          {entry.username}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        אין הצבעות בעד עדיין.
                      </p>
                    )}
                  </div>
                </section>

                <section>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    הצבעות נגד ({answerVoteDetails.downvotes.length})
                  </h4>
                  <div className="space-y-2">
                    {answerVoteDetails.downvotes.length > 0 ? (
                      answerVoteDetails.downvotes.map((entry) => (
                        <div
                          key={`answer-downvote-${entry.userId}`}
                          className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm text-gray-700 dark:text-gray-200"
                        >
                          {entry.username}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        אין הצבעות נגד עדיין.
                      </p>
                    )}
                  </div>
                </section>
              </div>
            )}
          </div>
        </div>
      )}

      {reportingAnswer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          dir="rtl"
        >
          <div
            className="absolute inset-0 bg-black/40 dark:bg-black/60"
            onClick={() => {
              if (!reportSubmitting) {
                setReportingAnswer(null);
                setReportReason("");
                setReportError("");
              }
            }}
          />
          <form
            onSubmit={handleSubmitAnswerReport}
            className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 max-w-md w-full border border-gray-200 dark:border-gray-700"
          >
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">
              דווח על תשובה
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
                  setReportingAnswer(null);
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

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSwitchToRegister={() => {
          setIsLoginModalOpen(false);
          setIsRegisterModalOpen(true);
        }}
        canClose={!isGuest}
      />
      <RegisterModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSwitchToLogin={() => {
          setIsRegisterModalOpen(false);
          setIsLoginModalOpen(true);
        }}
      />

      {/* Answer Modal (matches create status popout) */}
      {isAnswerPanelOpen && (
        <>
          {/* Desktop modal */}
          <div
            className="hidden md:flex fixed inset-0 z-50 items-center justify-center p-4"
            dir="rtl"
          >
            <div
              className="absolute inset-0 bg-black/40 dark:bg-black/60"
              onClick={() => setIsAnswerPanelOpen(false)}
            />
            <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden rounded-2xl shadow-2xl bg-white text-gray-900 dark:bg-slate-900 dark:text-gray-100">
              <form
                onSubmit={handleSubmitAnswer}
                className="flex-1 flex flex-col min-h-0"
              >
                <div className="relative flex-1 flex flex-col min-h-0 bg-gray-50 dark:bg-slate-800">
                  <textarea
                    value={answerContent}
                    onChange={(e) => setAnswerContent(e.target.value)}
                    placeholder="תשובתך..."
                    className="w-full flex-1 px-6 pt-6 pb-8 bg-transparent text-gray-900 placeholder-gray-500 dark:text-gray-100 dark:placeholder-gray-400 border-none outline-none resize-none min-h-[320px]"
                    autoFocus
                    required
                  />
                  <span className="absolute bottom-2 left-6 text-xs text-gray-500 dark:text-slate-400 pointer-events-none">
                    {answerContent.length} תווים
                  </span>
                </div>

                {answerError && (
                  <div className="mx-6 mb-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-red-700 text-sm dark:bg-red-900/40 dark:border-red-700 dark:text-red-100">
                    {answerError}
                  </div>
                )}

                <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 bg-gray-50 dark:border-slate-700/80 dark:bg-slate-900/90">
                  <button
                    type="button"
                    onClick={() => setIsAnswerPanelOpen(false)}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 dark:text-slate-300 dark:hover:text-white"
                  >
                    ביטול
                  </button>
                  <button
                    type="submit"
                    disabled={!answerContent.trim() || submittingAnswer}
                    className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submittingAnswer ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        שולח...
                      </>
                    ) : (
                      "פרסום תשובה"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Mobile bottom sheet */}
          <div className="md:hidden fixed inset-x-0 bottom-0 z-50 px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.1)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
            <form onSubmit={handleSubmitAnswer} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <textarea
                  value={answerContent}
                  onChange={(e) => setAnswerContent(e.target.value)}
                  placeholder="תשובתך..."
                  className="w-full min-h-[80px] px-3 pt-3 pb-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 resize-none"
                  autoFocus
                  required
                />
                {answerError && (
                  <div className="p-2 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
                    {answerError}
                  </div>
                )}
              </div>
              <div className="flex w-full min-w-0 items-center justify-between gap-2">
                <div className="flex min-w-0 max-w-[min(100%,12rem)] items-center gap-2">
                  {profile?.avatar_url ? (
                    <Image
                      src={profile.avatar_url}
                      alt={profile?.username ?? ""}
                      width={36}
                      height={36}
                      className="h-9 w-9 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50">
                      <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                        {profile?.username?.charAt(0).toUpperCase() ?? ""}
                      </span>
                    </div>
                  )}
                  <span className="truncate text-xs font-semibold text-gray-800 dark:text-gray-100">
                    {profile?.username ?? "משתמש"}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="submit"
                    disabled={!answerContent.trim() || submittingAnswer}
                    className="inline-flex shrink-0 items-center justify-center gap-1 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submittingAnswer ? (
                      <>
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        שולח...
                      </>
                    ) : (
                      <>
                        <ChevronUp size={14} strokeWidth={2.25} />
                        שלח
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAnswerPanelOpen(false)}
                    className="shrink-0 px-3 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg text-xs font-medium"
                  >
                    ביטול
                  </button>
                </div>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
