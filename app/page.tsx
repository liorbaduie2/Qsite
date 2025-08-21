"use client";

import React, { useState } from 'react';
import { Menu, X, MessageSquare, Users, HelpCircle, BookOpen, Home, Plus } from 'lucide-react';

const ForumHomepage = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const menuItems = [
    { label: 'ראשי', icon: Home, href: '/' },
    { label: 'סטטוסים', icon: Users, href: '/status' },
    { label: 'דיונים', icon: MessageSquare, href: '/discussions' },
    { label: 'שאלות', icon: HelpCircle, href: '/questions' },
    { label: 'סיפורים', icon: BookOpen, href: '/stories' },
  ];

  const sampleQuestions = [
    {
      id: 1,
      title: 'למה בעצם נשים מתקשות בחיים הרבה יותר מגברים?',
      author: 'נועה24242',
      replies: 12,
      votes: 8,
      views: 156,
      time: 'לפני 1 דקה',
      tags: ['הבדלים', 'למה', 'משיכה מינית', 'העולם'],
      image: 'https://picsum.photos/900/400?random=1'
    },
    {
      id: 2,
      title: 'איך אני יכול ללמוד תכנות בצורה יעילה?',
      author: 'דני כהן',
      replies: 15,
      votes: 12,
      views: 234,
      time: 'לפני 2 שעות',
      tags: ['תכנות', 'לימודים', 'קריירה'],
      image: 'https://picsum.photos/900/400?random=2'
    },
    {
      id: 3,
      title: 'מה ההבדל בין React ל-Vue?',
      author: 'שרה לוי',
      replies: 8,
      votes: 6,
      views: 89,
      time: 'לפני 4 שעות',
      tags: ['React', 'Vue', 'פיתוח'],
      image: 'https://picsum.photos/900/400?random=3'
    }
  ];

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
                פורום הקהילה
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

        {/* Drawer */}
        <div
          className={`absolute top-full right-0 bg-white/90 backdrop-blur-xl shadow-2xl rounded-bl-3xl border-l border-b border-gray-200/30 transition-all duration-500 z-50 ${
            isDrawerOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'
          }`}
        >
          <nav className="p-8 w-72">
            <ul className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      className="flex items-center gap-4 p-4 rounded-xl hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:text-indigo-600 transition-all duration-300 hover:scale-105 hover:shadow-lg group"
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
      </header>

      {/* Overlay for drawer */}
      {isDrawerOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => setIsDrawerOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-5 py-10">
        
        {/* Questions Feed */}
        <div className="space-y-8">
          {sampleQuestions.map((question, index) => (
            <article 
              key={question.id} 
              className="bg-white/80 backdrop-blur-xl rounded-3xl overflow-hidden shadow-xl border border-gray-200/30 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 group relative"
              style={{
                animationDelay: `${index * 0.1}s`,
                animation: 'slideInUp 0.6s ease-out forwards'
              }}
            >
              {/* Gradient Border Effect */}
              <div 
                className="absolute top-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899)' }}
              />

              {/* Question Image */}
              <div 
                className="h-80 bg-cover bg-center relative overflow-hidden"
                style={{ 
                  backgroundImage: `url(${question.image})`,
                }}
              >
                <div 
                  className="absolute inset-0"
                  style={{
                    background: 'linear-gradient(45deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1))',
                    mixBlendMode: 'overlay'
                  }}
                />
                <div 
                  className="absolute inset-0"
                  style={{
                    background: 'linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0.1))'
                  }}
                />
                <div className="absolute bottom-9 right-6 left-5 text-white">
                  <h2 
                    className="text-3xl font-bold mb-0 leading-tight"
                    style={{ textShadow: '0 4px 12px rgba(0,0,0,0.6)' }}
                  >
                    {question.title}
                  </h2>
                </div>
              </div>

              {/* Question Body */}
              <div className="p-6">
                {/* Tags */}
                <div className="flex flex-wrap gap-3 mb-4">
                  {question.tags.map((tag, tagIndex) => (
                    <span
                      key={tagIndex}
                      className="px-4 py-2 text-sm font-semibold text-white rounded-full transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer relative overflow-hidden"
                      style={{
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899)'
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Meta Row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img 
                      className="w-10 h-10 rounded-full border-2 border-indigo-200 transition-all duration-300 hover:scale-110 hover:border-indigo-400"
                      src={`https://i.pravatar.cc/40?img=${question.id}`}
                      alt="אווטר משתמש"
                    />
                    <div>
                      <div 
                        className="font-bold text-lg relative group-hover:after:w-full"
                        style={{
                          color: '#4f46e5',
                        }}
                      >
                        {question.author}
                      </div>
                      <div className="text-sm text-gray-500 font-medium">
                        {question.time}
                      </div>
                    </div>
                  </div>

                  {/* Votes */}
                  <div 
                    className="flex items-center gap-2 px-3 py-2 rounded-full border transition-all duration-300 hover:scale-105"
                    style={{
                      background: 'rgba(99, 102, 241, 0.1)',
                      borderColor: 'rgba(99, 102, 241, 0.2)'
                    }}
                  >
                    <button className="text-gray-400 hover:text-indigo-600 transition-colors p-1 rounded hover:bg-indigo-50">
                      ▲
                    </button>
                    <span className="font-bold text-indigo-600 min-w-5 text-center">
                      {question.votes}
                    </span>
                    <button className="text-gray-400 hover:text-indigo-600 transition-colors p-1 rounded hover:bg-indigo-50">
                      ▼
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
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

export default ForumHomepage;