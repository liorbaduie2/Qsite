"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowRight,
  MapPin,
  Globe,
  Calendar,
  Star,
  Music,
  MessageCircle,
  Heart,
  MessageSquare,
  HelpCircle,
} from "lucide-react";
import { useAuth } from "../../components/AuthProvider";
import Image from "next/image";
import { RoleBadge } from "../../components/RoleBadge";
import {
  SkeletonBlock,
  SkeletonCircle,
  SkeletonText,
} from "../../components/ui/Skeleton";
import { formatRelativeTime } from "../../../lib/utils";

interface PublicProfile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  reputation: number;
  is_verified: boolean;
  is_moderator: boolean;
  created_at: string | null;
  role?: string;
  role_hebrew?: string;
  questions_count?: number;
  profile_likes_count?: number;
}

interface SharedStatus {
  id: string;
  content: string;
  createdAt: string;
}

interface ProfileQuestion {
  id: string;
  title: string;
  created_at: string;
}

interface ProfileComment {
  id: string;
  content: string;
  created_at: string;
  author_id: string;
  author_username: string | null;
  author_avatar_url: string | null;
}

const getPlaylistInfo = (url: string | undefined) => {
  if (!url)
    return {
      icon: <Globe size={18} className="text-gray-400 dark:text-gray-500" />,
      text: "",
    };
  if (url.includes("spotify.com"))
    return {
      icon: <Music size={18} className="text-green-500" />,
      text: "פלייליסט ספוטיפיי",
    };
  if (url.includes("music.apple.com"))
    return {
      icon: <Music size={18} className="text-pink-500" />,
      text: "פלייליסט אפל מיוזיק",
    };
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
          id="public-reputation-arc-gradient"
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

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const username = typeof params?.username === "string" ? params.username : "";
  const { user, profile: authProfile, loading: authLoading } = useAuth();

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [sharedStatus, setSharedStatus] = useState<SharedStatus | null>(null);
  const [questions, setQuestions] = useState<ProfileQuestion[]>([]);
  const [repliesCount, setRepliesCount] = useState(0);
  const [comments, setComments] = useState<ProfileComment[]>([]);
  const [profileLiked, setProfileLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [chatStatus, setChatStatus] = useState<
    | "none"
    | "pending_sent"
    | "pending_received"
    | "accepted"
    | "blocked_them"
    | "blocked_by_them"
    | null
  >(null);
  const [chatConversationId, setChatConversationId] = useState<string | null>(
    null,
  );
  const [chatRequesting, setChatRequesting] = useState(false);
  const [likeRequesting, setLikeRequesting] = useState(false);
  const [commentContent, setCommentContent] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  useEffect(() => {
    if (!username) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    setNotFound(false);
    fetch(`/api/profile/${encodeURIComponent(username)}`)
      .then((res) => {
        if (!res.ok) {
          setNotFound(true);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.profile) {
          setProfile(data.profile);
          setSharedStatus(data.sharedStatus || null);
          setQuestions(Array.isArray(data.questions) ? data.questions : []);
          setRepliesCount(
            typeof data.replies_count === "number" ? data.replies_count : 0,
          );
          setLikesCount(data.profile?.profile_likes_count ?? 0);
        } else {
          setNotFound(true);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [username]);

  useEffect(() => {
    if (!username || !profile) return;
    fetch(`/api/profile/${encodeURIComponent(username)}/comments`)
      .then((res) => (res.ok ? res.json() : { comments: [] }))
      .then((data) =>
        setComments(Array.isArray(data?.comments) ? data.comments : []),
      )
      .catch(() => setComments([]));
  }, [username, profile?.id]);

  useEffect(() => {
    if (
      !username ||
      !user ||
      (profile && profile.username === authProfile?.username)
    )
      return;
    fetch(`/api/profile/${encodeURIComponent(username)}/like`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setProfileLiked(!!data.liked);
          if (typeof data.likes_count === "number")
            setLikesCount(data.likes_count);
        }
      })
      .catch(() => {});
  }, [username, user, profile?.username, authProfile?.username]);

  useEffect(() => {
    if (authLoading || !profile || !authProfile) return;
    if (authProfile.username && authProfile.username === profile.username) {
      router.replace("/profile");
    }
  }, [authLoading, authProfile, profile, router]);

  useEffect(() => {
    if (!user || !profile || authProfile?.username === profile.username) {
      setChatStatus(null);
      setChatConversationId(null);
      return;
    }
    fetch(
      `/api/chat/check?otherUsername=${encodeURIComponent(profile.username)}`,
    )
      .then((res) => res.json())
      .then((data) => {
        setChatStatus(data.status || "none");
        setChatConversationId(data.conversationId || null);
      })
      .catch(() => setChatStatus("none"));
  }, [user, profile, authProfile?.username]);

  const isProfileLoading = loading || authLoading;
  const isSkeleton = isProfileLoading;

  if (!isProfileLoading && (notFound || !profile)) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">משתמש לא נמצא</p>
          <Link
            href="/"
            className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-colors"
          >
            חזור לעמוד הבית
          </Link>
        </div>
      </div>
    );
  }

  const displayName = profile?.full_name || profile?.username || "";
  const playlistInfo = getPlaylistInfo(profile?.website || undefined);
  const { textClass: reputationTextClass } = getReputationVisuals(
    profile?.reputation ?? 0,
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900" dir="rtl">
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            <Link
              href="/"
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              <ArrowRight size={20} />
              <span>חזור לעמוד הבית</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6 sticky top-8">
              {!isSkeleton && profile && (
                <div className="absolute top-4 right-4">
                  {user && profile.username !== authProfile?.username ? (
                    <button
                      type="button"
                      onClick={async () => {
                        if (likeRequesting) return;
                        setLikeRequesting(true);
                        try {
                          const res = await fetch(
                            `/api/profile/${encodeURIComponent(username)}/like`,
                            {
                              method: "POST",
                            },
                          );
                          const data = await res.json();
                          if (res.ok) {
                            setProfileLiked(!!data.liked);
                            if (typeof data.likes_count === "number")
                              setLikesCount(data.likes_count);
                          }
                        } finally {
                          setLikeRequesting(false);
                        }
                      }}
                      disabled={likeRequesting}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors shadow-sm"
                    >
                      <Heart
                        size={18}
                        className={
                          profileLiked
                            ? "fill-red-500 text-red-500"
                            : "text-gray-500 dark:text-gray-400"
                        }
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {likesCount}
                      </span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5 px-3 py-2 text-gray-600 dark:text-gray-400 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50/80 dark:bg-gray-700/80">
                      <Heart
                        size={18}
                        className="text-gray-500 dark:text-gray-400"
                      />
                      <span className="text-sm font-medium tabular-nums">
                        {likesCount}
                      </span>
                    </div>
                  )}
                </div>
              )}
              <div className="text-center mb-4">
                <div className="flex flex-col items-center justify-center mb-2">
                  <div className="relative" style={{ width: 124, height: 124 }}>
                    {isSkeleton ? (
                      <div className="absolute inset-4 flex items-center justify-center">
                        <SkeletonCircle className="w-24 h-24 border-4 border-white dark:border-gray-600 shadow-lg" />
                      </div>
                    ) : (
                      <>
                        <ReputationArc
                          value={profile?.reputation ?? 0}
                          size={124}
                        />
                        <div className="absolute inset-4 flex items-center justify-center">
                          {profile?.avatar_url ? (
                            <Image
                              src={profile.avatar_url}
                              alt={profile.username}
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
                        </div>
                      </>
                    )}
                  </div>
                  <div className="mt-2 space-y-1">
                    <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      {isSkeleton ? (
                        <SkeletonText className="w-32 mx-auto" />
                      ) : (
                        <>
                          מוניטין{" "}
                          <span className={reputationTextClass}>
                            {profile?.reputation ?? 0}
                          </span>{" "}
                          נקודות
                        </>
                      )}
                    </div>
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
                      <div className="flex items-center gap-2 mb-2">
                        <SkeletonText className="w-32 h-4" />
                      </div>
                      <div className="space-y-2">
                        <SkeletonText className="w-full" />
                        <SkeletonText className="w-3/4" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 className="text-[1.75rem] font-bold text-gray-800 dark:text-gray-100 mb-1">
                      {displayName}
                    </h2>
                    {!isSkeleton && profile?.role && profile.role_hebrew && (
                      <div className="mt-1 mb-1.5 flex justify-center">
                        <RoleBadge
                          role={profile.role}
                          roleHebrew={profile.role_hebrew}
                          size="sm"
                        />
                      </div>
                    )}
                    {profile?.bio && (
                      <div className="mt-3 p-3 bg-gray-50/50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                        <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                          {profile.bio}
                        </p>
                      </div>
                    )}
                    {sharedStatus && (
                      <div className="mt-3 p-4 bg-amber-50/80 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-700/50">
                        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-medium mb-2">
                          <Star size={18} className="fill-current" />
                          מוצג בפרופיל (Featured)
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
                    {profile?.location && (
                      <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                        <MapPin
                          size={18}
                          className="text-gray-400 dark:text-gray-500"
                        />
                        <span>{profile.location}</span>
                      </div>
                    )}
                    {profile?.website && (
                      <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                        {playlistInfo.icon}
                        <a
                          href={profile.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          {playlistInfo.text}
                        </a>
                      </div>
                    )}
                    {profile?.created_at && (
                      <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                        <Calendar
                          size={18}
                          className="text-gray-400 dark:text-gray-500"
                        />
                        <span>
                          הצטרף ב-
                          {new Date(profile.created_at).toLocaleDateString(
                            "he-IL",
                          )}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>

              {profile && profile.reputation === 100 && !isSkeleton && (
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
                      משתמש זה הגיע לרמת האמון הגבוהה ביותר בקהילה.
                    </p>
                  </div>
                </div>
              )}

              {user && (
                <div className="mt-6 p-4 bg-white/60 dark:bg-gray-700/60 rounded-xl border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center gap-2 mb-3">
                    <MessageCircle
                      className="text-indigo-600 dark:text-indigo-400"
                      size={20}
                    />
                    <span className="font-semibold text-gray-800 dark:text-gray-200">
                      צ'אט
                    </span>
                  </div>
                  {isSkeleton || chatStatus === null ? (
                    <SkeletonBlock className="w-full h-10 rounded-lg" />
                  ) : (
                    <>
                      {chatStatus === "none" && (
                        <button
                          type="button"
                          onClick={async () => {
                            setChatRequesting(true);
                            try {
                              if (!profile) return;
                              const res = await fetch("/api/chat/request", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  receiverUsername: profile.username,
                                }),
                              });
                              const data = await res.json();
                              if (res.ok) {
                                setChatStatus("pending_sent");
                              }
                            } finally {
                              setChatRequesting(false);
                            }
                          }}
                          disabled={chatRequesting}
                          className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                        >
                          {chatRequesting ? "שולח..." : "שלח בקשת צ'אט"}
                        </button>
                      )}
                      {chatStatus === "pending_sent" && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          בקשת צ\'אט ממתינה לאישור
                        </p>
                      )}
                      {chatStatus === "pending_received" && (
                        <Link
                          href="/chat"
                          className="block w-full py-2.5 px-4 rounded-lg bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 font-medium text-center hover:bg-amber-200 dark:hover:bg-amber-900/70 transition-colors"
                        >
                          יש לך בקשת צ\'אט — עבור לצ\'אט
                        </Link>
                      )}
                      {chatStatus === "accepted" && chatConversationId && (
                        <Link
                          href={`/chat/${chatConversationId}`}
                          className="block w-full py-2.5 px-4 rounded-lg bg-indigo-600 text-white font-medium text-center hover:bg-indigo-700 transition-colors"
                        >
                          היכנס לצ'אט
                        </Link>
                      )}
                      {chatStatus === "blocked_by_them" && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          אין אפשרות לשלוח בקשת צ\'אט
                        </p>
                      )}
                      {chatStatus === "blocked_them" && (
                        <Link
                          href="/settings"
                          className="block w-full py-2.5 px-4 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium text-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          הסר חסימה (הגדרות)
                        </Link>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6">
              {isSkeleton ? (
                <div className="space-y-4">
                  <SkeletonText className="w-48 h-5 mx-auto" />
                  <div className="space-y-2">
                    <SkeletonText className="w-full" />
                    <SkeletonText className="w-5/6" />
                    <SkeletonText className="w-4/6" />
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                      <HelpCircle size={20} className="text-indigo-500" />
                      פעילות
                    </h3>
                    <div className="grid grid-cols-2 gap-3 mb-5">
                      <div className="flex items-center gap-3 p-4 rounded-xl border border-blue-200 dark:border-blue-700/50 bg-gradient-to-br from-blue-50 to-blue-100/80 dark:from-blue-900/20 dark:to-blue-800/20">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-500/15 dark:bg-blue-500/25">
                          <HelpCircle
                            size={22}
                            className="text-blue-600 dark:text-blue-400"
                          />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-blue-700 dark:text-blue-300 tabular-nums">
                            {profile?.questions_count ?? 0}
                          </p>
                          <p className="text-xs font-medium text-blue-600/80 dark:text-blue-400/80">
                            שאלות
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-4 rounded-xl border border-emerald-200 dark:border-emerald-700/50 bg-gradient-to-br from-emerald-50 to-emerald-100/80 dark:from-emerald-900/20 dark:to-emerald-800/20">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-500/15 dark:bg-emerald-500/25">
                          <MessageSquare
                            size={22}
                            className="text-emerald-600 dark:text-emerald-400"
                          />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 tabular-nums">
                            {repliesCount}
                          </p>
                          <p className="text-xs font-medium text-emerald-600/80 dark:text-emerald-400/80">
                            תשובות
                          </p>
                        </div>
                      </div>
                    </div>
                    {questions.length > 0 && (
                      <>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          השאלה האחרונה
                        </h4>
                        <Link
                          href={`/questions/${questions[0].id}`}
                          className="block p-3 rounded-lg bg-indigo-50/80 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100/80 dark:hover:bg-indigo-900/30 transition-colors"
                        >
                          <span className="font-medium text-gray-800 dark:text-gray-200">
                            {questions[0].title}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 block mt-1">
                            {formatRelativeTime(questions[0].created_at)}
                          </span>
                        </Link>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-4 mb-2">
                          כל השאלות
                        </h4>
                        <ul className="space-y-2">
                          {questions.map((q) => (
                            <li key={q.id}>
                              <Link
                                href={`/questions/${q.id}`}
                                className="text-indigo-600 dark:text-indigo-400 hover:underline"
                              >
                                {q.title}
                              </Link>
                              <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">
                                {" "}
                                {formatRelativeTime(q.created_at)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                תגובות על הפרופיל
              </h3>
              {isSkeleton ? (
                <div className="space-y-2 mt-4">
                  <SkeletonText className="w-full" />
                  <SkeletonText className="w-4/5" />
                </div>
              ) : (
                <>
                  {user &&
                    profile &&
                    profile.username !== authProfile?.username && (
                      <form
                        className="mt-4"
                        onSubmit={async (e) => {
                          e.preventDefault();
                          if (!commentContent.trim() || commentSubmitting)
                            return;
                          setCommentSubmitting(true);
                          try {
                            const res = await fetch(
                              `/api/profile/${encodeURIComponent(username)}/comments`,
                              {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  content: commentContent.trim(),
                                }),
                              },
                            );
                            const data = await res.json();
                            if (res.ok && data?.comment) {
                              setComments((prev) => [data.comment, ...prev]);
                              setCommentContent("");
                            }
                          } finally {
                            setCommentSubmitting(false);
                          }
                        }}
                      >
                        <textarea
                          value={commentContent}
                          onChange={(e) => setCommentContent(e.target.value)}
                          placeholder="הוסף תגובה ציבורית..."
                          rows={2}
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 resize-none"
                        />
                        <button
                          type="submit"
                          disabled={!commentContent.trim() || commentSubmitting}
                          className="mt-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {commentSubmitting ? "שולח..." : "פרסם"}
                        </button>
                      </form>
                    )}
                </>
              )}
            </div>

            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6">
              {isSkeleton ? (
                <div className="space-y-2">
                  <SkeletonText className="w-full" />
                  <SkeletonText className="w-4/5" />
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-600">
                  {comments.length === 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 py-2">
                      אין תגובות עדיין.
                    </p>
                  )}
                  {comments.map((c) => (
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
