
import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser, Session } from "@supabase/supabase-js";

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

const fetchUserBranch = async (userId: string) => {
  try {
    console.log('Fetching user branch for user:', userId);
    
    const { data: userBranch, error } = await supabase
      .from('user_branches')
      .select('branch_id')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user branch:', error);
      return null;
    }

    console.log('User branch found:', userBranch?.branch_id);
    return userBranch?.branch_id || null;
  } catch (error) {
    console.error('Error in fetchUserBranch:', error);
    return null;
  }
};

const fetchUserProfile = async (supabaseUser: SupabaseUser): Promise<User | null> => {
  try {
    console.log('Fetching profile for user:', supabaseUser.id);
    
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', supabaseUser.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
      // If no profile found, create a basic one
      const basicUser: User = {
        id: supabaseUser.id,
        name: supabaseUser.email?.split('@')[0] || 'User',
        email: supabaseUser.email || '',
        role: 'kasir_cabang'
      };
      console.log('Created basic user object:', basicUser);
      return basicUser;
    }

    if (!profile) {
      console.log('No profile found, creating basic user');
      const basicUser: User = {
        id: supabaseUser.id,
        name: supabaseUser.email?.split('@')[0] || 'User',
        email: supabaseUser.email || '',
        role: 'kasir_cabang'
      };
      return basicUser;
    }

    let branchId: string | undefined;
    
    // For kasir_cabang, fetch their branch assignment
    if (profile.role === 'kasir_cabang') {
      branchId = await fetchUserBranch(supabaseUser.id) || undefined;
    }

    const user: User = {
      id: supabaseUser.id,
      name: profile.name,
      email: supabaseUser.email || '',
      role: profile.role as RoleType,
      branchId
    };

    console.log('Created user object from profile:', user);
    return user;
  } catch (error) {
    console.error('Error in fetchUserProfile:', error);
    // Return basic user instead of null to prevent blocking
    const basicUser: User = {
      id: supabaseUser.id,
      name: supabaseUser.email?.split('@')[0] || 'User',
      email: supabaseUser.email || '',
      role: 'kasir_cabang'
    };
    return basicUser;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);

  // Handle auth state changes and initialize session
  useEffect(() => {
    let mounted = true;
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
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
              localStorage.setItem("bakeryUser", JSON.stringify(userProfile));
            }
          }
        } else {
          // No session, clear user
          setSupabaseUser(null);
          setUser(null);
          localStorage.removeItem("bakeryUser");
        }
        
        if (mounted) {
          setLoading(false);
          setInitializing(false);
        }
      }
    );

    // Check for existing session only once
    if (initializing) {
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        console.log('Initial session check:', session?.user?.email);
        
        if (!mounted) return;
        
        if (session?.user) {
          setSupabaseUser(session.user);
          
          // Check if we have cached user data first
          const cachedUser = localStorage.getItem("bakeryUser");
          if (cachedUser) {
            try {
              const parsedUser = JSON.parse(cachedUser) as User;
              if (parsedUser.id === session.user.id) {
                console.log('Using cached user data');
                setUser(parsedUser);
                setLoading(false);
                setInitializing(false);
                return;
              }
            } catch (error) {
              console.error('Error parsing cached user:', error);
            }
          }
          
          // Fetch fresh profile if no valid cache
          const userProfile = await fetchUserProfile(session.user);
          if (mounted && userProfile) {
            setUser(userProfile);
            localStorage.setItem("bakeryUser", JSON.stringify(userProfile));
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
      console.log('Attempting login for:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      console.log('Login successful for:', email);
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
      console.log('Logging out user');
      await supabase.auth.signOut();
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
