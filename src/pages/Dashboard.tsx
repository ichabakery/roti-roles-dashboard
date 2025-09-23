
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { CashierDashboard } from '@/components/dashboard/CashierDashboard';
import { OwnerDashboard } from '@/components/dashboard/OwnerDashboard';
import { ProductionDashboard } from '@/components/dashboard/ProductionDashboard';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';

const Dashboard = () => {
  const { user } = useAuth();

  const renderRoleBasedDashboard = () => {
    switch (user?.role) {
      case 'kasir_cabang':
        return <CashierDashboard />;
      case 'owner':
        return <OwnerDashboard />;
      case 'kepala_produksi':
        return <ProductionDashboard />;
      case 'admin_pusat':
        return <AdminDashboard />;
      default:
        return <div>Dashboard tidak tersedia untuk role ini</div>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              Dashboard {user?.role === 'owner' ? 'Owner' : 
                       user?.role === 'kepala_produksi' ? 'Kepala Produksi' :
                       user?.role === 'kasir_cabang' ? 'Kasir Cabang' : 'Admin Pusat'}
            </h2>
            <p className="text-muted-foreground mt-2">
              Selamat datang, {user?.name}! Monitor bisnis Anda dalam satu tampilan.
            </p>
          </div>
        </div>

        {renderRoleBasedDashboard()}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
