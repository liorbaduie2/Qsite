'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare, HelpCircle, BookOpen, Home, Users, User, LogIn,
  CheckCircle, X, Shield, UserPlus, Clock
} from 'lucide-react';
import { useAuth } from '../components/AuthProvider';
import LoginModal from '../components/LoginModal';
import RegisterModal from '../components/RegisterModal';
import Drawer from '../components/Drawer';
import NavHeader from '../components/NavHeader';
import Image from 'next/image';
import Link from 'next/link';

type IncomingRequest = {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: string;
  created_at: string;
  sender: { id: string; username: string; full_name: string | null; avatar_url: string | null };
};

type OutgoingRequest = {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: string;
  created_at: string;
  receiver: { id: string; username: string; full_name: string | null; avatar_url: string | null };
};

type Conversation = {
  id: string;
  otherUser: { id: string; username: string; full_name: string | null; avatar_url: string | null };
  lastMessage: { content: string; created_at: string; sender_id: string } | null;
  created_at: string;
  unread_count: number;
};

function timeAgo(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffMins < 1) return 'הרגע';
  if (diffMins < 60) return `לפני ${diffMins} דקות`;
  if (diffHours < 24) return `לפני ${diffHours} שעות`;
  if (diffDays < 30) return `לפני ${diffDays} ימים`;
  return d.toLocaleDateString('he-IL');
}

