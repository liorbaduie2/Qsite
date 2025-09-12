//app/page.tsx
"use client";

import React, { useState } from 'react';
import { Menu, X, MessageSquare, Users, HelpCircle, BookOpen, Home, Plus, LogIn, LogOut, User, Search, Filter, TrendingUp, Eye, MessageCircle, ArrowUp } from 'lucide-react';
import { useAuth } from './components/AuthProvider';
import AuthModal from './components/AuthModal';
import Drawer from './components/Drawer';

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

export default function ForumHomepage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTag, setFilterTag] = useState('הכל');
  const [sortBy, setSortBy] = useState('newest');
  
  const { user, profile, loading, signOut } = useAuth();

  const menuItems = [
    { label: 'ראשי', icon: Home, href: '/' },
    { label: 'סטטוסי', icon: Users, href: '/status' },
    { label: 'דיונים', icon: MessageSquare, href: '/discussions' },
    { label: 'שאלות', icon: HelpCircle, href: '/questions' },
    { label: 'סיפורים', icon: BookOpen, href: '/stories' },
  ];

  const questions = [
    {
      id: 1,
      title: 'למה בעצם נשים מתקשות בחיים הרבה יותר מגברים?',
      content: 'אני רואה שבחברה שלנו נשים מתמודדות עם קשיים רבים יותר. מה הסיבות לכך?',
      author: 'נועה24242',
      authorAvatar: 'https://i.pravatar.cc/40?img=1',
      replies: 12,
      votes: 8,
      views: 156,
      time: 'לפני 1 דקה',
      tags: ['חברה', 'פמיניזם', 'דיון'],
      isAnswered: false
    },
    {
      id: 2,
      title: 'איך אני יכול ללמוד תכנות בצורה יעילה?',
      content: 'אני רוצה להתחיל ללמוד תכנות אבל לא יודע מאיפה להתחיל. יש המלצות?',
      author: 'דני כהן',
      authorAvatar: 'https://i.pravatar.cc/40?img=2',
      replies: 15,
      votes: 12,
      views: 234,
      time: 'לפני 2 שעות',
      tags: ['תכנות', 'למידה', 'קריירה'],
      isAnswered: true
    },
    {
      id: 3,
      title: 'מה ההבדל בין React ל-Vue?',
      content: 'אני מתלבט איזה פריימוורק ללמוד. מה היתרונות והחסרונות של כל אחד?',
      author: 'שרה לוי',
      authorAvatar: 'https://i.pravatar.cc/40?img=3',
      replies: 8,
      votes: 6,
      views: 89,
      time: 'לפני 4 שעות',
      tags: ['React', 'Vue', 'פיתוח'],
      isAnswered: false
    },
    {
      id: 4,
      title: 'איך לכתוב בדיקות יחידה יעילות?',
      content: 'אני מתחיל עם בדיקות יחידה ולא בטוח איך לעשות את זה נכון.',
      author: 'יונתן גרין',
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
      author: 'עמית רוזן',
      authorAvatar: 'https://i.pravatar.cc/40?img=5',
      replies: 11,
      votes: 14,
      views: 203,
      time: 'לפני 3 ימים',
      tags: ['קריירה', 'ניהול זמן'],
      isAnswered: true
    }
  ];

  const allTags = ['הכל', 'תכנות', 'React', 'Vue', 'קריירה', 'למידה', 'פיתוח', 'בדיקות', 'ניהול זמן', 'חברה', 'פמיניזם', 'דיון'];

  const filteredQuestions = questions.filter(question => {
    const matchesSearch = question.title.includes(searchTerm) || question.content.includes(searchTerm);
    const matchesTag = filterTag === 'הכל' || question.tags.includes(filterTag);
    return matchesSearch && matchesTag;
  });

  const sortedQuestions = [...filteredQuestions].sort((a, b) => {
    switch (sortBy) {
      case 'votes':
        return b.votes - a.votes;
      case 'views':
        return b.views - a.views;
      case 'replies':
        return b.replies - a.replies;
      default:
        return b.id - a.id; // newest first
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
    // Handle new question creation
    console.log('Create new question');
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
                {isDrawerOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Q&A פלטפורמה
              </h1>
            </div>

            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <button
                    onClick={handleNewQuestion}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                  >
                    <Plus size={16} />
                    שאלה חדשה
                  </button>
                  <div className="flex items-center gap-3 px-4 py-2 bg-white/60 rounded-lg shadow-lg">
                    <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {profile?.username?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <span className="font-medium text-sm">{profile?.username || user.email}</span>
                    <button
                      onClick={handleSignOut}
                      className="p-1.5 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      <LogOut size={16} className="text-red-600" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAuthAction('login')}
                    className="flex items-center gap-2 px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-300 border border-indigo-200 hover:border-indigo-300"
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
            ברוכים הבאים לפלטפורמת השאלות והתשובות
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            מקום בו תוכלו לשאול שאלות, לקבל תשובות מהקהילה ולשתף את הידע שלכם
          </p>
        </div>

        {/* Search and Filter Section */}
        <div className="mb-8">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/30 p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search size={18} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="חפש שאלות..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pr-12 pl-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white/70 backdrop-blur-sm"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4 lg:gap-6">
                {/* Tags Filter */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0">
                  <span className="text-sm font-medium text-gray-600 whitespace-nowrap">תגיות:</span>
                  <div className="flex gap-2">
                    {allTags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => setFilterTag(tag)}
                        className={`px-3 py-2 rounded-full text-sm font-medium transition-all duration-300 hover:scale-105 whitespace-nowrap ${
                          filterTag === tag
                            ? 'text-white shadow-lg'
                            : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                        }`}
                        style={filterTag === tag ? {
                          background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899)'
                        } : {}}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sort */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Filter size={18} className="text-gray-500" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white/70 backdrop-blur-sm whitespace-nowrap"
                  >
                    <option value="newest">הכי חדש</option>
                    <option value="votes">הכי מדורג</option>
                    <option value="views">הכי נצפה</option>
                    <option value="replies">הכי נענה</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Questions List */}
        <div className="space-y-6">
          {sortedQuestions.map((question) => (
            <div
              key={question.id}
              className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/30 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start gap-4">
                  {/* Author Avatar */}
                  <div className="flex-shrink-0">
                    <img
                      src={question.authorAvatar}
                      alt={question.author}
                      className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-lg"
                    />
                  </div>

                  {/* Question Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-800 mb-2 leading-tight hover:text-indigo-600 transition-colors cursor-pointer">
                          {question.title}
                        </h3>
                        <p className="text-gray-600 leading-relaxed line-clamp-2">
                          {question.content}
                        </p>
                      </div>
                      
                      {question.isAnswered && (
                        <div className="flex-shrink-0 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                          ✓ נענה
                        </div>
                      )}
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {question.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium hover:bg-indigo-200 transition-colors cursor-pointer"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Question Meta */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="font-medium text-gray-700">{question.author}</span>
                        <span>{question.time}</span>
                      </div>

                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1 text-green-600">
                          <ArrowUp size={16} />
                          <span className="font-medium">{question.votes}</span>
                        </div>
                        <div className="flex items-center gap-1 text-blue-600">
                          <MessageCircle size={16} />
                          <span className="font-medium">{question.replies}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-500">
                          <Eye size={16} />
                          <span className="font-medium">{question.views}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {sortedQuestions.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <MessageSquare size={64} className="mx-auto" />
            </div>
            <h3 className="text-xl font-bold text-gray-600 mb-2">לא נמצאו שאלות</h3>
            <p className="text-gray-500 mb-6">נסה לשנות את החיפוש או הסינון</p>
            {user && (
              <button
                onClick={handleNewQuestion}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <Plus size={16} />
                שאל שאלה ראשונה
              </button>
            )}
          </div>
        )}
      </main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
      />

      {/* Development Component */}
      <ProfileTestComponent />

      {/* Global Styles */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-10px) rotate(1deg); }
          66% { transform: translateY(5px) rotate(-1deg); }
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
}