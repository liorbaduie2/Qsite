"use client";

import React, { useState } from 'react';
import { Search, Filter, Plus, Home, MessageSquare, Users, // Removed unused: useEffect, X, TrendingUp, LogOut
         Clock, ArrowUp, Star, Eye, MessageCircle, Bookmark, 
         Award, User, ChevronDown, Calendar, Tag } from 'lucide-react';
import Image from 'next/image'; // Added Next.js Image component
import { useAuth } from '../components/AuthProvider';
import Drawer from '../components/Drawer';
import AuthModal from '../components/AuthModal';
import NewQuestionModal from '../components/NewQuestionModal';

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
  category: {
    id: string;
    name: string;
    name_hebrew: string;
    color: string;
  };
  tags: string[];
  votes_count: number;
  answers_count: number;
  views_count: number;
  created_at: string;
  last_activity_at: string;
  is_answered: boolean;
  is_pinned: boolean;
  is_featured: boolean;
}

interface Category {
  id: string;
  name: string;
  name_hebrew: string;
  color: string;
  questions_count: number;
}

export default function QuestionsPage() {
  const { user, profile, signOut } = useAuth();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [isNewQuestionModalOpen, setIsNewQuestionModalOpen] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedFilter, setSelectedFilter] = useState('latest');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const menuItems = [
    { label: 'בית', icon: Home, href: '/' },
    { label: 'שאלות', icon: MessageSquare, href: '/questions' },
    { label: 'משתמשים', icon: Users, href: '/users' },
    { label: 'תגיות', icon: Filter, href: '/tags' },
  ];

  const filterOptions = [
    { value: 'latest', label: 'האחרונות', icon: Clock, description: 'שאלות לפי תאריך יצירה' },
    { value: 'popular', label: 'פופולריות', icon: ArrowUp, description: 'שאלות עם הכי הרבה קולות' },
    { value: 'trending', label: 'טרנדיות', icon: Star, description: 'שאלות עם פעילות גבוהה' },
    { value: 'unanswered', label: 'ללא תשובה', icon: MessageCircle, description: 'שאלות שעדיין לא נענו' },
    { value: 'most-viewed', label: 'הכי נצפות', icon: Eye, description: 'שאלות עם הכי הרבה צפיות' },
  ];

  // Mock data - replace with actual Supabase queries
  React.useEffect(() => {
    const mockCategories: Category[] = [
      { id: '1', name: 'programming', name_hebrew: 'תכנות', color: '#10b981', questions_count: 45 },
      { id: '2', name: 'web-dev', name_hebrew: 'פיתוח אתרים', color: '#f59e0b', questions_count: 32 },
      { id: '3', name: 'mobile', name_hebrew: 'פיתוח מובייל', color: '#8b5cf6', questions_count: 18 },
      { id: '4', name: 'career', name_hebrew: 'קריירה', color: '#ef4444', questions_count: 25 },
      { id: '5', name: 'learning', name_hebrew: 'למידה', color: '#06b6d4', questions_count: 12 },
    ];

    const mockQuestions: Question[] = [
      {
        id: '1',
        title: 'איך להתחיל ללמוד React בצורה נכונה?',
        content: 'אני רוצה להתחיל ללמוד React אבל לא יודע מאיפה להתחיל. יש המון משאבים ברשת ואני מבולבל...',
        author: {
          id: '1',
          username: 'developer123',
          avatar_url: '/avatars/dev1.jpg',
          reputation: 245
        },
        category: { id: '1', name: 'programming', name_hebrew: 'תכנות', color: '#10b981' },
        tags: ['React', 'למידה', 'מתחילים', 'JavaScript'],
        votes_count: 15,
        answers_count: 8,
        views_count: 156,
        created_at: '2024-01-15T10:30:00Z',
        last_activity_at: '2024-01-15T14:20:00Z',
        is_answered: true,
        is_pinned: false,
        is_featured: true
      },
      {
        id: '2',
        title: 'בעיה עם Next.js ו-TypeScript - שגיאות קומפילציה',
        content: 'יש לי בעיה עם הגדרת TypeScript בפרויקט Next.js החדש שלי. אני מקבל שגיאות קומפילציה מוזרות...',
        author: {
          id: '2',
          username: 'coder_il',
          avatar_url: '/avatars/dev2.jpg',
          reputation: 512
        },
        category: { id: '2', name: 'web-dev', name_hebrew: 'פיתוח אתרים', color: '#f59e0b' },
        tags: ['Next.js', 'TypeScript', 'בעיות', 'שגיאות'],
        votes_count: 23,
        answers_count: 12,
        views_count: 298,
        created_at: '2024-01-14T16:45:00Z',
        last_activity_at: '2024-01-15T09:15:00Z',
        is_answered: true,
        is_pinned: true,
        is_featured: false
      },
      {
        id: '3',
        title: 'איך לעבור לקריירת הייטק ללא ניסיון קודם?',
        content: 'אני עובד כעכשיו במקצוע אחר ורוצה לעבור להייטק. איך מתחילים? איזה שפת תכנות כדאי ללמוד ראשונה?',
        author: {
          id: '3',
          username: 'career_changer',
          reputation: 89
        },
        category: { id: '4', name: 'career', name_hebrew: 'קריירה', color: '#ef4444' },
        tags: ['קריירה', 'הייטק', 'מעבר', 'התחלה'],
        votes_count: 34,
        answers_count: 0,
        views_count: 445,
        created_at: '2024-01-13T11:20:00Z',
        last_activity_at: '2024-01-13T11:20:00Z',
        is_answered: false,
        is_pinned: false,
        is_featured: false
      },
      {
        id: '4',
        title: 'איך לייעל ביצועים באפליקציית React Native?',
        content: 'האפליקציה שלי איטית במכשירים ישנים יותר. איך אפשר לייעל את הביצועים?',
        author: {
          id: '4',
          username: 'mobile_dev',
          avatar_url: '/avatars/dev3.jpg',
          reputation: 678
        },
        category: { id: '3', name: 'mobile', name_hebrew: 'פיתוח מובייל', color: '#8b5cf6' },
        tags: ['React Native', 'ביצועים', 'אופטימיזציה'],
        votes_count: 18,
        answers_count: 5,
        views_count: 234,
        created_at: '2024-01-12T14:30:00Z',
        last_activity_at: '2024-01-14T16:45:00Z',
        is_answered: true,
        is_pinned: false,
        is_featured: false
      },
    ];

    setCategories(mockCategories);
    setQuestions(mockQuestions);
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

  const filteredQuestions = questions.filter(question => {
    const matchesSearch = searchQuery === '' || 
      question.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      question.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      question.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || question.category.id === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

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
                  <h1 className="text-2xl font-bold text-gray-800">שאלות</h1>
                  <p className="text-sm text-gray-600">כל השאלות בקהילה</p>
                </div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="חיפוש שאלות..."
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
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <Plus size={16} />
                <span className="hidden md:inline">שאל שאלה</span>
              </button>

              {/* User Actions */}
              {user ? (
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
                <Filter size={24} />
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
            {/* Filter Toggle (Mobile) */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden w-full flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200"
            >
              <span className="font-medium">סינון ומיון</span>
              <ChevronDown size={20} className={`transform transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>

            {/* Filters Container */}
            <div className={`space-y-6 ${showFilters ? 'block' : 'hidden lg:block'}`}>
              {/* Sort Options */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-bold text-gray-800 mb-4">מיון שאלות</h3>
                <div className="space-y-2">
                  {filterOptions.map((filter) => (
                    <button
                      key={filter.value}
                      onClick={() => setSelectedFilter(filter.value)}
                      className={`w-full flex items-start gap-3 p-3 rounded-lg transition-colors ${
                        selectedFilter === filter.value
                          ? 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <filter.icon size={18} className="mt-0.5" />
                      <div className="text-right">
                        <div className="font-medium">{filter.label}</div>
                        <div className="text-xs text-gray-500 mt-1">{filter.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Categories */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-bold text-gray-800 mb-4">קטגוריות</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${
                      selectedCategory === 'all' ? 'bg-gray-100 text-gray-800' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span className="font-medium">הכל</span>
                    <span className="text-sm bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                      {questions.length}
                    </span>
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${
                        selectedCategory === category.id ? 'bg-gray-100 text-gray-800' : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: category.color }}
                        ></div>
                        <span className="font-medium">{category.name_hebrew}</span>
                      </div>
                      <span className="text-sm bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                        {category.questions_count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="flex-1">
            {/* Header with Count */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  {filteredQuestions.length} שאלות
                </h2>
                <p className="text-gray-600">
                  {selectedCategory === 'all' ? 'כל הקטגוריות' : 
                   categories.find(c => c.id === selectedCategory)?.name_hebrew}
                </p>
              </div>
              <div className="text-sm text-gray-500">
                מיון לפי: {filterOptions.find(f => f.value === selectedFilter)?.label}
              </div>
            </div>

            {/* Questions List */}
            <div className="space-y-4">
              {filteredQuestions.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
                  <MessageCircle size={48} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">לא נמצאו שאלות</h3>
                  <p className="text-gray-600 mb-4">נסה לשנות את הסינון או החיפוש</p>
                  <button
                    onClick={handleNewQuestion}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    שאל שאלה ראשונה
                  </button>
                </div>
              ) : (
                filteredQuestions.map((question) => (
                  <div key={question.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                    {/* Question Header */}
                    <div className="flex items-start gap-4">
                      {/* Vote Score & Stats */}
                      <div className="flex-shrink-0 text-center space-y-2">
                        <div className="w-16 h-16 bg-gray-50 rounded-lg flex flex-col items-center justify-center">
                          <span className="text-lg font-bold text-gray-800">{question.votes_count}</span>
                          <span className="text-xs text-gray-600">קולות</span>
                        </div>
                        <div className={`w-16 h-12 rounded-lg flex flex-col items-center justify-center ${
                          question.is_answered ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-600'
                        }`}>
                          <span className="text-sm font-bold">{question.answers_count}</span>
                          <span className="text-xs">תשובות</span>
                        </div>
                      </div>

                      {/* Question Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex-1">
                            {/* Pinned/Featured Badges */}
                            <div className="flex items-center gap-2 mb-2">
                              {question.is_pinned && (
                                <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-md font-medium">
                                  נעוץ
                                </span>
                              )}
                              {question.is_featured && (
                                <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-md font-medium">
                                  מומלץ
                                </span>
                              )}
                            </div>

                            <h3 className="text-lg font-semibold text-gray-800 hover:text-indigo-600 cursor-pointer transition-colors mb-2">
                              {question.title}
                            </h3>
                            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                              {question.content}
                            </p>
                            
                            {/* Category & Tags */}
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                              <span
                                className="px-2 py-1 text-xs rounded-md font-medium text-white"
                                style={{ backgroundColor: question.category.color }}
                              >
                                {question.category.name_hebrew}
                              </span>
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
                              <Award size={12} className="text-yellow-500" />
                              <span className="text-xs text-gray-600">{question.author.reputation}</span>
                            </div>
                          </div>
                        </div>

                        {/* Stats & Actions */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Eye size={14} />
                              <span>{question.views_count} צפיות</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar size={14} />
                              <span>{formatTimeAgo(question.created_at)}</span>
                            </div>
                            {question.last_activity_at !== question.created_at && (
                              <div className="flex items-center gap-1 text-green-600">
                                <Clock size={14} />
                                <span>פעילות: {formatTimeAgo(question.last_activity_at)}</span>
                              </div>
                            )}
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
                ))
              )}
            </div>

            {/* Load More */}
            {filteredQuestions.length > 0 && (
              <div className="text-center mt-8">
                <button className="px-6 py-3 text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors">
                  טען שאלות נוספות
                </button>
              </div>
            )}
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