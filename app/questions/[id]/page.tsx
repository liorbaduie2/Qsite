"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Menu, MessageSquare, Users, HelpCircle, BookOpen, Home,
  ArrowUp, ArrowDown, Star, User, LogIn, Eye, MessageCircle,
  ChevronRight, Clock, Shield, Send, CheckCircle, Pencil, X, Plus, Reply
} from 'lucide-react';
import { useAuth } from '../../components/AuthProvider';
import AuthModal from '../../components/AuthModal';
import Drawer from '../../components/Drawer';

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
  author: {
    id: string;
    username: string;
    avatar_url: string | null;
    reputation: number;
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
  replies?: Answer[];
  author: {
    id: string;
    username: string;
    avatar_url: string | null;
    reputation: number;
  };
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

function buildAnswerTree(flat: Answer[]): Answer[] {
  const byId = new Map<string, Answer>();
  const roots: Answer[] = [];
  flat.forEach((a) => {
    byId.set(a.id, { ...a, replies: [] });
  });
  flat.forEach((a) => {
    const node = byId.get(a.id)!;
    if (!a.parentAnswerId) {
      roots.push(node);
    } else {
      const parent = byId.get(a.parentAnswerId);
      if (parent) {
        parent.replies = parent.replies || [];
        parent.replies.push(node);
      } else {
        roots.push(node);
      }
    }
  });
  const sortByDate = (arr: Answer[]) =>
    arr.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  sortByDate(roots);
  function sortReplies(nodes: Answer[]) {
    nodes.forEach((n) => {
      if (n.replies?.length) {
        sortByDate(n.replies);
        sortReplies(n.replies);
      }
    });
  }
  sortReplies(roots);
  return roots;
}

export default function QuestionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [question, setQuestion] = useState<QuestionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [answers, setAnswers] = useState<Answer[]>([]);
  const [answersLoading, setAnswersLoading] = useState(true);
  const [answerContent, setAnswerContent] = useState('');
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [answerError, setAnswerError] = useState<string | null>(null);

  const [isAnswerPanelOpen, setIsAnswerPanelOpen] = useState(false);

  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  const { user, profile, loading: authLoading, signOut } = useAuth();

  const menuItems = [
    { label: 'ראשי', icon: Home, href: '/' },
    { label: 'סטטוסי', icon: Users, href: '/status' },
    { label: 'דיוני', icon: MessageSquare, href: '/discussions' },
    { label: 'שאלות', icon: HelpCircle, href: '/questions', active: true },
    { label: 'סיפורי', icon: BookOpen, href: '/stories' },
  ];

  useEffect(() => {
    async function fetchQuestion() {
      try {
        const res = await fetch(`/api/questions/${id}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || 'שגיאה בטעינת השאלה');
          return;
        }

        setQuestion(data.question);
      } catch {
        setError('שגיאה בחיבור לשרת');
      } finally {
        setLoading(false);
      }
    }

    if (id) fetchQuestion();
  }, [id]);

  const fetchAnswers = useCallback(async () => {
    if (!id) return;
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
  }, [id]);

  useEffect(() => {
    fetchAnswers();
  }, [fetchAnswers]);

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answerContent.trim()) return;

    if (!user) {
      handleAuthAction('login');
      return;
    }

    setSubmittingAnswer(true);
    setAnswerError(null);
    try {
      const res = await fetch(`/api/questions/${id}/answers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: answerContent.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setAnswerError(data.error || 'שגיאה בשליחת התשובה');
        return;
      }

      setAnswerContent('');
      setIsAnswerPanelOpen(false);
      fetchAnswers();
    } catch {
      setAnswerError('שגיאה בחיבור לשרת');
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const answerTree = React.useMemo(() => buildAnswerTree(answers), [answers]);

  const handleSubmitReply = async (e: React.FormEvent, parentAnswerId: string) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    if (!user) {
      handleAuthAction('login');
      return;
    }
    setSubmittingReply(true);
    setReplyError(null);
    try {
      const res = await fetch(`/api/questions/${id}/answers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyContent.trim(), parentAnswerId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setReplyError(data.error || 'שגיאה בשליחת התגובה');
        return;
      }
      setReplyContent('');
      setReplyingToId(null);
      fetchAnswers();
    } catch {
      setReplyError('שגיאה בחיבור לשרת');
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleAuthAction = (mode: 'login' | 'register') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen relative"
      dir="rtl"
      style={{
        fontFamily: 'Assistant, system-ui, sans-serif',
        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
        color: '#0f172a',
      }}
    >
      <div
        className="fixed inset-0 -z-10"
        style={{
          background: `
            radial-gradient(circle at 20% 80%, rgba(99, 102, 241, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(236, 72, 153, 0.05) 0%, transparent 50%)
          `,
        }}
      />

      {/* Header */}
      <header className="relative bg-white/80 backdrop-blur-xl shadow-xl border-b border-gray-200/20">
        <div className="max-w-6xl mx-auto px-5">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsDrawerOpen(!isDrawerOpen)}
                className="p-2 rounded-lg hover:bg-gray-100/60 transition-all duration-300 hover:scale-105"
              >
                <Menu size={20} />
              </button>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                שאלות ותשובות
              </h1>
            </div>

            <div className="flex items-center gap-3">
              {!user && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAuthAction('login')}
                    className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white/60 rounded-lg hover:bg-white/80 transition-all duration-300 border border-indigo-200 hover:border-indigo-300"
                  >
                    <LogIn size={16} />
                    התחברות
                  </button>
                  <button
                    onClick={() => handleAuthAction('register')}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    <User size={16} />
                    הרשמה
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <Drawer
        isDrawerOpen={isDrawerOpen}
        setIsDrawerOpen={setIsDrawerOpen}
        menuItems={menuItems}
        user={user}
        profile={profile}
        onSignOut={handleSignOut}
      />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-5 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/questions" className="hover:text-indigo-600 transition-colors">
            שאלות ותשובות
          </Link>
          <ChevronRight size={14} className="rotate-180" />
          <span className="text-gray-400 truncate max-w-xs">
            {question?.title || 'שאלה'}
          </span>
        </nav>

        {error ? (
          <div className="text-center py-16">
            <HelpCircle size={48} className="mx-auto text-red-400 mb-4" />
            <h3 className="text-xl font-semibold text-red-600 mb-2">{error}</h3>
            <Link
              href="/questions"
              className="inline-block mt-4 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg"
            >
              חזרה לשאלות
            </Link>
          </div>
        ) : question ? (
          <div className="space-y-6">
            {/* Question Card */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden">
              <div className="flex">
                {/* Vote sidebar */}
                <div className="flex flex-col items-center gap-1 px-4 py-6 bg-gray-50/80 border-l border-gray-200/50">
                  <button className="p-2 hover:bg-indigo-50 rounded-lg transition-colors">
                    <ArrowUp size={22} className="text-gray-500 hover:text-indigo-600" />
                  </button>
                  <span className="font-bold text-xl text-gray-800">{question.votes}</span>
                  <button className="p-2 hover:bg-indigo-50 rounded-lg transition-colors">
                    <ArrowDown size={22} className="text-gray-500 hover:text-indigo-600" />
                  </button>
                  {question.isAnswered && (
                    <div className="mt-3 p-1.5 bg-green-100 rounded-full" title="נענתה">
                      <Star size={18} className="text-green-600" fill="currentColor" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 p-6">
                  {/* Status badges */}
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    {question.isAnswered && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
                        נענתה
                      </span>
                    )}
                    {question.isPinned && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                        נעוצה
                      </span>
                    )}
                    {question.isClosed && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
                        סגורה
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h1 className="text-2xl font-bold text-gray-900 mb-4 leading-snug">
                    {question.title}
                  </h1>

                  {/* Content body */}
                  <div className="prose prose-gray max-w-none mb-6 text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {question.content}
                  </div>

                  {/* Tags */}
                  {question.tags.length > 0 && (
                    <div className="flex gap-2 mb-5 flex-wrap">
                      {question.tags.map((tag) => (
                        <Link
                          key={tag}
                          href={`/questions?tag=${encodeURIComponent(tag)}`}
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 border border-indigo-200 hover:bg-indigo-200 transition-colors"
                        >
                          {tag}
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Meta bar */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    {/* Author */}
                    <div className="flex items-center gap-3">
                      {question.author.avatar_url ? (
                        <Image
                          src={question.author.avatar_url}
                          alt={question.author.username}
                          width={36}
                          height={36}
                          className="w-9 h-9 rounded-full object-cover border border-gray-200"
                        />
                      ) : (
                        <div className="w-9 h-9 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center">
                          <User size={16} className="text-white" />
                        </div>
                      )}
                      <div>
                        <span className="font-semibold text-gray-800">{question.author.username}</span>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Shield size={11} />
                          <span>{question.author.reputation} נקודות</span>
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1" title="תגובות">
                        <MessageCircle size={15} />
                        <span>{question.replies}</span>
                      </div>
                      <div className="flex items-center gap-1" title="צפיות">
                        <Eye size={15} />
                        <span>{question.views}</span>
                      </div>
                      <div className="flex items-center gap-1" title="פורסם">
                        <Clock size={15} />
                        <span>{timeAgo(question.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Answers Section */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <MessageCircle size={22} className="text-indigo-500" />
                תשובות ({answerTree.length})
                {answers.length > answerTree.length && (
                  <span className="text-sm font-normal text-gray-500">
                    ({answers.length} כולל תגובות)
                  </span>
                )}
              </h2>

              {answersLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : answerTree.length > 0 ? (
                <div className="space-y-4">
                  {(() => {
                    const q = question!;
                    function renderAnswerNode(node: Answer, isTopLevel: boolean): React.ReactNode {
                      const isOP = node.author.id === q.author.id;
                      return (
                        <div key={node.id} className={isTopLevel ? '' : 'mr-6 border-r-2 border-indigo-100 pr-4 mt-3'}>
                          <div
                            className={`rounded-xl border transition-all ${
                              isTopLevel ? 'p-5' : 'p-4 rounded-r-lg bg-gray-50/60 border-gray-200/50'
                            } ${
                              node.isAccepted && isTopLevel
                                ? 'bg-green-50/60 border-green-200'
                                : isTopLevel
                                  ? 'bg-white/60 border-gray-200/50'
                                  : ''
                            }`}
                          >
                            <div className="flex gap-4">
                              {isTopLevel && (
                                <div className="flex flex-col items-center gap-0.5 min-w-[40px]">
                                  <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                                    <ArrowUp size={18} className="text-gray-400 hover:text-indigo-600" />
                                  </button>
                                  <span className="font-bold text-gray-700">{node.votes}</span>
                                  <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                                    <ArrowDown size={18} className="text-gray-400 hover:text-indigo-600" />
                                  </button>
                                  {node.isAccepted && (
                                    <CheckCircle size={20} className="text-green-600 mt-1" fill="currentColor" />
                                  )}
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div
                                  className={`text-gray-700 leading-relaxed whitespace-pre-wrap mb-4 ${!isTopLevel ? 'text-sm' : ''}`}
                                >
                                  {node.content}
                                </div>

                                <div className="flex items-center justify-between pt-3 border-t border-gray-100 flex-wrap gap-2">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    {node.author.avatar_url ? (
                                      <Image
                                        src={node.author.avatar_url}
                                        alt={node.author.username}
                                        width={isTopLevel ? 28 : 24}
                                        height={isTopLevel ? 28 : 24}
                                        className={`rounded-full object-cover border border-gray-200 ${isTopLevel ? 'w-7 h-7' : 'w-6 h-6'}`}
                                      />
                                    ) : (
                                      <div
                                        className={`bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center ${isTopLevel ? 'w-7 h-7' : 'w-6 h-6'}`}
                                      >
                                        <User size={isTopLevel ? 12 : 10} className="text-white" />
                                      </div>
                                    )}
                                    <span className={`font-semibold text-gray-800 ${isTopLevel ? 'text-sm' : 'text-sm'}`}>
                                      {node.author.username}
                                    </span>
                                    {isOP && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200">
                                        שואל השאלה
                                      </span>
                                    )}
                                    <span className="text-xs text-gray-400 flex items-center gap-1">
                                      <Shield size={10} />
                                      {node.author.reputation}
                                    </span>
                                    {node.isEdited && (
                                      <span className="text-xs text-gray-400 flex items-center gap-0.5">
                                        <Pencil size={10} />
                                        נערך
                                      </span>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (!user) {
                                          handleAuthAction('login');
                                          return;
                                        }
                                        setReplyingToId(node.id);
                                        setReplyError(null);
                                      }}
                                      className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                                    >
                                      <Reply size={isTopLevel ? 14 : 12} />
                                      הגב
                                    </button>
                                  </div>
                                  <span className="text-xs text-gray-400">{timeAgo(node.createdAt)}</span>
                                </div>

                                {replyingToId === node.id && (
                                  <form
                                    onSubmit={(e) => handleSubmitReply(e, node.id)}
                                    className="mt-4 pt-4 border-t border-gray-100"
                                  >
                                    <textarea
                                      value={replyContent}
                                      onChange={(e) => setReplyContent(e.target.value)}
                                      placeholder="כתוב תגובה... (לפחות 10 תווים)"
                                      className="w-full min-h-[80px] p-3 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                                      autoFocus
                                      required
                                      minLength={10}
                                    />
                                    {replyError && (
                                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                                        {replyError}
                                      </div>
                                    )}
                                    <div className="flex items-center gap-2 mt-2">
                                      <button
                                        type="submit"
                                        disabled={replyContent.trim().length < 10 || submittingReply}
                                        className="flex items-center gap-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                        {submittingReply ? (
                                          <>
                                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            שולח...
                                          </>
                                        ) : (
                                          <>
                                            <Send size={14} />
                                            שלח תגובה
                                          </>
                                        )}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setReplyingToId(null);
                                          setReplyContent('');
                                          setReplyError(null);
                                        }}
                                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
                                      >
                                        ביטול
                                      </button>
                                    </div>
                                  </form>
                                )}
                              </div>
                            </div>
                          </div>

                          {node.replies && node.replies.length > 0 && (
                            <div className="space-y-1">
                              {node.replies.map((reply) => renderAnswerNode(reply, false))}
                            </div>
                          )}
                        </div>
                      );
                    }
                    return answerTree.map((answer) => renderAnswerNode(answer, true));
                  })()}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-400">
                  <MessageCircle size={36} className="mx-auto mb-2 opacity-50" />
                  <p className="text-gray-500">אין תשובות עדיין. היה הראשון לענות!</p>
                </div>
              )}
            </div>

          </div>
        ) : null}
      </main>

      {isAuthModalOpen && (
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          initialMode={authModalMode}
        />
      )}

      {/* Fixed "Write Answer" button on the right side */}
      {!isAnswerPanelOpen && question && (
        <button
          onClick={() => {
            if (!user) {
              handleAuthAction('login');
              return;
            }
            setIsAnswerPanelOpen(true);
          }}
          className="fixed left-6 bottom-8 z-40 flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 font-medium"
        >
          <Plus size={18} />
          כתוב תשובה
        </button>
      )}

      {/* Answer Modal (centered) */}
      {isAnswerPanelOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsAnswerPanelOpen(false)}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-modal-in overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-l from-indigo-50 to-white flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Send size={20} className="text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">כתוב תשובה</h3>
                  <p className="text-xs text-gray-500 truncate max-w-[400px]">{question?.title}</p>
                </div>
              </div>
              <button
                onClick={() => setIsAnswerPanelOpen(false)}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmitAnswer} className="flex-1 flex flex-col p-6 gap-4 overflow-y-auto">
              <label className="font-semibold text-gray-700">התשובה שלך</label>
              <textarea
                value={answerContent}
                onChange={(e) => setAnswerContent(e.target.value)}
                placeholder="שתף את התשובה שלך כאן... (לפחות 10 תווים)"
                className="flex-1 min-h-[200px] p-4 text-base bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-colors resize-none"
                autoFocus
                required
                minLength={10}
              />

              {answerError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {answerError}
                </div>
              )}

              <div className="text-xs text-gray-400">
                {answerContent.length} תווים
              </div>

              {/* Footer */}
              <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={answerContent.trim().length < 10 || submittingAnswer}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {submittingAnswer ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      שולח...
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      פרסם תשובה
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setIsAnswerPanelOpen(false)}
                  className="px-5 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors font-medium"
                >
                  ביטול
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes modalIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .animate-modal-in {
          animation: modalIn 0.25s ease-out;
        }
      `}</style>
    </div>
  );
}
