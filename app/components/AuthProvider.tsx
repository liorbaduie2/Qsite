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
  error: string | null;
  signIn: (email: string, password: string) => Promise<AuthResponse>;
  signUp: (email: string, password: string, username: string, fullName?: string) => Promise<AuthResponse>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      },
    }
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const fetchProfile = useCallback(async (userId: string): Promise<boolean> => {
    try {
      console.log('Fetching profile for user:', userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Profile fetch error:', error);
        
        if (error.code === 'PGRST116') {
          console.log('Profile not found, creating new profile...');
          
          try {
            // Get fresh user data
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            
            if (currentUser && currentUser.id === userId) {
              const newProfile = {
                id: userId,
                username: currentUser.email?.split('@')[0] || `user_${userId.slice(0, 8)}`,
                full_name: currentUser.user_metadata?.full_name || '',
              };

              console.log('Creating profile with data:', newProfile);

              const { data: createdProfile, error: createError } = await supabase
                .from('profiles')
                .insert([newProfile])
                .select()
                .single();

              if (createError) {
                console.error('Error creating profile:', createError);
                setError('Failed to create user profile');
                return false;
              }

              console.log('Profile created successfully:', createdProfile);
              setProfile(createdProfile);
              return true;
            } else {
              console.error('User data mismatch or not available');
              setError('User authentication issue');
              return false;
            }
          } catch (createErr) {
            console.error('Error in profile creation process:', createErr);
            setError('Failed to create user profile');
            return false;
          }
        } else {
          setError('Failed to load user profile');
          return false;
        }
      }

      console.log('Profile fetched successfully:', data);
      setProfile(data);
      return true;
    } catch (error) {
      console.error('Unexpected error fetching profile:', error);
      setError('An unexpected error occurred while loading profile');
      return false;
    }
  }, [supabase]);

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        console.log('Initializing auth...');
        
        // Wait a bit for auth to settle
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session error:', error);
          setError('Failed to get session');
        } else {
          console.log('Initial session found:', session?.user?.id || 'No session');
          
          if (isMounted) {
            setUser(session?.user ?? null);
            
            if (session?.user) {
              console.log('User found, fetching profile...');
              const profileSuccess = await fetchProfile(session.user.id);
              console.log('Profile fetch completed with result:', profileSuccess);
            }
          }
        }
        
        if (isMounted) {
          setInitialized(true);
          setLoading(false);
          console.log('Auth initialization complete');
        }
      } catch (error) {
        console.error('Error during auth initialization:', error);
        if (isMounted) {
          setError('Failed to initialize authentication');
          setInitialized(true);
          setLoading(false);
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id || 'No user');
        
        if (!isMounted || !initialized) return;

        try {
          setUser(session?.user ?? null);
          
          if (session?.user) {
            console.log('User authenticated, fetching profile...');
            const profileSuccess = await fetchProfile(session.user.id);
            console.log('Profile fetch completed with result:', profileSuccess);
          } else {
            console.log('User signed out, clearing profile');
            setProfile(null);
          }
          
          // Only set loading to false if we were loading
          if (loading) {
            console.log('Setting loading to false after auth change');
            setLoading(false);
          }
        } catch (error) {
          console.error('Error handling auth state change:', error);
          setError('Authentication error occurred');
          setLoading(false);
        }
      }
    );

    return () => {
      console.log('AuthProvider cleanup');
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase.auth, fetchProfile, initialized, loading]);

  const signIn = async (email: string, password: string): Promise<AuthResponse> => {
    try {
      setError(null);
      setLoading(true);
      
      console.log('Attempting sign in...');
      
      const result = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (result.error) {
        console.error('Sign in error:', result.error);
        setError(result.error.message);
        setLoading(false);
      } else {
        console.log('Sign in successful');
      }

      return result;
    } catch (error) {
      console.error('Unexpected sign in error:', error);
      setError('An unexpected error occurred during sign in');
      setLoading(false);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, username: string, fullName?: string): Promise<AuthResponse> => {
    try {
      setError(null);
      setLoading(true);
      
      console.log('Attempting sign up...');
      
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

      if (result.error) {
        console.error('Sign up error:', result.error);
        setError(result.error.message);
        setLoading(false);
      } else {
        console.log('Sign up successful');
      }

      return result;
    } catch (error) {
      console.error('Unexpected sign up error:', error);
      setError('An unexpected error occurred during sign up');
      setLoading(false);
      throw error;
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      setError(null);
      console.log('Signing out...');
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
        throw error;
      }
      console.log('Sign out successful');
    } catch (error) {
      console.error('Error signing out:', error);
      setError('Failed to sign out');
      throw error;
    }
  };

  const updateProfile = async (updates: Partial<Profile>): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    try {
      setError(null);
      console.log('Updating profile...', updates);
      
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) {
        console.error('Profile update error:', error);
        throw error;
      }
      
      const profileSuccess = await fetchProfile(user.id);
      if (!profileSuccess) {
        console.warn('Profile refresh failed after update');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile');
      throw error;
    }
  };

  const value = {
    user,
    profile,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    updateProfile,
    clearError,
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