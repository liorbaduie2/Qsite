"use client";

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from './components/AuthProvider';
import { AuthModal } from './components/AuthModal';
import { ProfileTestComponent } from './components/ProfileTestComponent';
import Drawer, { type MenuItem } from './components/Drawer';
import { 
  Menu, 
  Plus, 
  LogIn, 
  User, 
  LogOut, 
  Search, 
  Filter, 
  ArrowUp, 
  ArrowDown, 
  MessageSquare, 
  Eye, 
  Clock,
  Home, 
  Users, 
  Settings, 
  HelpCircle,
  Trophy,
  Bookmark
} from 'lucide-react';

export default function Home() {
  const { user, profile, loading, signOut } = useAuth();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // Menu items for the drawer
  const menuItems: MenuItem[] = useMemo(() => [
    {
      label: '???',
      href: '/',
      icon: Home,
      active: true
    },
    {
      label: '?????? ???',
      href: '/my-questions',
      icon: MessageSquare
    },
    {
      label: '??????? ???',
      href: '/my-answers',
      icon: User
    },
    {
      label: '??????',
      href: '/bookmarks',
      icon: Bookmark
    },
    {
      label: '??? ??????',
      href: '/leaderboard',
      icon: Trophy
    },
    {
      label: '?????',
      href: '/community',
      icon: Users
    },
    {
      label: '????',
      href: '/help',
      icon: HelpCircle
    },
    {
      label: '??????',
      href: '/settings',
      icon: Settings
    }
  ], []);

  // Sample questions data
  const questions = [
    {
      id: 1,
      title: '??? ????? React component ????? ??????',
      content: '??? ???? ??? ????? ????? ????????? ?????? ????? ?-React ?? TypeScript. ?? ???? ????? ????? ????? ?? ???',
      author: '???? ???',
      authorAvatar: 'https://i.pravatar.cc/40?img=1',
      replies: 5,
      votes: 12,
      views: 145,
      time: '???? 3 ????',
      tags: ['React', 'TypeScript', '?????'],
      isAnswered: true,
      acceptedAnswerId: 3,
      image: 'https://picsum.photos/900/400?random=1'
    },
    {
      id: 2,
      title: '?? ????? ??? CSS Grid ?-Flexbox?',
      content: '??? ???? ?????? ??? CSS Grid ?-Flexbox. ??? ???? ?????? ??? ??? ????',
      author: '???? ????',
      authorAvatar: 'https://i.pravatar.cc/40?img=2',
      replies: 8,
      votes: 15,
      views: 203,
      time: '???? 5 ????',
      tags: ['CSS', '?????', '?????'],
      isAnswered: false
    },
    {
      id: 3,
      title: '??? ???? ??????? ?????????? Next.js?',
      content: '????????? ??? ????? ??? ???. ?? ????? ?????? ????????',
      author: '???? ?????',
      authorAvatar: 'https://i.pravatar.cc/40?img=3',
      replies: 12,
      votes: 18,
      views: 156,
      time: '???? ???',
      tags: ['?????', 'UI/UX'],
      isAnswered: true,
      acceptedAnswerId: 8
    },
    {
      id: 4,
      title: '?? ??????? ?? ?????? ????????? ???????',
      content: '????? ???? ?? ?????? ??????? ?????????? ??? ?? ???? ??? ?????? ?? ??.',
      author: '????? ????',
      authorAvatar: 'https://i.pravatar.cc/40?img=4',
      replies: 6,
      votes: 9,
      views: 78,
      time: '???? 2 ????',
      tags: ['?????', '??????', '?????'],
      isAnswered: false
    },
    {
      id: 5,
      title: '??? ???? ??? ????? ????? ??????',
      content: '??? ????? ???? ?? ???? ??? ??? ???????? ????? ?????? ?????????? ?????.',
      author: '??? ???',
      replies: 15,
      votes: 12,
      views: 234,
      time: '???? 2 ????',
      tags: ['?????', '???????', '??????'],
      image: 'https://picsum.photos/900/400?random=2'
    }
  ];

  // Get unique tags for filtering
  const allTags = Array.from(new Set(questions.flatMap(q => q.tags)));

  // Filter and sort questions
  const filteredQuestions = questions.filter(question => {
    const matchesSearch = question.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         question.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = !filterTag || question.tags.includes(filterTag);
    return matchesSearch && matchesTag;
  });

  const sortedQuestions = [...filteredQuestions].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.time).getTime() - new Date(a.time).getTime();
      case 'votes':
        return b.votes - a.votes;
      case 'views':
        return b.views - a.views;
      case 'replies':
        return b.replies - a.replies;
      default:
        return 0;
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
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium">????...</p>
        </div>
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
                aria-label="??? ?????"
              >
                <Menu size={20} />
              </button>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Q&A ????????
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

          {/* Search and Filters */}
          <div className="pb-6">
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/30">
              <div className="flex flex-col lg:flex-row gap-4 items-center">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search size={20} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="??? ?????..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-4 pr-12 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white/70 backdrop-blur-sm"
                  />
                </div>

                <div className="flex items-center gap-4 overflow-x-auto pb-2 lg:pb-0">
                  {/* Tags Filter */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {allTags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => setFilterTag(filterTag === tag ? '' : tag)}
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
        </div>
      </header>

      {/* Drawer Component */}
      <Drawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)}
        menuItems={menuItems}
      />

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-5 py-8">
        
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

                {/* Content Section */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <h3 className="text-xl font-bold text-gray-800 group-hover:text-indigo-600 transition-colors cursor-pointer leading-tight">
                      {question.title}
                    </h3>
                    {question.isAnswered && (
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium whitespace-nowrap">
                        ????? ?
                      </span>
                    )}
                  </div>

                  <p className="text-gray-600 mb-4 line-clamp-2 leading-relaxed">
                    {question.content}
                  </p>

                  {/* Question Meta */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <MessageSquare size={14} />
                        <span>{question.replies} ??????</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye size={14} />
                        <span>{question.views} ?????</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={14} />
                        <span>{question.time}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <img
                          src={question.authorAvatar}
                          alt={question.author}
                          className="w-6 h-6 rounded-full"
                        />
                        <span className="text-sm font-medium text-gray-700">{question.author}</span>
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    {question.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 rounded-lg text-sm font-medium hover:from-indigo-200 hover:to-purple-200 transition-all cursor-pointer"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {question.image && (
                  <div className="w-32 h-24 rounded-xl overflow-hidden shadow-lg">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={question.image}
                      alt="Question preview"
                      className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      </main>

      {/* Development Debug Component */}
      <ProfileTestComponent />

      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
      />

      <style jsx global>{`
        @keyframes float {
          0%, 100% {
            transform: translate(0px, 0px) rotate(0deg);
          }
          33% {
            transform: translate(30px, -50px) rotate(1deg);
          }
          66% {
            transform: translate(-20px, 20px) rotate(-1deg);
          }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}