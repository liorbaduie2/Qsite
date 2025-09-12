"use client";

import React, { useState, useEffect } from 'react';
import { Menu, Search, Plus, Home, MessageSquare, Users, // Removed TrendingUp - was unused
         Clock, ArrowUp, User, Star, Eye, MessageCircle, Bookmark, 
         Trophy, Award, Filter, SortAsc } from 'lucide-react';
import Image from 'next/image'; // Added Next.js Image component
import { useAuth } from './components/AuthProvider';
import Drawer from './components/Drawer';
import AuthModal from './components/AuthModal';
import NewQuestionModal from './components/NewQuestionModal';

interface Question {
  id: string;
  title: string;
  content: string;
  author: {
    id: string;
    username: string;
    avatar_url?: string;
    reputation: number;
  };
  tags: string[];
  votes_count: number;
  answers_count: number;
  views_count: number;
  created_at: string;
  last_activity_at: string;
  is_answered: boolean;
}

interface TopUser {
  id: string;
  username: string;
  avatar_url?: string;
  reputation: number;
  answers_count: number;
}

export default function HomePage() {
  const { user, profile, signOut } = useAuth();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [isNewQuestionModalOpen, setIsNewQuestionModalOpen] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [selectedFilter, setSelectedFilter] = useState('latest');
  const [searchQuery, setSearchQuery] = useState('');

  const menuItems = [
    { label: 'בית', icon: Home, href: '/' },
    { label: 'שאלות', icon: MessageSquare, href: '/questions' },
    { label: 'משתמשים', icon: Users, href: '/users' },
    { label: 'תגיות', icon: Filter, href: '/tags' },
  ];

  const filterOptions = [
    { value: 'latest', label: 'האחרונות', icon: Clock },
    { value: 'popular', label: 'פופולריות', icon: ArrowUp },
    { value: 'unanswered', label: 'ללא תשובה', icon: MessageCircle },
  ];

  useEffect(() => {
    // Simulated data - replace with actual Supabase queries
    const mockQuestions: Question[] = [
      {
        id: '1',
        title: 'איך להתחיל ללמוד React?',
        content: 'אני רוצה להתחיל ללמוד React אבל לא יודע מאיפה להתחיל...',
        author: {
          id: '1',
          username: 'developer123',
          avatar_url: '/avatars/dev1.jpg',
          reputation: 245
        },
        tags: ['React', 'למידה', 'מתחילים'],
        votes_count: 15,
        answers_count: 8,
        views_count: 156,
        created_at: '2024-01-15T10:30:00Z',
        last_activity_at: '2024-01-15T14:20:00Z',
        is_answered: true
      },
      {
        id: '2',
        title: 'בעיה עם Next.js ו-TypeScript',
        content: 'יש לי בעיה עם הגדרת TypeScript בפרויקט Next.js החדש שלי...',
        author: {
          id: '2',
          username: 'coder_il',
          avatar_url: '/avatars/dev2.jpg',
          reputation: 512
        },
        tags: ['Next.js', 'TypeScript', 'בעיות'],
        votes_count: 23,
        answers_count: 12,
        views_count: 298,
        created_at: '2024-01-14T16:45:00Z',
        last_activity_at: '2024-01-15T09:15:00Z',
        is_answered: true
      },
      {
        id: '3',
        title: 'איך לעבור לקריירת הייטק?',
        content: 'אני עובד כעכשיו במקצוע אחר ורוצה לעבור להייטק. איך מתחילים?',
        author: {
          id: '3',
          username: 'career_changer',
          reputation: 89
        },
        tags: ['קריירה', 'הייטק', 'מעבר'],
        votes_count: 34,
        answers_count: 0,
        views_count: 445,
        created_at: '2024-01-13T11:20:00Z',
        last_activity_at: '2024-01-13T11:20:00Z',
        is_answered: false
      }
    ];

    const mockTopUsers: TopUser[] = [
      {
        id: '1',
        username: 'expert_dev',
        avatar_url: '/avatars/expert1.jpg',
        reputation: 2845,
        answers_count: 156
      },
      {
        id: '2',
        username: 'pro_coder',
        avatar_url: '/avatars/expert2.jpg',
        reputation: 1923,
        answers_count: 98
      },
      {
        id: '3',
        username: 'tech_guru',
        reputation: 1456,
        answers_count: 87
      }
    ];

    setQuestions(mockQuestions);
    setTopUsers(mockTopUsers);
  }, []);

  const handleAuthClick = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleNewQuestion = () => {
    if (!user) {
      handleAuthClick('login');
    } else {
      setIsNewQuestionModalOpen(true);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `לפני ${diffInMinutes} דקות`;
    } else if (diffInMinutes < 1440) {
      return `לפני ${Math.floor(diffInMinutes / 60)} שעות`;
    } else {
      return `לפני ${Math.floor(diffInMinutes / 1440)} ימים`;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50" dir="rtl">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo and Title */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <MessageSquare className="text-white" size={24} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">פורום הקהילה</h1>
                  <p className="text-sm text-gray-600">קהילת המפתחים הישראלית</p>
                </div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="חיפוש שאלות, תגיות או משתמשים..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {/* New Question Button */}
              <button
                onClick={handleNewQuestion}
                className="hidden md:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <Plus size={16} />
                שאל שאלה
              </button>

              {/* User Actions */}
              {user ? (
                <div className="flex items-center gap-3">
                  {/* User Profile Preview */}
                  <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                    {profile?.avatar_url ? (
                      <Image
                        src={profile.avatar_url}
                        alt={profile.username}
                        width={24}
                        height={24}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-6 h-6 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {profile?.username?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                    )}
                    <span className="text-sm font-medium text-gray-700">
                      {profile?.username || 'משתמש'}
                    </span>
                    <div className="flex items-center gap-1">
                      <Trophy size={12} className="text-yellow-500" />
                      <span className="text-xs text-gray-600">{profile?.reputation || 0}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="hidden md:flex items-center gap-2">
                  <button
                    onClick={() => handleAuthClick('login')}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    התחבר
                  </button>
                  <button
                    onClick={() => handleAuthClick('register')}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    הירשם
                  </button>
                </div>
              )}

              {/* Menu Button */}
              <button
                onClick={() => setIsDrawerOpen(true)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Menu size={24} />
              </button>
            </div>
          </div>

          {/* Mobile Search */}
          <div className="md:hidden mt-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="חיפוש..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Sidebar - Filters */}
          <aside className="w-full lg:w-64 space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-gray-800 mb-4">סינון שאלות</h3>
              <div className="space-y-2">
                {filterOptions.map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => setSelectedFilter(filter.value)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      selectedFilter === filter.value
                        ? 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <filter.icon size={18} />
                    <span className="font-medium">{filter.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Top Contributors */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-gray-800 mb-4">תורמים מובילים</h3>
              <div className="space-y-3">
                {topUsers.map((topUser, index) => (
                  <div key={topUser.id} className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                        index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-500'
                      }`}>
                        {index + 1}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      {topUser.avatar_url ? (
                        <Image
                          src={topUser.avatar_url}
                          alt={topUser.username}
                          width={32}
                          height={32}
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {topUser.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-800 truncate">{topUser.username}</p>
                      <div className="flex items-center gap-1">
                        <Award size={12} className="text-yellow-500" />
                        <span className="text-xs text-gray-600">{topUser.reputation}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="flex-1">
            {/* Header with Sort */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">שאלות אחרונות</h2>
                <p className="text-gray-600">השאלות הכי עדכניות מהקהילה</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleNewQuestion}
                  className="md:hidden flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300"
                >
                  <Plus size={16} />
                  שאלה חדשה
                </button>
                <button className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <SortAsc size={16} />
                  מיון
                </button>
              </div>
            </div>

            {/* Questions List */}
            <div className="space-y-4">
              {questions.map((question) => (
                <div key={question.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    {/* Vote Score */}
                    <div className="flex-shrink-0 text-center">
                      <div className="w-16 h-16 bg-gray-50 rounded-lg flex flex-col items-center justify-center">
                        <span className="text-lg font-bold text-gray-800">{question.votes_count}</span>
                        <span className="text-xs text-gray-600">קולות</span>
                      </div>
                    </div>

                    {/* Question Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-800 hover:text-indigo-600 cursor-pointer transition-colors mb-2">
                            {question.title}
                          </h3>
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                            {question.content}
                          </p>
                          
                          {/* Tags */}
                          <div className="flex flex-wrap gap-2 mb-3">
                            {question.tags.map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-md hover:bg-indigo-200 cursor-pointer transition-colors"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Author Info */}
                        <div className="flex-shrink-0 text-left">
                          <div className="flex items-center gap-2 mb-2">
                            {question.author.avatar_url ? (
                              <Image
                                src={question.author.avatar_url}
                                alt={question.author.username}
                                width={24}
                                height={24}
                                className="rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-6 h-6 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                {question.author.username.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <span className="text-sm font-medium text-gray-700">{question.author.username}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star size={12} className="text-yellow-500" />
                            <span className="text-xs text-gray-600">{question.author.reputation}</span>
                          </div>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <MessageCircle size={14} />
                            <span>{question.answers_count} תשובות</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Eye size={14} />
                            <span>{question.views_count} צפיות</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock size={14} />
                            <span>{formatTimeAgo(question.created_at)}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {question.is_answered && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-md">
                              <MessageCircle size={12} />
                              <span>נענתה</span>
                            </div>
                          )}
                          <button className="p-2 text-gray-400 hover:text-indigo-600 transition-colors">
                            <Bookmark size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Load More */}
            <div className="text-center mt-8">
              <button className="px-6 py-3 text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors">
                טען שאלות נוספות
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      <Drawer
        isDrawerOpen={isDrawerOpen}
        setIsDrawerOpen={setIsDrawerOpen}
        menuItems={menuItems}
        user={user}
        profile={profile}
        onSignOut={signOut}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        mode={authMode}
        onModeSwitch={setAuthMode}
      />

      <NewQuestionModal
        isOpen={isNewQuestionModalOpen}
        onClose={() => setIsNewQuestionModalOpen(false)}
      />
    </div>
  );
}