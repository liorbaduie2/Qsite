"use client";

import React, { useState, useEffect } from 'react';
import { Menu, X, Plus, LogIn, User, LogOut, Search, Filter, ArrowUp, ArrowDown, MessageSquare, Eye, Clock, Home, MessageSquare as MessageSquareIcon, TrendingUp, Bookmark, Settings, HelpCircle, Bell } from 'lucide-react';
import { useAuth } from './components/AuthProvider';
import AuthModal from './components/AuthModal';
import Drawer, { useDrawer, MenuItem } from './components/Drawer';

// Mock data for demonstration
const mockQuestions = [
  {
    id: 1,
    title: "??? ????? API ?-Next.js ?? TypeScript?",
    content: "??? ???? ????? API routes ?-Next.js 14 ?? TypeScript ??? ???? ??????...",
    author: "developer123",
    votes: 15,
    views: 234,
    replies: 8,
    tags: ["Next.js", "TypeScript", "API"],
    timeAgo: "???? 2 ????",
    isResolved: false
  },
  {
    id: 2,
    title: "???? ?? Supabase Authentication",
    content: "?????? ?? ???? ??? ?????, ?????? ?? ???? ????...",
    author: "coder456",
    votes: 8,
    views: 156,
    replies: 3,
    tags: ["Supabase", "Authentication"],
    timeAgo: "???? 4 ????",
    isResolved: true
  },
  // Add more mock questions as needed
];

const availableTags = ["???", "Next.js", "React", "TypeScript", "Supabase", "CSS", "JavaScript", "API"];

export default function HomePage() {
  const { user, profile, signOut, loading } = useAuth();
  const [authModal, setAuthModal] = useState<'login' | 'register' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTag, setFilterTag] = useState('???');
  const [sortBy, setSortBy] = useState('newest');
  
  // Use the custom drawer hook
  const { isOpen: isDrawerOpen, openDrawer, closeDrawer, toggleDrawer } = useDrawer();

  // Custom menu items with user context
  const menuItems: MenuItem[] = [
    { label: '???', href: '/', icon: Home, active: true },
    { label: '????? ?????', href: '/questions', icon: MessageSquareIcon },
    { label: '?????', href: '/trending', icon: TrendingUp },
    { label: '?????', href: '/search', icon: Search },
    ...(user ? [
      { label: '??????', href: '/notifications', icon: Bell, badge: 3 },
      { label: '??????', href: '/saved', icon: Bookmark },
      { label: '??????', href: '/profile', icon: User },
    ] : []),
    { label: '??????', href: '/settings', icon: Settings },
    { label: '????', href: '/help', icon: HelpCircle },
  ];

  const handleAuthAction = (action: 'login' | 'register') => {
    setAuthModal(action);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleNewQuestion = () => {
    // Navigate to new question page or open modal
    console.log('Navigate to new question page');
  };

  // Filter and sort questions
  const filteredQuestions = mockQuestions
    .filter(q => 
      (filterTag === '???' || q.tags.includes(filterTag)) &&
      (searchQuery === '' || 
       q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
       q.content.toLowerCase().includes(searchQuery.toLowerCase()))
    );

  const sortedQuestions = [...filteredQuestions].sort((a, b) => {
    switch (sortBy) {
      case 'votes':
        return b.votes - a.votes;
      case 'views':
        return b.views - a.views;
      case 'replies':
        return b.replies - a.replies;
      case 'newest':
      default:
        return b.id - a.id; // Assuming higher ID means newer
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">????...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/30 shadow-lg">
        <div className="max-w-7xl mx-auto px-5">
          <div className="flex items-center justify-between h-16">
            {/* Left side - Logo and menu button */}
            <div className="flex items-center gap-4">
              <button
                onClick={toggleDrawer}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors md:hidden"
                aria-label={isDrawerOpen ? '???? ?????' : '??? ?????'}
              >
                {isDrawerOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Q&A ????????
              </h1>
            </div>

            {/* Right side - User actions */}
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <button
                    onClick={handleNewQuestion}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                  >
                    <Plus size={16} />
                    ???? ????
                  </button>
                  <div className="flex items-center gap-3 px-4 py-2 bg-white/60 rounded-lg shadow-lg">
                    <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {profile?.username?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <span className="font-medium text-sm">{profile?.username || user.email}</span>
                    <button
                      onClick={handleSignOut}
                      className="p-1.5 hover:bg-red-100 rounded-lg transition-colors"
                      aria-label="?????"
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
                    ???????
                  </button>
                  <button
                    onClick={() => handleAuthAction('register')}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    <User size={16} />
                    ?????
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="pb-4">
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              {/* Search */}
              <div className="relative flex-1 w-full lg:max-w-md">
                <Search size={20} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="??? ?????..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-4 pr-12 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white/70 backdrop-blur-sm"
                />
              </div>

              {/* Filters */}
              <div className="flex items-center gap-4 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0">
                {/* Tags */}
                <div className="flex gap-2 flex-shrink-0">
                  {availableTags.map((tag) => (
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

                {/* Sort */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Filter size={18} className="text-gray-500" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white/70 backdrop-blur-sm whitespace-nowrap"
                  >
                    <option value="newest">??? ???</option>
                    <option value="votes">??? ?????</option>
                    <option value="views">??? ????</option>
                    <option value="replies">??? ????</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Drawer Component */}
      <Drawer 
        isOpen={isDrawerOpen}
        onClose={closeDrawer}
        menuItems={menuItems}
      />

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-5 py-8">
        {/* Welcome Section */}
        <div className="mb-8 text-center">
          <h2 className="text-4xl font-bold text-gray-800 mb-4 leading-tight">
            ?????? ????? ????????? ?????? ????????
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            ???? ?? ????? ????? ?????, ???? ?????? ???????? ????? ??? ?? ??????
          </p>
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
                    {question.isResolved && (
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                        ????
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
                  
                  {/* Meta Info */}
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <MessageSquare size={16} />
                        {question.replies} ??????
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye size={16} />
                        {question.views} ?????
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={16} />
                        {question.timeAgo}
                      </span>
                    </div>
                    <span className="font-medium">
                      ???? ?? ??? {question.author}
                    </span>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* No questions found */}
        {sortedQuestions.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">??</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">?? ????? ?????</h3>
            <p className="text-gray-600">??? ????? ?? ????? ?????? ?? ??????</p>
          </div>
        )}
      </main>

      {/* Auth Modal */}
      {authModal && (
        <AuthModal
          mode={authModal}
          onClose={() => setAuthModal(null)}
        />
      )}

      {/* CSS for animations */}
      <style jsx>{`
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
}