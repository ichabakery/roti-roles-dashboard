
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { ProductionRequest, NewProductionRequest } from '@/types/production';
import {
  fetchProductionRequestsFromDB,
  createProductionRequestInDB,
  updateProductionRequestStatusInDB,
  deleteProductionRequestFromDB
} from '@/services/productionService';

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
      const requests = await fetchProductionRequestsFromDB();
      setProductionRequests(requests);
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
      const createdRequest = await createProductionRequestInDB(newRequest, user.id);
      
      toast({
        title: "Berhasil",
        description: "Permintaan produksi berhasil dibuat",
      });

      await fetchProductionRequests();
      return createdRequest;
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
    quantity_produced: number = 0
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
      await updateProductionRequestStatusInDB(id, status, user.id, quantity_produced);

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
      await deleteProductionRequestFromDB(id);

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

// Re-export types for backward compatibility
export type { ProductionRequest, NewProductionRequest } from '@/types/production';
