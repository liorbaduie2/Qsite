"use client";

import React from 'react';
import { X, Home, MessageSquare, User, Bookmark, Settings, HelpCircle, Bell, Search, TrendingUp } from 'lucide-react';

interface MenuItem {
  label: string;
  href: string;
  icon: React.ElementType;
  active?: boolean;
  badge?: number;
}

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  menuItems?: MenuItem[];
  className?: string;
}

const defaultMenuItems: MenuItem[] = [
  { label: 'בית', href: '/', icon: Home, active: true },
  { label: 'שאלות חדשות', href: '/questions', icon: MessageSquare },
  { label: 'מגמות', href: '/trending', icon: TrendingUp },
  { label: 'חיפוש', href: '/search', icon: Search },
  { label: 'הודעות', href: '/notifications', icon: Bell, badge: 3 },
  { label: 'שמורים', href: '/saved', icon: Bookmark },
  { label: 'פרופיל', href: '/profile', icon: User },
  { label: 'הגדרות', href: '/settings', icon: Settings },
  { label: 'עזרה', href: '/help', icon: HelpCircle },
];

export default function Drawer({ 
  isOpen, 
  onClose, 
  menuItems = defaultMenuItems, 
  className = "" 
}: DrawerProps) {
  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when drawer is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[9999] transition-opacity duration-300"
          onClick={handleBackdropClick}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full bg-white/90 backdrop-blur-xl shadow-2xl rounded-bl-3xl border-l border-gray-200/30 transition-all duration-500 z-[99999] ${
          isOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'
        } ${className}`}
        style={{ width: "18rem" }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200/30">
          <h2 
            id="drawer-title" 
            className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"
          >
            תפריט ניווט
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="סגור תפריט"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav 
          className="p-6 w-full h-full overflow-y-auto"
          aria-label="תפריט ניווט ראשי"
        >
          <ul className="space-y-2" role="menu">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <li key={item.label} role="none">
                  <a
                    href={item.href}
                    role="menuitem"
                    tabIndex={isOpen ? 0 : -1}
                    className={`flex items-center justify-between gap-4 p-4 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg group focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      item.active 
                        ? 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-600 shadow-md' 
                        : 'hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:text-indigo-600'
                    }`}
                    onClick={onClose} // Close drawer when item is clicked
                  >
                    <div className="flex items-center gap-4">
                      <Icon size={22} className="group-hover:scale-110 transition-transform" />
                      <span className="font-medium text-lg">{item.label}</span>
                    </div>
                    
                    {/* Badge for notifications */}
                    {item.badge && item.badge > 0 && (
                      <span className="flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-red-500 rounded-full animate-pulse">
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </a>
                </li>
              );
            })}
          </ul>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200/30">
            <div className="text-center text-sm text-gray-500">
              <p>© 2025 פורום הקהילה</p>
              <p className="mt-1">גרסה 1.0.0</p>
            </div>
          </div>
        </nav>
      </div>
    </>
  );
}

// Hook for managing drawer state
export function useDrawer(initialState = false) {
  const [isOpen, setIsOpen] = React.useState(initialState);

  const openDrawer = React.useCallback(() => setIsOpen(true), []);
  const closeDrawer = React.useCallback(() => setIsOpen(false), []);
  const toggleDrawer = React.useCallback(() => setIsOpen(prev => !prev), []);

  return {
    isOpen,
    openDrawer,
    closeDrawer,
    toggleDrawer,
  };
}

// Optional: Custom menu items type export for TypeScript users
export type { MenuItem, DrawerProps };