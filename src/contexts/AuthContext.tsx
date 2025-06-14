
import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser, Session } from "@supabase/supabase-js";

export type RoleType = "owner" | "kepala_produksi" | "kasir_cabang" | "admin_pusat";

export interface User {
  id: string;
  name: string;
  email: string;
  role: RoleType;
  branchId?: string; // untuk kasir yang berkaitan dengan cabang tertentu
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

// Map email to role for demo
const emailToRoleMap: Record<string, { role: RoleType; branchId?: string }> = {
  "owner@bakeryguru.com": { role: "owner" },
  "owner@icha.com": { role: "owner" },
  "produksi@bakeryguru.com": { role: "kepala_produksi" },
  "kasir@bakeryguru.com": { role: "kasir_cabang" },
  "admin@bakeryguru.com": { role: "admin_pusat" },
  "kasir2@bakeryguru.com": { role: "kasir_cabang" },
};

const ensureUserBranchLink = async (userId: string, email: string) => {
  try {
    // Check if user-branch link exists
    const { data: existingLink } = await supabase
      .from('user_branches')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!existingLink) {
      // Get the first available branch for demo purposes
      const { data: branches } = await supabase
        .from('branches')
        .select('id')
        .limit(1);

      if (branches && branches.length > 0) {
        let branchId = branches[0].id;
        
        // Assign specific branches based on email for demo
        if (email === 'kasir@bakeryguru.com') {
          const { data: branch1 } = await supabase
            .from('branches')
            .select('id')
            .eq('name', 'Cabang Utama')
            .single();
          if (branch1) branchId = branch1.id;
        } else if (email === 'kasir2@bakeryguru.com') {
          const { data: branch2 } = await supabase
            .from('branches')
            .select('id')
            .eq('name', 'Cabang Selatan')
            .single();
          if (branch2) branchId = branch2.id;
        }

        // Create user-branch link
        await supabase
          .from('user_branches')
          .insert({
            user_id: userId,
            branch_id: branchId
          });

        return branchId;
      }
    } else {
      return existingLink.branch_id;
    }
  } catch (error) {
    console.error('Error ensuring user-branch link:', error);
  }
  return null;
};

const fetchUserBranch = async (userId: string) => {
  try {
    const { data: userBranch } = await supabase
      .from('user_branches')
      .select('branch_id')
      .eq('user_id', userId)
      .single();
    
    return userBranch?.branch_id || null;
  } catch (error) {
    console.error('Error fetching user branch:', error);
    return null;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  const createUserObject = async (supabaseUser: SupabaseUser): Promise<User> => {
    const email = supabaseUser.email?.toLowerCase() || '';
    
    // Get role from mapping or default to kasir_cabang
    const userRole = emailToRoleMap[email]?.role || 'kasir_cabang';
    
    let branchId: string | undefined;
    
    // For kasir_cabang, ensure they have a branch assignment
    if (userRole === 'kasir_cabang') {
      branchId = await ensureUserBranchLink(supabaseUser.id, email);
      if (!branchId) {
        branchId = await fetchUserBranch(supabaseUser.id);
      }
    }

    return {
      id: supabaseUser.id,
      name: email.split('@')[0],
      email: email,
      role: userRole,
      branchId: branchId || undefined,
    };
  };

  // Handle auth state changes and initialize session
  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setLoading(true);
        
        if (session?.user) {
          setSupabaseUser(session.user);
          
          // Create user object with proper branch assignment
          const userObj = await createUserObject(session.user);
          setUser(userObj);
          localStorage.setItem("bakeryUser", JSON.stringify(userObj));
        } else {
          // No session, clear user
          setSupabaseUser(null);
          setUser(null);
          localStorage.removeItem("bakeryUser");
        }
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setSupabaseUser(session.user);
        
        // Create user object with proper branch assignment
        const userObj = await createUserObject(session.user);
        setUser(userObj);
        localStorage.setItem("bakeryUser", JSON.stringify(userObj));
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
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
