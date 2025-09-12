import React from 'react';
import { X, LucideIcon, User, Settings, LogOut, Bell, Bookmark, Award } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface MenuItem {
  label: string;
  icon: LucideIcon;
  href: string;
}

interface Profile {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  reputation?: number;
}

interface DrawerProps {
  isDrawerOpen: boolean;
  setIsDrawerOpen: (open: boolean) => void;
  menuItems: MenuItem[];
  user?: SupabaseUser | null; // Fixed: Changed from any to proper Supabase User type
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
                    <img 
                      src={profile.avatar_url} 
                      alt={profile.username}
                      className="w-16 h-16 rounded-full object-cover border-3 border-white shadow-lg"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                      {profile?.username?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  )}
                  {/* Online status indicator */}
                  <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></div>
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-800 truncate">
                    {profile?.full_name || profile?.username || 'משתמש'}
                  </h3>
                  <p className="text-sm text-gray-600 truncate">
                    @{profile?.username || user?.email?.split('@')[0]}
                  </p>
                  {profile?.reputation !== undefined && (
                    <div className="flex items-center gap-1 mt-1">
                      <Award size={14} className="text-yellow-500" />
                      <span className="text-xs text-gray-600">{profile.reputation} נקודות</span>
                    </div>
                  )}
                </div>
              </div>

              {/* User Bio */}
              {profile?.bio && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {profile.bio}
                </p>
              )}

              {/* Quick User Actions */}
              <div className="grid grid-cols-3 gap-2">
                <button 
                  onClick={handleProfileClick}
                  className="flex flex-col items-center gap-1 p-2 hover:bg-white/60 rounded-lg transition-colors"
                >
                  <User size={16} className="text-indigo-600" />
                  <span className="text-xs text-gray-600">פרופיל</span>
                </button>
                
                <button 
                  onClick={() => handleMenuClick('/notifications')}
                  className="flex flex-col items-center gap-1 p-2 hover:bg-white/60 rounded-lg transition-colors relative"
                >
                  <Bell size={16} className="text-indigo-600" />
                  <span className="text-xs text-gray-600">התראות</span>
                  {/* Notification badge - you can add logic to show unread count */}
                  <div className="absolute top-1 right-3 w-2 h-2 bg-red-500 rounded-full"></div>
                </button>
                
                <button 
                  onClick={() => handleMenuClick('/bookmarks')}
                  className="flex flex-col items-center gap-1 p-2 hover:bg-white/60 rounded-lg transition-colors"
                >
                  <Bookmark size={16} className="text-indigo-600" />
                  <span className="text-xs text-gray-600">מועדפים</span>
                </button>
              </div>
            </div>
          )}
          
          {/* Navigation Menu */}
          <nav className="flex-1 space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.label}
                onClick={() => handleMenuClick(item.href)}
                className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-all duration-300 group"
              >
                <item.icon size={20} className="group-hover:scale-110 transition-transform" />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Bottom Section */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            {user ? (
              <div className="space-y-2">
                <button
                  onClick={() => handleMenuClick('/settings')}
                  className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-all duration-300 group"
                >
                  <Settings size={20} className="group-hover:scale-110 transition-transform" />
                  <span className="font-medium">הגדרות</span>
                </button>
                
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-300 group"
                >
                  <LogOut size={20} className="group-hover:scale-110 transition-transform" />
                  <span className="font-medium">התנתק</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={() => handleMenuClick('/login')}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-300"
                >
                  <User size={16} />
                  <span className="font-medium">התחבר</span>
                </button>
                
                <button
                  onClick={() => handleMenuClick('/register')}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-indigo-200 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-all duration-300"
                >
                  <span className="font-medium">הרשם</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Drawer;