"use client";

import React from 'react';
import { X, LogOut } from 'lucide-react';

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
  menuItems: MenuItem[];
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

export function NavigationDrawer({
  isOpen,
  onClose,
  menuItems,
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
          className={`fixed inset-0 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'} ${overlayClassName}`}
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/30" />
        </div>
      )}

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 h-full w-72 bg-white/95 backdrop-blur-xl shadow-2xl transform transition-transform duration-300 z-50 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } ${drawerClassName}`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6">
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
            <div className="px-6 pb-4 border-b border-gray-200/30">
              <div className="flex items-center gap-3">
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
            <div className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    onClick={(e) => {
                      e.preventDefault();
                      handleMenuItemClick(item);
                    }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 group cursor-pointer ${
                      item.active 
                        ? 'bg-indigo-50 text-indigo-600' 
                        : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-600'
                    }`}
                  >
                    <Icon size={20} className="group-hover:scale-110 transition-transform flex-shrink-0" />
                    <span className="font-medium">{item.label}</span>
                  </a>
                );
              })}
            </div>
          </nav>

          {/* Footer with sign out (if logged in) */}
          {user && onSignOut && (
            <div className="p-4 border-t border-gray-200/30">
              <button
                onClick={() => {
                  onSignOut();
                  onClose();
                }}
                className="flex items-center gap-3 w-full p-4 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-300 group"
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