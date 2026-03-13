// components/SimpleThemeToggle.tsx
'use client';

import React from 'react';
import { useTheme } from './ThemeProvider';
import type { SimpleThemeMode } from '../types/theme';
import { Sun, Moon } from 'lucide-react';

interface SimpleThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function SimpleThemeToggle({ 
  className = '',
  size = 'md' 
}: SimpleThemeToggleProps) {
  const { preferences, updateTheme, loading, currentTheme } = useTheme();
  
  if (loading && !preferences) {
    return (
      <div className={`flex items-center ${className}`} dir="rtl">
        <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded-full ${size === 'sm' ? 'w-8 h-8' : 'w-10 h-10'}`}></div>
      </div>
    );
  }
  
  const currentMode = preferences?.theme_mode || 'system';
  
  const getNextTheme = (): SimpleThemeMode => {
    if (currentMode === 'system') {
      return currentTheme === 'dark' ? 'light' : 'dark';
    } else {
      return currentMode === 'light' ? 'dark' : 'light';
    }
  };

  const shouldShowSun = currentTheme === 'light';
  const nextTheme = getNextTheme();

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10', 
    lg: 'w-12 h-12'
  };

  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const handleToggle = () => {
    updateTheme(nextTheme);
  };

  return (
    <button
      onClick={handleToggle}
      className={`
        ${sizeClasses[size]}
        ${className}
        relative
        rounded-full
        flex items-center justify-center
        overflow-hidden
        border border-gray-200/80 dark:border-gray-700/80
        bg-white/90 dark:bg-gray-800/90
        backdrop-blur-md
        hover:bg-gray-50 dark:hover:bg-gray-700
        active:scale-95
        transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
        shadow-sm hover:shadow
        focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:ring-offset-1 dark:focus:ring-offset-gray-900
        disabled:opacity-50 disabled:cursor-not-allowed
        group
      `}
      title={shouldShowSun ? 'מעבר למצב כהה' : 'מעבר למצב בהיר'}
      disabled={loading}
      dir="ltr"
    >
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-400/10 to-orange-500/10 dark:from-indigo-400/10 dark:to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative z-10 flex items-center justify-center w-full h-full">
        <div className={`transform transition-all duration-500 ${shouldShowSun ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-50 opacity-0'} absolute`}>
          <Sun className={`${iconSizeClasses[size]} text-amber-500 drop-shadow-sm`} strokeWidth={2.5} />
        </div>
        
        <div className={`transform transition-all duration-500 ${!shouldShowSun ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-50 opacity-0'} absolute`}>
          <Moon className={`${iconSizeClasses[size]} text-indigo-400 drop-shadow-sm`} strokeWidth={2.5} />
        </div>
      </div>
    </button>
  );
}