
import { useState, useEffect } from 'react';
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
  const fetchBranches = async () => {
    try {
      console.log('Fetching branches for user role:', user?.role);
      
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
          setSelectedBranch(data[0].id);
        }
      }
    } catch (error: any) {
      console.error('Error fetching branches:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Gagal memuat data cabang: ${error.message}`,
      });
    }
  };

  // Fetch products
  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name')
        .eq('active', true)
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      console.error('Error fetching products:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Gagal memuat data produk: ${error.message}`,
      });
    }
  };

  // Fetch inventory
  const fetchInventory = async () => {
    if (!selectedBranch && user?.role !== 'owner' && user?.role !== 'admin_pusat') {
      return;
    }

    setLoading(true);
    try {
      let query = supabase
        .from('inventory')
        .select(`
          id, 
          product_id, 
          branch_id, 
          quantity, 
          last_updated,
          product:products(id, name), 
          branch:branches(id, name)
        `);

      // Apply branch filter based on user role
      if (user?.role === 'kasir_cabang' && user.branchId) {
        query = query.eq('branch_id', user.branchId);
      } else if (selectedBranch) {
        query = query.eq('branch_id', selectedBranch);
      }

      const { data, error } = await query.order('last_updated', { ascending: false });

      if (error) throw error;
      setInventory(data || []);
    } catch (error: any) {
      console.error('Error fetching inventory:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Gagal memuat data stok: ${error.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  // Add or update stock
  const addStock = async (productId: string, branchId: string, quantity: number) => {
    try {
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
      console.error('Error adding stock:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Gagal menambahkan stok: ${error.message}`,
      });
      return false;
    }
  };

  // Initialize data
  useEffect(() => {
    if (user) {
      fetchBranches();
      fetchProducts();
    }
  }, [user]);

  // Fetch inventory when branch changes
  useEffect(() => {
    if (selectedBranch || user?.role === 'owner' || user?.role === 'admin_pusat') {
      fetchInventory();
    }
  }, [selectedBranch, user]);

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
