
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, RoleType } from '@/contexts/AuthContext';

interface AuthGuardProps {
  allowedRoles: RoleType[];
  children: React.ReactNode;
  redirectTo?: string;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ 
  allowedRoles, 
  children, 
  redirectTo = '/login' 
}) => {
  const { user, loading, isAuthorized } = useAuth();

  // Jika sedang loading, tampilkan indicator loading
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Jika belum login, redirect ke login page
  if (!user) {
    return <Navigate to={redirectTo} replace />;
  }

  // Jika role tidak sesuai, redirect ke halaman khusus untuk role tertentu
  if (!isAuthorized(allowedRoles)) {
    // Redirect ke halaman khusus untuk role tertentu
    switch (user.role) {
      case 'owner':
        return <Navigate to="/dashboard" replace />;
      case 'kepala_produksi':
        return <Navigate to="/production" replace />;
      case 'kasir_cabang':
        // Kasir cabang tetap bisa akses kasir meskipun belum ada branch assignment
        return <Navigate to="/cashier" replace />;
      case 'admin_pusat':
        return <Navigate to="/products" replace />;
      case 'kurir':
        // Kurir hanya bisa akses halaman delivery
        return <Navigate to="/delivery" replace />;
      default:
        return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
};

export default AuthGuard;
