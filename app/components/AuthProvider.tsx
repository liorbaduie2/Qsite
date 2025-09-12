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
  location?: string;
  website?: string;
  reputation?: number;
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
                reputation: 0
              };

              console.log('Creating profile with data:', newProfile);

              const { data: createdProfile, error: createError } = await supabase
                .from('profiles')
                .insert([newProfile])
                .select()
                .single();

              if (createError) {
                console.error('Profile creation error:', createError);
                return false;
              }

              console.log('Profile created successfully:', createdProfile);
              setProfile(createdProfile);
              return true;
            }
          } catch (createError) {
            console.error('Error in profile creation:', createError);
            return false;
          }
        }
        return false;
      }

      console.log('Profile fetched successfully:', data);
      setProfile(data);
      return true;
    } catch (error) {
      console.error('Unexpected error in fetchProfile:', error);
      return false;
    }
  }, [supabase]);

  const initializeAuth = useCallback(async () => {
    try {
      console.log('Initializing auth...');
      setLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Initial session:', session?.user?.id || 'no session');
      
      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      setError('Failed to initialize authentication');
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  }, [supabase, fetchProfile]);

  useEffect(() => {
    if (!initialized) {
      initializeAuth();
    }
  }, [initializeAuth, initialized]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id || 'no user');
      
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        setUser(session.user);
        if (!profile || profile.id !== session.user.id) {
          await fetchProfile(session.user.id);
        }
      }
      
      if (initialized) {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, fetchProfile, profile, initialized]);

  const signIn = async (email: string, password: string): Promise<AuthResponse> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (response.error) {
        setError(response.error.message);
      }

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setError(errorMessage);
      return { data: { user: null, session: null }, error: { message: errorMessage } } as AuthResponse;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, username: string, fullName?: string): Promise<AuthResponse> => {
    try {
      setLoading(true);
      setError(null);

      // Check if username is already taken
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .single();

      if (existingProfile) {
        const errorMessage = 'שם המשתמש כבר תפוס';
        setError(errorMessage);
        return { data: { user: null, session: null }, error: { message: errorMessage } } as AuthResponse;
      }

      const response = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            full_name: fullName || '',
          }
        }
      });

      if (response.error) {
        setError(response.error.message);
      } else if (response.data.user) {
        // Profile will be created automatically via the auth state change listener
        console.log('User signed up successfully');
      }

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setError(errorMessage);
      return { data: { user: null, session: null }, error: { message: errorMessage } } as AuthResponse;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error('Sign out error:', error);
      setError(error instanceof Error ? error.message : 'Failed to sign out');
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Profile>): Promise<void> => {
    if (!user || !profile) {
      throw new Error('No authenticated user');
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setProfile(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
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