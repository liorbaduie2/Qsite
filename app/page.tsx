//app/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { MessageSquare, Users, HelpCircle, BookOpen, Home, LogIn, User, Eye, MessageCircle, ArrowUp, ArrowDown, Star } from 'lucide-react';
import { useAuth } from './components/AuthProvider';
import LoginModal from './components/LoginModal';
import HebrewRegistration from './components/HebrewRegistration';
import Drawer from './components/Drawer';
import NavHeader from './components/NavHeader';
import Image from 'next/image';
import AuthStatusDisplay from './components/AuthStatusDisplay';
import { SimpleThemeToggle } from './components/SimpleThemeToggle';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Development-only ProfileTestComponent
function ProfileTestComponent() {
  // Only show in development
  if (process.env.NODE_ENV === 'production') return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      background: 'rgba(0,0,0,0.9)',
      color: 'white',
      padding: '10px',
      fontSize: '12px',
      zIndex: 9999,
      borderRadius: '0 5px 0 0'
    }}>
      🧪 Dev Debug Mode
    </div>
  );
}

interface TopQuestion {
  id: string;
  title: string;
  content: string;
  votes: number;
  replies: number;
  views: number;
  createdAt: string;
  isAnswered?: boolean;
  author: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
  tags: string[];
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

export default function ForumHomepage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [topQuestions, setTopQuestions] = useState<TopQuestion[]>([]);
  const [loadingTopQuestions, setLoadingTopQuestions] = useState(true);
  const [topQuestionsError, setTopQuestionsError] = useState<string | null>(null);

  const { user, profile, loading, signOut } = useAuth();
  const router = useRouter();
  const [userVotes, setUserVotes] = useState<Record<string, 1 | -1 | 0>>({});
  const [updatingVoteId, setUpdatingVoteId] = useState<string | null>(null);
  const isGuest = !user;

