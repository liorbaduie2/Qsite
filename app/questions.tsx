"use client";

import React, { useState } from 'react';
import { Menu, X, MessageSquare, Users, HelpCircle, BookOpen, Home, Plus, Search, Filter, TrendingUp, Clock, Eye, ThumbsUp } from 'lucide-react';

const QuestionsPage = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('הכל');

  const menuItems = [
    { label: 'ראשי', icon: Home, href: '/' },
    { label: 'סטטוסים', icon: Users, href: '/status' },
    { label: 'דיונים', icon: MessageSquare, href: '/discussions' },
    { label: 'שאלות', icon: HelpCircle, href: '/questions', active: true },
    { label: 'סיפורים', icon: BookOpen, href: '/stories' },
  ];

  const filterOptions = ['הכל', 'פופולריות', 'חדשות', 'ללא מענה', 'נפתרו'];

  const questions = [
    {
      id: 1,
      title: 'איך להתחיל ללמוד React בתור מתחיל מוחלט?',
      content: 'אני מתחיל בפיתוח ווב ורוצה ללמוד React. איפה הכי טוב להתחיל? איזה משאבים אתם ממליצים?',
      author: 'יוסי כהן',
      authorAvatar: 'https://i.pravatar.cc/40?img=1',
      replies: 15,
      votes: 23,
      views: 456,
      time: 'לפני 2 שעות',
      tags: ['React', 'JavaScript', 'מתחילים', 'פיתוח'],
      solved: false,
      trending: true
    },
    {
      id: 2,
      title: 'מה ההבדל בין useState ל-useEffect ב-React?',
      content: 'אני מתבלבל בין השני hooks האלה. מתי משתמשים בכל אחד מהם?',
      author: 'דנה לוי',
      authorAvatar: 'https://i.pravatar.cc/40?img=2',
      replies: 8,
      votes: 12,
      views: 234,
      time: 'לפני 4 שעות',
      tags: ['React', 'Hooks', 'useState', 'useEffect'],
      solved: true,
      trending: false
    },
    {
      id: 3,
      title: 'איך לעשות API calls נכון ב-Next.js?',
      content: 'אני רוצה לעשות קריאות API בצד השרת ובצד הלקוח. מה הדרך הנכונה?',
      author: 'מיכל אברהם',
      authorAvatar: 'https://i.pravatar.cc/40?img=3',
      replies: 12,
      votes: 18,
      views: 378,
      time: 'לפני 6 שעות',
      tags: ['Next.js', 'API', 'SSR', 'פיתוח'],
      solved: false,
      trending: true
    },
    {
      id: 4,
      title: 'איך לעבוד עם TypeScript ב-React?',
      content: 'רוצה להוסיף TypeScript לפרויקט React קיים. איך מתחילים?',
      author: 'אור רוזן',
      authorAvatar: 'https://i.pravatar.cc/40?img=4',
      replies: 6,
      votes: 9,
      views: 156,
      time: 'לפני 1 יום',
      tags: ['TypeScript', 'React', 'Types'],
      solved: true,
      trending: false
    },
    {
      id: 5,
      title: 'מה זה CSS-in-JS ומתי כדאי להשתמש בזה?',
      content: 'שמעתי על styled-components ו-emotion. מה היתרונות והחסרונות?',
      author: 'רותם גל',
      authorAvatar: 'https://i.pravatar.cc/40?img=5',
      replies: 10,
      votes: 14,
      views: 267,
      time: 'לפני 1 יום',
      tags: ['CSS', 'styled-components', 'CSS-in-JS'],
      solved: false,
      trending: false
    }
  ];

  const filteredQuestions = questions.filter(question => {
    if (searchQuery && !question.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !question.content.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    switch (selectedFilter) {
      case 'פופולריות':
        return question.votes > 15;
      case 'חדשות':
        return question.time.includes('שעות') || question.time.includes('דקות');
      case 'ללא מענה':
        return !question.solved;
      case 'נפתרו':
        return question.solved;
      default:
        return true;
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
        <div className="max-w-5xl mx-auto px-5">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsDrawerOpen(!isDrawerOpen)}
                className="p-2 rounded-lg hover:bg-gray-100/60 transition-all duration-300 hover:scale-105"
              >
                {isDrawerOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              <h1 
                className="text-2xl font-bold"
                style={{
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                שאלות וקהילה
              </h1>
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
                        ? 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-600 shadow-lg' 
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
      <main className="max-w-5xl mx-auto px-5 py-10">
        
        {/* Search and Filters */}
        <div className="mb-8">
          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="חפש שאלות..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-12 pl-4 py-4 rounded-2xl bg-white/80 backdrop-blur-xl border border-gray-200/30 shadow-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 text-lg"
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-3">
            {filterOptions.map((filter) => (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                  selectedFilter === filter
                    ? 'text-white shadow-lg'
                    : 'text-gray-600 bg-white/60 hover:bg-white/80'
                }`}
                style={
                  selectedFilter === filter
                    ? { background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899)' }
                    : {}
                }
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Questions List */}
        <div className="space-y-6">
          {filteredQuestions.map((question, index) => (
            <article 
              key={question.id} 
              className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-gray-200/30 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 group relative"
              style={{
                animationDelay: `${index * 0.1}s`,
                animation: 'slideInUp 0.6s ease-out forwards'
              }}
            >
              {/* Status Indicators */}
              <div className="absolute top-4 left-4 flex gap-2">
                {question.solved && (
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full border border-green-200">
                    נפתר
                  </span>
                )}
                {question.trending && (
                  <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded-full border border-orange-200 flex items-center gap-1">
                    <TrendingUp size={12} />
                    פופולרי
                  </span>
                )}
              </div>

              {/* Question Header */}
              <div className="mb-4 pt-8">
                <h2 className="text-xl font-bold text-gray-900 mb-3 leading-tight group-hover:text-indigo-600 transition-colors">
                  {question.title}
                </h2>
                <p className="text-gray-600 leading-relaxed">
                  {question.content}
                </p>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {question.tags.map((tag, tagIndex) => (
                  <span
                    key={tagIndex}
                    className="px-3 py-1 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-full border border-indigo-200 hover:bg-indigo-100 transition-colors cursor-pointer"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              {/* Question Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center gap-3">
                  <img 
                    className="w-10 h-10 rounded-full border-2 border-indigo-200 transition-all duration-300 hover:scale-110 hover:border-indigo-400"
                    src={question.authorAvatar}
                    alt="אווטר משתמש"
                  />
                  <div>
                    <div className="font-semibold text-indigo-600">
                      {question.author}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center gap-1">
                      <Clock size={12} />
                      {question.time}
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1 hover:text-indigo-600 transition-colors">
                    <ThumbsUp size={16} />
                    <span className="font-semibold">{question.votes}</span>
                  </div>
                  <div className="flex items-center gap-1 hover:text-indigo-600 transition-colors">
                    <MessageSquare size={16} />
                    <span className="font-semibold">{question.replies}</span>
                  </div>
                  <div className="flex items-center gap-1 hover:text-indigo-600 transition-colors">
                    <Eye size={16} />
                    <span className="font-semibold">{question.views}</span>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* No Results Message */}
        {filteredQuestions.length === 0 && (
          <div className="text-center py-12">
            <HelpCircle size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">לא נמצאו שאלות</h3>
            <p className="text-gray-500">נסה לשנות את החיפוש או הסינון</p>
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
      `}</style>
    </div>
  );
};

export default QuestionsPage;