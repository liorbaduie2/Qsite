"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowRight,
  MapPin,
  Globe,
  Calendar,
  Award,
  Star,
  Music,
  MessageCircle,
} from "lucide-react";
import { useAuth } from "../../components/AuthProvider";
import Image from "next/image";

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
}

interface SharedStatus {
  id: string;
  content: string;
  createdAt: string;
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
        } else {
          setNotFound(true);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [username]);

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

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">טוען פרופיל...</p>
        </div>
      </div>
    );
  }

  if (notFound || !profile) {
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

  const displayName = profile.full_name || profile.username;
  const playlistInfo = getPlaylistInfo(profile.website || undefined);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900" dir="rtl">
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
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
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6 sticky top-8">
              <div className="text-center mb-6">
                <div className="relative inline-block mb-4">
                  {profile.avatar_url ? (
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
                        {profile.username?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-1">
                  {displayName}
                </h2>
                {profile.bio && (
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
                      {new Date(sharedStatus.createdAt).toLocaleDateString(
                        "he-IL",
                      )}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-3 mb-6">
                {profile.location && (
                  <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                    <MapPin
                      size={18}
                      className="text-gray-400 dark:text-gray-500"
                    />
                    <span>{profile.location}</span>
                  </div>
                )}
                {profile.website && (
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
                {profile.created_at && (
                  <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                    <Calendar
                      size={18}
                      className="text-gray-400 dark:text-gray-500"
                    />
                    <span>
                      הצטרף ב-
                      {new Date(profile.created_at).toLocaleDateString("he-IL")}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl border border-yellow-200 dark:border-yellow-700/50">
                <div className="flex items-center gap-2 mb-2">
                  <Award
                    className="text-yellow-600 dark:text-yellow-500"
                    size={20}
                  />
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    מוניטין
                  </span>
                </div>
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-500">
                  {profile.reputation}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  נקודות
                </div>
              </div>
              {profile.reputation === 100 && (
                <div className="mt-3 p-3 bg-emerald-50/90 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-xl flex items-start gap-3">
                  <Star size={18} className="text-emerald-600 dark:text-emerald-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                      תג כבוד – מוניטין 100
                    </p>
                    <p className="text-xs text-emerald-800/80 dark:text-emerald-200/80 mt-0.5">
                      משתמש זה הגיע לרמת המוניטין הגבוהה ביותר בקהילה.
                    </p>
                  </div>
                </div>
              )}

              {user && chatStatus !== null && (
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
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6">
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                פרופיל ציבורי — אין פעילות להצגה כאן.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
