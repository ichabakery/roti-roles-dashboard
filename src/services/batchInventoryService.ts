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
      throw new Error(`Gagal mengambil data inventory: ${fetchError.message}`);
    }

    // Create a map for quick lookup
    const inventoryMap = new Map<string, { id: string; quantity: number }>();
    (existingInventory || []).forEach(inv => {
      const key = `${inv.product_id}-${inv.branch_id}`;
      inventoryMap.set(key, { id: inv.id, quantity: inv.quantity });
    });

    // Process each item individually for better error handling
    for (const item of validItems) {
      const key = `${item.productId}-${item.branchId}`;
      const existing = inventoryMap.get(key);

      try {
        if (existing) {
          // Update existing - add to current quantity
          const newQuantity = existing.quantity + item.quantity;
          const { error: updateError } = await supabase
            .from('inventory')
            .update({ 
              quantity: newQuantity,
              last_updated: new Date().toISOString()
            })
            .eq('id', existing.id);

          if (updateError) {
            console.error('❌ Error updating inventory:', updateError);
            result.errors.push(`Gagal update stok: ${updateError.message}`);
          } else {
            result.totalUpdated++;
            // Update local map for next iterations
            inventoryMap.set(key, { id: existing.id, quantity: newQuantity });
          }
        } else {
          // Insert new inventory record
          const { data: insertedData, error: insertError } = await supabase
            .from('inventory')
            .insert({
              product_id: item.productId,
              branch_id: item.branchId,
              quantity: item.quantity,
            })
            .select('id')
            .single();

          if (insertError) {
            console.error('❌ Error inserting inventory:', insertError);
            result.errors.push(`Gagal tambah stok baru: ${insertError.message}`);
          } else {
            result.totalInserted++;
            // Add to local map for next iterations
            if (insertedData) {
              inventoryMap.set(key, { id: insertedData.id, quantity: item.quantity });
            }
          }
        }

        // Try to log stock movement (optional - don't fail if this fails)
        try {
          await supabase
            .from('stock_movements')
            .insert({
              product_id: item.productId,
              branch_id: item.branchId,
              quantity_change: item.quantity,
              movement_type: 'in',
              reference_type: 'batch_stock_add',
              performed_by: performedBy,
            });
        } catch (movementError) {
          console.warn('⚠️ Could not log stock movement:', movementError);
          // Don't fail the whole operation for logging errors
        }
      } catch (itemError: any) {
        console.error('❌ Error processing item:', itemError);
        result.errors.push(itemError.message || 'Error processing item');
      }
    }

    // Determine overall success
    result.success = result.errors.length === 0 && (result.totalUpdated > 0 || result.totalInserted > 0);

    console.log('✅ Batch stock operation completed:', result);
    return result;

  } catch (error: any) {
    console.error('❌ Batch stock operation failed:', error);
    result.success = false;
    result.errors.push(error.message || 'Terjadi kesalahan tidak diketahui');
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
