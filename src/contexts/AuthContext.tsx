
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
    console.log('Ensuring user-branch link for user:', userId, 'email:', email);
    
    // Check if user-branch link exists
    const { data: existingLinks, error: checkError } = await supabase
      .from('user_branches')
      .select('branch_id')
      .eq('user_id', userId);

    if (checkError) {
      console.error('Error checking existing user-branch links:', checkError);
      return null;
    }

    console.log('Existing user-branch links:', existingLinks);

    if (!existingLinks || existingLinks.length === 0) {
      // No existing links, create one
      const { data: branches, error: branchError } = await supabase
        .from('branches')
        .select('id, name')
        .order('name');

      if (branchError) {
        console.error('Error fetching branches:', branchError);
        return null;
      }

      if (branches && branches.length > 0) {
        let targetBranchId = branches[0].id;
        
        // Assign specific branches based on email for demo
        if (email === 'kasir@bakeryguru.com') {
          const utamaBranch = branches.find(b => b.name === 'Cabang Utama');
          if (utamaBranch) targetBranchId = utamaBranch.id;
        } else if (email === 'kasir2@bakeryguru.com') {
          const selatanBranch = branches.find(b => b.name === 'Cabang Selatan');
          if (selatanBranch) targetBranchId = selatanBranch.id;
        }

        // Create user-branch link
        const { error: insertError } = await supabase
          .from('user_branches')
          .insert({
            user_id: userId,
            branch_id: targetBranchId
          });

        if (insertError) {
          console.error('Error creating user-branch link:', insertError);
          return null;
        }

        console.log('Created new user-branch link:', userId, '->', targetBranchId);
        return targetBranchId;
      }
    } else {
      // Use existing link (for kasir, use first one; for others, they might have multiple)
      console.log('Using existing user-branch link:', existingLinks[0].branch_id);
      return existingLinks[0].branch_id;
    }
  } catch (error) {
    console.error('Error in ensureUserBranchLink:', error);
  }
  return null;
};

const fetchUserBranch = async (userId: string) => {
  try {
    console.log('Fetching user branch for user:', userId);
    
    const { data: userBranch, error } = await supabase
      .from('user_branches')
      .select('branch_id')
      .eq('user_id', userId)
      .limit(1)
      .single();
    
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
      branchId = await fetchUserBranch(supabaseUser.id);
      if (!branchId) {
        branchId = await ensureUserBranchLink(supabaseUser.id, email);
      }
    }

    const userObj = {
      id: supabaseUser.id,
      name: email.split('@')[0],
      email: email,
      role: userRole,
      branchId: branchId || undefined,
    };

    console.log('Created user object:', userObj);
    return userObj;
  };

  // Handle auth state changes and initialize session
  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email);
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
      console.log('Initial session check:', session?.user?.email);
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
