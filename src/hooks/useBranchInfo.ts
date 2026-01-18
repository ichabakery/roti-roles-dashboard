import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface BranchInfo {
  id: string;
  name: string;
  address: string;
  phone: string;
}

export const useBranchInfo = (branchId?: string | null) => {
  const [branchInfo, setBranchInfo] = useState<BranchInfo | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchBranchInfo = async () => {
      if (!branchId) {
        setBranchInfo(null);
        return;
      }

      try {
        setLoading(true);
        console.log('🔍 [BranchInfo] Fetching branch info for:', branchId);

        const { data, error } = await supabase
          .from('branches')
          .select('id, name, address, phone')
          .eq('id', branchId)
          .single();

        if (error) {
          console.error('❌ [BranchInfo] Error fetching branch:', error);
          setBranchInfo(null);
          return;
        }

        if (data) {
          setBranchInfo({
            id: data.id,
            name: data.name,
            address: data.address || '',
            phone: data.phone || ''
          });
          console.log('✅ [BranchInfo] Branch info loaded:', data);
        }
      } catch (error) {
        console.error('❌ [BranchInfo] Error:', error);
        setBranchInfo(null);
      } finally {
        setLoading(false);
      }
    };

    fetchBranchInfo();
  }, [branchId]);

  return { branchInfo, loading };
};
