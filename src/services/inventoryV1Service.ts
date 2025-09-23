import { supabase } from '@/integrations/supabase/client';
import { StockAdjustment, StockAdjustmentType, InventoryKPI, StockStatus } from '@/types/products';
import { INVENTORY_DEFAULTS } from '@/utils/featureFlags';

/**
 * Create initial stock for a product
 */
export const createInitialStock = async (
  productId: string,
  branchId: string,
  initialStock: number
): Promise<void> => {
  if (initialStock <= 0) return;

  const { error } = await supabase.rpc('create_initial_stock', {
    p_product_id: productId,
    p_branch_id: branchId,
    p_initial_stock: initialStock
  });

  if (error) {
    console.error('Error creating initial stock:', error);
    throw error;
  }
};

/**
 * Get stock adjustments for a product/branch
 */
export const getStockAdjustments = async (
  productId?: string,
  branchId?: string
): Promise<StockAdjustment[]> => {
  let query = supabase
    .from('stock_adjustments')
    .select('*')
    .order('adjustment_date', { ascending: false });

  if (productId) {
    query = query.eq('product_id', productId);
  }

  if (branchId) {
    query = query.eq('branch_id', branchId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching stock adjustments:', error);
    throw error;
  }

  return data || [];
};

/**
 * Calculate stock status based on current quantity and reorder point
 */
export const calculateStockStatus = (
  currentStock: number,
  reorderPoint: number | null
): StockStatus => {
  const rop = reorderPoint || INVENTORY_DEFAULTS.REORDER_POINT;
  
  if (currentStock > rop) return 'high';
  if (currentStock === rop) return 'medium';
  return 'low';
};

/**
 * Get inventory KPIs for dashboard
 */
export const getInventoryKPIs = async (branchId?: string): Promise<InventoryKPI> => {
  try {
    // Get products with inventory data
    let inventoryQuery = supabase
      .from('inventory')
      .select(`
        id,
        product_id,
        branch_id,
        quantity,
        products!fk_inventory_product_id (
          id,
          name,
          sku,
          reorder_point,
          shelf_life_days,
          active
        )
      `)
      .eq('products.active', true);

    if (branchId && branchId !== 'all') {
      inventoryQuery = inventoryQuery.eq('branch_id', branchId);
    }

    const { data: inventoryData, error: inventoryError } = await inventoryQuery;

    if (inventoryError) {
      throw inventoryError;
    }

    const inventory = inventoryData || [];

    // Calculate KPIs
    const activeSKUs = new Set(inventory.map(item => item.product_id)).size;
    const totalUnits = inventory.reduce((sum, item) => sum + (item.quantity || 0), 0);
    
    const lowStockSKUs = inventory.filter(item => {
      const product = item.products as any;
      const reorderPoint = product?.reorder_point || INVENTORY_DEFAULTS.REORDER_POINT;
      return (item.quantity || 0) <= reorderPoint;
    }).length;

    // For expiring items, we'll use a simplified calculation
    // In a real implementation, this would check actual batch expiry dates
    const expiringItems = 0; // Placeholder - would need batch data

    return {
      activeSKUs,
      totalUnits,
      lowStockSKUs,
      expiringItems
    };
  } catch (error) {
    console.error('Error calculating inventory KPIs:', error);
    return {
      activeSKUs: 0,
      totalUnits: 0,
      lowStockSKUs: 0,
      expiringItems: 0
    };
  }
};

/**
 * Validate stock availability before transaction
 */
export const validateStockAvailability = async (
  productId: string,
  branchId: string,
  requiredQuantity: number
): Promise<{ isValid: boolean; availableStock: number; message?: string }> => {
  try {
    const { data: inventoryData, error } = await supabase
      .from('inventory')
      .select('quantity')
      .eq('product_id', productId)
      .eq('branch_id', branchId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    const availableStock = inventoryData?.quantity || 0;
    
    if (availableStock >= requiredQuantity) {
      return {
        isValid: true,
        availableStock
      };
    }

    return {
      isValid: false,
      availableStock,
      message: `Stok tidak mencukupi. Tersedia: ${availableStock}, Dibutuhkan: ${requiredQuantity}`
    };
  } catch (error) {
    console.error('Error validating stock:', error);
    return {
      isValid: false,
      availableStock: 0,
      message: 'Error validating stock availability'
    };
  }
};

/**
 * Generate SKU if not provided
 */
export const generateSKU = (productName: string, productId: string): string => {
  const prefix = productName
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .substring(0, 3);
  
  const suffix = productId.substring(0, 5).toUpperCase();
  return `${prefix}-${suffix}`;
};