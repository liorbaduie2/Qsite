//app/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Menu, X, MessageSquare, Users, HelpCircle, BookOpen, Home, LogIn, User, Search, Filter, Eye, MessageCircle, ArrowUp } from 'lucide-react';
import { useAuth } from './components/AuthProvider';
import LoginModal from './components/LoginModal';
import HebrewRegistration from './components/HebrewRegistration';
import Drawer from './components/Drawer';
import Image from 'next/image';
import AuthStatusDisplay from './components/AuthStatusDisplay';
import { SimpleThemeToggle } from './components/SimpleThemeToggle';

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
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTag, setFilterTag] = useState('הכל');
  const [sortBy, setSortBy] = useState('newest');

  const { user, profile, loading, signOut } = useAuth();

  useEffect(() => {
    if (isRegisterModalOpen || isLoginModalOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
  }, [isRegisterModalOpen, isLoginModalOpen]);

  const menuItems = [
    { label: 'ראשי', icon: Home, href: '/' },
    { label: 'סטטוסי', icon: Users, href: '/status' },
    { label: 'דיוני', icon: MessageSquare, href: '/discussions' },
    { label: 'שאלות', icon: HelpCircle, href: '/questions' },
    { label: 'סיפורי', icon: BookOpen, href: '/stories' },
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
      author: 'מיכל לוי',
      authorAvatar: 'https://i.pravatar.cc/40?img=3',
      replies: 8,
      votes: 15,
      views: 189,
      time: 'לפני 3 שעות',
      tags: ['React', 'Vue', 'JavaScript'],
      isAnswered: true
    },
    {
      id: 4,
      title: 'איך להכין קפה טוב בבית?',
      content: 'מחפש טיפים להכנת קפה איכותי בבית בלי מכונת אספרסו יקרה',
      author: 'עומר כספי',
      authorAvatar: 'https://i.pravatar.cc/40?img=4',
      replies: 6,
      votes: 4,
      views: 92,
      time: 'לפני 5 שעות',
      tags: ['קפה', 'בישול', 'טיפים'],
      isAnswered: false
    }
  ];

  const allTags = ['הכל', 'תכנות', 'עיצוב', 'קריירה', 'לימודים', 'טכנולוגיה', 'פיתוח', 'React', 'Vue', 'JavaScript', 'CSS', 'HTML'];

  const filteredQuestions = questions
    .filter(q =>
      q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.content.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(q => filterTag === 'הכל' || q.tags.includes(filterTag))
    .sort((a, b) => {
      if (sortBy === 'votes') return b.votes - a.votes;
      if (sortBy === 'replies') return b.replies - a.replies;
      if (sortBy === 'views') return b.views - a.views;
      return b.id - a.id; // newest first
    });

  const handleLogin = () => setIsLoginModalOpen(true);
  const handleRegister = () => setIsRegisterModalOpen(true);
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
      <header className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl shadow-lg border-b border-gray-200/20 dark:border-gray-700/40">
        {!user && <AuthStatusDisplay className="bg-white/90 dark:bg-gray-800/90 border-b border-gray-200 dark:border-gray-700" showOnlyErrors={true} />}
        
        <div className="max-w-6xl mx-auto px-5">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsDrawerOpen(!isDrawerOpen)}
                className="p-2 rounded-lg hover:bg-gray-100/60 dark:hover:bg-gray-700/60 transition-all duration-300 hover:scale-105"
              >
                {isDrawerOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Q&A פלטפורמה
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <SimpleThemeToggle />
              
              {!user && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleLogin}
                    className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-200 bg-white/60 dark:bg-gray-700/60 rounded-lg hover:bg-white/80 dark:hover:bg-gray-700/80 transition-all duration-300 border border-indigo-200 dark:border-indigo-800 hover:border-indigo-300"
                  >
                    <LogIn size={16} />
                    התחברות
                  </button>
                  <button
                    onClick={handleRegister}
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

      <main className="max-w-6xl mx-auto px-5 py-8">
        <div className="mb-8 text-center">
          <h2 className="text-4xl font-bold text-gray-800 dark:text-gray-100 mb-4 leading-tight">
            ברוכים הבאים לפלטפורמת השאלות והתשובות
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
            מקום בו תוכלו לשאול שאלות, לקבל תשובות מהקהילה ולשתף את הידע שלכם
          </p>
        </div>

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
                <option value="votes">הכי מצוינות</option>
                <option value="replies">הכי פופולריות</option>
                <option value="views">הכי נצפות</option>
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {filteredQuestions.length > 0 ? (
            filteredQuestions.map((question) => (
              <div
                key={question.id}
                className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] group"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <Image
                      src={question.authorAvatar}
                      alt={question.author}
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-gray-600 shadow-md group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {question.isAnswered && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-700">
                          נענתה
                        </span>
                      )}
                      <span className="text-sm text-gray-600 dark:text-gray-400">{question.time}</span>
                    </div>

                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300 leading-tight">
                      {question.title}
                    </h3>

                    <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed line-clamp-2">
                      {question.content}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span className="font-medium text-gray-700 dark:text-gray-300">{question.author}</span>
                        
                        <div className="flex items-center gap-1">
                          <ArrowUp size={16} />
                          <span>{question.votes}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle size={16} />
                          <span>{question.replies}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye size={16} />
                          <span>{question.views}</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {question.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-200 dark:hover:bg-indigo-900/80 transition-colors cursor-pointer"
                            onClick={() => setFilterTag(tag)}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 dark:text-gray-500 mb-4">
                <MessageSquare size={48} className="mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">
                לא נמצאו שאלות
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                נסה לשנות את הפילטרים או החיפוש
              </p>
            </div>
          )}
        </div>
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