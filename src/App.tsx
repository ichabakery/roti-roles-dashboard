
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, RoleType } from "./contexts/AuthContext";
import AuthGuard from "./components/auth/AuthGuard";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import UserManagement from "./pages/Users";
import Production from "./pages/Production";
import Cashier from "./pages/Cashier";
import Products from "./pages/Products";
import Reports from "./pages/Reports";
import Inventory from "./pages/Inventory";
import BranchesManagement from "./pages/Branches";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  // Role permissions untuk setiap halaman
  const rolePermissions: Record<string, RoleType[]> = {
    dashboard: ["owner", "kepala_produksi", "kasir_cabang", "admin_pusat"],
    users: ["owner"],
    production: ["owner", "kepala_produksi"],
    cashier: ["owner", "kasir_cabang"],
    products: ["owner", "admin_pusat"],
    branches: ["owner", "admin_pusat"],
    inventory: ["owner", "admin_pusat", "kasir_cabang", "kepala_produksi"],
    reports: ["owner", "admin_pusat", "kasir_cabang"],
  };

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />

              {/* Protected routes */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              
              {/* Dashboard route */}
              <Route 
                path="/dashboard" 
                element={
                  <AuthGuard allowedRoles={rolePermissions.dashboard}>
                    <Dashboard />
                  </AuthGuard>
                } 
              />
              
              {/* User Management (only for owner) */}
              <Route 
                path="/users" 
                element={
                  <AuthGuard allowedRoles={rolePermissions.users}>
                    <UserManagement />
                  </AuthGuard>
                } 
              />

              {/* Branch Management */}
              <Route 
                path="/branches" 
                element={
                  <AuthGuard allowedRoles={rolePermissions.branches}>
                    <BranchesManagement />
                  </AuthGuard>
                } 
              />
              
              {/* Production Management */}
              <Route 
                path="/production" 
                element={
                  <AuthGuard allowedRoles={rolePermissions.production}>
                    <Production />
                  </AuthGuard>
                } 
              />
              
              {/* Cashier */}
              <Route 
                path="/cashier" 
                element={
                  <AuthGuard allowedRoles={rolePermissions.cashier}>
                    <Cashier />
                  </AuthGuard>
                } 
              />
              
              {/* Products Management */}
              <Route 
                path="/products" 
                element={
                  <AuthGuard allowedRoles={rolePermissions.products}>
                    <Products />
                  </AuthGuard>
                } 
              />

              {/* Inventory Management */}
              <Route 
                path="/inventory" 
                element={
                  <AuthGuard allowedRoles={rolePermissions.inventory}>
                    <Inventory />
                  </AuthGuard>
                } 
              />

              {/* Financial Reports */}
              <Route 
                path="/reports" 
                element={
                  <AuthGuard allowedRoles={rolePermissions.reports}>
                    <Reports />
                  </AuthGuard>
                } 
              />
              
              {/* Not Found */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
