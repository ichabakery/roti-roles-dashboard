
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  active: boolean;
  image_url: string | null;
  created_at: string;
}

interface UseProductsOptions {
  branchId?: string | null;
  filterByStock?: boolean;
}

export const useProducts = (options: UseProductsOptions = {}) => {
  const { branchId, filterByStock = false } = options;
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching products from Supabase...');
      
      let query = supabase.from('products').select('*');
      
      // If filtering by stock and branch is provided, join with inventory
      if (filterByStock && branchId) {
        console.log('Filtering products by branch stock:', branchId);
        
        const { data, error } = await supabase
          .from('products')
          .select(`
            id,
            name,
            description,
            price,
            active,
            image_url,
            created_at,
            inventory!inner(quantity)
          `)
          .eq('active', true)
          .eq('inventory.branch_id', branchId)
          .gt('inventory.quantity', 0)
          .order('name');

        if (error) {
          console.error('Error fetching products with stock filter:', error);
          throw error;
        }

        console.log('Products with stock fetched successfully:', data);
        // Transform data to match Product interface
        const transformedData = (data || []).map(item => ({
          id: item.id,
          name: item.name,
          description: item.description,
          price: item.price,
          active: item.active,
          image_url: item.image_url,
          created_at: item.created_at
        }));
        
        setProducts(transformedData);
        return;
      }
      
      // Default behavior: fetch all active products
      const { data, error } = await query
        .eq('active', true)
        .order('name');

      if (error) {
        console.error('Error fetching products:', error);
        throw error;
      }

      console.log('Products fetched successfully:', data);
      setProducts(data || []);
    } catch (error: any) {
      console.error('Error fetching products:', error);
      setError(error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Gagal memuat data produk: ${error.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [branchId, filterByStock]);

  return { products, loading, error, refetchProducts: fetchProducts };
};
