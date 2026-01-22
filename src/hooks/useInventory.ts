
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { InventoryItem, Product, Branch } from '@/types/inventory';
import { fetchInventoryData, addStockToInventory, quickUpdateInventory } from '@/services/inventoryService';
import { fetchBranchesForUser } from '@/services/branchService';
import { fetchActiveProducts } from '@/services/productService';
import { useInventoryRealtime } from '@/hooks/useInventoryRealtime';
import { supabase } from '@/integrations/supabase/client';

export const useInventory = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [userActualBranchId, setUserActualBranchId] = useState<string | null>(null);
  
  const { user } = useAuth();

  // Fetch user's actual branch assignment from database (sama seperti useCashierAuth)
  useEffect(() => {
    const fetchUserBranch = async () => {
      if (user?.role === 'kasir_cabang' && user.id) {
        try {
          console.log('🔍 [Inventory] Fetching actual branch assignment for kasir_cabang:', user.id);
          const { data: userBranch, error } = await supabase
            .from('user_branches')
            .select('branch_id')
            .eq('user_id', user.id)
            .maybeSingle();
          
          if (error && error.code !== 'PGRST116') {
            console.error('❌ [Inventory] Error fetching user branch:', error);
            setUserActualBranchId(null);
            return;
          }
          
          if (userBranch) {
            console.log('✅ [Inventory] Found user branch assignment:', userBranch.branch_id);
            setUserActualBranchId(userBranch.branch_id);
          } else {
            console.warn('⚠️ [Inventory] No branch assignment found for kasir_cabang');
            setUserActualBranchId(null);
          }
        } catch (error) {
          console.error('❌ [Inventory] Failed to fetch user branch:', error);
          setUserActualBranchId(null);
        }
      } else {
        // For non-kasir_cabang roles, clear branch data
        setUserActualBranchId(null);
      }
    };

    fetchUserBranch();
  }, [user]);

  // Fetch branches based on user role
  const fetchBranches = useCallback(async () => {
    try {
      // Only kasir_cabang needs userActualBranchId
      const effectiveBranchId = user?.role === 'kasir_cabang' ? userActualBranchId : null;
      const branchData = await fetchBranchesForUser(user?.role || '', effectiveBranchId);
      setBranches(branchData);
      
      if (user?.role === 'kasir_cabang' && branchData.length > 0) {
        setSelectedBranch(branchData[0].id);
      } else if (branchData.length > 0 && !selectedBranch) {
        setSelectedBranch('all');
      }
    } catch (error: any) {
      console.error('❌ [Inventory] Error fetching branches:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Gagal memuat data cabang: ${error.message}`,
      });
    }
  }, [user, selectedBranch, userActualBranchId]);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    try {
      const productData = await fetchActiveProducts();
      setProducts(productData);
    } catch (error: any) {
      console.error('❌ [Inventory] Error fetching products:', error);
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
    if (user.role === 'kasir_cabang' && !userActualBranchId) {
      console.error('❌ [Inventory] Kasir user without branch assignment');
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
      // Only kasir_cabang needs userActualBranchId
      const effectiveBranchId = user.role === 'kasir_cabang' ? userActualBranchId : null;
      const inventoryData = await fetchInventoryData(user.role, effectiveBranchId, selectedBranch);
      setInventory(inventoryData);
    } catch (error: any) {
      console.error('❌ [Inventory] Error fetching inventory:', error);
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
  }, [user, selectedBranch, userActualBranchId]);

  // Add or update stock, batasi kasir tidak boleh menambah stok
  const addStock = useCallback(async (productId: string, branchId: string, quantity: number) => {
    if (!user || user.role === "kasir_cabang") {
      toast({
        variant: "destructive",
        title: "Akses Ditolak",
        description: "Anda tidak memiliki izin untuk menambah stok. Silakan hubungi admin pusat.",
      });
      return false;
    }
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
      console.error('❌ [Inventory] Error adding stock:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Gagal menambahkan stok: ${error.message}`,
      });
      return false;
    }
  }, [user, products, branches, fetchInventory]);

  // Quick update single inventory item (inline edit)
  const quickUpdate = useCallback(async (inventoryId: string, newQuantity: number, reason?: string) => {
    if (!user || user.role === "kasir_cabang") {
      toast({
        variant: "destructive",
        title: "Akses Ditolak",
        description: "Anda tidak memiliki izin untuk mengubah stok.",
      });
      return false;
    }
    try {
      await quickUpdateInventory(inventoryId, newQuantity, user.id, reason || 'Quick Edit');
      
      // Update local state immediately for instant feedback
      setInventory(prev => prev.map(item => 
        item.id === inventoryId 
          ? { ...item, quantity: newQuantity, last_updated: new Date().toISOString() }
          : item
      ));

      return true;
    } catch (error: any) {
      console.error('❌ [Inventory] Error quick updating stock:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Gagal mengubah stok: ${error.message}`,
      });
      return false;
    }
  }, [user]);

  // Setup real-time updates
  useInventoryRealtime(user, fetchInventory);

  // Initialize data - hanya tunggu userActualBranchId untuk kasir_cabang
  useEffect(() => {
    if (user) {
      if (user.role === 'kasir_cabang') {
        // Untuk kasir, tunggu sampai userActualBranchId tersedia
        if (userActualBranchId !== null) {
          fetchBranches();
          fetchProducts();
        }
      } else {
        // Untuk role lain, langsung fetch
        fetchBranches();
        fetchProducts();
      }
    }
  }, [user, userActualBranchId, fetchBranches, fetchProducts]);

  // Fixed: Change comparison logic to avoid type conflict
  useEffect(() => {
    if (user) {
      // Check if user is kasir_cabang and has branch assignment before fetching
      if (user.role === 'kasir_cabang') {
        if (userActualBranchId && selectedBranch) {
          fetchInventory();
        }
      } else {
        // For non-kasir roles (owner, admin_pusat, kepala_produksi)
        if (selectedBranch) {
          fetchInventory();
        }
      }
    }
  }, [selectedBranch, user, userActualBranchId, fetchInventory]);

  return {
    inventory,
    products,
    branches,
    loading,
    selectedBranch,
    setSelectedBranch,
    fetchInventory,
    addStock,
    quickUpdate,
    user
  };
};
