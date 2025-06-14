
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Branch {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
}

export const useBranches = () => {
  const { toast } = useToast();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchBranches = async () => {
    try {
      setLoading(true);
      console.log('Fetching branches from Supabase...');
      
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching branches:', error);
        throw error;
      }

      console.log('Branches fetched successfully:', data);
      setBranches(data || []);
    } catch (error: any) {
      console.error('Error fetching branches:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Gagal memuat data cabang: ${error.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  return { branches, loading, refetch: fetchBranches };
};
