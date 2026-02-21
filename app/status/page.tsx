"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  Menu, Users, MessageSquare, HelpCircle, BookOpen, Home, Send, Star, User, LogIn,
  Clock, Share2, CheckCircle, History, X, Shield
} from 'lucide-react';
import { useAuth } from '../components/AuthProvider';
import AuthModal from '../components/AuthModal';
import Drawer from '../components/Drawer';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';

interface FeedItem {
  id: string;
  content: string;
  starsCount: number;
  createdAt: string;
  author: { id: string; username: string; fullName?: string | null; avatar_url?: string | null };
  starredByMe: boolean;
}

interface MyStatusItem {
  id: string;
  content: string;
  starsCount: number;
  sharedToProfile: boolean;
  isLegendary?: boolean;
  createdAt: string;
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffMins < 1) return 'הרגע';
  if (diffMins < 60) return `לפני ${diffMins} דקות`;
  if (diffHours < 24) return `לפני ${diffHours} שעות`;
  if (diffDays < 30) return `לפני ${diffDays} ימים`;
  return date.toLocaleDateString('he-IL');
}

function cooldownRemaining(nextPostAt: string): string {
  const remaining = new Date(nextPostAt).getTime() - Date.now();
  if (remaining <= 0) return '0';
  const mins = Math.ceil(remaining / 60000);
  return String(mins);
}

