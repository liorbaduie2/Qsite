"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { createBrowserClient } from "@supabase/ssr";
import type {
  User,
  AuthError,
  AuthChangeEvent,
  Session,
} from "@supabase/supabase-js";

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
  approval_status: "pending" | "approved" | "rejected" | "suspended";
  approved_at?: string;
  approved_by?: string;
  rejection_reason?: string;
  is_moderator: boolean;
  is_verified: boolean;
  created_at?: string;
  updated_at?: string;
}

interface UserPermissions {
  role: string;
  role_hebrew: string;
  is_hidden: boolean;
  reputation: number;
  can_approve_registrations: boolean;
  can_manage_user_ranks: boolean;
  can_view_user_list: boolean;
  can_view_private_chats: boolean;
  can_block_user: boolean;
  can_suspend_user: boolean;
  can_permanent_ban: boolean;
  can_edit_delete_content: boolean;
  can_deduct_reputation: boolean;
  can_mark_rule_violation: boolean;
  max_reputation_deduction: number;
  max_suspension_hours: number | null;
  can_report_statuses?: boolean;
  can_post_status_image?: boolean;
  can_use_gif_avatar?: boolean;
}

interface LoginStatusResult {
  can_login: boolean;
  status: "pending" | "approved" | "rejected" | "suspended" | "error";
  message_hebrew: string;
  user_id?: string;
}

