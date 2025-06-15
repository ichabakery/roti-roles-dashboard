
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import AuthGuard from "./components/auth/AuthGuard";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Products from "./pages/Products";
import EnhancedProducts from "./pages/EnhancedProducts";
import Inventory from "./pages/Inventory";
import Production from "./pages/Production";
import Cashier from "./pages/Cashier";
import Branches from "./pages/Branches";
import Reports from "./pages/Reports";
import Returns from "./pages/Returns";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard" element={
                <AuthGuard>
                  <Dashboard />
                </AuthGuard>
              } />
              <Route path="/users" element={
                <AuthGuard allowedRoles={['owner', 'admin_pusat']}>
                  <Users />
                </AuthGuard>
              } />
              <Route path="/products" element={
                <AuthGuard allowedRoles={['owner', 'admin_pusat']}>
                  <Products />
                </AuthGuard>
              } />
              <Route path="/enhanced-products" element={
                <AuthGuard allowedRoles={['owner', 'admin_pusat']}>
                  <EnhancedProducts />
                </AuthGuard>
              } />
              <Route path="/inventory" element={
                <AuthGuard>
                  <Inventory />
                </AuthGuard>
              } />
              <Route path="/production" element={
                <AuthGuard>
                  <Production />
                </AuthGuard>
              } />
              <Route path="/cashier" element={
                <AuthGuard allowedRoles={['kasir_cabang', 'owner', 'admin_pusat']}>
                  <Cashier />
                </AuthGuard>
              } />
              <Route path="/branches" element={
                <AuthGuard allowedRoles={['owner', 'admin_pusat']}>
                  <Branches />
                </AuthGuard>
              } />
              <Route path="/reports" element={
                <AuthGuard allowedRoles={['owner', 'admin_pusat']}>
                  <Reports />
                </AuthGuard>
              } />
              <Route path="/returns" element={
                <AuthGuard>
                  <Returns />
                </AuthGuard>
              } />
              <Route path="/settings" element={
                <AuthGuard>
                  <Settings />
                </AuthGuard>
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
