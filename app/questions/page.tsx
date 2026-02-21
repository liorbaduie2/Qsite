"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { 
  MessageSquare, Users, HelpCircle, BookOpen, Home, Plus, 
  Search, Filter, Eye, MessageCircle, ArrowUp, ArrowDown, Star, 
  User, LogIn 
} from 'lucide-react';
import { useAuth } from '../components/AuthProvider';
import AuthModal from '../components/AuthModal';
import Drawer from '../components/Drawer';
import NavHeader from '../components/NavHeader';
import NewQuestionModal from '../components/NewQuestionModal';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Question {
  id: string;
  title: string;
  content: string;
  author: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
  replies: number;
  votes: number;
  views: number;
  createdAt: string;
  tags: string[];
  isAnswered: boolean;
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

const QuestionsPage = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isNewQuestionModalOpen, setIsNewQuestionModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [filterTag, setFilterTag] = useState('הכל');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const { user, profile, loading, signOut } = useAuth();
  const router = useRouter();

  const menuItems = [
    { label: 'ראשי', icon: Home, href: '/' },
    { label: 'סטטוסי', icon: Users, href: '/status' },
    { label: 'דיוני', icon: MessageSquare, href: '/discussions' },
    { label: 'שאלות', icon: HelpCircle, href: '/questions', active: true },
    { label: 'סיפורי', icon: BookOpen, href: '/stories' },
  ];

  const allTags = ['הכל', 'תכנות', 'עיצוב', 'קריירה', 'לימודים', 'טכנולוגי', 'פיתוח', 'React', 'Vue', 'JavaScript', 'CSS', 'HTML'];

  const fetchQuestions = useCallback(async () => {
    setLoadingQuestions(true);
    setFetchError(null);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.set('search', searchTerm);
      if (filterTag && filterTag !== 'הכל') params.set('tag', filterTag);
      params.set('sort', sortBy);

      const res = await fetch(`/api/questions?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        setFetchError(data.error || 'שגיאה בטעינת השאלות');
        return;
      }

      setQuestions(data.questions || []);
    } catch {
      setFetchError('שגיאה בחיבור לשרת');
    } finally {
      setLoadingQuestions(false);
    }
  }, [searchTerm, filterTag, sortBy]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const handleAuthAction = (mode: 'login' | 'register') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleNewQuestion = () => {
    if (!user) {
      handleAuthAction('login');
      return;
    }
    setIsNewQuestionModalOpen(true);
  };

  if (loading) {
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
      style={{ fontFamily: 'Assistant, system-ui, sans-serif' }}
    >
      <div 
        className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_20%_80%,rgba(99,102,241,0.1)_0%,transparent_50%),radial-gradient(circle_at_80%_20%,rgba(139,92,246,0.1)_0%,transparent_50%),radial-gradient(circle_at_40%_40%,rgba(236,72,153,0.05)_0%,transparent_50%)] dark:bg-[radial-gradient(circle_at_20%_80%,rgba(99,102,241,0.08)_0%,transparent_50%),radial-gradient(circle_at_80%_20%,rgba(139,92,246,0.08)_0%,transparent_50%)]"
      />

      <NavHeader
        title="שאלות ותשובות"
        wide
        onMenuClick={() => setIsDrawerOpen(!isDrawerOpen)}
        rightContent={
          !user ? (
            <div className="flex items-center gap-2">
              <button onClick={() => handleAuthAction('login')} className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-200 bg-white/60 dark:bg-gray-700/60 rounded-lg hover:bg-white/80 dark:hover:bg-gray-700/80 transition-all duration-300 border border-indigo-200 dark:border-indigo-800 hover:border-indigo-300 dark:hover:border-indigo-700">
                <LogIn size={16} /> התחברות
              </button>
              <button onClick={() => handleAuthAction('register')} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl">
                <User size={16} /> הרשמה
              </button>
            </div>
          ) : undefined
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

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-5 py-8">
        <div className="mb-8 text-center">
          <h2 className="text-4xl font-bold text-gray-800 dark:text-gray-100 mb-4 leading-tight">
            שאלות ותשובות
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
            מקום לשאול שאלות, לחלוק ידע ולקבל עזרה מהקהילה
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-8">
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
                <input
                  type="text"
                  placeholder="חפש שאלות..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pr-11 pl-4 py-3 border border-gray-300/50 dark:border-gray-600/50 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm transition-all duration-300 text-gray-800 dark:text-gray-200"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter size={20} className="text-gray-500 dark:text-gray-400" />
                <select
                  value={filterTag}
                  onChange={(e) => setFilterTag(e.target.value)}
                  className="px-4 py-3 border border-gray-300/50 dark:border-gray-600/50 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm transition-all duration-300 text-gray-800 dark:text-gray-200"
                >
                  {allTags.map(tag => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 border border-gray-300/50 dark:border-gray-600/50 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm transition-all duration-300 text-gray-800 dark:text-gray-200"
              >
                <option value="newest">החדשות ביותר</option>
                <option value="oldest">הישנות ביותר</option>
                <option value="votes">הכי מצוינות</option>
                <option value="replies">הכי פופולריות</option>
                <option value="views">הכי נצפות</option>
              </select>
            </div>
          </div>
        </div>

        {/* Questions List */}
        <div className="space-y-3">
          {loadingQuestions ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
            </div>
          ) : fetchError ? (
            <div className="text-center py-12">
              <div className="text-red-400 dark:text-red-500 mb-4">
                <HelpCircle size={48} className="mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-2">{fetchError}</h3>
              <button
                onClick={fetchQuestions}
                className="mt-4 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg"
              >
                נסה שוב
              </button>
            </div>
          ) : questions.length > 0 ? (
            questions.map((question) => (
              <div
                key={question.id}
                role="button"
                tabIndex={0}
                onClick={() => router.push(`/questions/${question.id}`)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.push(`/questions/${question.id}`); } }}
                className="block bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-5 hover:shadow-2xl transition-all duration-300 hover:scale-[1.01] group cursor-pointer"
              >
                <div className="flex gap-5 items-center">
                  {/* Vote count */}
                  <div className="flex flex-col items-center gap-1 min-w-[50px]">
                    <ArrowUp size={18} className="text-gray-400 dark:text-gray-500 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors" />
                    <span className="font-bold text-lg text-gray-800 dark:text-gray-100">{question.votes}</span>
                    <ArrowDown size={18} className="text-gray-400 dark:text-gray-500 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors" />
                  </div>

                  {/* Title + meta */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
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

                  {/* Right meta */}
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">
                    <div className="flex items-center gap-3">
                      {question.author.username ? (
                        <Link
                          href={`/profile/${encodeURIComponent(question.author.username)}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-3 hover:opacity-90 transition-opacity"
                        >
                          {question.author.avatar_url ? (
                            <Image
                              src={question.author.avatar_url}
                              alt={question.author.username}
                              width={24}
                              height={24}
                              className="w-6 h-6 rounded-full object-cover border border-gray-200 dark:border-gray-600"
                            />
                          ) : (
                            <div className="w-6 h-6 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center">
                              <User size={12} className="text-white" />
                            </div>
                          )}
                          <span className="font-medium text-gray-600 dark:text-gray-300 text-sm hidden sm:inline">{question.author.username}</span>
                        </Link>
                      ) : (
                        <>
                          {question.author.avatar_url ? (
                            <Image
                              src={question.author.avatar_url}
                              alt=""
                              width={24}
                              height={24}
                              className="w-6 h-6 rounded-full object-cover border border-gray-200 dark:border-gray-600"
                            />
                          ) : (
                            <div className="w-6 h-6 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center">
                              <User size={12} className="text-white" />
                            </div>
                          )}
                          <span className="font-medium text-gray-600 dark:text-gray-300 text-sm hidden sm:inline">{question.author.username}</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-1" title="תגובות">
                      <MessageCircle size={15} />
                      <span>{question.replies}</span>
                    </div>
                    <div className="flex items-center gap-1" title="צפיות">
                      <Eye size={15} />
                      <span>{question.views}</span>
                    </div>
                    <span className="text-xs text-gray-400 dark:text-gray-500 hidden md:inline">{timeAgo(question.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 dark:text-gray-500 mb-4">
                <HelpCircle size={48} className="mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">
                אין שאלות עדיין
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                היה הראשון לשאול שאלה ולהתחיל את השיח
              </p>
              <button
                onClick={handleNewQuestion}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                שאל שאלה חדשה
              </button>
            </div>
          )}
        </div>
      </main>

      {isAuthModalOpen && (
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          initialMode={authModalMode}
        />
      )}

      {isNewQuestionModalOpen && (
        <NewQuestionModal
          isOpen={isNewQuestionModalOpen}
          onClose={() => setIsNewQuestionModalOpen(false)}
          onQuestionCreated={fetchQuestions}
        />
      )}

    </div>
  );
};

export default QuestionsPage;
