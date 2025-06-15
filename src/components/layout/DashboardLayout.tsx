
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserBranch } from '@/hooks/useUserBranch';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  // Set sidebar to always be open for better UX
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuth();
  const { userBranch } = useUserBranch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getBranchDisplayName = () => {
    if (user?.role === 'kasir_cabang') {
      return userBranch.branchName || 'Loading...';
    }
    return 'Manajemen Pusat';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - Always expanded for better UX */}
      <Sidebar 
        sidebarOpen={true}  // Always keep sidebar open
        setSidebarOpen={setSidebarOpen}
        user={user}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <TopBar 
          user={user}
          branchDisplayName={getBranchDisplayName()}
        />

        {/* Page Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};
