
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
      
      // If filtering by stock and branch is provided, use separate queries
      if (filterByStock && branchId) {
        console.log('Filtering products by branch stock:', branchId);
        
        // First, get products that have inventory in the specified branch
        const { data: inventoryData, error: inventoryError } = await supabase
          .from('inventory')
          .select('product_id')
          .eq('branch_id', branchId)
          .gt('quantity', 0);

        if (inventoryError) {
          console.error('Error fetching inventory:', inventoryError);
          throw inventoryError;
        }

        if (!inventoryData || inventoryData.length === 0) {
          console.log('No products found with stock in this branch');
          setProducts([]);
          return;
        }

        // Get unique product IDs that have stock
        const productIds = [...new Set(inventoryData.map(item => item.product_id))];
        
        // Then fetch the actual products
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .eq('active', true)
          .in('id', productIds)
          .order('name');

        if (productsError) {
          console.error('Error fetching products:', productsError);
          throw productsError;
        }

        console.log('Products with stock fetched successfully:', productsData);
        setProducts(productsData || []);
        return;
      }
      
      // Default behavior: fetch all active products
      const { data, error } = await supabase
        .from('products')
        .select('*')
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
