
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Product, ProductType } from '@/types/products';
import { 
  fetchProductsWithType, 
  createProduct, 
  updateProductType 
} from '@/services/enhancedProductService';

export const useEnhancedProducts = (productType?: ProductType) => {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching enhanced products with type:', productType);
      
      const data = await fetchProductsWithType(productType, true);
      console.log('Enhanced products fetched successfully:', data);
      setProducts(data);
    } catch (error: any) {
      console.error('Error fetching enhanced products:', error);
      setError(error.message);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Gagal memuat data produk: ${error.message}`,
      });
    } finally {
      setLoading(false);
    }
  }, [productType, toast]);

  const addProduct = useCallback(async (productData: {
    name: string;
    description?: string;
    price: number;
    productType: ProductType;
    imageUrl?: string;
  }) => {
    try {
      const newProduct = await createProduct(productData);
      toast({
        title: "Berhasil",
        description: `Produk ${productData.name} berhasil ditambahkan`,
      });
      fetchProducts();
      return newProduct;
    } catch (error: any) {
      console.error('Error adding product:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Gagal menambahkan produk: ${error.message}`,
      });
      throw error;
    }
  }, [toast, fetchProducts]);

  const changeProductType = useCallback(async (productId: string, newType: ProductType) => {
    try {
      await updateProductType(productId, newType);
      toast({
        title: "Berhasil",
        description: "Jenis produk berhasil diperbarui",
      });
      fetchProducts();
      return true;
    } catch (error: any) {
      console.error('Error updating product type:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Gagal memperbarui jenis produk: ${error.message}`,
      });
      return false;
    }
  }, [toast, fetchProducts]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { 
    products, 
    loading, 
    error, 
    refetchProducts: fetchProducts,
    addProduct,
    changeProductType
  };
};
