"use client";

import React, { useState, useEffect } from 'react';
import { Plus, LogIn, User, LogOut, Search, Filter, ArrowUp, MessageCircle, Eye, Menu } from 'lucide-react';
import { useAuth } from './components/AuthProvider';
import AuthModal from './components/AuthModal';
import { NavigationDrawer, useDrawer, MenuItem } from './components/NavigationDrawer';
import { ProfileTestComponent } from './components/ProfileTestComponent';

// Sample data - replace with your actual data fetching
const sampleQuestions = [
  {
    id: 1,
    title: "??? ????? API endpoint ?-Next.js ?? Supabase?",
    content: "??? ???? ????? API endpoint ?????? ???? ??????? ?? Supabase. ?? ?? ???? ?? ??????? ???????...",
    author: "??? ???",
    authorAvatar: null,
    votes: 15,
    replies: 8,
    views: 234,
    tags: ["Next.js", "Supabase", "API"],
    createdAt: "2024-12-20T10:30:00Z",
    image: null
  },
  {
    id: 2,
    title: "???? ?? authentication ?-React",
    content: "?? ?? ???? ?? ????? ????????, ?????? ?? ???? ?-session ???? ?? ????? ????? ???...",
    author: "??? ???",
    authorAvatar: null,
    votes: 23,
    replies: 12,
    views: 456,
    tags: ["React", "Authentication", "Session"],
    createdAt: "2024-12-20T08:15:00Z",
    image: null
  },
  {
    id: 3,
    title: "??? ????? ??????? ?? React app?",
    content: "????????? ??? ????? ???? ???? ???? ?? ????????. ????? ???? ????? ??? ????? ?? ????? ????...",
    author: "????? ????",
    authorAvatar: null,
    votes: 31,
    replies: 15,
    views: 678,
    tags: ["React", "Performance", "Optimization"],
    createdAt: "2024-12-19T16:45:00Z",
    image: null
  },
  {
    id: 4,
    title: "???? ?? TypeScript generics",
    content: "??? ????? ????? ??? ????? ?? generics ?-TypeScript, ????? ???? ????? ?? ????? ??????",
    author: "??? ????",
    authorAvatar: null,
    votes: 7,
    replies: 5,
    views: 189,
    tags: ["TypeScript", "Generics", "JavaScript"],
    createdAt: "2024-12-19T14:20:00Z",
    image: null
  },
  {
    id: 5,
    title: "Docker deployment ??????? Node.js",
    content: "???? ?????? ?????? Node.js ?? Docker ??? ???? ?????? ?? ?????????...",
    author: "???? ???",
    authorAvatar: null,
    votes: 12,
    replies: 9,
    views: 345,
    tags: ["Docker", "Node.js", "Deployment"],
    createdAt: "2024-12-19T11:10:00Z",
    image: null
  }
];

// Custom menu items for the drawer
const customMenuItems: MenuItem[] = [
  { 
    label: '???? ????', 
    href: '/', 
    icon: ({ size, className }) => <span className={`text-xl ${className}`}>??</span>
  },
  { 
    label: '????? ???????', 
    href: '/questions', 
    icon: ({ size, className }) => <span className={`text-xl ${className}`}>?</span>,
    active: true 
  },
  { 
    label: '??????', 
    href: '/profile', 
    icon: User
  },
  { 
    label: '????????? ???', 
    href: '/projects', 
    icon: ({ size, className }) => <span className={`text-xl ${className}`}>??</span>
  },
  { 
    label: '?????', 
    href: '/community', 
    icon: ({ size, className }) => <span className={`text-xl ${className}`}>??</span>
  },
  { 
    label: '??????? ???', 
    href: '/lists', 
    icon: ({ size, className }) => <span className={`text-xl ${className}`}>??</span>
  },
  { 
    label: '??????', 
    href: '/notifications', 
    icon: ({ size, className }) => <span className={`text-xl ${className}`}>??</span>
  },
  { 
    label: '??????', 
    href: '/settings', 
    icon: ({ size, className }) => <span className={`text-xl ${className}`}>??</span>
  }
];

