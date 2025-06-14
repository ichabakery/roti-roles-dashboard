
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface Product {
  id: string;
  name: string;
}

interface Branch {
  id: string;
  name: string;
}

interface InventoryItem {
  id: string;
  product_id: string;
  branch_id: string;
  quantity: number;
  last_updated: string;
  product: Product;
  branch: Branch;
}

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
      console.log('📍 Fetching branches for user role:', user?.role);
      
      if (user?.role === 'kasir_cabang' && user.branchId) {
        // For kasir, only get their assigned branch
        const { data, error } = await supabase
          .from('branches')
          .select('id, name')
          .eq('id', user.branchId)
          .single();

        if (error) throw error;

        setBranches(data ? [data] : []);
        setSelectedBranch(data?.id || '');
      } else {
        // For other roles, get all branches
        const { data, error } = await supabase
          .from('branches')
          .select('id, name')
          .order('name');

        if (error) throw error;

        setBranches(data || []);
        if (data && data.length > 0 && !selectedBranch) {
          setSelectedBranch('all');
        }
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
      const { data, error } = await supabase
        .from('products')
        .select('id, name')
        .eq('active', true)
        .order('name');

      if (error) throw error;
      setProducts(data || []);
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
      console.log('📦 Fetching inventory data...');
      
      let query = supabase
        .from('inventory')
        .select(`
          id, 
          product_id, 
          branch_id, 
          quantity, 
          last_updated,
          products!fk_inventory_product_id (id, name), 
          branches!fk_inventory_branch_id (id, name)
        `);

      // Apply branch filter based on user role
      if (user.role === 'kasir_cabang' && user.branchId) {
        query = query.eq('branch_id', user.branchId);
      } else if (selectedBranch && selectedBranch !== 'all') {
        query = query.eq('branch_id', selectedBranch);
      }

      const { data, error } = await query.order('last_updated', { ascending: false });

      if (error) {
        console.error('❌ Inventory fetch error:', error);
        throw error;
      }
      
      console.log('✅ Inventory data fetched:', data?.length, 'records');
      
      // Transform the data to match InventoryItem interface
      const transformedData = (data || []).map(item => ({
        id: item.id,
        product_id: item.product_id,
        branch_id: item.branch_id,
        quantity: item.quantity,
        last_updated: item.last_updated,
        product: item.products || { id: '', name: '' },
        branch: item.branches || { id: '', name: '' }
      }));
      
      setInventory(transformedData);
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
      console.log('➕ Adding stock:', { productId, branchId, quantity });
      
      // Check if inventory item already exists
      const { data: existing, error: fetchError } = await supabase
        .from('inventory')
        .select('id, quantity')
        .eq('product_id', productId)
        .eq('branch_id', branchId)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existing) {
        // Update existing inventory
        const newQuantity = existing.quantity + quantity;
        const { error: updateError } = await supabase
          .from('inventory')
          .update({ 
            quantity: newQuantity,
            last_updated: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (updateError) throw updateError;
        console.log('✅ Stock updated:', existing.quantity, '->', newQuantity);
      } else {
        // Insert new inventory
        const { error: insertError } = await supabase
          .from('inventory')
          .insert({
            product_id: productId,
            branch_id: branchId,
            quantity: quantity
          });

        if (insertError) throw insertError;
        console.log('✅ New stock record created');
      }

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

  // Enhanced real-time updates setup
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
              fetchInventory();
            }
          } else {
            // Other roles see all branches
            fetchInventory();
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
  }, [user, fetchInventory]);

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

  // Setup real-time updates
  useEffect(() => {
    const cleanup = setupRealTimeUpdates();
    return cleanup;
  }, [setupRealTimeUpdates]);

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
