import { supabase } from '@/integrations/supabase/client';
import { FEATURE_FLAGS } from '@/utils/featureFlags';

export interface StockValidationResult {
  isValid: boolean;
  availableStock: number;
  message?: string;
  canOverride?: boolean;
}

export interface CartValidationResult {
  isValid: boolean;
  issues: Array<{
    productId: string;
    productName: string;
    requested: number;
    available: number;
    deficit: number;
  }>;
  message?: string;
}

/**
 * Validates stock availability for a single product
 */
export const validateProductStock = async (
  productId: string,
  branchId: string,
  requiredQuantity: number
): Promise<StockValidationResult> => {
  try {
    const { data: inventory, error } = await supabase
      .from('inventory')
      .select('quantity')
      .eq('product_id', productId)
      .eq('branch_id', branchId)
      .maybeSingle();

    if (error) {
      console.error('Error checking stock:', error);
      throw error;
    }

    const availableStock = inventory?.quantity || 0;
    const isValid = availableStock >= requiredQuantity;

    if (!isValid) {
      const deficit = requiredQuantity - availableStock;
      return {
        isValid: false,
        availableStock,
        message: `Stok tidak mencukupi. Tersedia: ${availableStock}, Dibutuhkan: ${requiredQuantity}, Kekurangan: ${deficit}`,
        canOverride: FEATURE_FLAGS.ALLOW_NEGATIVE_STOCK_OVERRIDE
      };
    }

    return {
      isValid: true,
      availableStock,
      message: `Stok mencukupi. Tersedia: ${availableStock}`
    };

  } catch (error: any) {
    console.error('Stock validation error:', error);
    return {
      isValid: false,
      availableStock: 0,
      message: `Error validasi stok: ${error.message}`
    };
  }
};

/**
 * Validates stock for multiple products (cart validation)
 */
export const validateCartStock = async (
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
  }>,
  branchId: string
): Promise<CartValidationResult> => {
  try {
    // Get current stock for all products in the cart
    const productIds = items.map(item => item.productId);
    
    const { data: inventoryData, error } = await supabase
      .from('inventory')
      .select('product_id, quantity')
      .eq('branch_id', branchId)
      .in('product_id', productIds);

    if (error) {
      throw error;
    }

    // Create a map of current stock
    const stockMap = new Map<string, number>();
    inventoryData?.forEach(inv => {
      stockMap.set(inv.product_id, inv.quantity || 0);
    });

    // Check each item
    const issues: CartValidationResult['issues'] = [];
    let allValid = true;

    for (const item of items) {
      const availableStock = stockMap.get(item.productId) || 0;
      
      if (availableStock < item.quantity) {
        allValid = false;
        issues.push({
          productId: item.productId,
          productName: item.productName,
          requested: item.quantity,
          available: availableStock,
          deficit: item.quantity - availableStock
        });
      }
    }

    return {
      isValid: allValid,
      issues,
      message: allValid 
        ? 'Semua stok mencukupi untuk transaksi ini'
        : `${issues.length} produk memiliki stok tidak mencukupi`
    };

  } catch (error: any) {
    console.error('Cart stock validation error:', error);
    return {
      isValid: false,
      issues: [],
      message: `Error validasi keranjang: ${error.message}`
    };
  }
};

/**
 * Prevents transaction if stock would go negative (unless override is allowed)
 */
export const validateTransactionStock = async (
  productId: string,
  branchId: string,
  quantityToDeduct: number,
  allowOverride: boolean = false
): Promise<StockValidationResult> => {
  try {
    const result = await validateProductStock(productId, branchId, quantityToDeduct);
    
    if (!result.isValid && !allowOverride) {
      // Block the transaction
      return {
        ...result,
        message: `${result.message}. Transaksi dibatalkan untuk mencegah stok negatif.`
      };
    }

    return result;

  } catch (error: any) {
    return {
      isValid: false,
      availableStock: 0,
      message: `Error validasi transaksi: ${error.message}`
    };
  }
};

/**
 * Checks if input values are valid (no negative numbers)
 */
export const validateInputQuantity = (quantity: number, fieldName: string = 'Kuantitas'): string | null => {
  if (quantity < 0) {
    return `${fieldName} tidak boleh negatif`;
  }
  
  if (!Number.isInteger(quantity)) {
    return `${fieldName} harus berupa bilangan bulat`;
  }
  
  if (quantity > 999999) {
    return `${fieldName} terlalu besar (maksimal 999,999)`;
  }
  
  return null;
};