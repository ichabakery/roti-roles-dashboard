
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface CartItem {
  product: {
    id: string;
    name: string;
    price: number;
  };
  quantity: number;
}

interface StockInfo {
  productId: string;
  productName: string;
  availableStock: number;
  requestedQuantity: number;
}

export const useStockValidation = () => {
  const [checking, setChecking] = useState(false);

  const checkProductStock = async (productId: string, branchId: string): Promise<number> => {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('quantity')
        .eq('product_id', productId)
        .eq('branch_id', branchId)
        .maybeSingle();

      if (error) {
        console.error('Error checking product stock:', error);
        // Handle RLS policy errors more gracefully
        if (error.code === '42501') {
          throw new Error('Tidak memiliki akses untuk memeriksa stok cabang ini');
        }
        throw error;
      }

      return data?.quantity || 0;
    } catch (error: any) {
      console.error('Stock check error:', error);
      throw new Error(`Gagal memeriksa stok: ${error.message}`);
    }
  };

  const validateCartStock = async (cart: CartItem[], branchId: string): Promise<{ isValid: boolean; stockInfo: StockInfo[] }> => {
    if (!branchId) {
      throw new Error('Branch ID tidak tersedia');
    }

    setChecking(true);
    
    try {
      console.log('🔍 Validating stock for cart items...', cart.length);
      
      const stockInfo: StockInfo[] = [];
      let isValid = true;

      // Use batch query for better performance
      const productIds = cart.map(item => item.product.id);
      
      const { data: inventoryData, error } = await supabase
        .from('inventory')
        .select('product_id, quantity')
        .eq('branch_id', branchId)
        .in('product_id', productIds);

      if (error) {
        console.error('Batch stock check error:', error);
        if (error.code === '42501') {
          throw new Error('Tidak memiliki akses untuk memeriksa stok cabang ini');
        }
        throw error;
      }

      // Create lookup map for inventory data
      const inventoryMap = new Map(
        (inventoryData || []).map(item => [item.product_id, item.quantity])
      );

      for (const cartItem of cart) {
        const availableStock = inventoryMap.get(cartItem.product.id) || 0;
        
        const stockItem: StockInfo = {
          productId: cartItem.product.id,
          productName: cartItem.product.name,
          availableStock,
          requestedQuantity: cartItem.quantity
        };

        stockInfo.push(stockItem);

        if (availableStock < cartItem.quantity) {
          isValid = false;
          console.warn(`Insufficient stock for ${cartItem.product.name}: available ${availableStock}, requested ${cartItem.quantity}`);
        }
      }

      return { isValid, stockInfo };
    } catch (error: any) {
      console.error('Cart stock validation error:', error);
      toast({
        variant: "destructive",
        title: "Error Validasi Stok",
        description: error.message,
      });
      throw error;
    } finally {
      setChecking(false);
    }
  };

  const getStockSummary = (stockInfo: StockInfo[]) => {
    const insufficientStock = stockInfo.filter(item => item.availableStock < item.requestedQuantity);
    
    if (insufficientStock.length > 0) {
      const messages = insufficientStock.map(item => 
        `${item.productName}: tersedia ${item.availableStock}, dibutuhkan ${item.requestedQuantity}`
      );
      
      return {
        hasIssues: true,
        message: `Stok tidak mencukupi:\n${messages.join('\n')}`
      };
    }

    return {
      hasIssues: false,
      message: 'Semua produk tersedia'
    };
  };

  return {
    checking,
    checkProductStock,
    validateCartStock,
    getStockSummary
  };
};
