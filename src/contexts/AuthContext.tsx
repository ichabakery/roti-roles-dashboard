
import React, { createContext, useContext, useState, useEffect, useRef } from "react";
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
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  
  const lastFetchedUserId = useRef<string | null>(null);
  const mounted = useRef(true);

  // Function to refresh user profile
  const refreshProfile = async () => {
    if (!supabaseUser) return;
    
    console.log('Refreshing profile for user:', supabaseUser.email);
    
    // Clear cache and reset
    removeCachedUser();
    lastFetchedUserId.current = null;
    
    try {
      const userProfile = await fetchUserProfile(supabaseUser);
      if (mounted.current && userProfile) {
        console.log('Profile refreshed successfully:', userProfile);
        setUser(userProfile);
        setCachedUser(userProfile);
        lastFetchedUserId.current = supabaseUser.id;
      }
    } catch (error) {
      console.error('Error refreshing profile:', error);
      // On refresh error, clear everything to force re-authentication
      setUser(null);
      setSupabaseUser(null);
      removeCachedUser();
    }
  };

  // Handle auth state changes
  useEffect(() => {
    console.log('Setting up auth state listener...');
    
    const { data: { subscription } } = onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email);
        
        if (!mounted.current) return;
        
        if (session?.user) {
          setSupabaseUser(session.user);
          
          // Always clear cache and fetch fresh profile on any auth event
          console.log('Auth event detected, clearing cache and fetching fresh profile');
          removeCachedUser();
          lastFetchedUserId.current = null;
          
          try {
            const userProfile = await fetchUserProfile(session.user);
            if (mounted.current && userProfile) {
              console.log('Fresh profile loaded:', userProfile);
              setUser(userProfile);
              setCachedUser(userProfile);
              lastFetchedUserId.current = session.user.id;
            }
          } catch (error) {
            console.error('Error fetching user profile:', error);
            // On profile fetch error, clear everything
            if (mounted.current) {
              setUser(null);
              setSupabaseUser(null);
              removeCachedUser();
            }
          }
        } else {
          // No session, clear everything
          setSupabaseUser(null);
          setUser(null);
          lastFetchedUserId.current = null;
          removeCachedUser();
        }
        
        if (mounted.current) {
          setLoading(false);
        }
      }
    );

    // Check for existing session once on mount
    getSession().then(async ({ data: { session } }) => {
      console.log('Initial session check:', session?.user?.email);
      
      if (!mounted.current) return;
      
      if (session?.user) {
        setSupabaseUser(session.user);
        
        // Always fetch fresh profile on app initialization
        console.log('App initialization - fetching fresh profile');
        removeCachedUser();
        
        try {
          const userProfile = await fetchUserProfile(session.user);
          if (mounted.current && userProfile) {
            console.log('Initial profile loaded:', userProfile);
            setUser(userProfile);
            setCachedUser(userProfile);
            lastFetchedUserId.current = session.user.id;
          }
        } catch (error) {
          console.error('Error fetching initial user profile:', error);
          // On error, clear everything
          if (mounted.current) {
            setUser(null);
            setSupabaseUser(null);
            removeCachedUser();
          }
        }
      }
      
      if (mounted.current) {
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
      // Clear any existing cache before login
      removeCachedUser();
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
      lastFetchedUserId.current = null;
      removeCachedUser();
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
