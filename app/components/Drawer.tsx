"use client";

import React from 'react';
import { 
  X, 
  Home, 
  MessageSquare, 
  Users, 
  Settings, 
  HelpCircle,
  User,
  Trophy,
  Bookmark
} from 'lucide-react';

interface MenuItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  active?: boolean;
}

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  menuItems?: MenuItem[];
  className?: string;
}

const defaultMenuItems: MenuItem[] = [
  {
    label: 'בית',
    href: '/',
    icon: Home,
    active: true
  },
  {
    label: 'השאלות שלי',
    href: '/my-questions',
    icon: MessageSquare
  },
  {
    label: 'התשובות שלי',
    href: '/my-answers',
    icon: User
  },
  {
    label: 'שמורים',
    href: '/bookmarks',
    icon: Bookmark
  },
  {
    label: 'לוח תוצאות',
    href: '/leaderboard',
    icon: Trophy
  },
  {
    label: 'קהילה',
    href: '/community',
    icon: Users
  },
  {
    label: 'עזרה',
    href: '/help',
    icon: HelpCircle
  },
  {
    label: 'הגדרות',
    href: '/settings',
    icon: Settings
  }
];

export default function Drawer({ 
  isOpen, 
  onClose, 
  menuItems = defaultMenuItems,
  className = ""
}: DrawerProps) {
  return (
    <>
      {/* Drawer Container */}
      <div
        className={`fixed top-0 right-0 h-full bg-white/90 backdrop-blur-xl shadow-2xl rounded-bl-3xl border-l border-gray-200/30 transition-all duration-500 z-[99999] ${
          isOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'
        } ${className}`}
        style={{ width: "18rem" }}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200/30">
          <h2 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            תפריט ניווט
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100/60 rounded-lg transition-colors group"
            aria-label="סגור תפריט"
          >
            <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="p-8 w-full h-full overflow-y-auto">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg group ${
                      item.active 
                        ? 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-600 shadow-md' 
                        : 'hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:text-indigo-600'
                    }`}
                  >
                    <Icon size={22} className="group-hover:scale-110 transition-transform" />
                    <span className="font-medium text-lg">{item.label}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Overlay for drawer */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[9999] transition-opacity duration-300"
          onClick={onClose}
          aria-label="סגור תפריט"
        />
      )}
    </>
  );
}

// Export types for easy importing
export type { MenuItem, DrawerProps };