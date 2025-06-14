
import React, { createContext, useContext, useState, useEffect } from "react";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { signInWithEmail, signOut, getSession, onAuthStateChange } from "@/services/authService";
import { fetchUserProfile } from "@/services/userProfileService";
import { getCachedUser, setCachedUser, removeCachedUser } from "@/utils/authStorage";

export type RoleType = "owner" | "kepala_produksi" | "kasir_cabang" | "admin_pusat";

export interface User {
  id: string;
  name: string;
  email: string;
  role: RoleType;
  branchId?: string;
}

interface AuthContextValue {
  user: User | null;
  supabaseUser: SupabaseUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthorized: (allowedRoles: RoleType[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);

  // Handle auth state changes and initialize session
  useEffect(() => {
    let mounted = true;
    
    // Set up auth state listener
    const { data: { subscription } } = onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email);
        
        if (!mounted) return;
        
        // Don't set loading to true on token refresh
        if (event !== 'TOKEN_REFRESHED') {
          setLoading(true);
        }
        
        if (session?.user) {
          setSupabaseUser(session.user);
          
          // Only fetch profile if we don't have a user or user ID changed
          if (!user || user.id !== session.user.id) {
            console.log('Fetching user profile...');
            const userProfile = await fetchUserProfile(session.user);
            if (mounted && userProfile) {
              setUser(userProfile);
              setCachedUser(userProfile);
            }
          }
        } else {
          // No session, clear user
          setSupabaseUser(null);
          setUser(null);
          removeCachedUser();
        }
        
        if (mounted) {
          setLoading(false);
          setInitializing(false);
        }
      }
    );

    // Check for existing session only once
    if (initializing) {
      getSession().then(async ({ data: { session } }) => {
        console.log('Initial session check:', session?.user?.email);
        
        if (!mounted) return;
        
        if (session?.user) {
          setSupabaseUser(session.user);
          
          // Check if we have cached user data first
          const cachedUser = getCachedUser();
          if (cachedUser && cachedUser.id === session.user.id) {
            console.log('Using cached user data');
            setUser(cachedUser);
            setLoading(false);
            setInitializing(false);
            return;
          }
          
          // Fetch fresh profile if no valid cache
          const userProfile = await fetchUserProfile(session.user);
          if (mounted && userProfile) {
            setUser(userProfile);
            setCachedUser(userProfile);
          }
        }
        
        if (mounted) {
          setLoading(false);
          setInitializing(false);
        }
      });
    }

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [initializing]); // Only depend on initializing

  // Login function
  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      await signInWithEmail(email, password);
      // The user will be set by the auth state change listener
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await signOut();
      // The user will be cleared by the auth state change listener
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Check apakah user memiliki role yang diizinkan
  const isAuthorized = (allowedRoles: RoleType[]): boolean => {
    if (!user) return false;
    return allowedRoles.includes(user.role);
  };

  const value = {
    user,
    supabaseUser,
    loading,
    login,
    logout,
    isAuthorized,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
