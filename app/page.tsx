"use client";

import React, { useState } from 'react';
import { Menu, MessageSquare, Users, HelpCircle, BookOpen, Home, Plus, LogIn, LogOut, User } from 'lucide-react';
import { useAuth } from './components/AuthProvider';
import AuthModal from './components/AuthModal';
import { NavigationDrawer, useDrawer, MenuItem } from './components/NavigationDrawer';

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
      ??? Dev Debug Mode
    </div>
  );
}

export default function ForumHomepage() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  
  const { user, profile, loading, signOut } = useAuth();
  
  // Use the new drawer hook
  const { isOpen: isDrawerOpen, toggleDrawer, closeDrawer } = useDrawer();

  // Menu items configuration
  const menuItems: MenuItem[] = [
    { 
      label: '???? ????', 
      icon: Home, 
      href: '/',
      onClick: () => handleNavigation('/')
    },
    { 
      label: '???????', 
      icon: Users, 
      href: '/status',
      onClick: () => handleNavigation('/status')
    },
    { 
      label: '??????', 
      icon: MessageSquare, 
      href: '/discussions',
      onClick: () => handleNavigation('/discussions')
    },
    { 
      label: '?????', 
      icon: HelpCircle, 
      href: '/questions',
      active: true,
      onClick: () => handleNavigation('/questions')
    },
    { 
      label: '???????', 
      icon: BookOpen, 
      href: '/stories',
      onClick: () => handleNavigation('/stories')
    },
  ];

  const sampleQuestions = [
    {
      id: 1,
      title: '??? ???? ???? ?????? ????? ???? ???? ???????',
      author: '????24242',
      replies: 12,
      votes: 8,
      views: 156,
      time: '???? 1 ???',
      tags: ['??????', '???', '????? ?????', '?????'],
      image: 'https://picsum.photos/900/400?random=1'
    },
    {
      id: 2,
      title: '??? ??? ???? ????? ????? ????? ??????',
      author: '??? ???',
      replies: 15,
      votes: 12,
      views: 234,
      time: '???? 2 ????',
      tags: ['?????', '???????', '??????'],
      image: 'https://picsum.photos/900/400?random=2'
    },
    {
      id: 3,
      title: '?? ????? ??? React ?-Vue?',
      author: '??? ???',
      replies: 8,
      votes: 6,
      views: 89,
      time: '???? 4 ????',
      tags: ['React', 'Vue', '?????'],
      image: 'https://picsum.photos/900/400?random=3'
    }
  ];

  const handleAuthAction = (mode: 'login' | 'register') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      closeDrawer();
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

  const handleNavigation = (href: string) => {
    console.log(`Navigate to: ${href}`);
    closeDrawer();
    // Add your navigation logic here (e.g., Next.js router)
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

      {/* Navigation Drawer */}
      <NavigationDrawer
        isOpen={isDrawerOpen}
        onClose={closeDrawer}
        menuItems={menuItems}
        user={user ? { username: profile?.username, email: user.email } : null}
        onSignOut={handleSignOut}
      />

      {/* Header */}
      <header className="relative bg-white/80 backdrop-blur-xl shadow-xl border-b border-gray-200/20">
        <div className="max-w-5xl mx-auto px-5">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={toggleDrawer}
                className="p-2 rounded-lg hover:bg-gray-100/60 transition-all duration-300 hover:scale-105"
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
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-5 py-8">
        <div className="mb-8 text-center">
          <h2 className="text-4xl font-bold text-gray-800 mb-4 leading-tight">
            ?????? ????? ????????? ?????? ????????
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            ???? ?? ????? ????? ?????, ???? ?????? ???????? ?????? ?? ???? ???? ?? ??????
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { label: '?????', value: '1,234', color: 'indigo' },
            { label: '??????', value: '5,678', color: 'purple' },
            { label: '???????', value: '892', color: 'pink' },
            { label: '??????', value: '156', color: 'blue' }
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-white/20"
            >
              <div className={`text-3xl font-bold bg-gradient-to-r from-${stat.color}-600 to-${stat.color}-800 bg-clip-text text-transparent mb-2`}>
                {stat.value}
              </div>
              <div className="text-gray-600 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Questions List */}
        <div className="space-y-6">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">????? ???????</h3>
          
          {sampleQuestions.map((question) => (
            <div
              key={question.id}
              className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border border-white/20"
            >
              <div className="flex gap-6">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <h4 className="text-xl font-semibold text-gray-800 hover:text-indigo-600 transition-colors cursor-pointer leading-tight">
                      {question.title}
                    </h4>
                    <div className="text-sm text-gray-500 whitespace-nowrap mr-4">
                      {question.time}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6 text-sm text-gray-600 mb-4">
                    <span className="flex items-center gap-1">
                      <User size={14} />
                      {question.author}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare size={14} />
                      {question.replies} ??????
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="text-green-600">¡ø</span>
                      {question.votes} ?????
                    </span>
                    <span>{question.views} ?????</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {question.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1.5 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 rounded-lg text-sm font-medium hover:from-indigo-200 hover:to-purple-200 transition-all cursor-pointer"
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
            </div>
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