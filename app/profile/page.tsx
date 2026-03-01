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
} from "lucide-react";
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
          stroke="rgba(148, 163, 184, 0.35)"
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
  const { user, profile, updateProfile, loading } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    username: "",
    bio: "",
    location: "",
    website: "",
    avatar_url: "",
  });

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
  const [countsReady, setCountsReady] = useState(false);
  const [preloadCounts, setPreloadCounts] = useState<{
    questions_count: number;
    answers_count: number;
    profile_likes_count: number;
  } | null>(null);
  const [questionsTotal, setQuestionsTotal] = useState(0);
  const [repliesTotal, setRepliesTotal] = useState(0);
  const [likersTotal, setLikersTotal] = useState(0);
  const [loadingMoreQuestions, setLoadingMoreQuestions] = useState(false);
  const [loadingMoreReplies, setLoadingMoreReplies] = useState(false);
  const [loadingMoreLikers, setLoadingMoreLikers] = useState(false);
  const questionsScrollRef = useRef<HTMLDivElement>(null);
  const questionsSentinelRef = useRef<HTMLDivElement>(null);
  const repliesScrollRef = useRef<HTMLDivElement>(null);
  const repliesSentinelRef = useRef<HTMLDivElement>(null);
  const likersScrollRef = useRef<HTMLDivElement>(null);
  const likersSentinelRef = useRef<HTMLDivElement>(null);

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

  // Phase 1: Fetch only counts. Skeleton hides when profile + counts are ready.
  useEffect(() => {
    if (!profile?.username) {
      setCountsReady(true);
      return;
    }
    setCountsReady(false);
    fetch(`/api/profile/${encodeURIComponent(profile.username)}/counts`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setPreloadCounts({
            questions_count:
              typeof data.questions_count === "number"
                ? data.questions_count
                : 0,
            answers_count:
              typeof data.answers_count === "number" ? data.answers_count : 0,
            profile_likes_count:
              typeof data.profile_likes_count === "number"
                ? data.profile_likes_count
                : 0,
          });
        }
        setCountsReady(true);
      })
      .catch(() => setCountsReady(true));
  }, [profile?.username]);

  // Phase 2: After profile is visible, fetch detail lists in background. Does not affect skeleton.
  useEffect(() => {
    if (!profile?.username || !countsReady) return;
    fetch(`/api/profile/${encodeURIComponent(profile.username)}/preload`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setUserQuestions(Array.isArray(data.questions) ? data.questions : []);
          setUserReplies(Array.isArray(data.replies) ? data.replies : []);
          setLikers(Array.isArray(data.likers) ? data.likers : []);
          setQuestionsTotal(
            typeof data.questions_total === "number"
              ? data.questions_total
              : (data.questions?.length ?? 0),
          );
          setRepliesTotal(
            typeof data.replies_total === "number"
              ? data.replies_total
              : (data.replies?.length ?? 0),
          );
          setLikersTotal(
            typeof data.likers_total === "number"
              ? data.likers_total
              : (data.likers?.length ?? 0),
          );
        }
      })
      .catch(() => {
        setUserQuestions([]);
        setUserReplies([]);
        setLikers([]);
        setQuestionsTotal(0);
        setRepliesTotal(0);
        setLikersTotal(0);
      });
  }, [profile?.username, countsReady]);

  useEffect(() => {
    if (!profile?.username) return;
    fetch(`/api/profile/${encodeURIComponent(profile.username)}/comments`)
      .then((res) => (res.ok ? res.json() : { comments: [] }))
      .then((data) =>
        setProfileComments(Array.isArray(data?.comments) ? data.comments : []),
      )
      .catch(() => setProfileComments([]));
  }, [profile?.username]);

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
  };

  const handleEditToggle = async () => {
    if (isEditing) {
      // Save changes
      if (updateProfile) {
        const success = await updateProfile(editForm);
        if (success) {
          setIsEditing(false);
        }
      }
    } else {
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    // Revert form to original profile data
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
  const isProfileLoading = loading && !profile;
  const isSkeleton = !profile || !countsReady;

  if (!loading && !user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            לא נמצא פרופיל
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-colors"
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
  const questionsAsked = preloadCounts
    ? preloadCounts.questions_count
    : Math.max(userQuestions.length, profile?.questions_count ?? 0);
  const answersGiven =
    preloadCounts?.answers_count ?? profile?.answers_count ?? 0;
  const profileLikesCount =
    preloadCounts?.profile_likes_count ?? profile?.profile_likes_count ?? 0;

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

  const playlistInfo = getPlaylistInfo(
    isEditing ? editForm.website : profile?.website,
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900" dir="rtl">
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              <ArrowRight size={20} />
              <span>חזור לעמוד הבית</span>
            </button>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
              פרופיל אישי
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6 sticky top-8">
              {/* Profile Header */}
              <div className="text-center mb-4">
                <div className="flex flex-col items-center justify-center mb-2">
                  <div className="relative" style={{ width: 124, height: 124 }}>
                    {isSkeleton ? (
                      <div className="absolute inset-4 flex items-center justify-center">
                        <SkeletonCircle className="w-24 h-24 border-4 border-white dark:border-gray-600 shadow-lg" />
                      </div>
                    ) : (
                      <>
                        <ReputationArc value={reputation} size={124} />
                        <div className="absolute inset-4 flex items-center justify-center">
                          <div className="relative">
                            {profile?.avatar_url ? (
                              <Image
                                src={profile.avatar_url}
                                alt={profile?.username || ""}
                                width={96}
                                height={96}
                                className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-gray-600 shadow-lg"
                              />
                            ) : (
                              <div className="w-24 h-24 bg-gradient-to-br from-indigo-400 to-purple-500 dark:from-indigo-500 dark:to-purple-600 rounded-full flex items-center justify-center border-4 border-white dark:border-gray-600 shadow-lg">
                                <span className="text-2xl font-bold text-white">
                                  {profile?.username
                                    ? profile.username.charAt(0).toUpperCase()
                                    : ""}
                                </span>
                              </div>
                            )}
                            {isEditing && (
                              <button className="absolute bottom-0 right-0 w-8 h-8 bg-indigo-600 dark:bg-indigo-500 text-white rounded-full flex items-center justify-center hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors">
                                <Camera size={16} />
                              </button>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="mt-2 text-sm font-medium text-gray-800 dark:text-gray-200">
                    {isSkeleton ? (
                      <SkeletonText className="w-32 mx-auto" />
                    ) : (
                      <>
                        מוניטין{" "}
                        <span className={reputationTextClass}>
                          {reputation}
                        </span>{" "}
                        נקודות
                      </>
                    )}
                  </div>
                </div>

                {isSkeleton ? (
                  <div className="space-y-3 mt-2">
                    <SkeletonText className="w-40 mx-auto h-6" />
                    <div className="mt-3 p-3 bg-gray-50/50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                      <div className="space-y-2">
                        <SkeletonText className="w-full" />
                        <SkeletonText className="w-5/6" />
                        <SkeletonText className="w-4/6" />
                      </div>
                    </div>
                    <div className="mt-3 p-4 bg-amber-50/80 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-700/50">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <SkeletonText className="w-32 h-4" />
                        <SkeletonBlock className="w-20 h-6 rounded-lg" />
                      </div>
                      <div className="space-y-2">
                        <SkeletonText className="w-full" />
                        <SkeletonText className="w-3/4" />
                      </div>
                    </div>
                  </div>
                ) : isEditing ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editForm.username}
                      onChange={(e) =>
                        handleInputChange("username", e.target.value)
                      }
                      placeholder="שם משתמש"
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-gray-100"
                    />
                    <textarea
                      value={editForm.bio}
                      onChange={(e) => handleInputChange("bio", e.target.value)}
                      placeholder="ביוגרפיה - ספר קצת על עצמך"
                      rows={4}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-gray-900 dark:text-gray-100"
                    />
                  </div>
                ) : (
                  <>
                    <h2 className="text-[1.75rem] font-bold text-gray-800 dark:text-gray-100 mb-1">
                      {profile?.full_name || profile?.username || ""}
                    </h2>
                    {profile?.bio && (
                      <div className="mt-3 p-3 bg-gray-50/50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                        <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                          {profile.bio}
                        </p>
                      </div>
                    )}
                    {sharedStatus && (
                      <div className="mt-3 p-4 bg-amber-50/80 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-700/50">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-medium">
                            <Star size={18} className="fill-current" />
                            מוצג בפרופיל (Featured)
                          </div>
                          <button
                            type="button"
                            onClick={removeSharedFromProfile}
                            disabled={removingShared}
                            className="text-xs px-3 py-1.5 rounded-lg border border-amber-300 dark:border-amber-600 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 disabled:opacity-50"
                          >
                            {removingShared ? "מסיר..." : "הסר מפרופיל"}
                          </button>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                          {sharedStatus.content}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          {formatRelativeTime(sharedStatus.createdAt)}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Profile Actions */}
              <div className="flex gap-2 mb-6">
                {isSkeleton ? (
                  <>
                    <SkeletonBlock className="flex-1 h-10 rounded-lg" />
                    <SkeletonBlock className="w-10 h-10 rounded-lg" />
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleEditToggle}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                        isEditing
                          ? "bg-green-600 dark:bg-green-500 text-white hover:bg-green-700 dark:hover:bg-green-600"
                          : "bg-indigo-600 dark:bg-indigo-500 text-white hover:bg-indigo-700 dark:hover:bg-indigo-600"
                      }`}
                    >
                      {isEditing ? <Save size={16} /> : <Edit3 size={16} />}
                      {isEditing ? "שמור" : "ערוך פרופיל"}
                    </button>
                    {isEditing && (
                      <button
                        onClick={handleCancelEdit}
                        className="px-4 py-2 text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* Profile Details */}
              <div className="space-y-3 mb-6">
                {isSkeleton ? (
                  <>
                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                      <MapPin
                        size={18}
                        className="text-gray-400 dark:text-gray-500"
                      />
                      <SkeletonText className="w-32" />
                    </div>
                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                      <Globe
                        size={18}
                        className="text-gray-400 dark:text-gray-500"
                      />
                      <SkeletonText className="w-40" />
                    </div>
                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                      <Calendar
                        size={18}
                        className="text-gray-400 dark:text-gray-500"
                      />
                      <SkeletonText className="w-28" />
                    </div>
                  </>
                ) : (
                  <>
                    {(profile?.location || isEditing) && (
                      <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                        <MapPin
                          size={18}
                          className="text-gray-400 dark:text-gray-500"
                        />
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.location}
                            onChange={(e) =>
                              handleInputChange("location", e.target.value)
                            }
                            placeholder="מיקום (אופציונלי)"
                            className="flex-1 px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-gray-100"
                          />
                        ) : (
                          <span>{profile?.location}</span>
                        )}
                      </div>
                    )}

                    {(profile?.website || isEditing) && (
                      <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                        {playlistInfo.icon}
                        {isEditing ? (
                          <input
                            type="url"
                            value={editForm.website}
                            onChange={(e) =>
                              handleInputChange("website", e.target.value)
                            }
                            placeholder="פלייליסט ספוטיפיי/אפל מיוזיק"
                            className="flex-1 px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-gray-100"
                          />
                        ) : (
                          profile?.website && (
                            <a
                              href={profile.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 dark:text-indigo-400 hover:underline"
                            >
                              {playlistInfo.text}
                            </a>
                          )
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                      <Calendar
                        size={18}
                        className="text-gray-400 dark:text-gray-500"
                      />
                      <span>
                        הצטרף ב-
                        {new Date(joinedDate).toLocaleDateString("he-IL")}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {reputation === 100 && !isSkeleton && (
                <div className="mt-3 p-3 bg-emerald-50/90 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-xl flex items-start gap-3">
                  <Star
                    size={18}
                    className="text-emerald-600 dark:text-emerald-400 mt-0.5"
                  />
                  <div>
                    <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                      תג כבוד – מוניטין 100
                    </p>
                    <p className="text-xs text-emerald-800/80 dark:text-emerald-200/80 mt-0.5">
                      הגעת לרמת האמון הגבוהה ביותר בקהילה. תודה על התרומה שלך!
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main Content - same layout as public profile */}
          <div className="lg:col-span-2 space-y-6">
            {/* Activity card */}
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6">
              {isSkeleton ? (
                <div className="space-y-4">
                  <SkeletonText className="w-48 h-5 mx-auto" />
                  <div className="grid grid-cols-3 gap-3">
                    {[0, 1, 2].map((idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/40"
                      >
                        <SkeletonText className="w-16 h-6" />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                    <HelpCircle size={20} className="text-indigo-500" />
                    פעילות
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedSection((s) =>
                          s === "questions" ? null : "questions",
                        )
                      }
                      className="flex items-center gap-3 p-4 rounded-xl border border-blue-200 dark:border-blue-700/50 bg-gradient-to-br from-blue-50 to-blue-100/80 dark:from-blue-900/20 dark:to-blue-800/20 hover:from-blue-100 hover:to-blue-200/80 dark:hover:from-blue-800/30 dark:hover:to-blue-700/30 transition-colors text-right cursor-pointer"
                    >
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-500/15 dark:bg-blue-500/25">
                        <HelpCircle
                          size={22}
                          className="text-blue-600 dark:text-blue-400"
                        />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-blue-700 dark:text-blue-300 tabular-nums">
                          {Number(questionsAsked)}
                        </p>
                        <p className="text-xs font-medium text-blue-600/80 dark:text-blue-400/80">
                          שאלות
                        </p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedSection((s) =>
                          s === "answers" ? null : "answers",
                        )
                      }
                      className="flex items-center gap-3 p-4 rounded-xl border border-emerald-200 dark:border-emerald-700/50 bg-gradient-to-br from-emerald-50 to-emerald-100/80 dark:from-emerald-900/20 dark:to-emerald-800/20 hover:from-emerald-100 hover:to-emerald-200/80 dark:hover:from-emerald-800/30 dark:hover:to-emerald-700/30 transition-colors text-right cursor-pointer"
                    >
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-500/15 dark:bg-emerald-500/25">
                        <MessageSquare
                          size={22}
                          className="text-emerald-600 dark:text-emerald-400"
                        />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 tabular-nums">
                          {answersGiven}
                        </p>
                        <p className="text-xs font-medium text-emerald-600/80 dark:text-emerald-400/80">
                          תשובות
                        </p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedSection((s) =>
                          s === "likers" ? null : "likers",
                        )
                      }
                      className="flex items-center gap-3 p-4 rounded-xl border border-purple-200 dark:border-purple-700/50 bg-gradient-to-br from-purple-50 to-purple-100/80 dark:from-purple-900/20 dark:to-purple-800/20 hover:from-purple-100 hover:to-purple-200/80 dark:hover:from-purple-800/30 dark:hover:to-purple-700/30 transition-colors text-right cursor-pointer"
                    >
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-500/15 dark:bg-purple-500/25">
                        <Heart
                          size={22}
                          className="text-purple-600 dark:text-purple-400"
                        />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-purple-700 dark:text-purple-300 tabular-nums">
                          {profileLikesCount}
                        </p>
                      </div>
                    </button>
                  </div>

                  {/* Slide-down content: fixed height, scroll inside for more */}
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      expandedSection
                        ? "max-h-[320px] opacity-100"
                        : "max-h-0 opacity-0"
                    }`}
                  >
                    {expandedSection === "questions" && (
                      <div
                        ref={questionsScrollRef}
                        className="pt-4 mt-4 h-[280px] overflow-y-auto"
                      >
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                          השאלות שלי
                        </h4>
                        {userQuestions.length === 0 ? (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            אין שאלות עדיין.
                          </p>
                        ) : (
                          <>
                            <ul className="divide-y divide-gray-200 dark:divide-gray-600">
                              {userQuestions.map((q) => (
                                <li key={q.id} className="py-3 first:pt-0">
                                  <Link
                                    href={`/questions/${q.id}`}
                                    className="text-indigo-600 dark:text-indigo-400 hover:underline block font-medium"
                                  >
                                    {q.title}
                                  </Link>
                                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">
                                    {formatRelativeTime(q.created_at)}
                                  </span>
                                </li>
                              ))}
                            </ul>
                            <div ref={questionsSentinelRef} className="h-2" />
                            {loadingMoreQuestions && (
                              <p className="text-sm text-gray-500 dark:text-gray-400 py-2">
                                טוען...
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    )}
                    {expandedSection === "answers" && (
                      <div
                        ref={repliesScrollRef}
                        className="pt-4 mt-4 h-[280px] overflow-y-auto"
                      >
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                          התשובות שלי
                        </h4>
                        {userReplies.length === 0 ? (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            אין תשובות עדיין.
                          </p>
                        ) : (
                          <>
                            <ul className="divide-y divide-gray-200 dark:divide-gray-600">
                              {userReplies.map((r) => (
                                <li key={r.id} className="py-3 first:pt-0">
                                  <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                                    {r.content}
                                  </p>
                                  <Link
                                    href={`/questions/${r.question_id}`}
                                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline mt-1 block"
                                  >
                                    {r.question_title ?? "שאלה"}
                                  </Link>
                                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 block">
                                    {formatRelativeTime(r.created_at)}
                                  </span>
                                </li>
                              ))}
                            </ul>
                            <div ref={repliesSentinelRef} className="h-2" />
                            {loadingMoreReplies && (
                              <p className="text-sm text-gray-500 dark:text-gray-400 py-2">
                                טוען...
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    )}
                    {expandedSection === "likers" && (
                      <div
                        ref={likersScrollRef}
                        className="pt-4 mt-4 h-[280px] overflow-y-auto"
                      >
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                          אנשים שאהבו את הפרופיל
                        </h4>
                        {likers.length === 0 ? (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            אין לייקים עדיין.
                          </p>
                        ) : (
                          <>
                            <ul className="divide-y divide-gray-200 dark:divide-gray-600">
                              {likers.map((u) => (
                                <li
                                  key={u.id}
                                  className="flex items-center gap-3 py-3 first:pt-0"
                                >
                                  {u.avatar_url ? (
                                    <Image
                                      src={u.avatar_url}
                                      alt={u.username}
                                      width={36}
                                      height={36}
                                      className="w-9 h-9 rounded-full object-cover border border-gray-200 dark:border-gray-600"
                                    />
                                  ) : (
                                    <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
                                      <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                                        {(u.username ?? "מ")
                                          .charAt(0)
                                          .toUpperCase()}
                                      </span>
                                    </div>
                                  )}
                                  <Link
                                    href={`/profile/${encodeURIComponent(u.username)}`}
                                    className="font-medium text-gray-800 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400"
                                  >
                                    {u.username}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                            <div ref={likersSentinelRef} className="h-2" />
                            {loadingMoreLikers && (
                              <p className="text-sm text-gray-500 dark:text-gray-400 py-2">
                                טוען...
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* תגובות על הפרופיל - heading only, no box */}
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              תגובות על הפרופיל
            </h3>

            {/* Comments list - same as public with avatar + delete */}
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6">
              {isSkeleton ? (
                <div className="space-y-2">
                  <SkeletonText className="w-full" />
                  <SkeletonText className="w-4/5" />
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-600">
                  {profileComments.length === 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 py-2">
                      אין תגובות על הפרופיל שלך.
                    </p>
                  )}
                  {profileComments.map((c) => (
                    <div
                      key={c.id}
                      className="flex gap-3 py-4 first:pt-0 last:pb-0"
                    >
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
                                className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-600 hover:opacity-90 transition-opacity"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/40 border border-gray-200 dark:border-gray-600 flex items-center justify-center hover:opacity-90 transition-opacity">
                                <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                                  {c.author_username.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                          </Link>
                        ) : (
                          <>
                            {c.author_avatar_url ? (
                              <Image
                                src={c.author_avatar_url}
                                alt=""
                                width={40}
                                height={40}
                                className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-600"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/40 border border-gray-200 dark:border-gray-600 flex items-center justify-center">
                                <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                                  מ
                                </span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {c.author_username ? (
                            <Link
                              href={`/profile/${encodeURIComponent(c.author_username)}`}
                              className="font-semibold text-gray-800 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400"
                            >
                              {c.author_username}
                            </Link>
                          ) : (
                            <span className="font-semibold text-gray-800 dark:text-gray-200">
                              משתמש
                            </span>
                          )}
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatRelativeTime(c.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                          {c.content}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <button
                          type="button"
                          onClick={async () => {
                            if (!profile?.username) return;
                            const res = await fetch(
                              `/api/profile/${encodeURIComponent(profile.username)}/comments/${c.id}`,
                              { method: "DELETE" },
                            );
                            if (res.ok)
                              setProfileComments((prev) =>
                                prev.filter((x) => x.id !== c.id),
                              );
                          }}
                          className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="מחק תגובה"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
