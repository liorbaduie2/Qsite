import React from 'react';
import { X, LucideIcon, User, LogOut, Bell, Bookmark, Award } from 'lucide-react';
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
}

interface DrawerProps {
  isDrawerOpen: boolean;
  setIsDrawerOpen: (open: boolean) => void;
  menuItems: MenuItem[];
  user?: { id: string; email?: string } | null; // Fixed: replaced any with proper type
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
                    <Image
                      src={profile.avatar_url}
                      alt={profile.username || 'משתמש'}
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center border-2 border-white shadow-md">
                      <User size={20} className="text-white" />
                    </div>
                  )}
                </div>
                
                {/* Profile Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-800 truncate">
                    {profile?.full_name || profile?.username || 'משתמש'}
                  </h3>
                  <p className="text-sm text-gray-600 truncate">
                    @{profile?.username || 'unknown'}
                  </p>
                  {profile?.reputation !== undefined && (
                    <div className="flex items-center gap-1 mt-1">
                      <Award size={12} className="text-yellow-500" />
                      <span className="text-xs text-gray-600">{profile.reputation} נקודות</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Profile Actions */}
              <div className="flex gap-2">
                <button
                  onClick={handleProfileClick}
                  className="flex-1 text-sm px-3 py-2 bg-white/60 text-gray-700 rounded-lg hover:bg-white/80 transition-colors"
                >
                  פרופיל
                </button>
                <button
                  onClick={() => handleMenuClick('/settings')}
                  className="flex-1 text-sm px-3 py-2 bg-white/60 text-gray-700 rounded-lg hover:bg-white/80 transition-colors"
                >
                  הגדרות
                </button>
              </div>
            </div>
          )}

          {/* Navigation Menu */}
          <nav className="flex-1 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={() => handleMenuClick(item.href)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-right rounded-xl transition-all duration-200 group ${
                    item.active
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                      : 'hover:bg-gray-100 text-gray-700 hover:text-gray-900'
                  }`}
                >
                  <Icon 
                    size={20} 
                    className={`transition-transform group-hover:scale-110 ${
                      item.active ? 'text-white' : 'text-gray-500'
                    }`} 
                  />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Bottom Actions */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            {user ? (
              <div className="space-y-2">
                <button
                  onClick={() => handleMenuClick('/notifications')}
                  className="w-full flex items-center gap-3 px-4 py-3 text-right rounded-xl hover:bg-gray-100 text-gray-700 transition-colors"
                >
                  <Bell size={20} className="text-gray-500" />
                  <span>התראות</span>
                </button>
                <button
                  onClick={() => handleMenuClick('/bookmarks')}
                  className="w-full flex items-center gap-3 px-4 py-3 text-right rounded-xl hover:bg-gray-100 text-gray-700 transition-colors"
                >
                  <Bookmark size={20} className="text-gray-500" />
                  <span>סימניות</span>
                </button>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-4 py-3 text-right rounded-xl hover:bg-red-50 text-red-600 transition-colors"
                >
                  <LogOut size={20} />
                  <span>התנתקות</span>
                </button>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-4">
                  התחבר כדי לגשת לכל התכונות
                </p>
                <button
                  onClick={() => handleMenuClick('/auth')}
                  className="w-full px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg"
                >
                  התחברות / הרשמה
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