export default function ChatPage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [incoming, setIncoming] = useState<IncomingRequest[]>([]);

  const handleAuthAction = (mode: 'login' | 'register') => {
    if (mode === 'login') {
      setIsRegisterModalOpen(false);
      setIsLoginModalOpen(true);
    } else {
      setIsLoginModalOpen(false);
      setIsRegisterModalOpen(true);
    }
  };

  useEffect(() => {
    if (isLoginModalOpen || isRegisterModalOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
  }, [isLoginModalOpen, isRegisterModalOpen]);

  const [sent, setSent] = useState<OutgoingRequest[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'conversations' | 'requests' | 'pending'>('conversations');

  const { user, profile, loading: authLoading, signOut } = useAuth();

  const menuItems = [
    { label: 'ראשי', icon: Home, href: '/' },
    { label: 'סטטוסי', icon: Users, href: '/status' },
    { label: 'דיוני', icon: MessageSquare, href: '/discussions' },
    { label: 'שאלות', icon: HelpCircle, href: '/questions' },
    { label: 'סיפורי', icon: BookOpen, href: '/stories' },
  ];

  const fetchData = useCallback(async () => {
    if (!user) {
      setIncoming([]);
      setSent([]);
      setConversations([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [reqRes, convRes] = await Promise.all([
        fetch('/api/chat/requests'),
        fetch('/api/chat/conversations'),
      ]);
      const reqData = await reqRes.json();
      const convData = await convRes.json();
      if (reqRes.ok) {
        setIncoming(reqData.incoming || []);
        setSent(reqData.sent || []);
      }
      if (convRes.ok) setConversations(convData.conversations || []);
    } catch {
      setIncoming([]);
      setSent([]);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRespond = async (requestId: string, action: 'accept' | 'decline' | 'block') => {
    setRespondingId(requestId);
    try {
      const res = await fetch(`/api/chat/requests/${requestId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (res.ok) await fetchData();
    } finally {
      setRespondingId(null);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center" dir="rtl">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-gray-900 dark:text-gray-100" dir="rtl">
      <NavHeader
        title="צ'אט"
        wide
        onMenuClick={() => setIsDrawerOpen(!isDrawerOpen)}
        rightContent={
          !user && (
            <button
              onClick={() => handleAuthAction('login')}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <LogIn size={16} /> התחברות
            </button>
          )
        }
      />

      <Drawer
        isDrawerOpen={isDrawerOpen}
        setIsDrawerOpen={setIsDrawerOpen}
        menuItems={menuItems}
        user={user}
        profile={profile}
        onSignOut={signOut}
        onOpenLoginModal={() => {
          setIsDrawerOpen(false);
          setIsLoginModalOpen(true);
        }}
      />

      <main className="max-w-6xl mx-auto px-5 py-8">
        {!user ? (
          <div className="text-center py-12 text-gray-600 dark:text-gray-400">
            <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
            <p>התחבר כדי לראות בקשות צ\'אט ושיחות</p>
            <button
              onClick={() => handleAuthAction('login')}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              התחברות
            </button>
          </div>
        ) : loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 dark:border-indigo-400" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Tab bar */}
            <div className="bg-white/80 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
              <div className="flex border-b border-gray-200 dark:border-gray-700">
                {[
                  { id: 'conversations' as const, label: 'שיחות', icon: MessageSquare, count: conversations.filter((c) => (c.unread_count ?? 0) > 0).length },
                  { id: 'requests' as const, label: 'בקשות', icon: UserPlus, count: incoming.length },
                  { id: 'pending' as const, label: 'ממתינות', icon: Clock, count: sent.length },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 font-medium transition-all duration-300 ${
                      activeTab === tab.id
                        ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50/50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <tab.icon size={18} />
                    {tab.label}
                    {(tab.count > 0) && (
                      <span className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs min-w-[1.25rem] h-5 px-1.5 flex items-center justify-center rounded-full font-medium">
                        {tab.count > 99 ? '99+' : tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab content */}
            <div className="bg-white/80 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
              {activeTab === 'conversations' && (
                <>
                  <h2 className="px-6 py-4 text-lg font-bold text-gray-800 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700">
                    שיחות
                  </h2>
                  {conversations.length === 0 ? (
                    <p className="px-6 py-6 text-gray-500 dark:text-gray-400 text-center">אין שיחות פעילות. שלח בקשת צ\'אט מפרופיל של משתמש.</p>
                  ) : (
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                      {conversations.map((c) => (
                        <li key={c.id}>
                          <Link
                            href={`/chat/${c.id}`}
                            className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                          >
                            {c.otherUser.avatar_url ? (
                              <Image src={c.otherUser.avatar_url} alt="" width={44} height={44} className="w-11 h-11 rounded-full object-cover border border-gray-200 dark:border-gray-600 flex-shrink-0" />
                            ) : (
                              <div className="w-11 h-11 rounded-full bg-indigo-200 dark:bg-indigo-800 flex items-center justify-center flex-shrink-0">
                                <User size={22} className="text-indigo-700 dark:text-indigo-300" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-800 dark:text-gray-100 truncate">{c.otherUser.full_name || c.otherUser.username}</p>
                              {c.lastMessage && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{c.lastMessage.content}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {c.lastMessage && (
                                <span className="text-xs text-gray-400 dark:text-gray-500">{timeAgo(c.lastMessage.created_at)}</span>
                              )}
                              {(c.unread_count ?? 0) > 0 && (
                                <span className="bg-[#6633cc] text-white text-xs min-w-[1.25rem] h-5 px-2 flex items-center justify-center rounded-full font-medium">
                                  {c.unread_count > 99 ? '99+' : c.unread_count}
                                </span>
                              )}
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}

              {activeTab === 'requests' && (
                <>
                  <h2 className="px-6 py-4 text-lg font-bold text-gray-800 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700">
                    בקשות נכנסות
                  </h2>
                  {incoming.length === 0 ? (
                    <p className="px-6 py-6 text-gray-500 dark:text-gray-400 text-center">אין בקשות חדשות</p>
                  ) : (
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                      {incoming.map((r) => (
                        <li key={r.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <Link href={`/profile/${encodeURIComponent(r.sender.username)}`} className="flex-shrink-0">
                            {r.sender.avatar_url ? (
                              <Image src={r.sender.avatar_url} alt="" width={44} height={44} className="w-11 h-11 rounded-full object-cover border border-gray-200 dark:border-gray-600" />
                            ) : (
                              <div className="w-11 h-11 rounded-full bg-indigo-200 dark:bg-indigo-800 flex items-center justify-center">
                                <User size={22} className="text-indigo-700 dark:text-indigo-300" />
                              </div>
                            )}
                          </Link>
                          <div className="flex-1 min-w-0">
                            <Link href={`/profile/${encodeURIComponent(r.sender.username)}`} className="font-medium text-gray-800 dark:text-gray-100 hover:underline">
                              {r.sender.full_name || r.sender.username}
                            </Link>
                            <p className="text-sm text-gray-500 dark:text-gray-400">@{r.sender.username}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{timeAgo(r.created_at)}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              onClick={() => handleRespond(r.id, 'accept')}
                              disabled={respondingId === r.id}
                              className="p-2 rounded-lg bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/70 disabled:opacity-50"
                              title="אישור"
                            >
                              <CheckCircle size={20} />
                            </button>
                            <button
                              onClick={() => handleRespond(r.id, 'decline')}
                              disabled={respondingId === r.id}
                              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
                              title="דחייה"
                            >
                              <X size={20} />
                            </button>
                            <button
                              onClick={() => handleRespond(r.id, 'block')}
                              disabled={respondingId === r.id}
                              className="p-2 rounded-lg bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/70 disabled:opacity-50"
                              title="חסימה"
                            >
                              <Shield size={20} />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}

              {activeTab === 'pending' && (
                <>
                  <h2 className="px-6 py-4 text-lg font-bold text-gray-800 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700">
                    בקשות שנשלחו
                  </h2>
                  {sent.length === 0 ? (
                    <p className="px-6 py-6 text-gray-500 dark:text-gray-400 text-center">אין בקשות שנשלחו וממתינות</p>
                  ) : (
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                      {sent.map((r) => (
                        <li key={r.id}>
                          <Link
                            href={`/profile/${encodeURIComponent(r.receiver.username)}`}
                            className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                          >
                            {r.receiver.avatar_url ? (
                              <Image src={r.receiver.avatar_url} alt="" width={44} height={44} className="w-11 h-11 rounded-full object-cover border border-gray-200 dark:border-gray-600 flex-shrink-0" />
                            ) : (
                              <div className="w-11 h-11 rounded-full bg-indigo-200 dark:bg-indigo-800 flex items-center justify-center flex-shrink-0">
                                <User size={22} className="text-indigo-700 dark:text-indigo-300" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-800 dark:text-gray-100 truncate">{r.receiver.full_name || r.receiver.username}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">@{r.receiver.username}</p>
                              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">ממתין לתשובה · {timeAgo(r.created_at)}</p>
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </main>

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSwitchToRegister={() => {
          setIsLoginModalOpen(false);
          setIsRegisterModalOpen(true);
        }}
      />
      <RegisterModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSwitchToLogin={() => {
          setIsRegisterModalOpen(false);
          setIsLoginModalOpen(true);
        }}
        canClose={false}
      />
    </div>
  );
}