interface AuthResponse {
  data: {
    user: User | null;
    session: Session | null;
  };
  error: AuthError | null;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  userPermissions: UserPermissions | null;
  loginStatus: LoginStatusResult | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<AuthResponse>;
  signUp: (
    email: string,
    password: string,
    username: string,
    fullName?: string,
  ) => Promise<AuthResponse>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshPermissions: () => Promise<void>;
  clearError: () => void;
  checkLoginStatus: (userId?: string) => Promise<LoginStatusResult>;
  updateProfile: (profileData: Partial<Profile>) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userPermissions, setUserPermissions] =
    useState<UserPermissions | null>(null);
  const [loginStatus, setLoginStatus] = useState<LoginStatusResult | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage:
          typeof window !== "undefined" ? window.localStorage : undefined,
      },
    },
  );

  // Check if user can login using API route
  const checkLoginStatus = useCallback(
    async (userId?: string): Promise<LoginStatusResult> => {
      try {
        const targetUserId = userId || user?.id;
        if (!targetUserId) {
          const errorResult: LoginStatusResult = {
            can_login: false,
            status: "error",
            message_hebrew: "אין מזהה משתמש",
          };
          setLoginStatus(errorResult);
          return errorResult;
        }

        const response = await fetch("/api/permissions/can-user-login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId: targetUserId }),
        });

        if (!response.ok) {
          throw new Error("Failed to check login status");
        }

        const result = await response.json();
        const loginResult: LoginStatusResult = {
          can_login: result.data,
          status: result.data ? "approved" : "pending",
          message_hebrew: result.data ? "משתמש מאושר" : "משתמש לא מאושר",
        };

        setLoginStatus(loginResult);
        return loginResult;
      } catch (error) {
        console.error("[Auth] Login status check error:", error);
        const errorResult: LoginStatusResult = {
          can_login: true, // Allow login by default if API fails
          status: "error",
          message_hebrew: "שגיאה בבדיקת סטטוס המשתמש",
        };
        setLoginStatus(errorResult);
        return errorResult;
      }
    },
    [user?.id],
  );

  const getUserPermissions = useCallback(
    async (userId: string): Promise<UserPermissions | null> => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const headers: HeadersInit = {
          "Content-Type": "application/json",
        };

        if (session?.access_token) {
          headers["Authorization"] = `Bearer ${session.access_token}`;
        }

        const response = await fetch("/api/permissions/get-user-permissions", {
          method: "POST",
          headers,
          body: JSON.stringify({ userId }),
        });

        if (!response.ok) {
          if (response.status === 401 && !session?.access_token) {
            console.log("No session token available yet");
            return null;
          }
          throw new Error("Failed to get user permissions");
        }

        const result = await response.json();

        if (result.success && result.permissions) {
          setUserPermissions(result.permissions);
          return result.permissions;
        }

        return null;
      } catch (error) {
        console.error("[Auth] Error getting user permissions:", error);

        const defaultPermissions: UserPermissions = {
          role: "user",
          role_hebrew: "משתמש",
          is_hidden: false,
          reputation: 50,
          can_approve_registrations: false,
          can_manage_user_ranks: false,
          can_view_user_list: false,
          can_view_private_chats: false,
          can_block_user: false,
          can_suspend_user: false,
          can_permanent_ban: false,
          can_edit_delete_content: false,
          can_deduct_reputation: false,
          can_mark_rule_violation: false,
          max_reputation_deduction: 0,
          max_suspension_hours: null,
        };
        setUserPermissions(defaultPermissions);
        return defaultPermissions;
      }
    },
    [supabase],
  );

  // Fetch user profile
  const fetchUserProfile = useCallback(
    async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select(
            `
          id, username, full_name, avatar_url, bio, location, website,
          reputation, phone, phone_verified_at, approval_status,
          approved_at, approved_by, rejection_reason, is_moderator,
          is_verified, created_at, updated_at, email
        `,
          )
          .eq("id", userId)
          .single();

        if (error) {
          console.error("[Auth] Profile fetch error:", error);
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
          email: data.email
            ? String(data.email)
            : user?.email
              ? String(user.email)
              : undefined,
          phone: data.phone ? String(data.phone) : undefined,
          phone_verified_at: data.phone_verified_at
            ? String(data.phone_verified_at)
            : undefined,
          approval_status: data.approval_status as
            | "pending"
            | "approved"
            | "rejected"
            | "suspended",
          approved_at: data.approved_at ? String(data.approved_at) : undefined,
          approved_by: data.approved_by ? String(data.approved_by) : undefined,
          rejection_reason: data.rejection_reason
            ? String(data.rejection_reason)
            : undefined,
          is_moderator: Boolean(data.is_moderator),
          is_verified: Boolean(data.is_verified),
          created_at: data.created_at ? String(data.created_at) : undefined,
          updated_at: data.updated_at ? String(data.updated_at) : undefined,
        };

        setProfile(profile);
        return profile;
      } catch (error) {
        console.error("[Auth] Profile fetch error:", error);
        return null;
      }
    },
    [user?.email, supabase],
  );

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      await fetchUserProfile(user.id);
    }
  }, [user?.id, fetchUserProfile]);

  const refreshPermissions = useCallback(async () => {
    if (user?.id) {
      await getUserPermissions(user.id);
    }
  }, [user?.id, getUserPermissions]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const signIn = async (
    email: string,
    password: string,
  ): Promise<AuthResponse> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.log("Sign in error:", error);

        let hebrewError = "שגיאה בהתחברות";
        switch (error.message) {
          case "Invalid login credentials":
            hebrewError = "אימייל או סיסמה שגויים";
            break;
          case "Too many requests":
            hebrewError = "יותר מדי ניסיונות התחברות. נסה שוב מאוחר יותר";
            break;
          default:
            if (error.message.includes("email")) {
              hebrewError = "בעיה עם כתובת האימייל";
            } else if (error.message.includes("password")) {
              hebrewError = "בעיה עם הסיסמה";
            }
        }

        setError(hebrewError);
        return { data, error };
      }

      if (data.user) {
        console.log("User signed in successfully");
        setUser(data.user);

        // Try to get login status, but don't block if it fails
        try {
          const status = await checkLoginStatus(data.user.id);
          if (!status.can_login) {
            await supabase.auth.signOut();
            setError(status.message_hebrew);
            setLoginStatus(status);

            return {
              data: { user: null, session: null },
              error: {
                message: status.message_hebrew,
                name: "ApprovalRequired",
                status_code: status.status,
              } as unknown as AuthError,
            };
          }
        } catch (loginCheckError) {
          console.log(
            "Login status check failed, allowing login anyway:",
            loginCheckError,
          );
        }

        // Fetch profile and permissions
        await fetchUserProfile(data.user.id);
        await getUserPermissions(data.user.id);
      }

      return { data, error };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "שגיאה לא צפויה";
      setError(errorMessage);
      return {
        data: { user: null, session: null },
        error: {
          message: errorMessage,
          name: "UnexpectedError",
        } as AuthError,
      };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    username: string,
    fullName?: string,
  ): Promise<AuthResponse> => {
    try {
      setLoading(true);
      setError(null);

      const registrationResponse = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          username,
          fullName: fullName || "",
          phone: "",
          applicationText: "",
        }),
      });

      const registrationData = await registrationResponse.json();

      if (!registrationResponse.ok) {
        throw new Error(registrationData.error || "שגיאה ברישום");
      }

      return {
        data: {
          user: { id: registrationData.userId } as User,
          session: null,
        },
        error: null,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "שגיאה לא צפויה";
      setError(errorMessage);
      return {
        data: { user: null, session: null },
        error: {
          message: errorMessage,
          name: "SignUpError",
        } as AuthError,
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
      setUserPermissions(null);
      setLoginStatus(null);
      setError(null);
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = useCallback(
    async (profileData: Partial<Profile>): Promise<boolean> => {
      if (!user?.id) {
        setError("משתמש לא מחובר");
        return false;
      }

      try {
        setLoading(true);
        setError(null);

        const { error } = await supabase
          .from("profiles")
          .update({
            username: profileData.username || undefined,
            bio: profileData.bio || undefined,
            location: profileData.location || undefined,
            website: profileData.website || undefined,
            avatar_url: profileData.avatar_url || undefined,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id);

        if (error) {
          console.error("Profile update error:", error);

          if (error.message.includes("username")) {
            setError("שם משתמש כבר תפוס");
          } else if (error.code === "23505") {
            setError("הערך כבר קיים במערכת");
          } else {
            setError("שגיאה בעדכון פרופיל");
          }
          return false;
        }

        await refreshProfile();
        return true;
      } catch (error) {
        console.error("Profile update error:", error);
        setError("שגיאה לא צפויה");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [user?.id, supabase, refreshProfile, setError, setLoading],
  );

  // DEBUG: Add ?debug=auth to URL to see auth flow logs in browser console
  const DEBUG_AUTH =
    typeof window !== "undefined" && window.location.search.includes("debug=auth");

  // Load profile + permissions in background (non-blocking)
  const loadUserDataInBackground = useCallback(
    (userId: string) => {
      const load = async () => {
        try {
          const loginStatus = await Promise.race([
            checkLoginStatus(userId),
            new Promise<LoginStatusResult>((_, rej) =>
              setTimeout(() => rej(new Error("timeout")), 6000)
            ),
          ]);
          if (!loginStatus.can_login) {
            await supabase.auth.signOut();
            setUser(null);
            setProfile(null);
            setUserPermissions(null);
            return;
          }
          await Promise.race([
            Promise.all([
              fetchUserProfile(userId),
              getUserPermissions(userId),
            ]),
            new Promise((_, rej) => setTimeout(rej, 8000)),
          ]);
        } catch (e) {
          console.error("[Auth] Background load error:", e);
          try {
            await fetchUserProfile(userId);
            await getUserPermissions(userId);
          } catch (e2) {
            console.error("[Auth] Fallback load failed:", e2);
          }
        }
      };
      load();
    },
    [checkLoginStatus, fetchUserProfile, getUserPermissions, supabase]
  );

  // Handle auth state changes
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        if (DEBUG_AUTH) console.log("[Auth] onAuthStateChange", event, session?.user?.id ?? "no session");
        if (session?.user) {
          setUser(session.user);
          loadUserDataInBackground(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
          setUserPermissions(null);
          setLoginStatus(null);
        }
        setLoading(false);
        if (DEBUG_AUTH) console.log("[Auth] onAuthStateChange done, loading=false");
      },
    );

    return () => subscription.unsubscribe();
  }, [supabase, loadUserDataInBackground]);

  // Initial session check - set loading=false as soon as we know session state
  useEffect(() => {
    let cancelled = false;
    const timeout = setTimeout(() => {
      if (cancelled) return;
      if (DEBUG_AUTH) console.log("[Auth] Safety timeout (5s)");
      setLoading(false);
    }, 5000);

    const getInitialSession = async () => {
      try {
        if (DEBUG_AUTH) console.log("[Auth] getInitialSession start");
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (DEBUG_AUTH) console.log("[Auth] getSession", session?.user?.id ?? "none");
        if (cancelled) return;
        if (session?.user) {
          setUser(session.user);
          loadUserDataInBackground(session.user.id);
        }
      } catch (error) {
        console.error("[Auth] Initial session error:", error);
      } finally {
        if (!cancelled) setLoading(false);
        if (DEBUG_AUTH) console.log("[Auth] getInitialSession done");
      }
    };

    getInitialSession();

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [supabase, loadUserDataInBackground]);

  const value: AuthContextType = {
    user,
    profile,
    userPermissions,
    loginStatus,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    refreshProfile,
    refreshPermissions,
    clearError,
    checkLoginStatus,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Permission-based component wrapper
interface RequirePermissionProps {
  permission?: keyof UserPermissions;
  role?: string;
  fallback?: ReactNode;
  children: ReactNode;
}

export function RequirePermission({
  permission,
  role,
  fallback = null,
  children,
}: RequirePermissionProps) {
  const { userPermissions, loading } = useAuth();

  if (loading) {
    return <div>טוען...</div>;
  }

  if (!userPermissions) {
    return <>{fallback}</>;
  }

  // Check specific permission
  if (permission && !userPermissions[permission]) {
    return <>{fallback}</>;
  }

  // Check role
  if (role && userPermissions.role !== role) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// Admin route protection component
export function AdminRoute({ children }: { children: ReactNode }) {
  const { userPermissions, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div>טוען הרשאות...</div>
      </div>
    );
  }

  if (!userPermissions || !userPermissions.can_view_user_list) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">אין הרשאת גישה</h2>
          <p>אין לך הרשאה לגשת לאזור זה.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
