
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
  has_expiry: boolean;
  default_expiry_days: number | null;
  stock?: number; // New: stock per branch, optional
}

interface UseProductsOptions {
  branchId?: string | null;
  filterByStock?: boolean;
  withStock?: boolean; // New: fetch stock join
}

export const useProducts = (options: UseProductsOptions = {}) => {
  const { branchId, filterByStock = false, withStock = false } = options;
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching products from Supabase...');

      if ((filterByStock || withStock) && branchId) {
        // Hint the correct FK path to avoid ambiguous join error
        const { data: inventoryData, error: inventoryError } = await supabase
          .from('inventory')
          .select('product_id, quantity, products:products!fk_inventory_product_id(*)')
          .eq('branch_id', branchId)
          .gt('quantity', filterByStock ? 0 : -1);

        if (inventoryError) {
          console.error('Error fetching inventory:', inventoryError);
          throw inventoryError;
        }

        if (!inventoryData || inventoryData.length === 0) {
          setProducts([]);
          return;
        }

        // Only include when the join succeeded and has product info
        const productsWithStock: Product[] = inventoryData
          .filter((item) => item.products)
          .map(item => ({
            ...(item.products as Product),
            stock: item.quantity ?? 0,
          }));
        setProducts(productsWithStock);
        return;
      }

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('active', true)
        .order('name');

      if (error) {
        console.error('Error fetching products:', error);
        throw error;
      }

      setProducts(data || []);
    } catch (error: any) {
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
    // eslint-disable-next-line
  }, [branchId, filterByStock, withStock]);

  return { products, loading, error, refetchProducts: fetchProducts };
};

