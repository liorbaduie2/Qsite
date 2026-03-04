//app/profile/page.tsx - Updated for Dark/Light Mode
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  ArrowRight,
  MapPin,
  Globe,
  Calendar,
  MessageSquare,
  HelpCircle,
  Edit3,
  Save,
  X,
  Camera,
  Music,
  Star,
  Heart,
  Trash2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { SimpleThemeToggle } from "../components/SimpleThemeToggle";
import { useAuth } from "../components/AuthProvider";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  SkeletonBlock,
  SkeletonCircle,
  SkeletonText,
} from "../components/ui/Skeleton";
import { formatRelativeTime } from "../../lib/utils";
import { useInfiniteScroll } from "../hooks/useInfiniteScroll";
import { RoleBadge } from "../components/RoleBadge";

interface ProfileQuestion {
  id: string;
  title: string;
  created_at: string;
}

interface ProfileReply {
  id: string;
  content: string;
  created_at: string;
  question_id: string;
  question_title: string | null;
}

interface ProfileComment {
  id: string;
  content: string;
  created_at: string;
  author_id: string;
  author_username: string | null;
  author_avatar_url: string | null;
}

// Helper function to determine playlist icon and text
const getPlaylistInfo = (url: string | undefined) => {
  if (!url) {
    return {
      icon: <Globe size={18} className="text-gray-400 dark:text-gray-500" />,
      text: "",
    };
  }
  if (url.includes("spotify.com")) {
    return {
      icon: <Music size={18} className="text-green-500" />,
      text: "פלייליסט ספוטיפיי",
    };
  }
  if (url.includes("music.apple.com")) {
    return {
      icon: <Music size={18} className="text-pink-500" />,
      text: "פלייליסט אפל מיוזיק",
    };
  }
  return {
    icon: <Globe size={18} className="text-gray-400 dark:text-gray-500" />,
    text: url,
  };
};

interface ReputationArcProps {
  value: number;
  max?: number;
  size?: number;
}

function getReputationVisuals(value: number) {
  if (value < 10) {
    return {
      textClass: "text-red-500 dark:text-red-400",
      strokeColor: "#ef4444",
    };
  }
  if (value < 30) {
    return {
      textClass: "text-yellow-500 dark:text-yellow-400",
      strokeColor: "#eab308",
    };
  }
  if (value < 40) {
    return {
      textClass: "text-orange-500 dark:text-orange-400",
      strokeColor: "#f97316",
    };
  }
  if (value < 80) {
    return {
      textClass: "text-green-500 dark:text-green-400",
      strokeColor: "#22c55e",
    };
  }
  return {
    textClass: "text-fuchsia-500 dark:text-fuchsia-400",
    strokeColor: "#d946ef",
  };
}

function ReputationArc({ value, max = 100, size = 120 }: ReputationArcProps) {
  const clamped = Math.max(0, Math.min(value, max));
  const [animatedValue, setAnimatedValue] = useState(0);
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const arcFraction = 0.6; // ~110% of a half-circle
  const arcLength = circumference * arcFraction;
  const progress = animatedValue / max;
  const progressLength = arcLength * progress;
  const gapLength = circumference - arcLength;
  const rotationDegrees = -15.5; // ~3% of a full circle
  const { strokeColor } = getReputationVisuals(clamped);

  useEffect(() => {
    if (clamped === 0) {
      setAnimatedValue(0);
      return;
    }

    let frameId: number;
    const start = performance.now();
    const duration = 700; // ms

    const animate = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / duration);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      setAnimatedValue(clamped * eased);
      if (t < 1) {
        frameId = window.requestAnimationFrame(animate);
      }
    };

    frameId = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frameId);
  }, [clamped]);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <linearGradient
          id="reputation-arc-gradient"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="0%"
        >
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="50%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#fb923c" />
        </linearGradient>
      </defs>
      <g transform={`rotate(${rotationDegrees} ${center} ${center})`}>
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(148, 163, 184, 0.25)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${arcLength} ${gapLength}`}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${progressLength} ${circumference - progressLength}`}
        />
      </g>
    </svg>
  );
}

