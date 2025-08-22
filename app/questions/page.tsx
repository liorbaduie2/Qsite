"use client";

import React, { useState } from 'react';
import { Menu, X, MessageSquare, Users, HelpCircle, BookOpen, Home, Plus, Search, Filter, TrendingUp, Clock, Eye, MessageCircle, ArrowUp, ArrowDown } from 'lucide-react';

const QuestionsPage = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [filterTag, setFilterTag] = useState('all');

  const menuItems = [
    { label: 'ראשי', icon: Home, href: '/' },
    { label: 'סטטוסים', icon: Users, href: '/status' },
    { label: 'דיונים', icon: MessageSquare, href: '/discussions' },
    { label: 'שאלות', icon: HelpCircle, href: '/questions', active: true },
    { label: 'סיפורים', icon: BookOpen, href: '/stories' },
  ];

  const allTags = ['הכל', 'תכנות', 'עיצוב', 'קריירה', 'לימודים', 'טכנולוגיה', 'פיתוח', 'React', 'Vue'];

  const questions = [
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
      content: 'אני מתקשה לנהל את הזמן שלי בין פרויקטים שונים ולימוד טכנולוgiות חדשות.',
      author: 'עמית רוזן',
      authorAvatar: 'https://i.pravatar.cc/40?img=5',
      replies: 11,
      votes: 14,
      views: 203,
      time: 'לפני 3 ימים',
      tags: ['קריירה', 'ניהול זמן'],
      isAnswered: true,
      acceptedAnswerId: 12
    }
  ];

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
                {isDrawerOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              <div className="flex items-center gap-3">
                <HelpCircle size={28} className="text-indigo-600" />
                <h1 
                  className="text-2xl font-bold"
                  style={{
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}
                >
                  שאלות ותשובות
                </h1>
              </div>
            </div>
            <button 
              className="px-4 py-2 rounded-xl text-white font-semibold transition-all duration-300 hover:scale-105 hover:shadow-2xl flex items-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899)',
                boxShadow: '0 10px 25px -5px rgba(99, 102, 241, 0.3)'
              }}
            >
              <Plus size={18} />
              שאל שאלה חדשה
            </button>
          </div>
        </div>
      </header>

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full bg-white/90 backdrop-blur-xl shadow-2xl rounded-bl-3xl border-l border-gray-200/30 transition-all duration-500 z-[99999] ${
          isDrawerOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'
        }`}
        style={{ width: "18rem" }}
      >
        <nav className="p-8 w-full h-full overflow-y-auto">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg group ${
                      item.active 
                        ? 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-600 shadow-md' 
                        : 'hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:text-indigo-600'
                    }`}
                  >
                    <Icon size={22} className="group-hover:scale-110 transition-transform" />
                    <span className="font-medium text-lg">{item.label}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Overlay for drawer */}
      {isDrawerOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[9999] transition-opacity duration-300"
          onClick={() => setIsDrawerOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-5 py-8">
        
        {/* Search and Filter Bar */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-gray-200/30 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            {/* Search */}
            <div className="relative flex-1 w-full">
              <Search size={20} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="חפש שאלות..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-12 pl-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/70 backdrop-blur-sm"
              />
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-gray-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white/70 backdrop-blur-sm"
              >
                <option value="newest">הכי חדש</option>
                <option value="votes">הכי מדורג</option>
                <option value="views">הכי נצפה</option>
                <option value="replies">הכי נענה</option>
              </select>
            </div>
          </div>

          {/* Tags Filter */}
          <div className="flex flex-wrap gap-2 mt-4">
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setFilterTag(tag === 'הכל' ? 'הכל' : tag)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 hover:scale-105 ${
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

        {/* Questions List */}
        <div className="space-y-6">
          {sortedQuestions.map((question, index) => (
            <article 
              key={question.id} 
              className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-gray-200/30 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group"
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
                      color: question.votes > 10 ? 'white' : '#6366f1'
                    }}
                  >
                    {question.votes}
                  </span>
                  <button className="p-2 rounded-lg hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 transition-colors">
                    <ArrowDown size={20} />
                  </button>
                </div>

                {/* Question Content */}
                <div className="flex-1">
                  <div className="flex items-start gap-3 mb-3">
                    {question.isAnswered && (
                      <span 
                        className="px-3 py-1 text-xs font-bold text-white rounded-full"
                        style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
                      >
                        נענתה
                      </span>
                    )}
                    <h2 className="text-xl font-bold text-gray-900 hover:text-indigo-600 cursor-pointer transition-colors flex-1">
                      {question.title}
                    </h2>
                  </div>

                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {question.content}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {question.tags.map((tag, tagIndex) => (
                      <span
                        key={tagIndex}
                        className="px-3 py-1 text-xs font-medium bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100 cursor-pointer transition-colors"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Meta Information */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img 
                        className="w-8 h-8 rounded-full border-2 border-indigo-200"
                        src={question.authorAvatar}
                        alt="אווטר משתמש"
                      />
                      <div>
                        <div className="font-semibold text-indigo-600 text-sm">
                          {question.author}
                        </div>
                        <div className="text-xs text-gray-500">
                          {question.time}
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
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
            </article>
          ))}
        </div>

        {/* Empty State */}
        {sortedQuestions.length === 0 && (
          <div className="text-center py-12">
            <HelpCircle size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">לא נמצאו שאלות</h3>
            <p className="text-gray-500">נסה לשנות את הפילטרים או הוסף שאלה חדשה</p>
          </div>
        )}
      </main>

      {/* Floating Action Button */}
      <button 
        className="fixed bottom-8 left-1/2 transform -translate-x-1/2 w-16 h-16 rounded-full text-white shadow-2xl transition-all duration-300 hover:scale-115 z-50 flex items-center justify-center text-2xl"
        style={{
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899)',
          boxShadow: '0 20px 40px rgba(99, 102, 241, 0.4)',
          animation: 'pulse 2s infinite'
        }}
      >
        <Plus size={28} />
      </button>

      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Assistant:wght@400;500;600;700&display=swap');
        
        @keyframes float {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(30px, -30px) rotate(120deg); }
          66% { transform: translate(-20px, 20px) rotate(240deg); }
        }

        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse {
          0% { box-shadow: 0 20px 40px rgba(99, 102, 241, 0.4); }
          50% { box-shadow: 0 25px 60px rgba(99, 102, 241, 0.6); }
          100% { box-shadow: 0 20px 40px rgba(99, 102, 241, 0.4); }
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