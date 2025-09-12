"use client";

import React, { useState, useEffect } from 'react';
import { 
  Menu, X, MessageSquare, Users, HelpCircle, BookOpen, Home, Plus, 
  Search, Filter, Eye, MessageCircle, ArrowUp, ArrowDown, Star, 
  Clock, TrendingUp, User, LogIn, LogOut 
} from 'lucide-react';
import { useAuth } from '../components/AuthProvider';
import AuthModal from '../components/AuthModal';
import Drawer from '../components/Drawer';
import NewQuestionModal from '../components/NewQuestionModal';

interface Question {
  id: number;
  title: string;
  content: string;
  author: string;
  authorAvatar: string;
  replies: number;
  votes: number;
  views: number;
  time: string;
  tags: string[];
  isAnswered: boolean;
  acceptedAnswerId?: number;
}

const QuestionsPage = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isNewQuestionModalOpen, setIsNewQuestionModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [filterTag, setFilterTag] = useState('הכל');

  const { user, profile, loading, signOut } = useAuth();

  const menuItems = [
    { label: 'ראשי', icon: Home, href: '/' },
    { label: 'סטטוסי', icon: Users, href: '/status' },
    { label: 'דיונים', icon: MessageSquare, href: '/discussions' },
    { label: 'שאלות', icon: HelpCircle, href: '/questions', active: true },
    { label: 'סיפורים', icon: BookOpen, href: '/stories' },
  ];

  const allTags = ['הכל', 'תכנות', 'עיצוב', 'קריירה', 'לימודים', 'טכנולוגיה', 'פיתוח', 'React', 'Vue', 'JavaScript', 'CSS', 'HTML'];

  const questions: Question[] = [
    {
      id: 1,
      title: 'איך אני יכול ללמוד תכנות בצורה יעילה?',
      content: 'אני מתחיל בתכנות ורוצה לדעת מה הדרך הכי טובה להתחיל. יש המלצות על קורסים או משאבים?',
      author: 'דני כהן',
      authorAvatar: 'https://i.pravatar.cc/40?img=1',
      replies: 15,
      votes: 12,
      views: 234,
      time: 'לפני 2 שעות',
      tags: ['תכנות', 'לימודים', 'קריירה'],
      isAnswered: true,
      acceptedAnswerId: 5
    },
    {
      id: 2,
      title: 'מה ההבדל בין React ל-Vue?',
      content: 'אני צריך לבחור בין React ל-Vue לפרויקט הבא שלי. מה היתרונות והחסרונות של כל אחד?',
      author: 'שרה לוי',
      authorAvatar: 'https://i.pravatar.cc/40?img=2',
      replies: 8,
      votes: 6,
      views: 89,
      time: 'לפני 4 שעות',
      tags: ['React', 'Vue', 'פיתוח'],
      isAnswered: false
    },
    {
      id: 3,
      title: 'איך לעצב ממשק משתמש נוח ויעיל?',
      content: 'אני מעצב UI/UX ורוצה טיפים לעיצוב ממשק משתמש שיהיה נוח ויעיל למשתמשים.',
      author: 'מיכל אבידן',
      authorAvatar: 'https://i.pravatar.cc/40?img=3',
      replies: 12,
      votes: 18,
      views: 156,
      time: 'לפני יום',
      tags: ['עיצוב', 'UI/UX'],
      isAnswered: true,
      acceptedAnswerId: 8
    },
    {
      id: 4,
      title: 'מה החשיבות של בדיקות אוטומטיות בפיתוח?',
      content: 'שמעתי הרבה על חשיבות הבדיקות האוטומטיות אבל לא בטוח איך להתחיל עם זה.',
      author: 'יונתן ברין',
      authorAvatar: 'https://i.pravatar.cc/40?img=4',
      replies: 6,
      votes: 9,
      views: 78,
      time: 'לפני 2 ימים',
      tags: ['תכנות', 'בדיקות', 'פיתוח'],
      isAnswered: false
    },
    {
      id: 5,
      title: 'איך לנהל זמן בצורה יעילה כמפתח?',
      content: 'אני מתקשה לנהל את הזמן שלי בין פרויקטים שונים ולימוד טכנולוגיות חדשות.',
      author: 'אורי שמואל',
      authorAvatar: 'https://i.pravatar.cc/40?img=5',
      replies: 9,
      votes: 14,
      views: 112,
      time: 'לפני 3 ימים',
      tags: ['קריירה', 'ניהול זמן', 'פיתוח'],
      isAnswered: true
    }
  ];

  const handleAuthAction = (action: 'login' | 'register') => {
    setAuthModalMode(action);
    setIsAuthModalOpen(true);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const filteredQuestions = questions.filter(question => {
    const matchesSearch = question.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         question.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = filterTag === 'הכל' || question.tags.includes(filterTag);
    return matchesSearch && matchesTag;
  });

  const sortedQuestions = [...filteredQuestions].sort((a, b) => {
    switch (sortBy) {
      case 'votes':
        return b.votes - a.votes;
      case 'views':
        return b.views - a.views;
      case 'answers':
        return b.replies - a.replies;
      case 'newest':
      default:
        return new Date(b.time).getTime() - new Date(a.time).getTime();
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50" dir="rtl">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200/30 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-5 py-4">
          <div className="flex items-center justify-between">
            {/* Right side - Logo and Menu */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsDrawerOpen(true)}
                className="p-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <Menu size={20} />
              </button>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                פלטפורמת השאלות
              </h1>
            </div>

            {/* Center - Search */}
            <div className="flex-1 max-w-md mx-8">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="חפש שאלות..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 bg-white/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                />
              </div>
            </div>

            {/* Left side - User actions */}
            <div className="flex items-center gap-3">
              {user ? (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsNewQuestionModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    <Plus size={16} />
                    שאלה חדשה
                  </button>
                  <div className="flex items-center gap-2">
                    <img
                      src={profile?.avatar_url || `https://i.pravatar.cc/32?u=${user.email}`}
                      alt={profile?.username || 'משתמש'}
                      className="w-8 h-8 rounded-full ring-2 ring-indigo-200"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {profile?.username || 'משתמש'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAuthAction('login')}
                    className="flex items-center gap-2 px-4 py-2 text-indigo-600 bg-white/70 rounded-lg border border-indigo-200 hover:border-indigo-300 transition-all duration-300"
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

      {/* Enhanced Drawer Component */}
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
          <h2 className="text-4xl font-bold text-gray-800 mb-4 leading-tight">
            שאלות ותשובות
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            מקום בו תוכלו לשאול שאלות, לקבל תשובות מהקהילה ולשתף את הידע שלכם
          </p>
        </div>

        {/* Filters and Sort */}
        <div className="mb-8 bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-gray-200/30">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            {/* Sort Options */}
            <div className="flex items-center gap-2">
              <Filter className="text-gray-500" size={20} />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="newest">החדשות ביותר</option>
                <option value="votes">הכי מדורגות</option>
                <option value="views">הכי נצפות</option>
                <option value="answers">עם הכי הרבה תשובות</option>
              </select>
            </div>

            {/* Tag Filter */}
            <div className="flex flex-wrap gap-2">
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setFilterTag(tag)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-300 ${
                    filterTag === tag
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <MessageSquare size={16} />
                {sortedQuestions.length} שאלות
              </span>
            </div>
          </div>
        </div>

        {/* Questions List */}
        <div className="space-y-6">
          {sortedQuestions.map((question, index) => (
            <article 
              key={question.id} 
              className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-gray-200/30 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group cursor-pointer"
              style={{
                animationDelay: `${index * 0.1}s`,
                animation: 'slideInUp 0.6s ease-out forwards'
              }}
            >
              <div className="flex gap-4">
                {/* Vote Section */}
                <div className="flex flex-col items-center gap-2 min-w-16">
                  <button className="p-2 rounded-lg hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 transition-colors">
                    <ArrowUp size={20} />
                  </button>
                  <span 
                    className="text-xl font-bold px-3 py-1 rounded-lg"
                    style={{
                      background: question.votes > 10 ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(99, 102, 241, 0.1)',
                      color: question.votes > 10 ? '#ffffff' : '#6366f1'
                    }}
                  >
                    {question.votes}
                  </span>
                  <button className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                    <ArrowDown size={20} />
                  </button>
                </div>

                {/* Question Content */}
                <div className="flex-1">
                  {/* Header with status */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {question.isAnswered && (
                        <div className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                          <Star size={14} fill="currentColor" />
                          נענתה
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-gray-500 text-sm">
                        <Clock size={14} />
                        {question.time}
                      </div>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-gray-800 mb-3 group-hover:text-indigo-600 transition-colors line-clamp-2">
                    {question.title}
                  </h3>

                  {/* Content preview */}
                  <p className="text-gray-600 mb-4 line-clamp-2 leading-relaxed">
                    {question.content}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {question.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-sm font-medium hover:bg-indigo-100 transition-colors cursor-pointer"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    {/* Author */}
                    <div className="flex items-center gap-3">
                      <img
                        src={question.authorAvatar}
                        alt={question.author}
                        className="w-8 h-8 rounded-full ring-2 ring-gray-200"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        {question.author}
                      </span>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <MessageCircle size={16} />
                        {question.replies}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye size={16} />
                        {question.views}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Empty State */}
        {sortedQuestions.length === 0 && (
          <div className="text-center py-16">
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-12 shadow-lg border border-gray-200/30">
              <HelpCircle size={64} className="mx-auto text-gray-300 mb-6" />
              <h3 className="text-2xl font-bold text-gray-600 mb-4">
                לא נמצאו שאלות
              </h3>
              <p className="text-gray-500 mb-8">
                נסו לשנות את מונחי החיפוש או הסינון
              </p>
              {user && (
                <button
                  onClick={() => setIsNewQuestionModalOpen(true)}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  שאל שאלה ראשונה
                </button>
              )}
            </div>
          </div>
        )}

        {/* Load More Button */}
        {sortedQuestions.length > 0 && (
          <div className="text-center mt-12">
            <button className="px-8 py-3 bg-white/70 backdrop-blur-xl border border-gray-200 rounded-xl text-gray-600 hover:text-indigo-600 hover:border-indigo-200 transition-all duration-300 shadow-lg hover:shadow-xl">
              טען עוד שאלות
            </button>
          </div>
        )}
      </main>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        mode={authModalMode}
      />

      {isNewQuestionModalOpen && (
        <NewQuestionModal
          isOpen={isNewQuestionModalOpen}
          onClose={() => setIsNewQuestionModalOpen(false)}
        />
      )}

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default QuestionsPage;