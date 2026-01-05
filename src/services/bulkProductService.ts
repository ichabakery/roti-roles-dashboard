
import { supabase } from '@/integrations/supabase/client';

export interface BulkDeleteResult {
  deleted: string[];
  archived: string[];
  failed: Array<{ id: string; error: string }>;
}

/**
 * Check if a product has related data in other tables
 */
export const checkProductRelations = async (productId: string): Promise<boolean> => {
  // Check transaction_items
  const { count: transactionCount } = await supabase
    .from('transaction_items')
    .select('*', { count: 'exact', head: true })
    .eq('product_id', productId);

  if (transactionCount && transactionCount > 0) return true;

  // Check order_items
  const { count: orderCount } = await supabase
    .from('order_items')
    .select('*', { count: 'exact', head: true })
    .eq('product_id', productId);

  if (orderCount && orderCount > 0) return true;

  // Check inventory
  const { count: inventoryCount } = await supabase
    .from('inventory')
    .select('*', { count: 'exact', head: true })
    .eq('product_id', productId);

  if (inventoryCount && inventoryCount > 0) return true;

  // Check production_requests
  const { count: productionCount } = await supabase
    .from('production_requests')
    .select('*', { count: 'exact', head: true })
    .eq('product_id', productId);

  if (productionCount && productionCount > 0) return true;

  // Check product_packages (as parent or component)
  const { count: packageParentCount } = await supabase
    .from('product_packages')
    .select('*', { count: 'exact', head: true })
    .eq('parent_product_id', productId);

  if (packageParentCount && packageParentCount > 0) return true;

  const { count: packageComponentCount } = await supabase
    .from('product_packages')
    .select('*', { count: 'exact', head: true })
    .eq('component_product_id', productId);

  if (packageComponentCount && packageComponentCount > 0) return true;

  return false;
};

/**
 * Bulk delete products - soft delete if has relations, hard delete otherwise
 */
export const bulkDeleteProducts = async (productIds: string[]): Promise<BulkDeleteResult> => {
  const result: BulkDeleteResult = {
    deleted: [],
    archived: [],
    failed: []
  };

  for (const productId of productIds) {
    try {
      // Check if product has relations
      const hasRelations = await checkProductRelations(productId);

      if (hasRelations) {
        // Soft delete - set active = false (archive)
        const { error } = await supabase
          .from('products')
          .update({ active: false })
          .eq('id', productId);

        if (error) throw error;
        result.archived.push(productId);
        console.log(`📦 Product ${productId} archived (has relations)`);
      } else {
        // Hard delete
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', productId);

        if (error) throw error;
        result.deleted.push(productId);
        console.log(`🗑️ Product ${productId} deleted permanently`);
      }
    } catch (error: any) {
      console.error(`❌ Failed to delete product ${productId}:`, error);
      result.failed.push({ id: productId, error: error.message });
    }
  }

  console.log('📊 Bulk delete result:', {
    deleted: result.deleted.length,
    archived: result.archived.length,
    failed: result.failed.length
  });

  return result;
};

/**
 * Get products by IDs for preview
 */
export const getProductsByIds = async (productIds: string[]) => {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, price, active')
    .in('id', productIds);

  if (error) throw error;
  return data || [];
};
