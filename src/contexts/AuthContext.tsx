
import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Cek apakah ada sesi tersimpan
  useEffect(() => {
    const storedUser = localStorage.getItem("bakeryUser");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // Simpan user saat berubah
  useEffect(() => {
    if (user) {
      localStorage.setItem("bakeryUser", JSON.stringify(user));
      
      // If we have a real user, store their branch association in user_branches
      if (user.branchId && user.id && user.id !== "1" && user.id !== "2" && user.id !== "3" && user.id !== "4" && user.id !== "5") {
        supabase.from('user_branches').upsert(
          { user_id: user.id, branch_id: user.branchId },
          { onConflict: 'user_id' }
        ).then(({ error }) => {
          if (error) console.error("Failed to save user branch:", error);
        });
      }
    }
  }, [user]);

  // Login function
  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      // Simulasi delay network
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Cari user berdasarkan email
      const foundUser = MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      if (!foundUser) {
        throw new Error("Email atau password salah");
      }
      
      // Dalam implementasi nyata, kita akan check password di sini
      // Untuk demo, kita tidak check password
      
      // Set user
      setUser(foundUser);
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem("bakeryUser");
  };

  // Check apakah user memiliki role yang diizinkan
  const isAuthorized = (allowedRoles: RoleType[]): boolean => {
    if (!user) return false;
    return allowedRoles.includes(user.role);
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthorized,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
