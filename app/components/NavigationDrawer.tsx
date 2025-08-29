"use client";

import React from 'react';
import { X, Home, HelpCircle, User, Settings, MessageSquare, BookOpen, Users, Bell, LogOut } from 'lucide-react';

// Types for better type safety
export interface MenuItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  active?: boolean;
  onClick?: () => void;
}

export interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  menuItems?: MenuItem[];
  user?: {
    username?: string;
    email?: string;
    avatar_url?: string;
  } | null;
  onSignOut?: () => void;
  className?: string;
  overlayClassName?: string;
  drawerClassName?: string;
}

// Default menu items if none provided
const defaultMenuItems: MenuItem[] = [
  { label: 'עמוד ראשי', href: '/', icon: Home },
  { label: 'שאלות ותשובות', href: '/questions', icon: HelpCircle, active: true },
  { label: 'פרופיל', href: '/profile', icon: User },
  { label: 'פרויקטים', href: '/projects', icon: BookOpen },
  { label: 'קהילה', href: '/community', icon: Users },
  { label: 'דיונים', href: '/discussions', icon: MessageSquare },
  { label: 'התראות', href: '/notifications', icon: Bell },
  { label: 'הגדרות', href: '/settings', icon: Settings },
];

export function NavigationDrawer({
  isOpen,
  onClose,
  menuItems = defaultMenuItems,
  user,
  onSignOut,
  className = '',
  overlayClassName = '',
  drawerClassName = ''
}: NavigationDrawerProps) {
  // Handle menu item click
  const handleMenuItemClick = (item: MenuItem) => {
    if (item.onClick) {
      item.onClick();
    }
    // Don't auto-close for certain actions, let the parent handle it
    if (!item.onClick) {
      onClose();
    }
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-[9999] transition-opacity duration-300 ${overlayClassName}`}
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full bg-white/90 backdrop-blur-xl shadow-2xl rounded-bl-3xl border-l border-gray-200/30 transition-all duration-500 z-[99999] ${
          isOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'
        } ${drawerClassName}`}
        style={{ width: "18rem" }}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200/30">
            <h2 className="text-xl font-bold text-gray-800">תפריט ניווט</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="סגור תפריט"
            >
              <X size={20} />
            </button>
          </div>

          {/* User info (if logged in) */}
          {user && (
            <div className="p-6 border-b border-gray-200/30">
              <div className="flex items-center gap-3 mb-4">
                {user.avatar_url ? (
                  <img 
                    src={user.avatar_url} 
                    alt="Profile" 
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {user.username?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.username || user.email}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    משתמש רשום
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Menu */}
          <nav className="flex-1 p-4 overflow-y-auto">
            <ul className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      onClick={(e) => {
                        e.preventDefault();
                        handleMenuItemClick(item);
                      }}
                      className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg group cursor-pointer ${
                        item.active 
                          ? 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-600 shadow-md' 
                          : 'hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:text-indigo-600 text-gray-700'
                      }`}
                    >
                      <Icon size={22} className="group-hover:scale-110 transition-transform flex-shrink-0" />
                      <span className="font-medium text-lg">{item.label}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer with sign out (if logged in) */}
          {user && onSignOut && (
            <div className="p-4 border-t border-gray-200/30">
              <button
                onClick={() => {
                  onSignOut();
                  onClose();
                }}
                className="flex items-center gap-3 w-full p-4 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-300 group"
              >
                <LogOut size={20} className="group-hover:scale-110 transition-transform" />
                <span className="font-medium">התנתקות</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// Hook for drawer state management
export function useDrawer() {
  const [isOpen, setIsOpen] = React.useState(false);

  const openDrawer = React.useCallback(() => setIsOpen(true), []);
  const closeDrawer = React.useCallback(() => setIsOpen(false), []);
  const toggleDrawer = React.useCallback(() => setIsOpen(prev => !prev), []);

  return {
    isOpen,
    openDrawer,
    closeDrawer,
    toggleDrawer
  };
}