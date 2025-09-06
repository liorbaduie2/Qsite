"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { Menu, X, MessageSquare, Users, HelpCircle, BookOpen, Home, Plus, Search, Filter, Eye, MessageCircle, ArrowUp, ArrowDown } from 'lucide-react';

const QuestionsPage = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [filterTag, setFilterTag] = useState('all');

  const menuItems = [
    { label: '℅“℅℅?℅?', icon: Home, href: '/' },
    { label: '℅?℅?℅?℅?℅?℅?℅', icon: Users, href: '/status' },
    { label: '℅"℅?℅?℅ ℅?℅', icon: MessageSquare, href: '/discussions' },
    { label: '℅?℅℅?℅?℅a', icon: HelpCircle, href: '/questions', active: true },
    { label: '℅?℅?℅∟℅?℅“℅?℅', icon: BookOpen, href: '/stories' },
  ];

  const allTags = ['℅"℅?℅?', '℅a℅?℅ ℅?℅a', '℅⊿℅?℅|℅?℅'', '℅∫℅“℅?℅?℅“℅"', '℅?℅?℅?℅?℅"℅?℅', '℅?℅?℅ ℅?℅?℅?℅'℅?℅"', '℅∟℅?℅a℅?℅〞', 'React', 'Vue'];

  const questions = [
    {
      id: 1,
      title: '℅℅?℅? ℅℅ ℅? ℅?℅?℅?℅? ℅?℅?℅?℅?℅" ℅a℅?℅ ℅?℅a ℅'℅|℅?℅“℅" ℅?℅⊿℅?℅?℅"?',
      content: '℅℅ ℅? ℅?℅a℅〞℅?℅? ℅'℅a℅?℅ ℅?℅a ℅?℅“℅?℅|℅" ℅?℅"℅⊿℅a ℅?℅" ℅"℅"℅“℅? ℅"℅?℅? ℅?℅?℅'℅" ℅?℅"℅a℅〞℅?℅?. ℅?℅? ℅"℅?℅?℅|℅?℅a ℅⊿℅? ℅∫℅?℅“℅?℅?℅ ℅℅? ℅?℅?℅℅'℅?℅?',
      author: '℅"℅ ℅? ℅?℅"℅?',
      authorAvatar: 'https://i.pravatar.cc/40?img=1',
      replies: 15,
      votes: 12,
      views: 234,
      time: '℅?℅∟℅ ℅? 2 ℅?℅⊿℅?℅a',
      tags: ['℅a℅?℅ ℅?℅a', '℅?℅?℅?℅?℅"℅?℅', '℅∫℅“℅?℅?℅“℅"'],
      isAnswered: true,
      acceptedAnswerId: 5
    },
    {
      id: 2,
      title: '℅?℅" ℅"℅"℅'℅"℅? ℅'℅?℅? React ℅?-Vue?',
      content: '℅℅ ℅? ℅|℅“℅?℅? ℅?℅'℅〞℅?℅“ ℅'℅?℅? React ℅?-Vue ℅?℅∟℅“℅?℅?℅∫℅? ℅"℅'℅ ℅?℅?℅?. ℅?℅" ℅"℅?℅a℅“℅?℅ ℅?℅a ℅?℅"℅〞℅?℅“℅?℅ ℅?℅a ℅?℅? ℅?℅? ℅℅〞℅"?',
      author: '℅?℅“℅" ℅?℅?℅?',
      authorAvatar: 'https://i.pravatar.cc/40?img=2',
      replies: 8,
      votes: 6,
      views: 89,
      time: '℅?℅∟℅ ℅? 4 ℅?℅⊿℅?℅a',
      tags: ['React', 'Vue', '℅∟℅?℅a℅?℅〞'],
      isAnswered: false
    },
    {
      id: 3,
      title: '℅℅?℅? ℅?℅⊿℅|℅' ℅?℅?℅?℅∫ ℅?℅?℅a℅?℅? ℅ ℅?℅〞 ℅?℅?℅⊿℅?℅??',
      content: '℅℅ ℅? ℅?℅⊿℅|℅' UI/UX ℅?℅“℅?℅|℅" ℅?℅?℅∟℅?℅ ℅?℅⊿℅?℅|℅?℅' ℅?℅?℅?℅∫ ℅?℅?℅a℅?℅? ℅?℅?℅"℅?℅" ℅ ℅?℅〞 ℅?℅?℅⊿℅?℅? ℅?℅?℅?℅a℅?℅?℅?℅.',
      author: '℅?℅?℅?℅? ℅℅'℅?℅"℅?',
      authorAvatar: 'https://i.pravatar.cc/40?img=3',
      replies: 12,
      votes: 18,
      views: 156,
      time: '℅?℅∟℅ ℅? ℅?℅?℅',
      tags: ['℅⊿℅?℅|℅?℅'', 'UI/UX'],
      isAnswered: true,
      acceptedAnswerId: 8
    },
    {
      id: 4,
      title: '℅?℅" ℅"℅〞℅?℅?℅'℅?℅a ℅?℅? ℅'℅"℅?℅∫℅?℅a ℅℅?℅?℅?℅?℅?℅?℅?℅a ℅'℅∟℅?℅a℅?℅〞?',
      content: '℅?℅?℅⊿℅a℅? ℅"℅“℅'℅" ℅⊿℅? ℅〞℅?℅?℅'℅?℅a ℅"℅'℅"℅?℅∫℅?℅a ℅"℅℅?℅?℅?℅?℅?℅?℅?℅a ℅℅'℅? ℅?℅ ℅'℅?℅?℅〞 ℅℅?℅? ℅?℅"℅a℅〞℅?℅? ℅⊿℅ ℅每℅".',
      author: '℅?℅?℅ ℅a℅? ℅'℅“℅?℅?',
      authorAvatar: 'https://i.pravatar.cc/40?img=4',
      replies: 6,
      votes: 9,
      views: 78,
      time: '℅?℅∟℅ ℅? 2 ℅?℅?℅?℅',
      tags: ['℅a℅?℅ ℅?℅a', '℅'℅"℅?℅∫℅?℅a', '℅∟℅?℅a℅?℅〞'],
      isAnswered: false
    },
    {
      id: 5,
      title: '℅℅?℅? ℅?℅ ℅"℅? ℅每℅?℅? ℅'℅|℅?℅“℅" ℅?℅⊿℅?℅?℅" ℅?℅?℅∟℅a℅〞?',
      content: '℅℅ ℅? ℅?℅a℅∫℅?℅" ℅?℅ ℅"℅? ℅℅a ℅"℅每℅?℅? ℅?℅?℅? ℅'℅?℅? ℅∟℅“℅?℅?℅∫℅?℅?℅ ℅?℅?℅ ℅?℅ ℅?℅?℅?℅?℅?℅" ℅?℅?℅ ℅?℅?℅?℅'℅?℅?℅a ℅〞℅"℅?℅?℅a.',
      author: '℅⊿℅?℅?℅a ℅“℅?℅每℅?',
      authorAvatar: 'https://i.pravatar.cc/40?img=5',
      replies: 11,
      votes: 14,
      views: 203,
      time: '℅?℅∟℅ ℅? 3 ℅?℅?℅?℅',
      tags: ['℅∫℅“℅?℅?℅“℅"', '℅ ℅?℅"℅?℅? ℅每℅?℅?'],
      isAnswered: true,
      acceptedAnswerId: 12
    }
  ];

  const filteredQuestions = questions.filter(question => {
    const matchesSearch = question.title.includes(searchTerm) || question.content.includes(searchTerm);
    const matchesTag = filterTag === '℅"℅?℅?' || question.tags.includes(filterTag);
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

              <div className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                ℅∟℅?℅?℅∟℅?℅“℅?℅a ℅?℅℅?℅?℅a ℅?℅a℅?℅?℅'℅?℅a
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105">
                <Plus size={18} />
                ℅?℅℅?℅" ℅〞℅"℅?℅"
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="pb-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search size={20} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="℅〞℅∟℅? ℅?℅℅?℅?℅a..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pr-12 pl-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/70 backdrop-blur-sm"
                />
              </div>

              {/* Filters */}
              <div className="flex gap-3 items-center">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 bg-white/70 backdrop-blur-sm"
                >
                  <option value="newest">℅〞℅"℅? ℅'℅?℅?℅a℅“</option>
                  <option value="votes">℅?℅"℅?℅“℅' ℅'℅?℅?℅a℅“</option>
                  <option value="views">℅ ℅|℅∟℅" ℅'℅?℅?℅a℅“</option>
                  <option value="replies">℅⊿℅ ℅a℅?℅?℅'℅?℅a</option>
                </select>
              </div>
            </div>

            {/* Tags Filter */}
            <div className="flex gap-2 mt-4 flex-wrap">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setFilterTag(tag)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    filterTag === tag
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Side Drawer */}
      <div className={`fixed inset-0 z-50 transition-opacity duration-300 ${isDrawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black/30" onClick={() => setIsDrawerOpen(false)} />
        <div className={`absolute right-0 top-0 h-full w-80 bg-white/95 backdrop-blur-xl shadow-2xl transform transition-transform duration-300 ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-gray-800">℅a℅∟℅“℅?℅? ℅ ℅?℅?℅?℅?</h2>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <nav className="space-y-2">
              {menuItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 group ${
                    item.active ? 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-600' : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-600'
                  }`}
                >
                  <item.icon size={20} className="group-hover:scale-110 transition-transform" />
                  <span className="font-medium">{item.label}</span>
                </a>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-5 py-8">
        <div className="space-y-6">
          {sortedQuestions.map((question, index) => (
            <article
              key={question.id}
              className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.01] border border-white/20"
              style={{
                animationDelay: `${index * 0.1}s`,
                animation: 'slideInUp 0.6s ease-out forwards'
              }}
            >
              <div className="flex gap-6">
                {/* Vote Section */}
                <div className="flex flex-col items-center gap-2 min-w-20">
                  <button className="p-2 rounded-lg hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 transition-colors">
                    <ArrowUp size={20} />
                  </button>
                  <span className={`text-xl font-bold px-3 py-1 rounded-lg ${
                    question.votes > 10 
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white' 
                      : 'bg-indigo-50 text-indigo-600'
                  }`}>
                    {question.votes}
                  </span>
                  <button className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors">
                    <ArrowDown size={20} />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xl font-bold text-gray-800 hover:text-indigo-600 transition-colors cursor-pointer line-clamp-2">
                      {question.title}
                    </h3>
                    {question.isAnswered && (
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                        ℅ ℅∟℅a℅“
                      </span>
                    )}
                  </div>
                  
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {question.content}
                  </p>
                  
                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {question.tags.map((tag) => (
                      <span 
                        key={tag}
                        className="px-3 py-1 bg-indigo-50 text-indigo-700 text-sm rounded-full hover:bg-indigo-100 transition-colors cursor-pointer"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Meta Information */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Image 
                        className="w-8 h-8 rounded-full border-2 border-indigo-200"
                        src={question.authorAvatar}
                        alt="℅℅?℅?℅?℅“ ℅?℅?℅a℅?℅?"
                        width={32}
                        height={32}
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
            <h3 className="text-xl font-semibold text-gray-600 mb-2">℅?℅ ℅ ℅?℅|℅℅? ℅?℅℅?℅?℅a</h3>
            <p className="text-gray-500">℅ ℅?℅" ℅?℅?℅ ℅?℅a ℅℅a ℅"℅∟℅?℅?℅?℅“℅?℅ ℅℅? ℅"℅?℅?℅㏒ ℅?℅℅?℅" ℅〞℅"℅?℅"</p>
          </div>
        )}
      </main>

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