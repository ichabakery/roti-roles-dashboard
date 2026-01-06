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

export interface BatchProgress {
  current: number;
  total: number;
  percentage: number;
}

const CHUNK_SIZE = 50;

/**
 * Split array into chunks
 */
const chunkArray = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

/**
 * Batch add/update stock untuk multiple products di multiple branches
 * Optimized with parallel processing and upsert
 */
export const batchAddStock = async (
  items: BatchStockItem[],
  performedBy: string,
  onProgress?: (progress: BatchProgress) => void
): Promise<BatchStockResult> => {
  console.log('📦 Batch adding stock for', items.length, 'items (optimized)');
  
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
    // Get existing inventory records in one query
    const productIds = [...new Set(validItems.map(i => i.productId))];
    const branchIds = [...new Set(validItems.map(i => i.branchId))];

    console.log('📊 Fetching existing inventory for', productIds.length, 'products across', branchIds.length, 'branches');

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

    // Split items into chunks for parallel processing
    const chunks = chunkArray(validItems, CHUNK_SIZE);
    const totalChunks = chunks.length;

    console.log('🔄 Processing', validItems.length, 'items in', totalChunks, 'chunks');

    // Process chunks sequentially but items within chunk in parallel
    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
      const chunk = chunks[chunkIndex];
      
      // Prepare upsert data for this chunk
      const upsertPromises = chunk.map(async (item) => {
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
              return { type: 'error' as const, message: `Update gagal: ${updateError.message}` };
            }
            
            // Update local map
            inventoryMap.set(key, { id: existing.id, quantity: newQuantity });
            return { type: 'updated' as const };
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
              return { type: 'error' as const, message: `Insert gagal: ${insertError.message}` };
            }
            
            // Add to local map
            if (insertedData) {
              inventoryMap.set(key, { id: insertedData.id, quantity: item.quantity });
            }
            return { type: 'inserted' as const };
          }
        } catch (err: any) {
          return { type: 'error' as const, message: err.message || 'Unknown error' };
        }
      });

      // Wait for all items in this chunk to complete
      const chunkResults = await Promise.all(upsertPromises);
      
      // Count results
      chunkResults.forEach(res => {
        if (res.type === 'updated') result.totalUpdated++;
        else if (res.type === 'inserted') result.totalInserted++;
        else if (res.type === 'error') result.errors.push(res.message);
      });

      // Report progress
      const progress: BatchProgress = {
        current: chunkIndex + 1,
        total: totalChunks,
        percentage: Math.round(((chunkIndex + 1) / totalChunks) * 100)
      };
      onProgress?.(progress);
      
      console.log(`✅ Chunk ${chunkIndex + 1}/${totalChunks} completed (${progress.percentage}%)`);
    }

    // Bulk insert stock movements (optional - don't fail if this fails)
    try {
      const movements = validItems.map(item => ({
        product_id: item.productId,
        branch_id: item.branchId,
        quantity_change: item.quantity,
        movement_type: 'in',
        reference_type: 'batch_stock_add',
        performed_by: performedBy,
      }));

      // Insert movements in chunks too
      const movementChunks = chunkArray(movements, 100);
      for (const movementChunk of movementChunks) {
        await supabase.from('stock_movements').insert(movementChunk);
      }
      console.log('📝 Stock movements logged successfully');
    } catch (movementError) {
      console.warn('⚠️ Could not log stock movements:', movementError);
      // Don't fail the whole operation for logging errors
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