export default function ProfilePage() {
  const {
    user,
    profile,
    updateProfile,
    loading,
    userPermissions,
    myProfilePreload,
    ensureMyProfilePreload,
  } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    username: "",
    bio: "",
    location: "",
    website: "",
    avatar_url: "",
  });

  const [usernameStatus, setUsernameStatus] = useState<
    "idle" | "checking" | "available" | "taken"
  >("idle");
  const [usernameError, setUsernameError] = useState<string | null>(null);

  const [sharedStatus, setSharedStatus] = useState<{
    id: string;
    content: string;
    createdAt: string;
  } | null>(null);
  const [removingShared, setRemovingShared] = useState(false);
  const [userQuestions, setUserQuestions] = useState<ProfileQuestion[]>([]);
  const [userReplies, setUserReplies] = useState<ProfileReply[]>([]);
  const [profileComments, setProfileComments] = useState<ProfileComment[]>([]);
  const [expandedSection, setExpandedSection] = useState<
    "questions" | "answers" | "likers" | null
  >(null);
  const [likers, setLikers] = useState<
    { id: string; username: string; avatar_url: string | null }[]
  >([]);
  const [questionsTotal, setQuestionsTotal] = useState(0);
  const [repliesTotal, setRepliesTotal] = useState(0);
  const [likersTotal, setLikersTotal] = useState(0);
  const [loadingMoreQuestions, setLoadingMoreQuestions] = useState(false);
  const [loadingMoreReplies, setLoadingMoreReplies] = useState(false);
  const [loadingMoreLikers, setLoadingMoreLikers] = useState(false);
  const [commentsOffset, setCommentsOffset] = useState(0);
  const [commentsTotal, setCommentsTotal] = useState(0);
  const [loadingMoreComments, setLoadingMoreComments] = useState(false);
  const questionsScrollRef = useRef<HTMLDivElement>(null);
  const questionsSentinelRef = useRef<HTMLDivElement>(null);
  const repliesScrollRef = useRef<HTMLDivElement>(null);
  const repliesSentinelRef = useRef<HTMLDivElement>(null);
  const likersScrollRef = useRef<HTMLDivElement>(null);
  const likersSentinelRef = useRef<HTMLDivElement>(null);
  const commentsScrollRef = useRef<HTMLDivElement>(null);
  const commentsSentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
      return;
    }

    if (profile) {
      setEditForm({
        username: profile.username || "",
        bio: profile.bio || "",
        location: profile.location || "",
        website: profile.website || "",
        avatar_url: profile.avatar_url || "",
      });
    }
  }, [user, profile, loading, router]);

  useEffect(() => {
    if (!user) {
      setSharedStatus(null);
      return;
    }
    fetch("/api/status/me")
      .then((res) => res.json())
      .then((data) => {
        const active = data.active?.sharedToProfile ? data.active : null;
        const fromHistory = (data.history || []).find(
          (s: { sharedToProfile: boolean }) => s.sharedToProfile,
        );
        const s = active || fromHistory;
        setSharedStatus(
          s ? { id: s.id, content: s.content, createdAt: s.createdAt } : null,
        );
      })
      .catch(() => setSharedStatus(null));
  }, [user]);

  useEffect(() => {
    if (!user || !profile?.username) return;
    void ensureMyProfilePreload();
  }, [user?.id, profile?.username, ensureMyProfilePreload]);

  useEffect(() => {
    if (!profile?.username) return;
    if (
      !myProfilePreload ||
      myProfilePreload.username !== profile.username ||
      myProfilePreload.status !== "loaded"
    ) {
      return;
    }

    setUserQuestions(
      Array.isArray(myProfilePreload.questions)
        ? myProfilePreload.questions
        : [],
    );
    setUserReplies(
      Array.isArray(myProfilePreload.replies) ? myProfilePreload.replies : [],
    );
    setLikers(
      Array.isArray(myProfilePreload.likers) ? myProfilePreload.likers : [],
    );
    setQuestionsTotal(
      typeof myProfilePreload.questions_total === "number"
        ? myProfilePreload.questions_total
        : Array.isArray(myProfilePreload.questions)
          ? myProfilePreload.questions.length
          : 0,
    );
    setRepliesTotal(
      typeof myProfilePreload.replies_total === "number"
        ? myProfilePreload.replies_total
        : Array.isArray(myProfilePreload.replies)
          ? myProfilePreload.replies.length
          : 0,
    );
    setLikersTotal(
      typeof myProfilePreload.likers_total === "number"
        ? myProfilePreload.likers_total
        : Array.isArray(myProfilePreload.likers)
          ? myProfilePreload.likers.length
          : 0,
    );

    const initialComments = Array.isArray(myProfilePreload.comments)
      ? myProfilePreload.comments
      : [];
    setProfileComments(initialComments);
    setCommentsOffset(initialComments.length);
    setCommentsTotal(
      typeof myProfilePreload.comments_total === "number"
        ? myProfilePreload.comments_total
        : initialComments.length,
    );
  }, [profile?.username, myProfilePreload]);

  const removeSharedFromProfile = async () => {
    if (!sharedStatus) return;
    setRemovingShared(true);
    try {
      const res = await fetch(`/api/status/${sharedStatus.id}/share`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ share: false }),
      });
      if (res.ok) setSharedStatus(null);
    } finally {
      setRemovingShared(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
    if (field === "username") {
      setUsernameError(null);
      setUsernameStatus("idle");
    }
  };

  const handleEditToggle = async () => {
    if (isEditing) {
      if (!canSaveProfile || !updateProfile) {
        return;
      }
      const success = await updateProfile(editForm);
      if (success) {
        setIsEditing(false);
      }
    } else {
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    if (profile) {
      setEditForm({
        username: profile.username || "",
        bio: profile.bio || "",
        location: profile.location || "",
        website: profile.website || "",
        avatar_url: profile.avatar_url || "",
      });
    }
    setIsEditing(false);
  };
  const originalUsername = profile?.username || "";
  const currentUsername = editForm.username.trim();
  const isUsernameDirty =
    isEditing &&
    currentUsername.length > 0 &&
    currentUsername !== originalUsername;

  let canChangeUsername = true;
  let nextUsernameChangeDate: Date | null = null;

  if (profile?.last_username_change_at) {
    const lastChange = new Date(profile.last_username_change_at);
    if (!Number.isNaN(lastChange.getTime())) {
      const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
      const diffMs = Date.now() - lastChange.getTime();
      if (diffMs < THIRTY_DAYS_MS) {
        canChangeUsername = false;
        nextUsernameChangeDate = new Date(
          lastChange.getTime() + THIRTY_DAYS_MS,
        );
      }
    }
  }

  const hasUsernameError = !!usernameError || usernameStatus === "taken";
  const isCheckingUsername = usernameStatus === "checking";

  const canSaveProfile =
    !loading &&
    !!profile &&
    !isCheckingUsername &&
    (!isUsernameDirty || (!hasUsernameError && canChangeUsername));

  useEffect(() => {
    if (!isEditing) {
      setUsernameStatus("idle");
      return;
    }

    if (!canChangeUsername) {
      setUsernameStatus("idle");
      return;
    }

    if (!isUsernameDirty) {
      setUsernameStatus("idle");
      return;
    }

    if (currentUsername.length < 3) {
      setUsernameStatus("idle");
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    setUsernameStatus("checking");

    const timeoutId = window.setTimeout(async () => {
      try {
        const res = await fetch("/api/auth/check-availability", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ field: "username", value: currentUsername }),
          signal: controller.signal,
        });

        const text = await res.text();
        let data: { available?: boolean; error?: string; message?: string } =
          {};
        try {
          data = text ? JSON.parse(text) : {};
        } catch {
          if (!cancelled) {
            setUsernameStatus("idle");
            setUsernameError("שגיאה בבדיקת שם משתמש");
          }
          return;
        }

        if (!res.ok) {
          if (!cancelled) {
            setUsernameStatus("idle");
            setUsernameError(data.error || "שגיאה בבדיקת שם משתמש");
          }
          return;
        }

        if (cancelled) return;

        if (data.available) {
          setUsernameStatus("available");
          setUsernameError(null);
        } else {
          setUsernameStatus("taken");
          setUsernameError(data.message || "שם משתמש כבר תפוס");
        }
      } catch (err) {
        if ((err as { name?: string } | undefined)?.name === "AbortError") {
          return;
        }
        if (!cancelled) {
          setUsernameStatus("idle");
          setUsernameError("שגיאת רשת בבדיקת שם משתמש");
        }
      }
    }, 700);

    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [isEditing, canChangeUsername, isUsernameDirty, currentUsername]);

  if (!loading && !user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            לא נמצא פרופיל
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
          >
            חזור לעמוד הבית
          </button>
        </div>
      </div>
    );
  }

  const joinedDate = profile?.created_at || new Date().toISOString();
  const reputation = profile?.reputation ?? 0;
  const { textClass: reputationTextClass } = getReputationVisuals(reputation);
  const preloadForUser =
    myProfilePreload &&
    profile?.username &&
    myProfilePreload.username === profile.username
      ? myProfilePreload
      : null;

  const hasPreloadForCurrentUser =
    !!preloadForUser && preloadForUser.status === "loaded";

  const isSkeleton = loading || !profile || !hasPreloadForCurrentUser;

  const questionsAsked = preloadForUser
    ? preloadForUser.counts.questions_count
    : Math.max(userQuestions.length, profile?.questions_count ?? 0);
  const answersGiven =
    preloadForUser?.counts.answers_count ?? profile?.answers_count ?? 0;
  const profileLikesCount =
    preloadForUser?.counts.profile_likes_count ??
    profile?.profile_likes_count ??
    0;

  const loadMoreQuestions = useCallback(() => {
    if (
      !profile?.username ||
      loadingMoreQuestions ||
      userQuestions.length >= questionsTotal
    )
      return;
    setLoadingMoreQuestions(true);
    fetch(
      `/api/profile/${encodeURIComponent(profile.username)}/questions?limit=20&offset=${userQuestions.length}`,
    )
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.questions?.length) {
          setUserQuestions((prev) => [...prev, ...data.questions]);
        }
      })
      .finally(() => setLoadingMoreQuestions(false));
  }, [
    profile?.username,
    loadingMoreQuestions,
    userQuestions.length,
    questionsTotal,
  ]);

  const loadMoreReplies = useCallback(() => {
    if (
      !profile?.username ||
      loadingMoreReplies ||
      userReplies.length >= repliesTotal
    )
      return;
    setLoadingMoreReplies(true);
    fetch(
      `/api/profile/${encodeURIComponent(profile.username)}/replies?limit=20&offset=${userReplies.length}`,
    )
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.replies?.length) {
          setUserReplies((prev) => [...prev, ...data.replies]);
        }
      })
      .finally(() => setLoadingMoreReplies(false));
  }, [profile?.username, loadingMoreReplies, userReplies.length, repliesTotal]);

  const loadMoreLikers = useCallback(() => {
    if (!profile?.username || loadingMoreLikers || likers.length >= likersTotal)
      return;
    setLoadingMoreLikers(true);
    fetch(
      `/api/profile/${encodeURIComponent(profile.username)}/likes?limit=20&offset=${likers.length}`,
    )
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.likers?.length) {
          setLikers((prev) => [...prev, ...data.likers]);
        }
      })
      .finally(() => setLoadingMoreLikers(false));
  }, [profile?.username, loadingMoreLikers, likers.length, likersTotal]);

  const loadMoreComments = useCallback(() => {
    if (
      !profile?.username ||
      loadingMoreComments ||
      commentsOffset >= commentsTotal
    )
      return;
    setLoadingMoreComments(true);
    fetch(
      `/api/profile/${encodeURIComponent(
        profile.username,
      )}/comments?limit=10&offset=${commentsOffset}`,
    )
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data?.comments) && data.comments.length > 0) {
          setProfileComments((prev) => [...prev, ...data.comments]);
          const nextOffset = commentsOffset + data.comments.length;
          setCommentsOffset(nextOffset);
          if (typeof data.total === "number") {
            setCommentsTotal(data.total);
          }
        }
      })
      .finally(() => setLoadingMoreComments(false));
  }, [profile?.username, loadingMoreComments, commentsOffset, commentsTotal]);

  useInfiniteScroll(questionsScrollRef, questionsSentinelRef, {
    hasMore: userQuestions.length < questionsTotal,
    loading: loadingMoreQuestions,
    loadMore: loadMoreQuestions,
    enabled: expandedSection === "questions",
  });
  useInfiniteScroll(repliesScrollRef, repliesSentinelRef, {
    hasMore: userReplies.length < repliesTotal,
    loading: loadingMoreReplies,
    loadMore: loadMoreReplies,
    enabled: expandedSection === "answers",
  });
  useInfiniteScroll(likersScrollRef, likersSentinelRef, {
    hasMore: likers.length < likersTotal,
    loading: loadingMoreLikers,
    loadMore: loadMoreLikers,
    enabled: expandedSection === "likers",
  });

  useInfiniteScroll(commentsScrollRef, commentsSentinelRef, {
    hasMore: commentsOffset < commentsTotal,
    loading: loadingMoreComments,
    loadMore: loadMoreComments,
    enabled: !isSkeleton,
  });

  const playlistInfo = getPlaylistInfo(
    isEditing ? editForm.website : profile?.website,
  );

  return (
    <div
      className="min-h-screen bg-gray-50/50 dark:bg-[#0B1120] pb-12"
      dir="rtl"
    >
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors font-medium"
            >
              <ArrowRight size={20} />
              <span>חזור לעמוד הבית</span>
            </button>
            <SimpleThemeToggle size="sm" />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Sidebar (Left in LTR, Right visually in RTL) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200/80 dark:border-gray-800 overflow-hidden relative">
              {/* Cover Photo */}
              <div className="h-32 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 dark:from-indigo-600 dark:via-purple-600 dark:to-pink-600">
                {isSkeleton && (
                  <div className="w-full h-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
                )}
              </div>

              <div className="px-6 pb-6 relative">
                {/* Profile Header (Avatar + Arc overlap) */}
                <div className="flex justify-center -mt-16 mb-4">
                  <div
                    className="relative bg-white dark:bg-gray-900 rounded-full p-1"
                    style={{ width: 132, height: 132 }}
                  >
                    {isSkeleton ? (
                      <SkeletonCircle className="w-full h-full border-4 border-white dark:border-gray-900 shadow-md" />
                    ) : (
                      <>
                        <div className="absolute inset-1">
                          <ReputationArc value={reputation} size={124} />
                        </div>
                        <div className="absolute inset-4 flex items-center justify-center">
                          <div className="relative">
                            {profile?.avatar_url ? (
                              <Image
                                src={profile.avatar_url}
                                alt={profile?.username || ""}
                                width={96}
                                height={96}
                                className="w-[100px] h-[100px] rounded-full object-cover border-4 border-white dark:border-gray-900 shadow-sm"
                              />
                            ) : (
                              <div className="w-[100px] h-[100px] bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 rounded-full flex items-center justify-center border-4 border-white dark:border-gray-900 shadow-sm">
                                <span className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">
                                  {profile?.username
                                    ? profile.username.charAt(0).toUpperCase()
                                    : ""}
                                </span>
                              </div>
                            )}
                            {isEditing && (
                              <button
                                className="absolute bottom-0 right-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center hover:bg-indigo-700 transition-colors shadow-md border-2 border-white dark:border-gray-900"
                                title="עדכן תמונת פרופיל"
                              >
                                <Camera size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="text-center mb-6">
                  {isSkeleton ? (
                    <div className="space-y-3">
                      <SkeletonText className="w-40 mx-auto h-7" />
                      <SkeletonText className="w-24 mx-auto h-5" />
                    </div>
                  ) : (
                    <>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                        {profile?.full_name || profile?.username || ""}
                      </h2>
                      {!isEditing && (
                        <div className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center justify-center gap-1.5 mb-2">
                          <span>מוניטין</span>
                          <span
                            className={`${reputationTextClass} font-bold px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-full`}
                          >
                            {reputation}
                          </span>
                        </div>
                      )}

                      {!isSkeleton &&
                        userPermissions &&
                        userPermissions.role !== "user" &&
                        !userPermissions.is_hidden && (
                          <div className="mt-2 flex justify-center">
                            <RoleBadge
                              role={userPermissions.role}
                              roleHebrew={userPermissions.role_hebrew}
                              size="sm"
                            />
                          </div>
                        )}
                    </>
                  )}
                </div>

                {/* Edit Mode vs View Mode */}
                {isEditing ? (
                  <div className="space-y-4 mb-6">
                    <div className="relative">
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        שם משתמש
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={editForm.username}
                          onChange={(e) =>
                            handleInputChange("username", e.target.value)
                          }
                          disabled={!canChangeUsername}
                          className={`w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:border-transparent transition-all ${
                            !canChangeUsername
                              ? "opacity-70 cursor-not-allowed border border-gray-200 dark:border-gray-700"
                              : hasUsernameError
                                ? "border border-red-300 dark:border-red-500/50 bg-red-50/50 dark:bg-red-900/10 focus:ring-red-500"
                                : "border border-gray-200 dark:border-gray-700 focus:ring-indigo-500"
                          } pr-4`}
                        />
                        {canChangeUsername && usernameStatus === "checking" && (
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <SkeletonCircle className="w-5 h-5" />
                          </span>
                        )}
                        {canChangeUsername &&
                          usernameStatus === "available" && (
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500">
                              <CheckCircle2 size={18} />
                            </span>
                          )}
                        {canChangeUsername && usernameStatus === "taken" && (
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-red-500">
                            <AlertCircle size={18} />
                          </span>
                        )}
                      </div>
                      {canChangeUsername && usernameError && (
                        <p className="mt-1.5 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                          <AlertCircle size={12} /> {usernameError}
                        </p>
                      )}
                      {!canChangeUsername && nextUsernameChangeDate && (
                        <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400">
                          ניתן לשנות שוב ב־
                          {nextUsernameChangeDate.toLocaleDateString("he-IL")}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        ביוגרפיה
                      </label>
                      <textarea
                        value={editForm.bio}
                        onChange={(e) =>
                          handleInputChange("bio", e.target.value)
                        }
                        placeholder="ספר קצת על עצמך..."
                        rows={3}
                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-gray-900 dark:text-white transition-all"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    {!isSkeleton && profile?.bio && (
                      <div className="mb-6">
                        <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                          {profile.bio}
                        </p>
                      </div>
                    )}

                    {!isSkeleton && sharedStatus && (
                      <div className="mb-6 p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/10 rounded-xl border border-amber-200/60 dark:border-amber-700/30 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-1 h-full bg-amber-400 dark:bg-amber-500" />
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-sm font-semibold">
                            <Star size={16} className="fill-current" />
                            <span>סטטוס נעוץ</span>
                          </div>
                          <button
                            type="button"
                            onClick={removeSharedFromProfile}
                            disabled={removingShared}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-xs px-2 py-1 rounded-md bg-white/60 hover:bg-white dark:bg-gray-800/60 dark:hover:bg-gray-800 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-700/50 disabled:opacity-50"
                          >
                            {removingShared ? "מסיר..." : "הסר"}
                          </button>
                        </div>
                        <p className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed">
                          {sharedStatus.content}
                        </p>
                        <p className="text-[11px] text-amber-600/70 dark:text-amber-400/60 mt-3 font-medium">
                          {formatRelativeTime(sharedStatus.createdAt)}
                        </p>
                      </div>
                    )}
                  </>
                )}

                {/* Profile Details List */}
                <div className="space-y-4 py-4 border-t border-gray-100 dark:border-gray-800">
                  {isSkeleton ? (
                    [1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-3">
                        <SkeletonCircle className="w-8 h-8 rounded-lg" />
                        <SkeletonText className="w-32 h-4" />
                      </div>
                    ))
                  ) : (
                    <>
                      {(profile?.location || isEditing) && (
                        <div className="flex items-center gap-3 text-sm">
                          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                            <MapPin size={16} />
                          </div>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editForm.location}
                              onChange={(e) =>
                                handleInputChange("location", e.target.value)
                              }
                              placeholder="מיקום (אופציונלי)"
                              className="flex-1 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-white"
                            />
                          ) : (
                            <span className="text-gray-700 dark:text-gray-300 font-medium">
                              {profile?.location}
                            </span>
                          )}
                        </div>
                      )}

                      {(profile?.website || isEditing) && (
                        <div className="flex items-center gap-3 text-sm">
                          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-800">
                            {playlistInfo.icon}
                          </div>
                          {isEditing ? (
                            <input
                              type="url"
                              value={editForm.website}
                              onChange={(e) =>
                                handleInputChange("website", e.target.value)
                              }
                              placeholder="קישור לפלייליסט או אתר"
                              className="flex-1 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-white text-left"
                              dir="ltr"
                            />
                          ) : (
                            profile?.website && (
                              <a
                                href={profile.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium hover:underline truncate"
                                dir="ltr"
                              >
                                {playlistInfo.text}
                              </a>
                            )
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-3 text-sm">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                          <Calendar size={16} />
                        </div>
                        <span className="text-gray-700 dark:text-gray-300">
                          הצטרף ב-
                          {new Date(joinedDate).toLocaleDateString("he-IL")}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Profile Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                  {isSkeleton ? (
                    <>
                      <SkeletonBlock className="flex-1 h-11 rounded-xl" />
                      <SkeletonBlock className="w-11 h-11 rounded-xl" />
                    </>
                  ) : (
                    <>
                      <button
                        onClick={handleEditToggle}
                        disabled={
                          isEditing && (!canSaveProfile || isCheckingUsername)
                        }
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 ${
                          isEditing
                            ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            : "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/40"
                        }`}
                      >
                        {isEditing ? <Save size={18} /> : <Edit3 size={18} />}
                        {isEditing ? "שמור שינויים" : "ערוך פרופיל"}
                      </button>
                      {isEditing && (
                        <button
                          onClick={handleCancelEdit}
                          className="px-3.5 py-2.5 text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                          title="ביטול"
                        >
                          <X size={20} />
                        </button>
                      )}
                    </>
                  )}
                </div>

                {/* Reputation Badge */}
                {reputation === 100 && !isSkeleton && (
                  <div className="mt-6 p-4 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/5 dark:to-teal-500/5 border border-emerald-200/50 dark:border-emerald-800/50 rounded-2xl flex items-start gap-3 relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 w-16 h-16 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
                    <Star
                      size={20}
                      className="text-emerald-500 dark:text-emerald-400 mt-0.5 flex-shrink-0"
                    />
                    <div>
                      <p className="text-sm font-bold text-emerald-900 dark:text-emerald-100">
                        מוניטין מושלם (100)
                      </p>
                      <p className="text-[13px] text-emerald-800/80 dark:text-emerald-200/70 mt-1 leading-relaxed">
                        הגעת לרמת האמון הגבוהה ביותר בקהילה. תודה על תרומתך!
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content Area (Right in LTR, Left visually in RTL) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Activity Dashboard */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200/80 dark:border-gray-800 p-4">
              {isSkeleton ? (
                <div className="grid grid-cols-3 gap-4">
                  {[0, 1, 2].map((idx) => (
                    <SkeletonBlock
                      key={idx}
                      className="h-[90px] rounded-xl"
                    />
                  ))}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-4">
                    {/* Questions Card */}
                    <button
                      onClick={() =>
                        setExpandedSection((s) =>
                          s === "questions" ? null : "questions",
                        )
                      }
                      className={`group flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 relative overflow-hidden ${
                        expandedSection === "questions"
                          ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 ring-1 ring-blue-500/20 dark:ring-blue-400/20"
                          : "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-blue-200 dark:hover:border-blue-800 hover:bg-blue-50/50 dark:hover:bg-blue-900/10"
                      }`}
                    >
                      <div
                        className={`text-2xl font-extrabold tabular-nums mb-1 text-center ${
                          expandedSection === "questions"
                            ? "text-blue-700 dark:text-blue-300"
                            : "text-gray-900 dark:text-white"
                        }`}
                      >
                        {Number(questionsAsked)}
                      </div>
                      <div
                        className={`flex items-center justify-center gap-1.5 text-xs font-medium ${
                          expandedSection === "questions"
                            ? "text-blue-600/80 dark:text-blue-400/80"
                            : "text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        <HelpCircle
                          size={18}
                          className={
                            expandedSection === "questions"
                              ? "text-blue-500 dark:text-blue-400"
                              : "text-gray-400 dark:text-gray-500 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors"
                          }
                        />
                        <span>שאלות</span>
                      </div>
                    </button>

                    {/* Answers Card */}
                    <button
                      onClick={() =>
                        setExpandedSection((s) =>
                          s === "answers" ? null : "answers",
                        )
                      }
                      className={`group flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 relative overflow-hidden ${
                        expandedSection === "answers"
                          ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 ring-1 ring-emerald-500/20 dark:ring-emerald-400/20"
                          : "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-emerald-200 dark:hover:border-emerald-800 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10"
                      }`}
                    >
                      <div
                        className={`text-2xl font-extrabold tabular-nums mb-1 text-center ${
                          expandedSection === "answers"
                            ? "text-emerald-700 dark:text-emerald-300"
                            : "text-gray-900 dark:text-white"
                        }`}
                      >
                        {answersGiven}
                      </div>
                      <div
                        className={`flex items-center justify-center gap-1.5 text-xs font-medium ${
                          expandedSection === "answers"
                            ? "text-emerald-600/80 dark:text-emerald-400/80"
                            : "text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        <MessageSquare
                          size={18}
                          className={
                            expandedSection === "answers"
                              ? "text-emerald-500 dark:text-emerald-400"
                              : "text-gray-400 dark:text-gray-500 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors"
                          }
                        />
                        <span>תשובות</span>
                      </div>
                    </button>

                    {/* Likers Card */}
                    <button
                      onClick={() =>
                        setExpandedSection((s) =>
                          s === "likers" ? null : "likers",
                        )
                      }
                      className={`group flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 relative overflow-hidden ${
                        expandedSection === "likers"
                          ? "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 ring-1 ring-purple-500/20 dark:ring-purple-400/20"
                          : "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-purple-200 dark:hover:border-purple-800 hover:bg-purple-50/50 dark:hover:bg-purple-900/10"
                      }`}
                    >
                      <div
                        className={`text-2xl font-extrabold tabular-nums mb-1 text-center ${
                          expandedSection === "likers"
                            ? "text-purple-700 dark:text-purple-300"
                            : "text-gray-900 dark:text-white"
                        }`}
                      >
                        {profileLikesCount}
                      </div>
                      <div
                        className={`flex items-center justify-center gap-1.5 text-xs font-medium ${
                          expandedSection === "likers"
                            ? "text-purple-600/80 dark:text-purple-400/80"
                            : "text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        <Heart
                          size={18}
                          className={
                            expandedSection === "likers"
                              ? "text-purple-500 dark:text-purple-400"
                              : "text-gray-400 dark:text-gray-500 group-hover:text-purple-500 dark:group-hover:text-purple-400 transition-colors"
                          }
                        />
                        <span>לייקים</span>
                      </div>
                    </button>
                  </div>

                  {/* Expanded Activity Area */}
                  <div
                    className={`transition-all duration-500 ease-in-out overflow-hidden ${
                      expandedSection
                        ? "max-h-[500px] opacity-100 mt-6"
                        : "max-h-0 opacity-0 mt-0"
                    }`}
                  >
                    <div
                      className={`rounded-2xl border p-1 ${
                        expandedSection === "questions"
                          ? "bg-blue-50/50 border-blue-100 dark:bg-blue-900/10 dark:border-blue-900/30"
                          : expandedSection === "answers"
                            ? "bg-emerald-50/50 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-900/30"
                            : "bg-purple-50/50 border-purple-100 dark:bg-purple-900/10 dark:border-purple-900/30"
                      }`}
                    >
                      {expandedSection === "questions" && (
                        <div
                          ref={questionsScrollRef}
                          className="h-[300px] overflow-y-auto p-4 custom-scrollbar"
                        >
                          <h4 className="text-sm font-bold text-blue-900 dark:text-blue-300 mb-4 flex items-center gap-2">
                            <HelpCircle size={16} /> השאלות שלי
                          </h4>
                          {userQuestions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-40 text-blue-800/60 dark:text-blue-200/50">
                              <p className="text-sm">אין שאלות עדיין.</p>
                            </div>
                          ) : (
                            <ul className="space-y-3">
                              {userQuestions.map((q) => (
                                <li
                                  key={q.id}
                                  className="bg-white dark:bg-gray-800 p-3.5 rounded-xl shadow-sm border border-blue-100 dark:border-blue-800/30 hover:shadow-md transition-shadow"
                                >
                                  <Link
                                    href={`/questions/${q.id}`}
                                    className="text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 font-medium line-clamp-2"
                                  >
                                    {q.title}
                                  </Link>
                                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-2 block">
                                    {formatRelativeTime(q.created_at)}
                                  </span>
                                </li>
                              ))}
                              <div ref={questionsSentinelRef} className="h-4" />
                              {loadingMoreQuestions && (
                                <p className="text-sm text-center text-blue-600/60 dark:text-blue-400/60 py-2">
                                  טוען...
                                </p>
                              )}
                            </ul>
                          )}
                        </div>
                      )}

                      {expandedSection === "answers" && (
                        <div
                          ref={repliesScrollRef}
                          className="h-[300px] overflow-y-auto p-4 custom-scrollbar"
                        >
                          <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-300 mb-4 flex items-center gap-2">
                            <MessageSquare size={16} /> התשובות שלי
                          </h4>
                          {userReplies.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-40 text-emerald-800/60 dark:text-emerald-200/50">
                              <p className="text-sm">אין תשובות עדיין.</p>
                            </div>
                          ) : (
                            <ul className="space-y-3">
                              {userReplies.map((r) => (
                                <li
                                  key={r.id}
                                  className="bg-white dark:bg-gray-800 p-3.5 rounded-xl shadow-sm border border-emerald-100 dark:border-emerald-800/30"
                                >
                                  <p className="text-sm text-gray-800 dark:text-gray-200 line-clamp-2 mb-2">
                                    {r.content}
                                  </p>
                                  <div className="bg-gray-50 dark:bg-gray-900/50 p-2 rounded-lg border border-gray-100 dark:border-gray-700/50">
                                    <Link
                                      href={`/questions/${r.question_id}`}
                                      className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-medium line-clamp-1"
                                    >
                                      בשאלה:{" "}
                                      {r.question_title ?? "שאלה ללא כותרת"}
                                    </Link>
                                  </div>
                                  <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-2 block">
                                    {formatRelativeTime(r.created_at)}
                                  </span>
                                </li>
                              ))}
                              <div ref={repliesSentinelRef} className="h-4" />
                              {loadingMoreReplies && (
                                <p className="text-sm text-center text-emerald-600/60 dark:text-emerald-400/60 py-2">
                                  טוען...
                                </p>
                              )}
                            </ul>
                          )}
                        </div>
                      )}

                      {expandedSection === "likers" && (
                        <div
                          ref={likersScrollRef}
                          className="h-[300px] overflow-y-auto p-4 custom-scrollbar"
                        >
                          <h4 className="text-sm font-bold text-purple-900 dark:text-purple-300 mb-4 flex items-center gap-2">
                            <Heart size={16} /> אנשים שאהבו
                          </h4>
                          {likers.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-40 text-purple-800/60 dark:text-purple-200/50">
                              <p className="text-sm">אין לייקים עדיין.</p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {likers.map((u) => (
                                <Link
                                  key={u.id}
                                  href={`/profile/${encodeURIComponent(u.username)}`}
                                  className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl border border-purple-100 dark:border-purple-800/30 hover:border-purple-300 dark:hover:border-purple-600 transition-colors group"
                                >
                                  {u.avatar_url ? (
                                    <Image
                                      src={u.avatar_url}
                                      alt={u.username}
                                      width={40}
                                      height={40}
                                      className="w-10 h-10 rounded-full object-cover border border-gray-100 dark:border-gray-700 group-hover:ring-2 ring-purple-500/30 transition-all"
                                    />
                                  ) : (
                                    <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center group-hover:ring-2 ring-purple-500/30 transition-all">
                                      <span className="text-sm font-bold text-purple-700 dark:text-purple-300">
                                        {(u.username ?? "מ")
                                          .charAt(0)
                                          .toUpperCase()}
                                      </span>
                                    </div>
                                  )}
                                  <span className="font-medium text-gray-800 dark:text-gray-200 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                    {u.username}
                                  </span>
                                </Link>
                              ))}
                              <div
                                ref={likersSentinelRef}
                                className="h-4 sm:col-span-2"
                              />
                              {loadingMoreLikers && (
                                <p className="text-sm text-center text-purple-600/60 dark:text-purple-400/60 py-2 sm:col-span-2">
                                  טוען...
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Profile Comments Section */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200/80 dark:border-gray-800 p-6 flex flex-col h-[500px]">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <MessageSquare size={20} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  תגובות על הפרופיל
                </h3>
                <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-bold px-2 py-1 rounded-full mr-auto">
                  {commentsTotal}
                </span>
              </div>

              {isSkeleton ? (
                <div className="space-y-6 flex-1">
                  {[1, 2].map((i) => (
                    <div key={i} className="flex gap-4">
                      <SkeletonCircle className="w-10 h-10 rounded-full flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <SkeletonText className="w-32 h-4" />
                        <SkeletonBlock className="w-full h-16 rounded-xl" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  ref={commentsScrollRef}
                  className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-5 custom-scrollbar"
                >
                  {profileComments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500">
                      <MessageSquare size={32} className="mb-3 opacity-50" />
                      <p className="text-sm font-medium">
                        אין תגובות על הפרופיל שלך.
                      </p>
                      <p className="text-xs mt-1">
                        כאשר משתמשים יגיבו, התגובות יופיעו כאן.
                      </p>
                    </div>
                  ) : (
                    <>
                      {profileComments.map((c) => (
                        <div key={c.id} className="group flex gap-3 lg:gap-4">
                          <div className="flex-shrink-0">
                            {c.author_username ? (
                              <Link
                                href={`/profile/${encodeURIComponent(c.author_username)}`}
                                className="block"
                              >
                                {c.author_avatar_url ? (
                                  <Image
                                    src={c.author_avatar_url}
                                    alt={c.author_username}
                                    width={40}
                                    height={40}
                                    className="w-10 h-10 lg:w-11 lg:h-11 rounded-full object-cover border border-gray-200 dark:border-gray-700 shadow-sm hover:opacity-90 transition-opacity"
                                  />
                                ) : (
                                  <div className="w-10 h-10 lg:w-11 lg:h-11 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40 border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-center hover:opacity-90 transition-opacity">
                                    <span className="text-sm lg:text-base font-bold text-indigo-700 dark:text-indigo-300">
                                      {c.author_username
                                        .charAt(0)
                                        .toUpperCase()}
                                    </span>
                                  </div>
                                )}
                              </Link>
                            ) : (
                              <div className="w-10 h-10 lg:w-11 lg:h-11 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-center">
                                <span className="text-sm lg:text-base font-bold text-gray-500">
                                  מ
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl rounded-tr-sm p-4 border border-gray-100 dark:border-gray-800/80 relative group-hover:border-gray-200 dark:group-hover:border-gray-700 transition-colors">
                              <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-2">
                                  {c.author_username ? (
                                    <Link
                                      href={`/profile/${encodeURIComponent(c.author_username)}`}
                                      className="font-bold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 text-[15px]"
                                    >
                                      {c.author_username}
                                    </Link>
                                  ) : (
                                    <span className="font-bold text-gray-900 dark:text-white text-[15px]">
                                      משתמש מחוק
                                    </span>
                                  )}
                                  <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                                    {formatRelativeTime(c.created_at)}
                                  </span>
                                </div>

                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (!profile?.username) return;
                                    const res = await fetch(
                                      `/api/profile/${encodeURIComponent(profile.username)}/comments/${c.id}`,
                                      { method: "DELETE" },
                                    );
                                    if (res.ok) {
                                      setProfileComments((prev) =>
                                        prev.filter((x) => x.id !== c.id),
                                      );
                                      setCommentsTotal((prev) =>
                                        Math.max(0, prev - 1),
                                      );
                                    }
                                  }}
                                  className="opacity-0 group-hover:opacity-100 p-1.5 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all focus:opacity-100"
                                  title="מחק תגובה"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                              <p className="text-[15px] text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                                {c.content}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                      <div ref={commentsSentinelRef} className="h-4" />
                      {loadingMoreComments && (
                        <div className="py-4 flex justify-center">
                          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-sm">
                            <SkeletonCircle className="w-4 h-4 animate-spin border-t-indigo-600" />
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                              טוען תגובות...
                            </span>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(156, 163, 175, 0.3);
          border-radius: 20px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(75, 85, 99, 0.4);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(156, 163, 175, 0.5);
        }
      `}</style>
    </div>
  );
}
