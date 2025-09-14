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
      
      // Set timeout for profile fetch to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Profile fetch timeout')), 10000);
      });

      const fetchPromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);

      if (error) {
        console.error('Profile fetch error:', error);
        
        // If profile doesn't exist, try to create it
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

              const createTimeoutPromise = new Promise<never>((_, reject) => {
                setTimeout(() => reject(new Error('Profile creation timeout')), 5000);
              });

              const createPromise = supabase
                .from('profiles')
                .insert([newProfile])
                .select()
                .single();

              const { data: createdProfile, error: createError } = await Promise.race([createPromise, createTimeoutPromise]);

              if (createError) {
                console.error('Profile creation error:', createError);
                // Don't fail completely, just proceed without profile
                return true;
              }

              console.log('Profile created successfully:', createdProfile);
              setProfile(createdProfile);
              return true;
            }
          } catch (createError) {
            console.error('Error in profile creation:', createError);
            // Continue without profile rather than failing
            return true;
          }
        }
        // Continue without profile rather than failing completely
        return true;
      }

      console.log('Profile fetched successfully:', data);
      setProfile(data);
      return true;
    } catch (error) {
      console.error('Unexpected error in fetchProfile:', error);
      // Continue without profile rather than failing completely
      return true;
    }
  }, [supabase]);

  // Initialize authentication
  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    const initializeAuth = async () => {
      try {
        console.log('Initializing auth...');
        
        // Set a maximum timeout for initialization
        timeoutId = setTimeout(() => {
          if (mounted) {
            console.warn('Auth initialization timeout, proceeding without auth');
            setLoading(false);
          }
        }, 15000); // 15 second timeout

        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (error) {
          console.error('Session error:', error);
          setError(error.message);
          setLoading(false);
          return;
        }

        console.log('Initial session:', session?.user?.id || 'no session');
        
        if (session?.user) {
          setUser(session.user);
          // Try to fetch profile, but don't block on it
          fetchProfile(session.user.id).finally(() => {
            if (mounted) {
              setLoading(false);
            }
          });
        } else {
          setUser(null);
          setProfile(null);
          setLoading(false);
        }

        // Clear timeout if we reach this point
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setError('Failed to initialize authentication');
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Cleanup function
    return () => {
      mounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [supabase, fetchProfile]);

  // Auth state change listener
  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log('Auth state changed:', event, session?.user?.id || 'no user');
      
      try {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          // Fetch profile without blocking
          fetchProfile(session.user.id).catch(error => {
            console.error('Profile fetch failed after sign in:', error);
          });
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          setUser(session.user);
          // Only fetch profile if we don't have one or it's different user
          if (!profile || profile.id !== session.user.id) {
            fetchProfile(session.user.id).catch(error => {
              console.error('Profile fetch failed after token refresh:', error);
            });
          }
        }
        
        // Always ensure loading is false after auth state changes
        setLoading(false);
      } catch (error) {
        console.error('Error in auth state change handler:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, fetchProfile, profile]);

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