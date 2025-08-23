"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import type { User, AuthResponse } from '@supabase/supabase-js';

interface Profile {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AuthResponse>;
  signUp: (email: string, password: string, username: string, fullName?: string) => Promise<AuthResponse>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchingProfile, setFetchingProfile] = useState(false);
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchProfile = useCallback(async (userId: string) => {
    // Prevent multiple simultaneous profile fetches
    if (fetchingProfile) {
      console.log('Profile fetch already in progress, skipping...');
      return;
    }

    setFetchingProfile(true);
    console.log('Fetching profile for user:', userId);
    
    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Profile fetch timeout')), 5000);
      });

      const fetchPromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;

      if (error) {
        console.error('Error fetching profile:', error);
        if (error.code === 'PGRST116') {
          // Profile doesn't exist yet - this is normal for new users
          console.log('Profile not found - user may need to complete registration');
        }
        setProfile(null);
        return;
      }
      
      console.log('Profile fetched successfully:', data);
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
    } finally {
      setFetchingProfile(false);
    }
  }, [supabase, fetchingProfile]);

  useEffect(() => {
    let isMounted = true;
    let loadingTimeout: NodeJS.Timeout;

    // Safety timeout - force stop loading after 8 seconds
    const setLoadingTimeout = () => {
      clearTimeout(loadingTimeout);
      loadingTimeout = setTimeout(() => {
        if (isMounted && loading) {
          console.warn('Loading timeout reached - forcing completion');
          setLoading(false);
        }
      }, 8000);
    };

    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('Getting initial session...');
        setLoadingTimeout();

        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!isMounted) return;

        if (error) {
          console.error('Error getting session:', error);
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }

        console.log('Initial session:', session?.user?.id || 'No user');
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
        
        if (isMounted) {
          clearTimeout(loadingTimeout);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error);
        if (isMounted) {
          setUser(null);
          setProfile(null);
          clearTimeout(loadingTimeout);
          setLoading(false);
        }
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;

        console.log('Auth state change:', event, session?.user?.id || 'No user');
        
        // Don't set loading to true again if we're just refreshing token
        if (event === 'TOKEN_REFRESHED') {
          return;
        }

        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
        
        if (isMounted) {
          setLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      clearTimeout(loadingTimeout);
      subscription.unsubscribe();
    };
  }, [supabase.auth, fetchProfile]);

  const signIn = async (email: string, password: string): Promise<AuthResponse> => {
    const result = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return result;
  };

  const signUp = async (email: string, password: string, username: string, fullName?: string): Promise<AuthResponse> => {
    const result = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          full_name: fullName,
        },
      },
    });

    return result;
  };

  const signOut = async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const updateProfile = async (updates: Partial<Profile>): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (error) throw error;
    
    // Refresh profile
    await fetchProfile(user.id);
  };

  const value = {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}