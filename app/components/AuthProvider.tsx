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

  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    if (!user || !profile) {
      throw new Error('User not authenticated');
    }

    try {
      console.log('Updating profile with:', updates);
      
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Profile update error:', error);
        throw new Error('Failed to update profile');
      }

      console.log('Profile updated successfully:', data);
      setProfile(data);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }, [supabase, user, profile]);

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
              console.log('Fetching profile for authenticated user:', session.user.id);
              const success = await fetchProfile(session.user.id);
              if (!success) {
                console.log('Profile fetch failed, but continuing...');
              }
            }
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        if (isMounted) {
          setError('Failed to initialize authentication');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    initializeAuth();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id || 'no user');
        
        if (isMounted) {
          setUser(session?.user ?? null);
          
          if (session?.user && event === 'SIGNED_IN') {
            console.log('User signed in, fetching profile...');
            const success = await fetchProfile(session.user.id);
            if (!success) {
              console.log('Profile fetch failed after sign in');
            }
          } else if (event === 'SIGNED_OUT') {
            console.log('User signed out, clearing profile...');
            setProfile(null);
            clearError();
          }
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, fetchProfile, clearError]);

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResponse> => {
    try {
      console.log('Attempting to sign in user:', email);
      clearError();
      
      const result = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (result.error) {
        console.error('Sign in error:', result.error);
        setError(result.error.message);
      } else if (result.data.user) {
        console.log('Sign in successful:', result.data.user.id);
        // Profile will be fetched by the auth state change listener
      }

      return result;
    } catch (error) {
      console.error('Unexpected sign in error:', error);
      const errorMessage = 'An unexpected error occurred during sign in';
      setError(errorMessage);
      return { data: { user: null, session: null }, error: new Error(errorMessage) as any };
    }
  }, [supabase, clearError]);

  const signUp = useCallback(async (email: string, password: string, username: string, fullName?: string): Promise<AuthResponse> => {
    try {
      console.log('Attempting to sign up user:', email, username);
      clearError();
      
      const result = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            full_name: fullName || '',
          },
        },
      });

      if (result.error) {
        console.error('Sign up error:', result.error);
        setError(result.error.message);
      } else if (result.data.user) {
        console.log('Sign up successful:', result.data.user.id);
        // Profile creation will be handled by the auth state change listener or fetchProfile
      }

      return result;
    } catch (error) {
      console.error('Unexpected sign up error:', error);
      const errorMessage = 'An unexpected error occurred during sign up';
      setError(errorMessage);
      return { data: { user: null, session: null }, error: new Error(errorMessage) as any };
    }
  }, [supabase, clearError]);

  const signOut = useCallback(async (): Promise<void> => {
    try {
      console.log('Attempting to sign out...');
      clearError();
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
        setError(error.message);
        throw error;
      }
      
      console.log('Sign out successful');
      // Clear state will be handled by the auth state change listener
    } catch (error) {
      console.error('Unexpected sign out error:', error);
      setError('An unexpected error occurred during sign out');
      throw error;
    }
  }, [supabase, clearError]);

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading: loading || !initialized,
      error,
      signIn,
      signUp,
      signOut,
      updateProfile,
      clearError,
    }}>
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