// components/ThemeProvider.tsx
'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import { useAuth } from './AuthProvider';
import { ThemeService } from '../lib/theme-service';
import type { SimpleUserPreferences, SimpleThemeMode } from '../types/theme';

interface SimpleThemeContextType {
  preferences: SimpleUserPreferences | null;
  currentTheme: 'light' | 'dark' | null;
  loading: boolean;
  updateTheme: (theme: SimpleThemeMode) => Promise<void>;
  refreshPreferences: () => Promise<void>;
}

const ThemeContext = createContext<SimpleThemeContextType | undefined>(undefined);

const getGuestPreferences = (): SimpleUserPreferences => {
  const savedTheme = typeof window !== 'undefined'
    ? (localStorage.getItem('theme-mode') as SimpleThemeMode) || 'system'
    : 'system';

  return {
    id: 'guest',
    user_id: 'guest',
    theme_mode: savedTheme,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [preferences, setPreferences] = useState<SimpleUserPreferences | null>(null);
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark' | null>(null);
  const [loading, setLoading] = useState(true);
  
  const userRef = useRef(user);
  useEffect(() => { userRef.current = user; }, [user]);
  
  const preferencesRef = useRef(preferences);
  useEffect(() => { preferencesRef.current = preferences; }, [preferences]);

  const getEffectiveTheme = useCallback((mode: SimpleThemeMode): 'light' | 'dark' => {
    if (mode === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return mode;
  }, []);

  // This function is for the initial load and shows a loading state.
  const loadPreferences = useCallback(async () => {
    if (authLoading) return;
    setLoading(true);
    try {
      let prefs: SimpleUserPreferences | null = userRef.current ? await ThemeService.getUserPreferences() : null;
      if (!prefs) {
        prefs = getGuestPreferences();
      }
      setPreferences(prefs);
      setCurrentTheme(getEffectiveTheme(prefs.theme_mode));
    } catch (error) {
      console.error('Failed to load preferences:', error);
      const guestPrefs = getGuestPreferences();
      setPreferences(guestPrefs);
      setCurrentTheme(getEffectiveTheme(guestPrefs.theme_mode));
    } finally {
      setLoading(false);
    }
  }, [authLoading, getEffectiveTheme]);

  // FIX: New function for silent background sync on tab focus.
  // It does the same as loadPreferences but WITHOUT setting the loading state.
  const syncPreferencesOnFocus = useCallback(async () => {
    if (authLoading) return;
    try {
      let prefs: SimpleUserPreferences | null = userRef.current ? await ThemeService.getUserPreferences() : null;
      if (!prefs) {
        prefs = getGuestPreferences();
      }
      // Only update state if the theme mode has actually changed in another tab
      if (preferencesRef.current?.theme_mode !== prefs.theme_mode) {
        setPreferences(prefs);
        setCurrentTheme(getEffectiveTheme(prefs.theme_mode));
      }
    } catch (error) {
      console.error('Failed to sync preferences on focus:', error);
    }
  }, [authLoading, getEffectiveTheme]);


  useEffect(() => {
    loadPreferences();
  }, [user, authLoading, loadPreferences]);

  const updateTheme = useCallback(async (theme: SimpleThemeMode) => {
    const newEffectiveTheme = getEffectiveTheme(theme);
    setCurrentTheme(newEffectiveTheme);
    if (preferencesRef.current) {
      setPreferences({ ...preferencesRef.current, theme_mode: theme });
    }
    
    localStorage.setItem('theme-mode', theme);
    if (userRef.current) {
      ThemeService.updateTheme(theme).then(result => {
        if (!result.success) {
          console.error("Failed to sync theme with database:", result.error);
        }
      });
    }
  }, [getEffectiveTheme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (preferencesRef.current?.theme_mode === 'system') {
        setCurrentTheme(mediaQuery.matches ? 'dark' : 'light');
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // FIX: Use the new silent sync function for visibility changes.
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncPreferencesOnFocus();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [syncPreferencesOnFocus]);
  
  useEffect(() => {
    if (currentTheme === null) return;

    if (currentTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [currentTheme]);

  return (
    <ThemeContext.Provider value={{ preferences, currentTheme, loading, updateTheme, refreshPreferences: loadPreferences }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export function ThemeDebugInfo() {
  const { preferences, currentTheme, loading } = useTheme();
  
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div 
      style={{
        position: 'fixed',
        bottom: '10px',
        left: '10px',
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '8px',
        fontSize: '12px',
        borderRadius: '4px',
        zIndex: 9999,
        fontFamily: 'monospace'
      }}
      dir="ltr"
    >
      <div>Theme: {currentTheme ?? 'null'}</div>
      <div>Mode: {preferences?.theme_mode || 'none'}</div>
      <div>Loading: {loading ? 'yes' : 'no'}</div>
      <div>User: {preferences?.user_id || 'none'}</div>
      <div>Visible: {typeof document !== 'undefined' ? document.visibilityState : 'unknown'}</div>
    </div>
  );
}