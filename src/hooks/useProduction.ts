
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

export interface ProductionRequest {
  id: string;
  product_id: string;
  productName?: string;
  branch_id: string;
  branchName?: string;
  quantity_requested: number;
  quantity_produced: number | null;
  production_date: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  notes: string | null;
  requested_by: string;
  requesterName?: string;
  produced_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface NewProductionRequest {
  product_id: string;
  branch_id: string;
  quantity_requested: number;
  production_date: string;
  notes?: string;
}

export const useProduction = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [productionRequests, setProductionRequests] = useState<ProductionRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProductionRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching production requests...');
      
      const { data, error } = await supabase
        .from('production_requests')
        .select(`
          *,
          products:product_id (name),
          branches:branch_id (name)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching production requests:', error);
        throw error;
      }

      // Transform data for UI
      const transformedRequests = data.map(request => ({
        ...request,
        productName: request.products?.name,
        branchName: request.branches?.name,
        production_date: format(parseISO(request.production_date), 'yyyy-MM-dd')
      }));

      console.log('Production requests fetched:', transformedRequests);
      setProductionRequests(transformedRequests);
    } catch (error: any) {
      console.error('Error in fetchProductionRequests:', error);
      setError(error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Gagal memuat data permintaan produksi: ${error.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const createProductionRequest = async (newRequest: NewProductionRequest) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Anda harus login untuk membuat permintaan produksi",
      });
      return null;
    }

    try {
      setLoading(true);
      const requestData = {
        ...newRequest,
        requested_by: user.id,
        status: 'pending',
      };

      const { data, error } = await supabase
        .from('production_requests')
        .insert([requestData])
        .select();

      if (error) {
        console.error('Error creating production request:', error);
        throw error;
      }

      toast({
        title: "Berhasil",
        description: "Permintaan produksi berhasil dibuat",
      });

      await fetchProductionRequests();
      return data[0];
    } catch (error: any) {
      console.error('Error in createProductionRequest:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Gagal membuat permintaan produksi: ${error.message}`,
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateProductionRequestStatus = async (
    id: string, 
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled',
    quantity_produced?: number
  ) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Anda harus login untuk mengubah status permintaan",
      });
      return false;
    }

    try {
      setLoading(true);
      
      const updateData: any = { 
        status,
        updated_at: new Date().toISOString()
      };
      
      if (status === 'in_progress' && !productionRequests.find(r => r.id === id)?.produced_by) {
        updateData.produced_by = user.id;
      }
      
      if (status === 'completed' && quantity_produced) {
        updateData.quantity_produced = quantity_produced;
        updateData.produced_by = user.id;
      }

      const { error } = await supabase
        .from('production_requests')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error('Error updating production request:', error);
        throw error;
      }

      toast({
        title: "Berhasil",
        description: `Status permintaan produksi berhasil diubah menjadi ${
          status === 'pending' ? 'Menunggu' : 
          status === 'in_progress' ? 'Sedang Diproses' : 
          status === 'completed' ? 'Selesai' : 
          'Dibatalkan'
        }`,
      });

      await fetchProductionRequests();
      return true;
    } catch (error: any) {
      console.error('Error in updateProductionRequestStatus:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Gagal mengubah status permintaan: ${error.message}`,
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteProductionRequest = async (id: string) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('production_requests')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting production request:', error);
        throw error;
      }

      toast({
        title: "Berhasil",
        description: "Permintaan produksi berhasil dihapus",
      });

      setProductionRequests(prev => prev.filter(request => request.id !== id));
      return true;
    } catch (error: any) {
      console.error('Error in deleteProductionRequest:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Gagal menghapus permintaan produksi: ${error.message}`,
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductionRequests();
  }, []);

  return {
    productionRequests,
    loading,
    error,
    createProductionRequest,
    updateProductionRequestStatus,
    deleteProductionRequest,
    refreshProductionRequests: fetchProductionRequests
  };
};
