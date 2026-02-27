// /app/components/Drawer.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { X, LucideIcon, User, LogOut, Bell, Bookmark, Award, Shield, Settings, MessageCircle } from 'lucide-react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';

interface MenuItem {
  label: string;
  icon: LucideIcon;
  href: string;
  active?: boolean;
}

interface Profile {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  reputation?: number;
  email?: string;
  phone?: string;
  phone_verified_at?: string;
  status?: string;
  is_moderator?: boolean;  // Added admin field
  is_verified?: boolean;   // Added verified field
  created_at?: string;
  updated_at?: string;
}

interface DrawerProps {
  isDrawerOpen: boolean;
  setIsDrawerOpen: (open: boolean) => void;
  menuItems: MenuItem[];
  user?: { id: string; email?: string } | null;
  profile?: Profile | null;
  onSignOut?: () => void;
  /** When provided, "התחברות" opens this (e.g. index login popup). Otherwise navigates to /?modal=login */
  onOpenLoginModal?: () => void;
}

const Drawer: React.FC<DrawerProps> = ({ 
  isDrawerOpen, 
  setIsDrawerOpen, 
  menuItems, 
  user, 
  profile,
  onSignOut,
  onOpenLoginModal,
}) => {
  const [chatUnreadCount, setChatUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await fetch('/api/chat/unread-count');
      const data = await res.json();
      if (res.ok && typeof data.count === 'number') setChatUnreadCount(data.count);
    } catch {
      // ignore
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) {
      setChatUnreadCount(0);
      return;
    }
    fetchUnreadCount();
  }, [user?.id, fetchUnreadCount]);

  useEffect(() => {
    if (user?.id && isDrawerOpen) fetchUnreadCount();
  }, [user?.id, isDrawerOpen, fetchUnreadCount]);

  useEffect(() => {
    if (!user?.id) return;
    const supabase = createClient();
    const channel = supabase
      .channel('drawer-chat-unread')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        () => { fetchUnreadCount(); }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchUnreadCount]);

  const handleMenuClick = (href: string) => {
    setIsDrawerOpen(false);
    // Use Next.js navigation instead of window.location
    if (typeof window !== 'undefined') {
      window.location.href = href;
    }
  };

  const handleProfileClick = () => {
    handleMenuClick('/profile');
  };

  const handleAdminClick = () => {
    handleMenuClick('/admin');
  };

  const handleSignOut = async () => {
    if (onSignOut) {
      await onSignOut();
    }
    setIsDrawerOpen(false);
  };

  return (
    <div className={`fixed inset-0 z-40 transition-opacity duration-300 ${isDrawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/30 dark:bg-black/50" 
        onClick={() => setIsDrawerOpen(false)} 
      />
      
      {/* Drawer Panel - white in light, dark gray in dark */}
      <div className={`absolute right-0 top-0 h-full w-80 bg-white dark:bg-gray-900 backdrop-blur-xl shadow-2xl transform transition-transform duration-300 ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6 h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">תפריט ניווט</h2>
            <button
              onClick={() => setIsDrawerOpen(false)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-800 dark:text-gray-100"
            >
              <X size={20} />
            </button>
          </div>

          {/* Profile Section - pale lavender in light, dark surface in dark */}
          {user && (
            <div className="mb-6 p-4 rounded-xl border border-purple-100/80 dark:border-gray-700 bg-[#f5f0ff] dark:bg-gray-800/90">
              <div className="flex items-center gap-4 mb-4">
                {/* Profile Circle - muted lavender when no avatar */}
                <div className="relative">
                  {profile?.avatar_url ? (
                    <Image
                      src={profile.avatar_url}
                      alt={profile.username}
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-gray-600 shadow-md"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[#d8c8eb] dark:bg-gray-700">
                      <User size={20} className="text-purple-700 dark:text-purple-300" />
                    </div>
                  )}
                  {profile?.is_verified && (
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </div>

                {/* Profile Info - email-style and reputation */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900 dark:text-gray-100 truncate min-h-[1.5rem] text-lg">
                      {profile
                        ? (profile.full_name || profile.username)
                        : (
                          <span className="inline-block w-24 h-5 rounded bg-gray-200 dark:bg-gray-600 animate-pulse" aria-hidden />
                        )}
                    </span>
                    {profile?.is_moderator && (
                      <div className="relative group">
                        <Shield size={14} className="text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          מנהל
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <Award size={12} className="text-amber-500 dark:text-amber-400" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {profile?.reputation ?? 0} נקודות מוניטין
                    </span>
                  </div>
                </div>
              </div>

              {/* Profile Actions - white + light lavender in light; dark variants in dark */}
              <div className="flex gap-2">
                <button
                  onClick={handleProfileClick}
                  className="flex-1 px-3 py-2 bg-white dark:bg-gray-700 text-indigo-800 dark:text-indigo-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-sm font-medium border border-gray-200 dark:border-gray-600"
                >
                  פרופיל
                </button>
                {profile?.is_moderator && (
                  <button
                    onClick={handleAdminClick}
                    className="flex-1 px-3 py-2 rounded-lg transition-colors text-sm font-medium border border-purple-200 dark:border-purple-700 bg-[rgb(230,220,250)] dark:bg-purple-900/50 text-indigo-800 dark:text-indigo-200 hover:opacity-90 dark:hover:bg-purple-900/70"
                  >
                    ניהול
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Navigation Menu - active: purple gradient; inactive: dark grey */}
          <nav className="flex-1">
            <div className="space-y-2">
              {menuItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.href}
                    onClick={() => handleMenuClick(item.href)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      item.active
                        ? 'text-white shadow-md'
                        : 'text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                    style={item.active ? { background: 'linear-gradient(to left, rgb(180, 100, 255), rgb(102, 51, 204))' } : undefined}
                  >
                    <IconComponent size={20} />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
              {user && (
                <>
                  <button
                    onClick={() => handleMenuClick('/chat')}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <MessageCircle size={20} />
                    <span className="font-medium">צ'אט</span>
                    {chatUnreadCount > 0 && (
                      <span className="mr-auto bg-[#6633cc] text-white text-xs min-w-[1.25rem] h-5 px-2 flex items-center justify-center rounded-full font-medium">
                        {chatUnreadCount > 99 ? '99+' : chatUnreadCount}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => handleMenuClick('/settings')}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <Settings size={20} />
                    <span className="font-medium">הגדרות</span>
                  </button>
                </>
              )}
            </div>
          </nav>

          {/* Quick Actions - grey divider, notification badge medium purple */}
          {user && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="space-y-2">
                <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
                  <Bell size={20} className="text-gray-700 dark:text-gray-300" />
                  <span>התראות</span>
                  <span className="mr-auto bg-[#6633cc] text-white text-xs min-w-[1.25rem] h-5 px-2 flex items-center justify-center rounded-full font-medium">
                    3
                  </span>
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
                  <Bookmark size={20} className="text-gray-700 dark:text-gray-300" />
                  <span>שמורים</span>
                </button>
              </div>
            </div>
          )}

          {/* Footer - logout vibrant red */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            {user ? (
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400"
              >
                <LogOut size={20} className="text-red-600 dark:text-red-400" />
                <span>התנתקות</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setIsDrawerOpen(false);
                  if (onOpenLoginModal) {
                    onOpenLoginModal();
                  } else {
                    if (typeof window !== 'undefined') {
                      window.location.href = '/?modal=login';
                    }
                  }
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-white rounded-xl transition-colors font-medium shadow-lg hover:opacity-95"
                style={{ background: 'linear-gradient(to left, rgb(180, 100, 255), rgb(102, 51, 204))' }}
              >
                <User size={20} />
                <span>התחברות</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Drawer;