import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface AdminKPI {
  activeUsers: number;
  rolesAndBranches: number;
  openTasks: number;
  integrationStatus: boolean;
}

interface UserAlert {
  user_name: string;
  issue: string;
  severity: 'warning' | 'error';
}

export const useAdminDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [kpis, setKpis] = useState<AdminKPI>({
    activeUsers: 0,
    rolesAndBranches: 0,
    openTasks: 0,
    integrationStatus: true
  });
  const [userAlerts, setUserAlerts] = useState<UserAlert[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDashboardData = async () => {
    if (user?.role !== 'admin_pusat') return;

    try {
      setLoading(true);

      // Fetch active users count
      const { data: usersData } = await supabase
        .from('profiles')
        .select('id, name, role');

      const activeUsers = usersData?.length || 0;

      // Fetch branches count
      const { data: branchesData } = await supabase
        .from('branches')
        .select('id');

      const branchesCount = branchesData?.length || 0;
      const rolesCount = 4; // owner, admin_pusat, kepala_produksi, kasir_cabang

      // Check for users without branch assignment (kasir_cabang only)
      const { data: userBranchData } = await supabase
        .from('user_branches')
        .select('user_id');

      const assignedUserIds = new Set(userBranchData?.map(ub => ub.user_id) || []);
      
      const usersWithoutBranch = usersData?.filter(user => 
        user.role === 'kasir_cabang' && !assignedUserIds.has(user.id)
      ) || [];

      const alerts = usersWithoutBranch.map(user => ({
        user_name: user.name,
        issue: 'Tidak memiliki cabang',
        severity: 'warning' as const
      }));

      setKpis({
        activeUsers,
        rolesAndBranches: rolesCount + branchesCount,
        openTasks: alerts.length,
        integrationStatus: true
      });

      setUserAlerts(alerts);

    } catch (error) {
      console.error('Error fetching admin dashboard data:', error);
      toast({
        title: "Gagal memuat data dashboard",
        description: "Terjadi kesalahan saat memuat data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user?.role]);

  return {
    kpis,
    userAlerts,
    loading,
    refreshData: fetchDashboardData
  };
};