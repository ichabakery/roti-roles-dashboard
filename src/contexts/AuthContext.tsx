
import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { signInWithEmail, signOut, getSession, onAuthStateChange } from "@/services/authService";
import { fetchUserProfile } from "@/services/userProfileService";

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
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  
  const mounted = useRef(true);
  const profileFetchingRef = useRef(false);

  // Simplified function to fetch profile without causing infinite loops
  const loadUserProfile = async (supabaseUser: SupabaseUser) => {
    if (profileFetchingRef.current) {
      console.log('Profile fetch already in progress, skipping...');
      return;
    }

    try {
      profileFetchingRef.current = true;
      console.log('Starting profile fetch for user:', supabaseUser.email);
      
      const userProfile = await fetchUserProfile(supabaseUser);
      
      if (mounted.current && userProfile) {
        console.log('Profile loaded successfully:', userProfile);
        setUser(userProfile);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      if (mounted.current) {
        // Clear everything on profile error to force re-authentication
        setUser(null);
        setSupabaseUser(null);
      }
    } finally {
      profileFetchingRef.current = false;
      if (mounted.current) {
        setLoading(false);
      }
    }
  };

  // Function to refresh user profile
  const refreshProfile = async () => {
    if (!supabaseUser) {
      console.log('No supabase user, cannot refresh profile');
      return;
    }
    
    console.log('Refreshing profile for user:', supabaseUser.email);
    await loadUserProfile(supabaseUser);
  };

  // Handle auth state changes - SIMPLIFIED to avoid async issues
  useEffect(() => {
    console.log('Setting up auth state listener...');
    
    const { data: { subscription } } = onAuthStateChange(
      (event, session) => {
        console.log('Auth state change:', event, session?.user?.email);
        
        if (!mounted.current) return;
        
        if (session?.user) {
          setSupabaseUser(session.user);
          // Use setTimeout to defer async operations and avoid callback deadlock
          setTimeout(() => {
            if (mounted.current) {
              loadUserProfile(session.user);
            }
          }, 0);
        } else {
          // No session, clear everything immediately
          console.log('No session, clearing all auth state');
          setSupabaseUser(null);
          setUser(null);
          setLoading(false);
        }
      }
    );

    // Check for existing session once on mount
    getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', session?.user?.email);
      
      if (!mounted.current) return;
      
      if (session?.user) {
        setSupabaseUser(session.user);
        // Use setTimeout here too to avoid blocking
        setTimeout(() => {
          if (mounted.current) {
            loadUserProfile(session.user);
          }
        }, 0);
      } else {
        console.log('No initial session found');
        setLoading(false);
      }
    }).catch((error) => {
      console.error('Error during initial session check:', error);
      if (mounted.current) {
        setLoading(false);
      }
    });

    return () => {
      mounted.current = false;
      subscription.unsubscribe();
    };
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      console.log('Attempting login for:', email);
      await signInWithEmail(email, password);
      // The user will be set by the auth state change listener
    } catch (error) {
      console.error("Login error:", error);
      setLoading(false);
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      console.log('Logging out user');
      profileFetchingRef.current = false;
      await signOut();
      // The user will be cleared by the auth state change listener
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Check if user has authorized role
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
    refreshProfile,
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
