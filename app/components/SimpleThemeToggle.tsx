// components/SimpleThemeToggle.tsx
'use client';

import React from 'react';
import { useTheme } from './ThemeProvider';
import type { SimpleThemeMode } from '../types/theme';

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
        border-2 border-gray-300 dark:border-gray-600
        bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900
        hover:from-blue-100 hover:to-indigo-200 dark:hover:from-gray-700 dark:hover:to-gray-800
        active:scale-95
        transition-all duration-300 ease-out
        shadow-lg hover:shadow-xl
        focus:outline-none focus:ring-4 focus:ring-blue-500/30
        disabled:opacity-50 disabled:cursor-not-allowed
        group
      `}
      title={shouldShowSun ? 'מעבר למצב כהה' : 'מעבר למצב בהיר'}
      disabled={loading}
      dir="ltr"
    >
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-400/20 to-orange-400/20 dark:from-blue-400/20 dark:to-purple-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      <div className="relative z-10 flex items-center justify-center w-full h-full overflow-hidden">
        <div className={`transform transition-all duration-500 ${shouldShowSun ? 'rotate-0 scale-100' : '-rotate-90 scale-0'} absolute`}>
          {/* Sun Icon */}
          <svg 
            className={`${iconSizeClasses[size]} text-yellow-500 drop-shadow-sm`}
            fill="currentColor" 
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
          </svg>
        </div>
        
        <div className={`transform transition-all duration-500 ${!shouldShowSun ? 'rotate-0 scale-100' : 'rotate-90 scale-0'} absolute`}>
          {/* Moon Icon */}
          <svg 
            className={`${iconSizeClasses[size]} text-indigo-400 drop-shadow-sm`}
            fill="currentColor" 
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
    </button>
  );
}