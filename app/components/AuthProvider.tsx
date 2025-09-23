// components/AuthProvider.tsx - UPDATED
'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import type { User, AuthError, AuthChangeEvent, Session } from '@supabase/supabase-js';

interface Profile {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  website?: string;
  reputation: number;
  email?: string;
  phone?: string;
  phone_verified_at?: string;
  approval_status: 'pending' | 'approved' | 'rejected' | 'suspended';
  approved_at?: string;
  approved_by?: string;
  rejection_reason?: string;
  is_moderator: boolean;
  is_verified: boolean;
  created_at?: string;
  updated_at?: string;
}

interface LoginStatusResult {
  can_login: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'suspended' | 'error';
  message_hebrew: string;
  user_id?: string;
}

interface AuthResponse {
  data: {
    user: User | null;
    session: any;
  };
  error: AuthError | null;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loginStatus: LoginStatusResult | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<AuthResponse>;
  signUp: (email: string, password: string, username: string, fullName?: string) => Promise<AuthResponse>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  clearError: () => void;
  checkLoginStatus: (userId?: string) => Promise<LoginStatusResult>;
  updateProfile: (profileData: Partial<Profile>) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loginStatus, setLoginStatus] = useState<LoginStatusResult | null>(null);
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

  // Check user login status using the SQL function
  const checkLoginStatus = useCallback(async (userId?: string): Promise<LoginStatusResult> => {
    try {
      const targetUserId = userId || user?.id;
      if (!targetUserId) {
        const errorResult: LoginStatusResult = {
          can_login: false,
          status: 'error',
          message_hebrew: 'אין מזהה משתמש'
        };
        setLoginStatus(errorResult);
        return errorResult;
      }

      const { data, error } = await supabase
        .rpc('get_user_login_status', { user_id: targetUserId });

      if (error) {
        console.error('Login status check error:', error);
        const errorResult: LoginStatusResult = {
          can_login: false,
          status: 'error',
          message_hebrew: 'שגיאה בבדיקת סטטוס המשתמש'
        };
        setLoginStatus(errorResult);
        return errorResult;
      }

      setLoginStatus(data);
      return data;
    } catch (error) {
      console.error('Login status check error:', error);
      const errorResult: LoginStatusResult = {
        can_login: false,
        status: 'error',
        message_hebrew: 'שגיאה בבדיקת סטטוס המשתמש'
      };
      setLoginStatus(errorResult);
      return errorResult;
    }
  }, [user?.id, supabase]);

  // Fetch user profile
  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id, username, full_name, avatar_url, bio, location, website,
          reputation, phone, phone_verified_at, approval_status,
          approved_at, approved_by, rejection_reason, is_moderator,
          is_verified, created_at, updated_at
        `)
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Profile fetch error:', error);
        return null;
      }

      const profile: Profile = {
        id: String(data.id),
        username: String(data.username),
        full_name: data.full_name ? String(data.full_name) : undefined,
        avatar_url: data.avatar_url ? String(data.avatar_url) : undefined,
        bio: data.bio ? String(data.bio) : undefined,
        location: data.location ? String(data.location) : undefined,
        website: data.website ? String(data.website) : undefined,
        reputation: data.reputation ? Number(data.reputation) : 0,
        email: user?.email ? String(user.email) : undefined,
        phone: data.phone ? String(data.phone) : undefined,
        phone_verified_at: data.phone_verified_at ? String(data.phone_verified_at) : undefined,
        approval_status: data.approval_status as 'pending' | 'approved' | 'rejected' | 'suspended',
        approved_at: data.approved_at ? String(data.approved_at) : undefined,
        approved_by: data.approved_by ? String(data.approved_by) : undefined,
        rejection_reason: data.rejection_reason ? String(data.rejection_reason) : undefined,
        is_moderator: Boolean(data.is_moderator),
        is_verified: Boolean(data.is_verified),
        created_at: data.created_at ? String(data.created_at) : undefined,
        updated_at: data.updated_at ? String(data.updated_at) : undefined,
      };

      setProfile(profile);
      return profile;
    } catch (error) {
      console.error('Profile fetch error:', error);
      return null;
    }
  }, [user?.email, supabase]);

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      await fetchUserProfile(user.id);
    }
  }, [user?.id, fetchUserProfile]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // 🔥 UPDATED: Simplified signIn without email confirmation errors
  const signIn = async (email: string, password: string): Promise<AuthResponse> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.log('Sign in error:', error);
        
        let hebrewError = 'שגיאה בהתחברות';
        switch (error.message) {
          case 'Invalid login credentials':
            hebrewError = 'אימייל או סיסמה שגויים';
            break;
          case 'Too many requests':
            hebrewError = 'יותר מדי ניסיונות התחברות. נסה שוב מאוחר יותר';
            break;
          default:
            if (error.message.includes('email')) {
              hebrewError = 'בעיה עם כתובת האימייל';
            } else if (error.message.includes('password')) {
              hebrewError = 'בעיה עם הסיסמה';
            }
        }
        
        setError(hebrewError);
        return { data, error };
      }

      if (data.user) {
        console.log('User signed in, checking approval status...');
        const status = await checkLoginStatus(data.user.id);
        
        if (!status.can_login) {
          await supabase.auth.signOut();
          setError(status.message_hebrew);
          setLoginStatus(status);
          
          return {
            data: { user: null, session: null },
            error: { 
              message: status.message_hebrew, 
              name: 'ApprovalRequired',
              status_code: status.status 
            } as any
          };
        }
        
        await fetchUserProfile(data.user.id);
      }

      return { data, error };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'שגיאה לא צפויה';
      setError(errorMessage);
      return { 
        data: { user: null, session: null }, 
        error: { 
          message: errorMessage,
          name: 'UnexpectedError',
        } as AuthError
      };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (
    email: string, 
    password: string, 
    username: string, 
    fullName?: string
  ): Promise<AuthResponse> => {
    try {
      setLoading(true);
      setError(null);

      const registrationResponse = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          username,
          fullName: fullName || '',
          phone: '',
          applicationText: ''
        }),
      });

      const registrationData = await registrationResponse.json();

      if (!registrationResponse.ok) {
        throw new Error(registrationData.error || 'שגיאה ברישום');
      }

      return {
        data: {
          user: { id: registrationData.userId } as User,
          session: null
        },
        error: null
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'שגיאה לא צפויה';
      setError(errorMessage);
      return { 
        data: { user: null, session: null }, 
        error: { 
          message: errorMessage,
          name: 'SignUpError',
        } as AuthError
      };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setLoginStatus(null);
      setError(null);
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // NEW updateProfile function as per your instructions
  const updateProfile = useCallback(async (profileData: Partial<Profile>): Promise<boolean> => {
    if (!user?.id) {
      setError('משתמש לא מחובר');
      return false;
    }

    try {
      setLoading(true);
      setError(null);

      // Direct database update using Supabase client
      const { data, error } = await supabase
        .from('profiles')
        .update({
          username: profileData.username || undefined,
          bio: profileData.bio || undefined,
          location: profileData.location || undefined,
          website: profileData.website || undefined,
          avatar_url: profileData.avatar_url || undefined,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        console.error('Profile update error:', error);
        
        // Handle specific errors in Hebrew
        if (error.message.includes('username')) {
          setError('שם משתמש כבר תפוס');
        } else if (error.code === '23505') {
          setError('הערך כבר קיים במערכת');
        } else {
          setError('שגיאה בעדכון פרופיל');
        }
        return false;
      }

      // Refresh the profile after successful update
      await refreshProfile();
      return true;

    } catch (error) {
      console.error('Profile update error:', error);
      setError('שגיאה לא צפויה');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user?.id, supabase, refreshProfile, setError, setLoading]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        console.log('Auth state change:', event, session?.user?.id);

        if (session?.user) {
          setUser(session.user);
          
          const loginStatus = await checkLoginStatus(session.user.id);
          if (loginStatus.can_login) {
            await fetchUserProfile(session.user.id);
          } else {
            await supabase.auth.signOut();
            setUser(null);
            setProfile(null);
          }
        } else {
          setUser(null);
          setProfile(null);
          setLoginStatus(null);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase, checkLoginStatus, fetchUserProfile]);

  const value: AuthContextType = {
    user,
    profile,
    loginStatus,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    refreshProfile,
    clearError,
    checkLoginStatus,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};