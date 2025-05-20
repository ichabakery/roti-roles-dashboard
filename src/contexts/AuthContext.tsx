
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

// Mock users untuk demo
const MOCK_USERS: User[] = [
  {
    id: "1",
    name: "Owner",
    email: "owner@bakeryguru.com",
    role: "owner",
  },
  {
    id: "2",
    name: "Kepala Produksi",
    email: "produksi@bakeryguru.com",
    role: "kepala_produksi",
  },
  {
    id: "3",
    name: "Kasir Cabang Utama",
    email: "kasir@bakeryguru.com",
    role: "kasir_cabang",
    branchId: "00000000-0000-0000-0000-000000000001",
  },
  {
    id: "4",
    name: "Admin Pusat",
    email: "admin@bakeryguru.com",
    role: "admin_pusat",
  },
  {
    id: "5",
    name: "Kasir Cabang Selatan",
    email: "kasir2@bakeryguru.com",
    role: "kasir_cabang",
    branchId: "00000000-0000-0000-0000-000000000002",
  },
];

// Map email to role for demo
const emailToRoleMap: Record<string, { role: RoleType; branchId?: string }> = {
  "owner@bakeryguru.com": { role: "owner" },
  "owner@icha.com": { role: "owner" },
  "produksi@bakeryguru.com": { role: "kepala_produksi" },
  "kasir@bakeryguru.com": { role: "kasir_cabang", branchId: "00000000-0000-0000-0000-000000000001" },
  "admin@bakeryguru.com": { role: "admin_pusat" },
  "kasir2@bakeryguru.com": { role: "kasir_cabang", branchId: "00000000-0000-0000-0000-000000000002" },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Handle auth state changes and initialize session
  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setLoading(true);
        
        if (session?.user) {
          const email = session.user.email?.toLowerCase();
          setSupabaseUser(session.user);
          
          // For demo, map email to role
          if (email && emailToRoleMap[email]) {
            // Create user object
            const newUser: User = {
              id: session.user.id,
              name: email.split('@')[0],
              email: email,
              role: emailToRoleMap[email].role,
              branchId: emailToRoleMap[email].branchId,
            };
            setUser(newUser);
            localStorage.setItem("bakeryUser", JSON.stringify(newUser));
          } else {
            // Default to kasir_cabang if we don't have this email mapped
            const newUser: User = {
              id: session.user.id,
              name: email ? email.split('@')[0] : 'User',
              email: email || 'unknown@example.com',
              role: "kasir_cabang",
              branchId: "00000000-0000-0000-0000-000000000001", // Default branch
            };
            setUser(newUser);
            localStorage.setItem("bakeryUser", JSON.stringify(newUser));
          }
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
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const email = session.user.email?.toLowerCase();
        setSupabaseUser(session.user);
        
        // For demo, map email to role
        if (email && emailToRoleMap[email]) {
          // Create user object
          const newUser: User = {
            id: session.user.id,
            name: email.split('@')[0],
            email: email,
            role: emailToRoleMap[email].role,
            branchId: emailToRoleMap[email].branchId,
          };
          setUser(newUser);
          localStorage.setItem("bakeryUser", JSON.stringify(newUser));
        } else {
          // Default to kasir_cabang if we don't have this email mapped
          const newUser: User = {
            id: session.user.id,
            name: email ? email.split('@')[0] : 'User',
            email: email || 'unknown@example.com',
            role: "kasir_cabang",
            branchId: "00000000-0000-0000-0000-000000000001", // Default branch
          };
          setUser(newUser);
          localStorage.setItem("bakeryUser", JSON.stringify(newUser));
        }
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