export default function StatusPage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [myActive, setMyActive] = useState<MyStatusItem | null>(null);
  const [myHistory, setMyHistory] = useState<MyStatusItem[]>([]);
  const [canPost, setCanPost] = useState(true);
  const [nextPostAt, setNextPostAt] = useState<string | null>(null);
  const [myLoading, setMyLoading] = useState(true);
  const [newContent, setNewContent] = useState('');
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const [starringId, setStarringId] = useState<string | null>(null);
  const [sharingId, setSharingId] = useState<string | null>(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [adminStarsModal, setAdminStarsModal] = useState<{ statusId: string; users: { id: string; username: string; fullName?: string | null; avatar_url?: string | null; starredAt: string }[]; starsCount: number } | null>(null);
  const [adminStarsLoading, setAdminStarsLoading] = useState(false);

  const { user, profile, loading: authLoading, signOut } = useAuth();

  const menuItems = [
    { label: 'ראשי', icon: Home, href: '/' },
    { label: 'סטטוסי', icon: Users, href: '/status', active: true },
    { label: 'דיוני', icon: MessageSquare, href: '/discussions' },
    { label: 'שאלות', icon: HelpCircle, href: '/questions' },
    { label: 'סיפורי', icon: BookOpen, href: '/stories' },
  ];

  const fetchFeed = useCallback(async () => {
    setFeedLoading(true);
    try {
      const res = await fetch('/api/status');
      const data = await res.json();
      if (res.ok) setFeed(data.feed || []);
    } catch {
      setFeed([]);
    } finally {
      setFeedLoading(false);
    }
  }, []);

  const fetchMe = useCallback(async () => {
    if (!user) {
      setMyActive(null);
      setMyHistory([]);
      setCanPost(true);
      setNextPostAt(null);
      setMyLoading(false);
      return;
    }
    setMyLoading(true);
    try {
      const res = await fetch('/api/status/me');
      const data = await res.json();
      if (res.ok) {
        setMyActive(data.active || null);
        setMyHistory(data.history || []);
        setCanPost(data.canPost !== false);
        setNextPostAt(data.nextPostAt || null);
      }
    } catch {
      setMyActive(null);
      setMyHistory([]);
    } finally {
      setMyLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  // Real-time: subscribe to user_statuses updates so star count syncs for all viewers
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('status-stars-realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_statuses',
        },
        (payload) => {
          const newRow = payload.new as { id?: string; stars_count?: number };
          if (!newRow?.id || newRow.stars_count === undefined) return;
          const id = newRow.id;
          const starsCount = Number(newRow.stars_count);
          setFeed((prev) =>
            prev.map((s) => (s.id === id ? { ...s, starsCount } : s))
          );
          setMyActive((prev) => (prev?.id === id ? { ...prev, starsCount } : prev));
          setMyHistory((prev) =>
            prev.map((s) => (s.id === id ? { ...s, starsCount } : s))
          );
          setAdminStarsModal((prev) =>
            prev?.statusId === id ? { ...prev, starsCount } : prev
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = newContent.trim();
    if (!content || !user) return;
    if (!canPost) {
      setPostError('המתן לסיום זמן ההמתנה בין פרסומים');
      return;
    }
    setPosting(true);
    setPostError(null);
    try {
      const res = await fetch('/api/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPostError(data.error || 'שגיאה בפרסום');
        if (data.nextPostAt) {
          setNextPostAt(data.nextPostAt);
          setCanPost(false);
        }
        return;
      }
      setNewContent('');
      setCanPost(false);
      if (data.nextPostAt) setNextPostAt(data.nextPostAt);
      fetchFeed();
      fetchMe();
    } catch {
      setPostError('שגיאה בחיבור לשרת');
    } finally {
      setPosting(false);
    }
  };

  const toggleStar = async (statusId: string) => {
    if (!user) {
      setAuthModalMode('login');
      setIsAuthModalOpen(true);
      return;
    }
    setStarringId(statusId);
    try {
      const res = await fetch(`/api/status/${statusId}/star`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        const starred = data.starred === true;
        const delta = starred ? 1 : -1;
        setFeed((prev) =>
          prev.map((s) =>
            s.id === statusId ? { ...s, starredByMe: starred, starsCount: Math.max(0, s.starsCount + delta) } : s
          )
        );
        setMyActive((prev) => (prev?.id === statusId ? { ...prev, starsCount: Math.max(0, prev.starsCount + delta) } : prev));
        setMyHistory((prev) =>
          prev.map((s) => (s.id === statusId ? { ...s, starsCount: Math.max(0, s.starsCount + delta) } : s))
        );
        setAdminStarsModal((prev) => (prev?.statusId === statusId ? { ...prev, starsCount: Math.max(0, prev.starsCount + delta) } : prev));
      }
    } finally {
      setStarringId(null);
    }
  };

  const openAdminStars = async (statusId: string) => {
    if (!profile?.is_moderator) return;
    setAdminStarsLoading(true);
    setAdminStarsModal(null);
    try {
      const res = await fetch(`/api/admin/status/${statusId}/stars`);
      const data = await res.json();
      if (res.ok) setAdminStarsModal({ statusId, users: data.users || [], starsCount: data.starsCount ?? 0 });
    } finally {
      setAdminStarsLoading(false);
    }
  };

  const toggleShare = async (statusId: string, current: boolean) => {
    if (!user) return;
    setSharingId(statusId);
    try {
      const res = await fetch(`/api/status/${statusId}/share`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ share: !current }),
      });
      if (res.ok) {
        const newVal = !current;
        setMyActive((a) => (a?.id === statusId ? { ...a, sharedToProfile: newVal } : a));
        setMyHistory((h) =>
          h.map((s) => (s.id === statusId ? { ...s, sharedToProfile: newVal } : s))
        );
        if (newVal) {
          setMyActive((a) => (a && a.id !== statusId ? { ...a, sharedToProfile: false } : a));
          setMyHistory((h) => h.map((s) => (s.id !== statusId ? { ...s, sharedToProfile: false } : s)));
        }
      }
    } finally {
      setSharingId(null);
    }
  };

  const topStatusId = feed.length > 0 ? feed[0].id : null;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative" dir="rtl" style={{ fontFamily: 'Assistant, system-ui, sans-serif', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', color: '#0f172a' }}>
      <div className="fixed inset-0 -z-10" style={{ background: 'radial-gradient(circle at 20% 80%, rgba(99, 102, 241, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)' }} />

      <header className="relative bg-white/80 backdrop-blur-xl shadow-xl border-b border-gray-200/20">
        <div className="max-w-4xl mx-auto px-5">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <button onClick={() => setIsDrawerOpen(!isDrawerOpen)} className="p-2 rounded-lg hover:bg-gray-100/60 transition-all duration-300">
                <Menu size={20} />
              </button>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">סטטוסי</h1>
            </div>
            <div className="flex items-center gap-4">
              {!user && (
                <div className="flex items-center gap-2">
                  <button onClick={() => { setAuthModalMode('login'); setIsAuthModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white/60 rounded-lg hover:bg-white/80 border border-indigo-200">
                    <LogIn size={16} /> התחברות
                  </button>
                  <button onClick={() => { setAuthModalMode('register'); setIsAuthModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 shadow-lg">
                    <User size={16} /> הרשמה
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <Drawer isDrawerOpen={isDrawerOpen} setIsDrawerOpen={setIsDrawerOpen} menuItems={menuItems} user={user} profile={profile} onSignOut={handleSignOut} />

      <main className="max-w-4xl mx-auto px-5 py-8">
        <p className="text-center text-gray-600 mb-6">סטטוס אחד פעיל לכל משתמש • המתנה של 5 דקות בין פרסומים • היסטוריה של 5 אחרונים</p>

        {user && (
          <div className="mb-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">פרסם סטטוס</h2>
            {!canPost && nextPostAt && (
              <div className="mb-4 flex items-center gap-2 text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <Clock size={18} />
                <span>ניתן לפרסם שוב בעוד {cooldownRemaining(nextPostAt)} דקות</span>
              </div>
            )}
            <form onSubmit={handlePost} className="space-y-4">
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="מה קורה?"
                className="w-full min-h-[100px] p-4 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                maxLength={500}
                disabled={!canPost || posting}
              />
              {postError && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{postError}</div>}
              <button
                type="submit"
                disabled={!newContent.trim() || !canPost || posting}
                className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={18} />
                {posting ? 'שולח...' : 'פרסם'}
              </button>
            </form>
          </div>
        )}

        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Star size={22} className="text-amber-500" />
            פיד סטטוסים
          </h2>
          {feedLoading ? (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" /></div>
          ) : feed.length === 0 ? (
            <div className="text-center py-12 text-gray-500 bg-white/60 rounded-2xl border border-gray-200/50">אין עדיין סטטוסים. היה הראשון לפרסם.</div>
          ) : (
            <div className="space-y-4">
              {feed.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-2xl border p-5 transition-all ${
                    item.id === topStatusId
                      ? 'bg-amber-50/80 border-amber-200 shadow-lg ring-2 ring-amber-200/50'
                      : 'bg-white/80 border-gray-200/50'
                  }`}
                >
                  {item.id === topStatusId && (
                    <div className="flex items-center gap-2 text-amber-700 font-semibold mb-3">
                      <Star size={18} fill="currentColor" /> סטטוס מוביל
                    </div>
                  )}
                  <p className="text-gray-800 whitespace-pre-wrap mb-4">{item.content}</p>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      {item.author.avatar_url ? (
                        <Image src={item.author.avatar_url} alt="" width={28} height={28} className="w-7 h-7 rounded-full object-cover border border-gray-200" />
                      ) : (
                        <div className="w-7 h-7 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center">
                          <User size={14} className="text-white" />
                        </div>
                      )}
                      <span className="font-medium text-gray-700">{item.author.fullName || item.author.username}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm text-gray-500">{timeAgo(item.createdAt)}</span>
                      <button
                        type="button"
                        onClick={() => toggleStar(item.id)}
                        disabled={starringId === item.id}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          item.starredByMe ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600 hover:bg-amber-50'
                        }`}
                      >
                        <Star size={16} className={item.starredByMe ? 'fill-current' : ''} />
                        {item.starsCount}
                      </button>
                      {profile?.is_moderator && (
                        <button
                          type="button"
                          onClick={() => openAdminStars(item.id)}
                          disabled={adminStarsLoading}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-indigo-600 hover:bg-indigo-50"
                          title="צפה במי סימן בכוכב"
                        >
                          <Shield size={14} />
                          מי סימן?
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {user && (myActive || myHistory.length > 0) && (
          <div className="mt-8">
            <button
              type="button"
              onClick={() => setHistoryModalOpen(true)}
              className="flex items-center gap-2 px-5 py-3 bg-white/80 hover:bg-white border border-gray-200 rounded-xl shadow-md hover:shadow-lg transition-all font-medium text-gray-800"
            >
              <History size={20} />
              היסטוריית סטטוסים ({[myActive, ...myHistory].filter(Boolean).length})
            </button>
          </div>
        )}
      </main>

      {/* History modal */}
      {historyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setHistoryModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-l from-indigo-50 to-white">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <History size={22} />
                היסטוריית הסטטוסים שלי
              </h3>
              <button onClick={() => setHistoryModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {myActive && (
                <div className="rounded-xl border-2 border-indigo-200 bg-indigo-50/60 p-4">
                  <span className="text-xs font-semibold text-indigo-700 mb-2 block">פעיל בפיד</span>
                  <p className="text-gray-800 whitespace-pre-wrap mb-3">{myActive.content}</p>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs text-gray-500">{timeAgo(myActive.createdAt)}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">{myActive.starsCount} כוכבים</span>
                      <button
                        type="button"
                        onClick={() => toggleShare(myActive.id, myActive.sharedToProfile)}
                        disabled={sharingId === myActive.id}
                        className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                          myActive.sharedToProfile ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {myActive.sharedToProfile ? <CheckCircle size={14} /> : <Share2 size={14} />}
                        {myActive.sharedToProfile ? 'מוצג בפרופיל' : 'שתף לפרופיל'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {myHistory.map((s) => (
                <div key={s.id} className={`rounded-xl border p-4 ${s.isLegendary ? 'border-amber-300 bg-amber-50/60' : 'border-gray-200 bg-gray-50/60'}`}>
                  {s.isLegendary && (
                    <span className="text-xs font-semibold text-amber-700 mb-2 flex items-center gap-1">
                      <Star size={12} className="fill-current" /> אגדה
                    </span>
                  )}
                  <p className="text-gray-700 whitespace-pre-wrap text-sm mb-2">{s.content}</p>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs text-gray-500">{timeAgo(s.createdAt)}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">{s.starsCount} כוכבים</span>
                      <button
                        type="button"
                        onClick={() => toggleShare(s.id, s.sharedToProfile)}
                        disabled={sharingId === s.id}
                        className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                          s.sharedToProfile ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {s.sharedToProfile ? <CheckCircle size={14} /> : <Share2 size={14} />}
                        {s.sharedToProfile ? 'מוצג בפרופיל' : 'שתף לפרופיל'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Admin: who starred modal */}
      {adminStarsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setAdminStarsModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-indigo-50">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Shield size={20} />
                מי סימן בכוכב ({adminStarsModal.starsCount})
              </h3>
              <button onClick={() => setAdminStarsModal(null)} className="p-2 hover:bg-white/60 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {adminStarsModal.users.length === 0 ? (
                <p className="text-gray-500 text-sm">עדיין אין כוכבים.</p>
              ) : (
                adminStarsModal.users.map((u) => (
                  <div key={u.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                    {u.avatar_url ? (
                      <Image src={u.avatar_url} alt="" width={36} height={36} className="w-9 h-9 rounded-full object-cover" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-indigo-200 flex items-center justify-center">
                        <User size={18} className="text-indigo-700" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-800">{u.fullName || u.username}</p>
                      <p className="text-xs text-gray-500">@{u.username}</p>
                    </div>
                    <span className="mr-auto text-xs text-gray-400">{timeAgo(u.starredAt)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {isAuthModalOpen && (
        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} initialMode={authModalMode} />
      )}
    </div>
  );
}
