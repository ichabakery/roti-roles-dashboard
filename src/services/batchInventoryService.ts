import { supabase } from '@/integrations/supabase/client';

export interface BatchStockItem {
  productId: string;
  branchId: string;
  quantity: number;
}

export interface BatchStockResult {
  success: boolean;
  totalUpdated: number;
  totalInserted: number;
  errors: string[];
}

/**
 * Batch add/update stock untuk multiple products di multiple branches
 */
export const batchAddStock = async (
  items: BatchStockItem[],
  performedBy: string
): Promise<BatchStockResult> => {
  console.log('📦 Batch adding stock for', items.length, 'items');
  
  const result: BatchStockResult = {
    success: true,
    totalUpdated: 0,
    totalInserted: 0,
    errors: [],
  };

  // Filter hanya item dengan quantity > 0
  const validItems = items.filter(item => item.quantity > 0);
  
  if (validItems.length === 0) {
    result.success = false;
    result.errors.push('Tidak ada item dengan jumlah stok yang valid');
    return result;
  }

  try {
    // Get existing inventory records
    const productIds = [...new Set(validItems.map(i => i.productId))];
    const branchIds = [...new Set(validItems.map(i => i.branchId))];

    const { data: existingInventory, error: fetchError } = await supabase
      .from('inventory')
      .select('id, product_id, branch_id, quantity')
      .in('product_id', productIds)
      .in('branch_id', branchIds);

    if (fetchError) {
      console.error('❌ Error fetching existing inventory:', fetchError);
      throw fetchError;
    }

    // Create a map for quick lookup
    const inventoryMap = new Map<string, { id: string; quantity: number }>();
    (existingInventory || []).forEach(inv => {
      const key = `${inv.product_id}-${inv.branch_id}`;
      inventoryMap.set(key, { id: inv.id, quantity: inv.quantity });
    });

    // Separate items into updates and inserts
    const updates: { id: string; quantity: number }[] = [];
    const inserts: { product_id: string; branch_id: string; quantity: number }[] = [];
    const stockMovements: {
      product_id: string;
      branch_id: string;
      quantity_change: number;
      movement_type: string;
      reference_type: string;
      performed_by: string;
    }[] = [];

    for (const item of validItems) {
      const key = `${item.productId}-${item.branchId}`;
      const existing = inventoryMap.get(key);

      if (existing) {
        // Update existing - add to current quantity
        updates.push({
          id: existing.id,
          quantity: existing.quantity + item.quantity,
        });
        result.totalUpdated++;
      } else {
        // Insert new
        inserts.push({
          product_id: item.productId,
          branch_id: item.branchId,
          quantity: item.quantity,
        });
        result.totalInserted++;
      }

      // Log stock movement
      stockMovements.push({
        product_id: item.productId,
        branch_id: item.branchId,
        quantity_change: item.quantity,
        movement_type: 'in',
        reference_type: 'batch_stock_add',
        performed_by: performedBy,
      });
    }

    // Execute updates
    for (const update of updates) {
      const { error } = await supabase
        .from('inventory')
        .update({ 
          quantity: update.quantity,
          last_updated: new Date().toISOString()
        })
        .eq('id', update.id);

      if (error) {
        console.error('❌ Error updating inventory:', error);
        result.errors.push(`Gagal update inventory: ${error.message}`);
      }
    }

    // Execute inserts
    if (inserts.length > 0) {
      const { error } = await supabase
        .from('inventory')
        .insert(inserts);

      if (error) {
        console.error('❌ Error inserting inventory:', error);
        result.errors.push(`Gagal insert inventory: ${error.message}`);
      }
    }

    // Log stock movements
    if (stockMovements.length > 0) {
      const { error: movementError } = await supabase
        .from('stock_movements')
        .insert(stockMovements);

      if (movementError) {
        console.error('⚠️ Error logging stock movements:', movementError);
        // Don't fail the whole operation for logging errors
      }
    }

    if (result.errors.length > 0) {
      result.success = false;
    }

    console.log('✅ Batch stock operation completed:', result);
    return result;

  } catch (error: any) {
    console.error('❌ Batch stock operation failed:', error);
    result.success = false;
    result.errors.push(error.message || 'Unknown error');
    return result;
  }
};

/**
 * Fetch all products with their current stock across all branches
 */
export const fetchProductsWithStock = async (branchIds: string[]) => {
  console.log('📦 Fetching products with stock for branches:', branchIds);

  // Fetch all active products
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, name, price, category, sku')
    .eq('active', true)
    .order('category')
    .order('name');

  if (productsError) {
    console.error('❌ Error fetching products:', productsError);
    throw productsError;
  }

  // Fetch current inventory for all products across specified branches
  const { data: inventory, error: inventoryError } = await supabase
    .from('inventory')
    .select('product_id, branch_id, quantity')
    .in('branch_id', branchIds);

  if (inventoryError) {
    console.error('❌ Error fetching inventory:', inventoryError);
    throw inventoryError;
  }

  // Create inventory map: productId -> { branchId -> quantity }
  const inventoryMap = new Map<string, Map<string, number>>();
  (inventory || []).forEach(inv => {
    if (!inventoryMap.has(inv.product_id)) {
      inventoryMap.set(inv.product_id, new Map());
    }
    inventoryMap.get(inv.product_id)!.set(inv.branch_id, inv.quantity);
  });

  // Combine products with their stock info
  const productsWithStock = (products || []).map(product => ({
    ...product,
    stockByBranch: inventoryMap.get(product.id) || new Map<string, number>(),
  }));

  console.log('✅ Fetched', productsWithStock.length, 'products with stock data');
  return productsWithStock;
};