export default function HomePage() {
  // Auth state
  const { user, profile, loading, signOut } = useAuth();
  
  // Drawer state using custom hook
  const { isOpen: isDrawerOpen, toggleDrawer, closeDrawer } = useDrawer();
  
  // Modal state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  
  // Questions state
  const [questions] = useState(sampleQuestions);
  const [filterTag, setFilterTag] = useState('???');
  const [sortBy, setSortBy] = useState('newest');
  const [searchTerm, setSearchTerm] = useState('');

  // Get all unique tags
  const allTags = ['???', ...Array.from(new Set(questions.flatMap(q => q.tags)))];

  // Filter and sort questions
  const filteredAndSortedQuestions = React.useMemo(() => {
    let filtered = questions.filter(q => {
      const matchesTag = filterTag === '???' || q.tags.includes(filterTag);
      const matchesSearch = searchTerm === '' || 
        q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.author.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesTag && matchesSearch;
    });

    // Sort questions
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'votes':
          return b.votes - a.votes;
        case 'views':
          return b.views - a.views;
        case 'replies':
          return b.replies - a.replies;
        case 'newest':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return filtered;
  }, [questions, filterTag, sortBy, searchTerm]);

  // Handle auth actions
  const handleAuthAction = (mode: 'login' | 'register') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      closeDrawer(); // Close drawer after sign out
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleNewQuestion = () => {
    if (!user) {
      handleAuthAction('login');
      return;
    }
    // Navigate to new question page
    console.log('Navigate to new question');
  };

  // Custom navigation handler for drawer items
  const handleDrawerNavigation = (href: string) => {
    console.log(`Navigate to: ${href}`);
    closeDrawer();
    // Add your navigation logic here (e.g., Next.js router)
  };

  // Enhanced menu items with custom navigation
  const enhancedMenuItems = customMenuItems.map(item => ({
    ...item,
    onClick: () => handleDrawerNavigation(item.href)
  }));

  // Format relative time
  const getRelativeTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return '???? ???? ????';
    if (diffInHours < 24) return `???? ${diffInHours} ????`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `???? ${diffInDays} ????`;
    const diffInWeeks = Math.floor(diffInDays / 7);
    return `???? ${diffInWeeks} ??????`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">????...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float"></div>
      <div className="absolute top-0 right-0 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{ animationDelay: '2s' }}></div>
      <div className="absolute -bottom-32 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{ animationDelay: '4s' }}></div>

      {/* Navigation Drawer */}
      <NavigationDrawer
        isOpen={isDrawerOpen}
        onClose={closeDrawer}
        menuItems={enhancedMenuItems}
        user={user ? { username: profile?.username, email: user.email } : null}
        onSignOut={handleSignOut}
      />

      {/* Header */}
      <header className="relative z-30 bg-white/20 backdrop-blur-xl shadow-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-5 py-4">
          <div className="flex items-center justify-between">
            {/* Left section - Menu and Logo */}
            <div className="flex items-center gap-4">
              <button
                onClick={toggleDrawer}
                className="p-3 hover:bg-white/20 rounded-xl transition-colors"
                aria-label="??? ?????"
              >
                <Menu size={20} />
              </button>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Q&A ????????
              </h1>
            </div>

            {/* Right section - Auth buttons */}
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
                      {profile?.username?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <span className="font-medium text-sm">{profile?.username || user.email}</span>
                    <button
                      onClick={handleSignOut}
                      className="p-1.5 hover:bg-red-100 rounded-lg transition-colors"
                      title="?????"
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
        </div>

        {/* Search and Filter Bar */}
        <div className="max-w-7xl mx-auto px-5 pb-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search size={18} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="??? ?????, ???? ?? ????..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-12 pl-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white/70 backdrop-blur-sm"
              />
            </div>

            {/* Tags Filter */}
            <div className="flex gap-2 flex-wrap">
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
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-5 py-8">
        <div className="mb-8 text-center">
          <h2 className="text-4xl font-bold text-gray-800 mb-4 leading-tight">
            ?????? ????? ?????? ??????
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            ???? ?? ????? ????? ?????, ???? ???? ????? ??? ?? ????? ??????? ????????
          </p>
        </div>

        {/* Stats Bar */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-indigo-600">{questions.length}</div>
            <div className="text-sm text-gray-600">????? ??????</div>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{questions.reduce((sum, q) => sum + q.replies, 0)}</div>
            <div className="text-sm text-gray-600">??????</div>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-pink-600">{questions.reduce((sum, q) => sum + q.views, 0)}</div>
            <div className="text-sm text-gray-600">?????</div>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{user ? '?????' : '????'}</div>
            <div className="text-sm text-gray-600">?????</div>
          </div>
        </div>

        {/* Questions List */}
        <div className="space-y-6">
          {filteredAndSortedQuestions.map((question, index) => (
            <article 
              key={question.id} 
              className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-gray-200/30 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group cursor-pointer"
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
                </div>

                {/* Content */}
                <div className="flex-1 space-y-3">
                  <h3 className="text-xl font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">
                    {question.title}
                  </h3>
                  
                  <p className="text-gray-600 leading-relaxed line-clamp-2">
                    {question.content}
                  </p>

                  <div className="flex items-center justify-between pt-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                          {question.author.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-700">{question.author}</span>
                          <span className="text-xs text-gray-500">{getRelativeTime(question.createdAt)}</span>
                        </div>
                      </div>

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

                    <div className="flex flex-wrap gap-2">
                      {question.tags.map((tag) => (
                        <span
                          key={tag}
                          onClick={(e) => {
                            e.stopPropagation();
                            setFilterTag(tag);
                          }}
                          className="px-3 py-1 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 rounded-lg text-sm font-medium hover:from-indigo-200 hover:to-purple-200 transition-all cursor-pointer hover:scale-105"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {question.image && (
                  <div className="w-32 h-24 rounded-xl overflow-hidden shadow-lg">
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

        {/* Empty State */}
        {filteredAndSortedQuestions.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">??</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">?? ????? ?????</h3>
            <p className="text-gray-600 mb-6">??? ????? ?? ??????? ?? ????? ???? ????</p>
            <button
              onClick={handleNewQuestion}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
            >
              ??? ???? ??????
            </button>
          </div>
        )}
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

        /* Custom scrollbar for drawer */
        .overflow-y-auto::-webkit-scrollbar {
          width: 6px;
        }

        .overflow-y-auto::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 3px;
        }

        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: rgba(99, 102, 241, 0.3);
          border-radius: 3px;
        }

        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: rgba(99, 102, 241, 0.5);
        }
      `}</style>
    </div>
  );
}