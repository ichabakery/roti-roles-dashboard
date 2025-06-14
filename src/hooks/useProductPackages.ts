
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ProductPackage } from '@/types/products';
import {
  createProductPackage,
  fetchProductPackages,
  updateProductPackage,
  deleteProductPackage,
  validatePackageStock
} from '@/services/productPackageService';

export const useProductPackages = (parentProductId?: string) => {
  const [packages, setPackages] = useState<ProductPackage[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchPackages = useCallback(async () => {
    if (!parentProductId) return;

    setLoading(true);
    try {
      const data = await fetchProductPackages(parentProductId);
      setPackages(data);
    } catch (error: any) {
      console.error('Error fetching packages:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Gagal memuat paket produk: ${error.message}`,
      });
    } finally {
      setLoading(false);
    }
  }, [parentProductId, toast]);

  const addPackageComponent = useCallback(async (
    components: { productId: string; quantity: number }[]
  ) => {
    if (!parentProductId) return false;

    try {
      await createProductPackage(parentProductId, components);
      toast({
        title: "Berhasil",
        description: "Komponen paket berhasil ditambahkan",
      });
      fetchPackages();
      return true;
    } catch (error: any) {
      console.error('Error adding package component:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Gagal menambahkan komponen: ${error.message}`,
      });
      return false;
    }
  }, [parentProductId, toast, fetchPackages]);

  const updateComponent = useCallback(async (packageId: string, quantity: number) => {
    try {
      await updateProductPackage(packageId, quantity);
      toast({
        title: "Berhasil",
        description: "Kuantitas komponen berhasil diperbarui",
      });
      fetchPackages();
      return true;
    } catch (error: any) {
      console.error('Error updating component:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Gagal memperbarui komponen: ${error.message}`,
      });
      return false;
    }
  }, [toast, fetchPackages]);

  const removeComponent = useCallback(async (packageId: string) => {
    try {
      await deleteProductPackage(packageId);
      toast({
        title: "Berhasil",
        description: "Komponen berhasil dihapus dari paket",
      });
      fetchPackages();
      return true;
    } catch (error: any) {
      console.error('Error removing component:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Gagal menghapus komponen: ${error.message}`,
      });
      return false;
    }
  }, [toast, fetchPackages]);

  const checkPackageStock = useCallback(async (
    branchId: string,
    quantity: number
  ) => {
    if (!parentProductId) return { isValid: false, missingComponents: [] };

    try {
      return await validatePackageStock(parentProductId, branchId, quantity);
    } catch (error: any) {
      console.error('Error validating package stock:', error);
      return { isValid: false, missingComponents: [] };
    }
  }, [parentProductId]);

  return {
    packages,
    loading,
    fetchPackages,
    addPackageComponent,
    updateComponent,
    removeComponent,
    checkPackageStock
  };
};
