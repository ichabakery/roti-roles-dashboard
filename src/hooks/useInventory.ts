
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { InventoryItem, Product, Branch } from '@/types/inventory';
import { fetchInventoryData, addStockToInventory } from '@/services/inventoryService';
import { fetchBranchesForUser } from '@/services/branchService';
import { fetchActiveProducts } from '@/services/productService';
import { useInventoryRealtime } from '@/hooks/useInventoryRealtime';

export const useInventory = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  
  const { user } = useAuth();

  // Fetch branches based on user role
  const fetchBranches = useCallback(async () => {
    try {
      const branchData = await fetchBranchesForUser(user?.role || '', user?.branchId);
      setBranches(branchData);
      
      if (user?.role === 'kasir_cabang' && branchData.length > 0) {
        setSelectedBranch(branchData[0].id);
      } else if (branchData.length > 0 && !selectedBranch) {
        setSelectedBranch('all');
      }
    } catch (error: any) {
      console.error('❌ Error fetching branches:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Gagal memuat data cabang: ${error.message}`,
      });
    }
  }, [user, selectedBranch]);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    try {
      const productData = await fetchActiveProducts();
      setProducts(productData);
    } catch (error: any) {
      console.error('❌ Error fetching products:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Gagal memuat data produk: ${error.message}`,
      });
    }
  }, []);

  // Fetch inventory with improved error handling
  const fetchInventory = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    // For kasir_cabang, ensure they have a branch assigned
    if (user.role === 'kasir_cabang' && !user.branchId) {
      console.error('❌ Kasir user without branch assignment');
      toast({
        variant: "destructive",
        title: "Error",
        description: "Akun kasir Anda belum dikaitkan dengan cabang. Silakan hubungi administrator.",
      });
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const inventoryData = await fetchInventoryData(user.role, user.branchId, selectedBranch);
      setInventory(inventoryData);
    } catch (error: any) {
      console.error('❌ Error fetching inventory:', error);
      if (error.code === '42501') {
        toast({
          variant: "destructive",
          title: "Akses Ditolak",
          description: "Anda tidak memiliki izin untuk mengakses data inventory. Silakan hubungi administrator.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: `Gagal memuat data stok: ${error.message}`,
        });
      }
    } finally {
      setLoading(false);
    }
  }, [user, selectedBranch]);

  // Add or update stock
  const addStock = useCallback(async (productId: string, branchId: string, quantity: number) => {
    try {
      await addStockToInventory(productId, branchId, quantity);

      const productName = products.find(p => p.id === productId)?.name;
      const branchName = branches.find(b => b.id === branchId)?.name;

      toast({
        title: "Stok Berhasil Ditambahkan",
        description: `Stok ${productName} di ${branchName} berhasil diperbarui`,
      });

      fetchInventory();
      return true;
    } catch (error: any) {
      console.error('❌ Error adding stock:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Gagal menambahkan stok: ${error.message}`,
      });
      return false;
    }
  }, [products, branches, fetchInventory]);

  // Setup real-time updates
  useInventoryRealtime(user, fetchInventory);

  // Initialize data
  useEffect(() => {
    if (user) {
      fetchBranches();
      fetchProducts();
    }
  }, [user, fetchBranches, fetchProducts]);

  // Fetch inventory when branch changes or user is available
  useEffect(() => {
    if (user && (selectedBranch || user.role === 'kasir_cabang')) {
      fetchInventory();
    }
  }, [selectedBranch, user, fetchInventory]);

  return {
    inventory,
    products,
    branches,
    loading,
    selectedBranch,
    setSelectedBranch,
    fetchInventory,
    addStock,
    user
  };
};
