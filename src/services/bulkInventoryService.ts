
import { supabase } from '@/integrations/supabase/client';

export type InventoryOperation = 'set' | 'add' | 'subtract' | 'reset';

export interface BulkEditInventoryResult {
  updated: Array<{ id: string; oldQty: number; newQty: number }>;
  failed: Array<{ id: string; error: string }>;
}

export interface InventoryEditItem {
  id: string;
  product_id: string;
  branch_id: string;
  quantity: number;
  product_name?: string;
  branch_name?: string;
}

/**
 * Bulk edit inventory quantities with audit trail
 */
export const bulkEditInventory = async (
  inventoryIds: string[],
  operation: InventoryOperation,
  value: number,
  performedBy: string,
  reason: string
): Promise<BulkEditInventoryResult> => {
  const result: BulkEditInventoryResult = {
    updated: [],
    failed: []
  };

  for (const invId of inventoryIds) {
    try {
      // Get current inventory item
      const { data: currentItem, error: fetchError } = await supabase
        .from('inventory')
        .select(`
          id, 
          product_id, 
          branch_id, 
          quantity,
          products!fk_inventory_product_id (name)
        `)
        .eq('id', invId)
        .single();

      if (fetchError || !currentItem) {
        throw new Error(fetchError?.message || 'Item tidak ditemukan');
      }

      // Calculate new quantity
      let newQuantity = currentItem.quantity;
      switch (operation) {
        case 'set':
          newQuantity = value;
          break;
        case 'add':
          newQuantity = currentItem.quantity + value;
          break;
        case 'subtract':
          newQuantity = Math.max(0, currentItem.quantity - value);
          break;
        case 'reset':
          newQuantity = 0;
          break;
      }

      // Update inventory
      const { error: updateError } = await supabase
        .from('inventory')
        .update({ 
          quantity: newQuantity, 
          last_updated: new Date().toISOString() 
        })
        .eq('id', invId);

      if (updateError) throw updateError;

      // Record stock adjustment for audit trail
      const quantityChange = newQuantity - currentItem.quantity;
      if (quantityChange !== 0) {
        const adjustmentType = quantityChange > 0 ? 'adjust_in' : 'adjust_out';
        
        await supabase.from('stock_adjustments').insert({
          product_id: currentItem.product_id,
          branch_id: currentItem.branch_id,
          adjustment_type: adjustmentType,
          quantity_change: quantityChange,
          reason: `Bulk edit (${operation}): ${reason}`,
          performed_by: performedBy
        });
      }

      result.updated.push({
        id: invId,
        oldQty: currentItem.quantity,
        newQty: newQuantity
      });

      console.log(`✅ Inventory ${invId} updated: ${currentItem.quantity} → ${newQuantity}`);
    } catch (error: any) {
      console.error(`❌ Failed to update inventory ${invId}:`, error);
      result.failed.push({ id: invId, error: error.message });
    }
  }

  console.log('📊 Bulk edit inventory result:', {
    updated: result.updated.length,
    failed: result.failed.length
  });

  return result;
};

/**
 * Get inventory items by IDs for preview
 */
export const getInventoryByIds = async (inventoryIds: string[]): Promise<InventoryEditItem[]> => {
  const { data, error } = await supabase
    .from('inventory')
    .select(`
      id, 
      product_id, 
      branch_id, 
      quantity,
      products!fk_inventory_product_id (name),
      branches!fk_inventory_branch_id (name)
    `)
    .in('id', inventoryIds);

  if (error) throw error;

  return (data || []).map(item => ({
    id: item.id,
    product_id: item.product_id,
    branch_id: item.branch_id,
    quantity: item.quantity,
    product_name: (item.products as any)?.name || 'Unknown',
    branch_name: (item.branches as any)?.name || 'Unknown'
  }));
};