  useEffect(() => {
    if (isRegisterModalOpen || isLoginModalOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
  }, [isRegisterModalOpen, isLoginModalOpen]);

  const menuItems = [
    { label: 'ראשי', icon: Home, href: '/', active: true },
    { label: 'סטטוסי', icon: Users, href: '/status' },
    { label: 'דיוני', icon: MessageSquare, href: '/discussions' },
    { label: 'שאלות', icon: HelpCircle, href: '/questions' },
    { label: 'סיפורי', icon: BookOpen, href: '/stories' },
  ];

  useEffect(() => {
    async function loadTopQuestions() {
      setLoadingTopQuestions(true);
      setTopQuestionsError(null);
      try {
        const res = await fetch('/api/questions?sort=votes&limit=5');
        const data = await res.json();

        if (!res.ok) {
          setTopQuestionsError(data.error || 'שגיאה בטעינת השאלות המובילות');
          return;
        }

        setTopQuestions(data.questions || []);
      } catch {
        setTopQuestionsError('שגיאה בטעינת השאלות המובילות');
      } finally {
        setLoadingTopQuestions(false);
      }
    }

    loadTopQuestions();
  }, []);

  const handleLogin = () => setIsLoginModalOpen(true);
  const handleRegister = () => setIsRegisterModalOpen(true);

  const handleVote = async (
    event: React.MouseEvent,
    questionId: string,
    voteType: 1 | -1
  ) => {
    event.stopPropagation();
    if (!user) {
      handleLogin();
      return;
    }
    setUpdatingVoteId(questionId);
    try {
      const res = await fetch(`/api/questions/${questionId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voteType }),
      });
      const data = await res.json();
      if (!res.ok) return;
      setTopQuestions((prev) =>
        prev.map((q) =>
          q.id === questionId ? { ...q, votes: data.votes ?? q.votes } : q
        )
      );
      setUserVotes((prev) => ({ ...prev, [questionId]: voteType }));
    } catch {
      // leave as-is
    } finally {
      setUpdatingVoteId(null);
    }
  };
  const closeLoginModal = () => setIsLoginModalOpen(false);
  const closeRegisterModal = () => setIsRegisterModalOpen(false);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-slate-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100"
      dir="rtl"
      style={{ fontFamily: "'Assistant', 'Heebo', system-ui, sans-serif" }}
    >
      <NavHeader
        title="Q&A פלטפורמה"
        wide
        onMenuClick={() => setIsDrawerOpen(!isDrawerOpen)}
        topContent={!user ? <AuthStatusDisplay className="bg-white/90 dark:bg-gray-800/90 border-b border-gray-200 dark:border-gray-700" showOnlyErrors={true} /> : undefined}
        rightContent={
          <>
            <SimpleThemeToggle />
            {!user && (
              <div className="flex items-center gap-2">
                <button onClick={handleLogin} className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-200 bg-white/60 dark:bg-gray-700/60 rounded-lg hover:bg-white/80 dark:hover:bg-gray-700/80 transition-all duration-300 border border-indigo-200 dark:border-indigo-800 hover:border-indigo-300">
                  <LogIn size={16} /> התחברות
                </button>
                <button onClick={handleRegister} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl">
                  <User size={16} /> הרשמה
                </button>
              </div>
            )}
          </>
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

      <main className="max-w-6xl mx-auto px-5 py-8">
        <section className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
              השאלות המדורגות ביותר
            </h3>
            <Link
              href="/questions"
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
            >
              צפה בכל השאלות
            </Link>
          </div>

          {loadingTopQuestions ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 dark:border-indigo-400" />
            </div>
          ) : topQuestionsError ? (
            <div className="text-center py-6">
              <p className="text-sm text-red-500 dark:text-red-400 mb-2">
                {topQuestionsError}
              </p>
            </div>
          ) : topQuestions.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                עדיין אין שאלות, תהיה הראשון לשאול שאלה!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {topQuestions.map((question) => {
                  const isInteractive = !!user;
                  return (
                  <div
                    key={question.id}
                    role={isInteractive ? 'button' : undefined}
                    tabIndex={isInteractive ? 0 : -1}
                    onClick={isInteractive ? () => router.push(`/questions/${question.id}`) : undefined}
                    onKeyDown={isInteractive ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        router.push(`/questions/${question.id}`);
                      }
                    } : undefined}
                    className={`block bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden hover:shadow-2xl transition-all duration-300 ${isInteractive ? 'hover:scale-[1.01] cursor-pointer' : 'cursor-default opacity-100'}`}
                  >
                    <div className="flex flex-row min-h-[120px]" style={{ direction: 'ltr' }}>
                      {/* Left: vertical voting column */}
                      <div className="flex flex-col items-center justify-center gap-0.5 min-w-[64px] py-4 px-3 border-r border-gray-200/80 dark:border-gray-600/80 bg-gray-50/80 dark:bg-gray-900/50">
                        <button
                          type="button"
                          onClick={user ? (e) => handleVote(e, question.id, 1) : undefined}
                          disabled={isGuest || updatingVoteId === question.id}
                          className={`p-1.5 rounded-md transition-colors ${isGuest ? 'cursor-not-allowed opacity-60' : 'hover:bg-indigo-100 dark:hover:bg-indigo-900/50'}`}
                        >
                          <ArrowUp
                            size={20}
                            className={
                              (userVotes[question.id] === 1
                                ? 'text-indigo-600 dark:text-indigo-400'
                                : 'text-gray-400 dark:text-gray-500') +
                              ' group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors'
                            }
                          />
                        </button>
                        <span className="font-bold text-lg text-gray-800 dark:text-gray-100 py-0.5 select-none">
                          {question.votes}
                        </span>
                        <button
                          type="button"
                          onClick={user ? (e) => handleVote(e, question.id, -1) : undefined}
                          disabled={isGuest || updatingVoteId === question.id}
                          className={`p-1.5 rounded-md transition-colors ${isGuest ? 'cursor-not-allowed opacity-60' : 'hover:bg-indigo-100 dark:hover:bg-indigo-900/50'}`}
                        >
                          <ArrowDown
                            size={20}
                            className={
                              (userVotes[question.id] === -1
                                ? 'text-indigo-600 dark:text-indigo-400'
                                : 'text-gray-400 dark:text-gray-500') +
                              ' group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors'
                            }
                          />
                        </button>
                      </div>

                      {/* Right: main content area */}
                      <div
                        className="flex-1 min-w-0 flex flex-col justify-between pr-6 pl-4 py-4 text-right"
                        style={{ direction: 'rtl' }}
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            {question.isAnswered && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-700">
                                <Star size={12} className="ml-1" fill="currentColor" />
                                נענתה
                              </span>
                            )}
                            {question.tags.length > 0 && question.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800"
                              >
                                {tag}
                              </span>
                            ))}
                            {question.tags.length > 3 && (
                              <span className="text-xs text-gray-400 dark:text-gray-500">+{question.tags.length - 3}</span>
                            )}
                          </div>
                          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300 leading-snug">
                            {question.title}
                          </h3>
                        </div>

                        <div className="flex items-center justify-start gap-3 text-sm text-gray-500 dark:text-gray-400 mt-1 pt-1.5 border-t border-gray-100 dark:border-gray-700/70">
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
                              'אנונימי'
                            )}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">{timeAgo(question.createdAt)}</span>
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
                )})}
            </div>
          )}
        </section>
      </main>

      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={closeLoginModal}
        onSwitchToRegister={() => {
          closeLoginModal();
          setIsRegisterModalOpen(true);
        }}
      />

      {isRegisterModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="w-full max-w-2xl max-h-[95vh] overflow-y-auto relative modal-scroll">
            <button
              onClick={closeRegisterModal}
              className="absolute top-2 right-2 z-20 bg-white/90 dark:bg-gray-700/90 backdrop-blur-sm rounded-full w-12 h-12 flex items-center justify-center shadow-lg hover:bg-white dark:hover:bg-gray-600 hover:shadow-xl transition-all duration-200 group"
              style={{ direction: 'ltr' }}
            >
              <svg className="w-6 h-6 text-gray-600 dark:text-gray-300 group-hover:text-gray-800 dark:group-hover:text-gray-100 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/20 dark:border-gray-700/20">
              <div 
                className="text-center p-8 text-white relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)' }}
              >
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-16 -translate-y-16"></div>
                  <div className="absolute bottom-0 right-0 w-24 h-24 bg-white rounded-full translate-x-12 translate-y-12"></div>
                </div>
                
                <div className="relative z-10">
                  <h2 className="text-4xl font-bold mb-3 drop-shadow-lg">הצטרפות לקהילה</h2>
                  <p className="text-white/90 text-lg font-medium">
                    רישום לפלטפורמת השאלות והתשובות של המפתחים הישראלים
                  </p>
                </div>
              </div>

              <div className="p-8 bg-gray-50/50 dark:bg-gray-900/50">
                <HebrewRegistration onComplete={closeRegisterModal} />
                
                <div className="mt-8 text-center">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300/60 dark:border-gray-600/60"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-gray-50/50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400 font-medium">
                        או
                      </span>
                    </div>
                  </div>
                  
                  <p className="mt-6 text-sm text-gray-600 dark:text-gray-400" dir="rtl">
                    יש לך כבר חשבון?{' '}
                    <button 
                      onClick={() => {
                        closeRegisterModal();
                        setIsLoginModalOpen(true);
                      }}
                      className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-bold transition-colors duration-200 hover:underline"
                    >
                      התחבר כאן
                    </button>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <ProfileTestComponent />

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Assistant:wght@300;400;600;700&family=Heebo:wght@400;500;700&display=swap');
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .modal-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(99, 102, 241, 0.3) transparent;
        }
        
        .modal-scroll::-webkit-scrollbar { width: 6px; }
        .modal-scroll::-webkit-scrollbar-track { background: transparent; }
        .modal-scroll::-webkit-scrollbar-thumb {
          background-color: rgba(99, 102, 241, 0.3);
          border-radius: 3px;
        }

        body.modal-open { overflow: hidden; }
      `}</style>
    </div>
  );
}