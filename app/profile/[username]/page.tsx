//app/profile/[username]/page.tsx
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
  ReputationArc,
  getReputationVisuals,
} from "../../components/ReputationArc";
import { SimpleThemeToggle } from "../../components/SimpleThemeToggle";
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
            className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-colors shadow-sm"
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
    <div
      className="min-h-screen bg-gray-50/50 dark:bg-[#0B1120] pb-12"
      dir="rtl"
    >
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <Link
              href="/"
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors font-medium"
            >
              <ArrowRight size={20} />
              <span>חזור לעמוד הבית</span>
            </Link>
            <SimpleThemeToggle size="sm" />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200/80 dark:border-gray-800 overflow-hidden relative">
              {/* Cover Photo */}
              <div className="h-32 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 dark:from-indigo-600 dark:via-purple-600 dark:to-pink-600">
                {isSkeleton && (
                  <div className="w-full h-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
                )}
              </div>

              <div className="px-6 pb-6 relative">
                {/* Avatar */}
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
                          <ReputationArc
                            value={profile?.reputation ?? 0}
                            size={124}
                          />
                        </div>
                        <div className="absolute inset-4 flex items-center justify-center">
                          {profile?.avatar_url ? (
                            <Image
                              src={profile.avatar_url}
                              alt={profile.username}
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
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Profile Info Header */}
                <div className="text-center mb-6">
                  {isSkeleton ? (
                    <div className="space-y-3">
                      <SkeletonText className="w-40 mx-auto h-7" />
                      <SkeletonText className="w-24 mx-auto h-5" />
                    </div>
                  ) : (
                    <>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                        {displayName}
                      </h2>
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center justify-center gap-1.5 mb-2">
                        <span>מוניטין</span>
                        <span
                          className={`${reputationTextClass} font-bold px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-full`}
                        >
                          {profile?.reputation ?? 0}
                        </span>
                      </div>

                      {profile?.role && profile.role !== "user" && (
                        <div className="mt-2 flex justify-center">
                          <RoleBadge
                            role={profile.role}
                            roleHebrew={profile.role_hebrew || profile.role}
                            size="sm"
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Bio */}
                {!isSkeleton && profile?.bio && (
                  <div className="mb-6">
                    <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                      {profile.bio}
                    </p>
                  </div>
                )}

                {/* Shared Status */}
                {!isSkeleton && sharedStatus && (
                  <div className="mb-6 p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/10 rounded-xl border border-amber-200/60 dark:border-amber-700/30 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-1 h-full bg-amber-400 dark:bg-amber-500" />
                    <div className="flex items-center gap-2 mb-3 text-amber-700 dark:text-amber-400 text-sm font-semibold">
                      <Star size={16} className="fill-current" />
                      <span>סטטוס נעוץ</span>
                    </div>
                    <p className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed">
                      {sharedStatus.content}
                    </p>
                    <p className="text-[11px] text-amber-600/70 dark:text-amber-400/60 mt-3 font-medium">
                      {formatRelativeTime(sharedStatus.createdAt)}
                    </p>
                  </div>
                )}

                {/* Details List */}
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
                      {profile?.location && (
                        <div className="flex items-center gap-3 text-sm">
                          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                            <MapPin size={16} />
                          </div>
                          <span className="text-gray-700 dark:text-gray-300 font-medium">
                            {profile.location}
                          </span>
                        </div>
                      )}

                      {profile?.website && (
                        <div className="flex items-center gap-3 text-sm">
                          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-800">
                            {playlistInfo.icon}
                          </div>
                          <a
                            href={profile.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium hover:underline truncate"
                            dir="ltr"
                          >
                            {playlistInfo.text}
                          </a>
                        </div>
                      )}

                      {profile?.created_at && (
                        <div className="flex items-center gap-3 text-sm">
                          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                            <Calendar size={16} />
                          </div>
                          <span className="text-gray-700 dark:text-gray-300">
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

                {/* Actions (Chat / Like) */}
                {!isSkeleton &&
                  user &&
                  profile &&
                  profile.username !== authProfile?.username && (
                    <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-800 flex-col sm:flex-row">
                      <button
                        type="button"
                        onClick={async () => {
                          if (likeRequesting) return;
                          setLikeRequesting(true);
                          try {
                            const res = await fetch(
                              `/api/profile/${encodeURIComponent(username)}/like`,
                              { method: "POST" },
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
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 ${
                          profileLiked
                            ? "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-800/50"
                            : "bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
                        }`}
                      >
                        <Heart
                          size={18}
                          className={profileLiked ? "fill-current" : ""}
                        />
                        <span className="text-sm">
                          {profileLiked ? "אהבת" : "לייק"} ({likesCount})
                        </span>
                      </button>

                      {chatStatus === "none" && (
                        <button
                          type="button"
                          onClick={async () => {
                            setChatRequesting(true);
                            try {
                              const res = await fetch("/api/chat/request", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  receiverUsername: profile.username,
                                }),
                              });
                              if (res.ok) setChatStatus("pending_sent");
                            } finally {
                              setChatRequesting(false);
                            }
                          }}
                          disabled={chatRequesting}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 border border-transparent"
                        >
                          <MessageCircle size={18} />
                          <span className="text-sm">
                            {chatRequesting ? "שולח..." : "צ'אט"}
                          </span>
                        </button>
                      )}
                      {chatStatus === "pending_sent" && (
                        <div className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-transparent cursor-not-allowed">
                          <MessageCircle size={18} />
                          <span className="text-sm">הבקשה נשלחה</span>
                        </div>
                      )}
                      {chatStatus === "pending_received" && (
                        <Link
                          href="/chat"
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 border border-amber-200 dark:border-amber-800/50"
                        >
                          <MessageCircle size={18} />
                          <span className="text-sm">השב לבקשה</span>
                        </Link>
                      )}
                      {chatStatus === "accepted" && chatConversationId && (
                        <Link
                          href={`/chat/${chatConversationId}`}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 bg-indigo-600 text-white hover:bg-indigo-700 border border-transparent shadow-sm"
                        >
                          <MessageCircle size={18} />
                          <span className="text-sm">פתח צ'אט</span>
                        </Link>
                      )}
                      {chatStatus === "blocked_by_them" && (
                        <div
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-transparent cursor-not-allowed"
                          title="משתמש זה לא מקבל בקשות צ'אט"
                        >
                          <MessageCircle size={18} />
                          <span className="text-sm">לא זמין</span>
                        </div>
                      )}
                      {chatStatus === "blocked_them" && (
                        <Link
                          href="/settings"
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
                        >
                          <MessageCircle size={18} />
                          <span className="text-sm">הסר חסימה</span>
                        </Link>
                      )}
                    </div>
                  )}

                {/* Reputation Badge */}
                {profile && profile.reputation === 100 && !isSkeleton && (
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
                        משתמש זה הגיע לרמת האמון הגבוהה ביותר בקהילה.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-6">
            {/* Activity Dashboard */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200/80 dark:border-gray-800 p-4">
              {isSkeleton ? (
                <div className="grid grid-cols-3 gap-4">
                  {[0, 1, 2].map((idx) => (
                    <SkeletonBlock key={idx} className="h-[90px] rounded-xl" />
                  ))}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-4">
                    {/* Questions Card */}
                    <div className="flex flex-col items-center justify-center p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                      <div className="text-2xl font-extrabold tabular-nums mb-1 text-center text-gray-900 dark:text-white">
                        {questions.length}
                      </div>
                      <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                        <HelpCircle
                          size={18}
                          className="text-gray-400 dark:text-gray-500"
                        />
                        <span>שאלות</span>
                      </div>
                    </div>

                    {/* Answers Card */}
                    <div className="flex flex-col items-center justify-center p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                      <div className="text-2xl font-extrabold tabular-nums mb-1 text-center text-gray-900 dark:text-white">
                        {repliesCount}
                      </div>
                      <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                        <MessageSquare
                          size={18}
                          className="text-gray-400 dark:text-gray-500"
                        />
                        <span>תשובות</span>
                      </div>
                    </div>
                  </div>
                  {/* Latest Questions removed from public profile view */}
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
                  {comments.length}
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
                <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-5 custom-scrollbar flex flex-col">
                  {/* Comment Input Form */}
                  {user &&
                    profile &&
                    profile.username !== authProfile?.username && (
                      <form
                        className="mb-6 flex-shrink-0"
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
                        <div className="flex gap-3 items-start">
                          <div className="flex-shrink-0">
                            {authProfile?.avatar_url ? (
                              <Image
                                src={authProfile.avatar_url}
                                alt={authProfile.username}
                                width={40}
                                height={40}
                                className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-700 shadow-sm"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40 border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-center">
                                <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300">
                                  {(authProfile?.username ?? "מ")
                                    .charAt(0)
                                    .toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>
                          <textarea
                            value={commentContent}
                            onChange={(e) => setCommentContent(e.target.value)}
                            placeholder="הוסף תגובה ציבורית..."
                            rows={2}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-gray-900 dark:text-white transition-all"
                          />
                        </div>
                        <div className="flex justify-end mt-2">
                          <button
                            type="submit"
                            disabled={
                              !commentContent.trim() || commentSubmitting
                            }
                            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {commentSubmitting ? "שולח..." : "פרסם תגובה"}
                          </button>
                        </div>
                      </form>
                    )}

                  {/* Comments List */}
                  {comments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500">
                      <MessageSquare size={32} className="mb-3 opacity-50" />
                      <p className="text-sm font-medium">
                        אין תגובות על הפרופיל עדיין.
                      </p>
                      <p className="text-xs mt-1">היה הראשון להגיב!</p>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {comments.map((c) => (
                        <div key={c.id} className="group flex gap-3 lg:gap-4">
                          <div className="flex-shrink-0">
                            {c.author_username ? (
                              <Link
                                href={
                                  authProfile?.username &&
                                  c.author_username &&
                                  authProfile.username === c.author_username
                                    ? "/profile"
                                    : `/profile/${encodeURIComponent(c.author_username)}`
                                }
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
                            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl rounded-tr-sm p-4 border border-gray-100 dark:border-gray-800/80 transition-colors">
                              <div className="flex items-center gap-2 mb-1.5">
                                {c.author_username ? (
                                  <Link
                                    href={
                                      authProfile?.username &&
                                      c.author_username &&
                                      authProfile.username === c.author_username
                                        ? "/profile"
                                        : `/profile/${encodeURIComponent(c.author_username)}`
                                    }
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
                              <p className="text-[15px] text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                                {c.content}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
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
