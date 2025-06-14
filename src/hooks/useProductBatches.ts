
import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ProductBatch } from '@/types/products';
import {
  createProductBatch,
  fetchProductBatches,
  fetchExpiringProducts,
  updateBatchStatus,
  adjustBatchQuantity
} from '@/services/productBatchService';

export const useProductBatches = (branchId?: string, productId?: string) => {
  const [batches, setBatches] = useState<ProductBatch[]>([]);
  const [expiringProducts, setExpiringProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchBatches = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchProductBatches(branchId, productId);
      setBatches(data);
    } catch (error: any) {
      console.error('Error fetching batches:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Gagal memuat data batch: ${error.message}`,
      });
    } finally {
      setLoading(false);
    }
  }, [branchId, productId, toast]);

  const fetchExpiring = useCallback(async (daysAhead: number = 3) => {
    try {
      const data = await fetchExpiringProducts(daysAhead);
      setExpiringProducts(data);
    } catch (error: any) {
      console.error('Error fetching expiring products:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Gagal memuat produk kadaluarsa: ${error.message}`,
      });
    }
  }, [toast]);

  const addBatch = useCallback(async (batchData: {
    productId: string;
    branchId: string;
    batchNumber: string;
    quantity: number;
    productionDate: string;
    expiryDate: string;
  }) => {
    try {
      await createProductBatch(batchData);
      toast({
        title: "Berhasil",
        description: "Batch produk berhasil ditambahkan",
      });
      fetchBatches();
      return true;
    } catch (error: any) {
      console.error('Error adding batch:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Gagal menambahkan batch: ${error.message}`,
      });
      return false;
    }
  }, [toast, fetchBatches]);

  const updateStatus = useCallback(async (
    batchId: string,
    status: 'active' | 'expired' | 'sold_out'
  ) => {
    try {
      await updateBatchStatus(batchId, status);
      toast({
        title: "Berhasil",
        description: "Status batch berhasil diperbarui",
      });
      fetchBatches();
      return true;
    } catch (error: any) {
      console.error('Error updating batch status:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Gagal memperbarui status: ${error.message}`,
      });
      return false;
    }
  }, [toast, fetchBatches]);

  const adjustQuantity = useCallback(async (batchId: string, newQuantity: number) => {
    try {
      await adjustBatchQuantity(batchId, newQuantity);
      toast({
        title: "Berhasil",
        description: "Kuantitas batch berhasil disesuaikan",
      });
      fetchBatches();
      return true;
    } catch (error: any) {
      console.error('Error adjusting batch quantity:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Gagal menyesuaikan kuantitas: ${error.message}`,
      });
      return false;
    }
  }, [toast, fetchBatches]);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  return {
    batches,
    expiringProducts,
    loading,
    fetchBatches,
    fetchExpiring,
    addBatch,
    updateStatus,
    adjustQuantity
  };
};
