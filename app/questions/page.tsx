//app\questions\page.tsx
"use client";

import React, { useState } from 'react';
import { 
  Menu, MessageSquare, Users, HelpCircle, BookOpen, Home, Plus, 
  Search, Filter, Eye, MessageCircle, ArrowUp, ArrowDown, Star, 
  User, LogIn 
} from 'lucide-react';
import { useAuth } from '../components/AuthProvider';
import AuthModal from '../components/AuthModal';
import Drawer from '../components/Drawer';
import NewQuestionModal from '../components/NewQuestionModal';
import Image from 'next/image';

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
    { label: 'דיוני', icon: MessageSquare, href: '/discussions' },
    { label: 'שאלות', icon: HelpCircle, href: '/questions', active: true },
    { label: 'סיפורי', icon: BookOpen, href: '/stories' },
  ];

  const allTags = ['הכל', 'תכנות', 'עיצוב', 'קריירה', 'לימודי', 'טכנולוגי', 'פיתוח', 'React', 'Vue', 'JavaScript', 'CSS', 'HTML'];

  const questions: Question[] = [
    {
      id: 1,
      title: 'איך אני יכול ללמוד תכנות בצורה יעילה?',
      content: 'אני מתחיל בתכנות ורוצה לדעת מה הדרך הכי טובה להתחיל. יש המלצות על קורסי או משאבי?',
      author: 'דני כהן',
      authorAvatar: 'https://i.pravatar.cc/40?img=1',
      replies: 15,
      votes: 12,
      views: 234,
      time: 'לפני 2 שעות',
      tags: ['תכנות', 'לימודי', 'קריירה'],
      isAnswered: true,
      acceptedAnswerId: 5
    },
    {
      id: 2,
      title: 'מה ההבדל בין React ל-Vue?',
      content: 'אני צריך לבחור בין React ל-Vue לפרויקט הבא שלי. מה היתרונות והחסרונות של כל אחד?',
      author: 'מיכל לוי',
      authorAvatar: 'https://i.pravatar.cc/40?img=2',
      replies: 8,
      votes: 15,
      views: 189,
      time: 'לפני 3 שעות',
      tags: ['React', 'Vue', 'JavaScript'],
      isAnswered: true,
      acceptedAnswerId: 3
    },
    {
      id: 3,
      title: 'איך לבצע optimization בביצועי אתר?',
      content: 'האתר שלי איטי ואני מחפש דרכי לשפר את הביצועי. מה הטכניקות הכי יעילות?',
      author: 'יוסי אברם',
      authorAvatar: 'https://i.pravatar.cc/40?img=3',
      replies: 6,
      votes: 9,
      views: 167,
      time: 'לפני 4 שעות',
      tags: ['ביצועי', 'אופטימיזציה', 'פיתוח'],
      isAnswered: false
    },
    {
      id: 4,
      title: 'איך לכתוב קוד נקי וקריא?',
      content: 'אני רוצה לשפר את איכות הקוד שלי. איזה עקרונות חשוב לעקוב אחריה?',
      author: 'שרה גולן',
      authorAvatar: 'https://i.pravatar.cc/40?img=4',
      replies: 11,
      votes: 18,
      views: 298,
      time: 'לפני 6 שעות',
      tags: ['קוד נקי', 'בסט פרקטיס', 'תכנות'],
      isAnswered: true,
      acceptedAnswerId: 7
    },
    {
      id: 5,
      title: 'איך להתמודד עם bugs מורכבי?',
      content: 'יש לי bug שקשה לי לזהות ולתקן. איזה טכניקות דיבוגינג אתם ממליצי?',
      author: 'אלון רוז',
      authorAvatar: 'https://i.pravatar.cc/40?img=5',
      replies: 4,
      votes: 7,
      views: 134,
      time: 'לפני 8 שעות',
      tags: ['דיבוגינג', 'בעיות', 'פתרון בעיות'],
      isAnswered: false
    }
  ];

  const filteredQuestions = questions
    .filter(q => 
      q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.author.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(q => filterTag === 'הכל' || q.tags.includes(filterTag))
    .sort((a, b) => {
      switch (sortBy) {
        case 'votes':
          return b.votes - a.votes;
        case 'replies':
          return b.replies - a.replies;
        case 'views':
          return b.views - a.views;
        case 'oldest':
          return a.id - b.id;
        default: // newest
          return b.id - a.id;
      }
    });

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
        color: '#0f172a'
      }}
    >
      {/* Animated Background */}
      <div 
        className="fixed inset-0 -z-10"
        style={{
          background: `
            radial-gradient(circle at 20% 80%, rgba(99, 102, 241, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(236, 72, 153, 0.05) 0%, transparent 50%)
          `,
          animation: 'float 20s ease-in-out infinite'
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
              <button
                onClick={handleNewQuestion}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
              >
                <Plus size={16} />
                שאלה חדשה
              </button>

              {user ? (
                <div className="flex items-center gap-3 px-4 py-2 bg-white/60 rounded-lg border border-gray-200/50">
                  <div className="flex items-center gap-2">
                    {profile?.avatar_url ? (
                      <Image
                        src={profile.avatar_url}
                        alt={profile.username || 'משתמש'}
                        width={28}
                        height={28}
                        className="w-7 h-7 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-7 h-7 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center">
                        <User size={14} className="text-white" />
                      </div>
                    )}
                    <span className="text-sm font-medium text-gray-700">
                      {profile?.username || 'משתמש'}
                    </span>
                  </div>
                </div>
              ) : (
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

      {/* Drawer */}
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
        {/* Page Header */}
        <div className="mb-8 text-center">
          <h2 className="text-4xl font-bold text-gray-800 mb-4 leading-tight">
            שאלות ותשובות
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            מקום לשאול שאלות, לחלוק ידע ולקבל עזרה מהקהילה
          </p>
        </div>

        {/* Search and Filter Section */}
        <div className="mb-8">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search Bar */}
              <div className="flex-1 relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="חפש שאלות..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pr-11 pl-4 py-3 border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/80 backdrop-blur-sm transition-all duration-300"
                />
              </div>

              {/* Filter by Tags */}
              <div className="flex items-center gap-2">
                <Filter size={20} className="text-gray-500" />
                <select
                  value={filterTag}
                  onChange={(e) => setFilterTag(e.target.value)}
                  className="px-4 py-3 border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/80 backdrop-blur-sm transition-all duration-300"
                >
                  {allTags.map(tag => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>
              </div>

              {/* Sort Options */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/80 backdrop-blur-sm transition-all duration-300"
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
        <div className="space-y-6">
          {filteredQuestions.length > 0 ? (
            filteredQuestions.map((question) => (
              <div
                key={question.id}
                className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6 hover:shadow-2xl transition-all duration-300 hover:scale-[1.01] group"
              >
                <div className="flex gap-6">
                  {/* Vote Section */}
                  <div className="flex flex-col items-center gap-2 min-w-[60px]">
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors group-hover:bg-indigo-50">
                      <ArrowUp size={20} className="text-gray-600 group-hover:text-indigo-600" />
                    </button>
                    <span className="font-bold text-lg text-gray-800">{question.votes}</span>
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors group-hover:bg-indigo-50">
                      <ArrowDown size={20} className="text-gray-600 group-hover:text-indigo-600" />
                    </button>
                    {question.isAnswered && (
                      <div className="mt-2 p-1 bg-green-100 rounded-full">
                        <Star size={16} className="text-green-600" fill="currentColor" />
                      </div>
                    )}
                  </div>

                  {/* Content Section */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-3">
                      {question.isAnswered && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                          נענתה
                        </span>
                      )}
                      <span className="text-sm text-gray-600">{question.time}</span>
                    </div>

                    <h3 className="text-xl font-bold text-gray-800 mb-3 group-hover:text-indigo-600 transition-colors duration-300 leading-tight cursor-pointer">
                      {question.title}
                    </h3>

                    <p className="text-gray-600 mb-4 leading-relaxed line-clamp-2">
                      {question.content}
                    </p>

                    {/* Tags */}
                    <div className="flex gap-2 mb-4">
                      {question.tags.map((tag) => (
                        <button
                          key={tag}
                          onClick={() => setFilterTag(tag)}
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 border border-indigo-200 hover:bg-indigo-200 transition-colors cursor-pointer"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>

                    {/* Author and Stats */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Image
                          src={question.authorAvatar}
                          alt={question.author}
                          width={32}
                          height={32}
                          className="w-8 h-8 rounded-full object-cover border border-gray-200"
                        />
                        <span className="font-medium text-gray-700">{question.author}</span>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <MessageCircle size={16} />
                          <span>{question.replies}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye size={16} />
                          <span>{question.views}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <HelpCircle size={48} className="mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                לא נמצאו שאלות
              </h3>
              <p className="text-gray-500 mb-6">
                נסה לשנות את הפילטרים או החיפוש
              </p>
              <button
                onClick={handleNewQuestion}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                היה הראשון לשאול שאלה
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
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
        />
      )}

      <style jsx>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(1deg); }
        }
      `}</style>
    </div>
  );
};

export default QuestionsPage;