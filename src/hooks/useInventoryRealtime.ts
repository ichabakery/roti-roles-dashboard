import { useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface User {
  role: string;
  branchId?: string;
}

export const useInventoryRealtime = (user: User | null, onInventoryChange: () => void) => {
  const setupRealTimeUpdates = useCallback(() => {
    console.log('🔄 Setting up real-time inventory updates...');
    
    const channel = supabase
      .channel('inventory-realtime-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inventory'
        },
        (payload) => {
          console.log('📡 Real-time inventory change received:', payload);
          
          // Type-safe check for branch_id property
          const newRecord = payload.new as any;
          const oldRecord = payload.old as any;
          
          // Only refresh if the change affects current user's view
          if (user?.role === 'kasir_cabang') {
            // Kasir only cares about their branch
            const relevantBranchId = newRecord?.branch_id || oldRecord?.branch_id;
            if (relevantBranchId === user.branchId) {
              onInventoryChange();
            }
          } else {
            // Other roles see all branches
            onInventoryChange();
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Real-time subscription status:', status);
      });

    return () => {
      console.log('🔌 Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [user, onInventoryChange]);

  useEffect(() => {
    const cleanup = setupRealTimeUpdates();
    return cleanup;
  }, [setupRealTimeUpdates]);

  return { setupRealTimeUpdates };
};
