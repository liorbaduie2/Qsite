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
      <div
        className={`flex items-center ${className}`}
        dir="rtl"
        aria-hidden
      >
        <div
          className={`animate-pulse opacity-30 ${size === "sm" ? "h-[2.2rem] w-[2.2rem]" : size === "lg" ? "h-[3.3rem] w-[3.3rem]" : "h-[2.75rem] w-[2.75rem]"}`}
        />
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

  /** ~10% larger than prior 2rem / 2.5rem / 3rem touch targets */
  const sizeClasses = {
    sm: "min-h-[2.2rem] min-w-[2.2rem] p-[0.275rem]",
    md: "min-h-[2.75rem] min-w-[2.75rem] p-[0.4125rem]",
    lg: "min-h-[3.3rem] min-w-[3.3rem] p-[0.55rem]",
  };

  /** Icons +10% vs 16 / 20 / 24px */
  const iconSizeClasses = {
    sm: "h-[1.125rem] w-[1.125rem]",
    md: "h-[1.375rem] w-[1.375rem]",
    lg: "h-[1.625rem] w-[1.625rem]",
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
        flex items-center justify-center
        bg-transparent
        active:scale-95
        transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
        focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:ring-offset-0
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
      title={shouldShowSun ? 'מעבר למצב כהה' : 'מעבר למצב בהיר'}
      disabled={loading}
      dir="ltr"
    >
      <div
        className={`relative z-10 flex items-center justify-center ${iconSizeClasses[size]}`}
      >
        <div
          className={`absolute inset-0 flex items-center justify-center transform transition-all duration-500 ${shouldShowSun ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-50 opacity-0"}`}
        >
          <Sun
            className={`${iconSizeClasses[size]} text-amber-500 drop-shadow-sm`}
            strokeWidth={2.5}
          />
        </div>
        <div
          className={`absolute inset-0 flex items-center justify-center transform transition-all duration-500 ${!shouldShowSun ? "rotate-0 scale-100 opacity-100" : "rotate-90 scale-50 opacity-0"}`}
        >
          <Moon
            className={`${iconSizeClasses[size]} text-indigo-400 drop-shadow-sm`}
            strokeWidth={2.5}
          />
        </div>
      </div>
    </button>
  );
}