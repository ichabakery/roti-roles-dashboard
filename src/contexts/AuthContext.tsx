
import React, { createContext, useContext, useState, useEffect } from "react";

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
    branchId: "branch-1",
  },
  {
    id: "4",
    name: "Admin Pusat",
    email: "admin@bakeryguru.com",
    role: "admin_pusat",
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
