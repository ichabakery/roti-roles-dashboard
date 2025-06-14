
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
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Use ref to track which user we've fetched profile for to prevent infinite loops
  const lastFetchedUserId = useRef<string | null>(null);
  const mounted = useRef(true);

  // Handle auth state changes
  useEffect(() => {
    console.log('Setting up auth state listener...');
    
    const { data: { subscription } } = onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email);
        
        if (!mounted.current) return;
        
        if (session?.user) {
          setSupabaseUser(session.user);
          
          // Only fetch profile if we haven't fetched it for this user yet
          if (lastFetchedUserId.current !== session.user.id) {
            console.log('Fetching user profile for new user:', session.user.id);
            lastFetchedUserId.current = session.user.id;
            
            try {
              const userProfile = await fetchUserProfile(session.user);
              if (mounted.current && userProfile) {
                setUser(userProfile);
                setCachedUser(userProfile);
              }
            } catch (error) {
              console.error('Error fetching user profile:', error);
              // Create a basic user profile as fallback
              const basicUser: User = {
                id: session.user.id,
                name: session.user.email?.split('@')[0] || 'User',
                email: session.user.email || '',
                role: 'kasir_cabang'
              };
              if (mounted.current) {
                setUser(basicUser);
                setCachedUser(basicUser);
              }
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

    // Check for existing session once
    getSession().then(async ({ data: { session } }) => {
      console.log('Initial session check:', session?.user?.email);
      
      if (!mounted.current) return;
      
      if (session?.user) {
        setSupabaseUser(session.user);
        
        // Check cached user first
        const cachedUser = getCachedUser();
        if (cachedUser && cachedUser.id === session.user.id) {
          console.log('Using cached user data');
          setUser(cachedUser);
          lastFetchedUserId.current = session.user.id;
          setLoading(false);
          return;
        }
        
        // Fetch fresh profile
        lastFetchedUserId.current = session.user.id;
        try {
          const userProfile = await fetchUserProfile(session.user);
          if (mounted.current && userProfile) {
            setUser(userProfile);
            setCachedUser(userProfile);
          }
        } catch (error) {
          console.error('Error fetching initial user profile:', error);
          // Create basic user as fallback
          const basicUser: User = {
            id: session.user.id,
            name: session.user.email?.split('@')[0] || 'User',
            email: session.user.email || '',
            role: 'kasir_cabang'
          };
          if (mounted.current) {
            setUser(basicUser);
            setCachedUser(basicUser);
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
  }, []); // No dependencies to prevent re-running

  // Login function
  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      await signInWithEmail(email, password);
      // The user will be set by the auth state change listener
    } catch (error) {
      console.error("Login error:", error);
      setLoading(false); // Set loading to false on error
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      lastFetchedUserId.current = null;
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
