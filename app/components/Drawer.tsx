// /app/components/Drawer.tsx
import React from 'react';
import { X, LucideIcon, User, LogOut, Bell, Bookmark, Award, Shield, Settings } from 'lucide-react';
import Image from 'next/image';

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
}

const Drawer: React.FC<DrawerProps> = ({ 
  isDrawerOpen, 
  setIsDrawerOpen, 
  menuItems, 
  user, 
  profile,
  onSignOut 
}) => {
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
        className="absolute inset-0 bg-black/30" 
        onClick={() => setIsDrawerOpen(false)} 
      />
      
      {/* Drawer Panel */}
      <div className={`absolute right-0 top-0 h-full w-80 bg-white/95 backdrop-blur-xl shadow-2xl transform transition-transform duration-300 ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6 h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">תפריט ניווט</h2>
            <button
              onClick={() => setIsDrawerOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Profile Section - Show when user is logged in */}
          {user && (
            <div className="mb-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
              <div className="flex items-center gap-4 mb-4">
                {/* Profile Circle */}
                <div className="relative">
                  {profile?.avatar_url ? (
                    <Image
                      src={profile.avatar_url}
                      alt={profile.username}
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center">
                      <User size={20} className="text-white" />
                    </div>
                  )}
                  {profile?.is_verified && (
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </div>

                {/* Profile Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-800 truncate min-h-[1.25rem]">
                      {profile
                        ? (profile.full_name || profile.username)
                        : (
                          <span className="inline-block w-24 h-5 rounded bg-gray-200 animate-pulse" aria-hidden />
                        )}
                    </h3>
                    {profile?.is_moderator && (
                      <div className="relative group">
                        <Shield size={14} className="text-indigo-600 flex-shrink-0" />
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          מנהל
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <Award size={12} className="text-yellow-500" />
                    <span className="text-xs text-gray-600">
                      {profile?.reputation || 0} נקודות מוניטין
                    </span>
                  </div>
                </div>
              </div>

              {/* Profile Actions */}
              <div className="flex gap-2">
                <button
                  onClick={handleProfileClick}
                  className="flex-1 px-3 py-2 bg-white/60 text-gray-700 rounded-lg hover:bg-white/80 transition-colors text-sm font-medium"
                >
                  פרופיל
                </button>
                {profile?.is_moderator && (
                  <button
                    onClick={handleAdminClick}
                    className="flex-1 px-3 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors text-sm font-medium"
                  >
                    ניהול
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Navigation Menu */}
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
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                        : 'text-gray-700 hover:bg-gray-100/60'
                    }`}
                  >
                    <IconComponent size={20} />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
              <button
                onClick={() => handleMenuClick('/settings')}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-gray-700 hover:bg-gray-100/60"
              >
                <Settings size={20} />
                <span className="font-medium">הגדרות</span>
              </button>
            </div>
          </nav>

          {/* Quick Actions - Show when user is logged in */}
          {user && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="space-y-2">
                <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100/60 rounded-xl transition-colors">
                  <Bell size={20} />
                  <span>התראות</span>
                  <span className="mr-auto bg-indigo-500 text-white text-xs px-2 py-1 rounded-full">
                    3
                  </span>
                </button>
                
                <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100/60 rounded-xl transition-colors">
                  <Bookmark size={20} />
                  <span>שמורים</span>
                </button>
              </div>
            </div>
          )}

          {/* Footer - Sign Out or Sign In */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            {user ? (
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium"
              >
                <LogOut size={20} />
                <span>התנתקות</span>
              </button>
            ) : (
              <button
                onClick={() => handleMenuClick('/login')}
                className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl transition-colors font-medium shadow-lg hover:shadow-xl"
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