
import { supabase } from '@/integrations/supabase/client';
import { InventoryItem } from '@/types/inventory';

export const fetchInventoryData = async (userRole: string, branchId?: string, selectedBranch?: string) => {
  console.log('📦 Fetching inventory data...');
  
  let query = supabase
    .from('inventory')
    .select(`
      id, 
      product_id, 
      branch_id, 
      quantity, 
      last_updated,
      products!fk_inventory_product_id (id, name, active), 
      branches!fk_inventory_branch_id (id, name)
    `);

  // Apply branch filter based on user role
  if (userRole === 'kasir_cabang' && branchId) {
    query = query.eq('branch_id', branchId);
  } else if (selectedBranch && selectedBranch !== 'all') {
    query = query.eq('branch_id', selectedBranch);
  }

  const { data, error } = await query.order('last_updated', { ascending: false });

  if (error) {
    console.error('❌ Inventory fetch error:', error);
    throw error;
  }
  
  console.log('✅ Inventory data fetched:', data?.length, 'records');
  
  // Filter out inactive products first
  const activeProductsData = (data || []).filter(item => {
    const product = item.products as { id: string; name: string; active?: boolean } | null;
    return product && product.active !== false;
  });
  
  console.log('✅ Active products inventory:', activeProductsData.length, 'records (filtered from', data?.length, ')');
  
  // Transform the data to match InventoryItem interface
  const transformedData: InventoryItem[] = activeProductsData.map(item => {
    const product = item.products as { id: string; name: string; active?: boolean } | null;
    return {
      id: item.id,
      product_id: item.product_id,
      branch_id: item.branch_id,
      quantity: item.quantity,
      last_updated: item.last_updated,
      product: product || { id: '', name: '', active: true },
      branch: item.branches || { id: '', name: '' }
    };
  });
  
  return transformedData;
};

export const addStockToInventory = async (productId: string, branchId: string, quantity: number) => {
  console.log('➕ Adding stock:', { productId, branchId, quantity });
  
  // Check if inventory item already exists
  const { data: existing, error: fetchError } = await supabase
    .from('inventory')
    .select('id, quantity')
    .eq('product_id', productId)
    .eq('branch_id', branchId)
    .maybeSingle();

  if (fetchError) throw fetchError;

  if (existing) {
    // Update existing inventory
    const newQuantity = existing.quantity + quantity;
    const { error: updateError } = await supabase
      .from('inventory')
      .update({ 
        quantity: newQuantity,
        last_updated: new Date().toISOString()
      })
      .eq('id', existing.id);

    if (updateError) throw updateError;
    console.log('✅ Stock updated:', existing.quantity, '->', newQuantity);
  } else {
    // Insert new inventory
    const { error: insertError } = await supabase
      .from('inventory')
      .insert({
        product_id: productId,
        branch_id: branchId,
        quantity: quantity
      });

    if (insertError) throw insertError;
    console.log('✅ New stock record created');
  }

  return true;
};

export const quickUpdateInventory = async (
  inventoryId: string, 
  newQuantity: number, 
  performedBy: string,
  reason: string = 'Quick Edit'
): Promise<boolean> => {
  console.log('⚡ Quick update inventory:', { inventoryId, newQuantity, reason });
  
  // Get current inventory item
  const { data: current, error: fetchError } = await supabase
    .from('inventory')
    .select('id, product_id, branch_id, quantity')
    .eq('id', inventoryId)
    .single();

  if (fetchError || !current) {
    console.error('❌ Failed to fetch inventory item:', fetchError);
    throw fetchError || new Error('Inventory item not found');
  }

  const quantityChange = newQuantity - current.quantity;
  
  // Update inventory
  const { error: updateError } = await supabase
    .from('inventory')
    .update({ 
      quantity: newQuantity,
      last_updated: new Date().toISOString()
    })
    .eq('id', inventoryId);

  if (updateError) {
    console.error('❌ Failed to update inventory:', updateError);
    throw updateError;
  }

  // Log stock adjustment for audit trail
  const { error: logError } = await supabase
    .from('stock_adjustments')
    .insert({
      product_id: current.product_id,
      branch_id: current.branch_id,
      adjustment_type: quantityChange >= 0 ? 'adjust_in' : 'adjust_out',
      quantity_change: quantityChange,
      reason: reason,
      performed_by: performedBy,
      adjustment_date: new Date().toISOString()
    });

  if (logError) {
    console.warn('⚠️ Failed to log stock adjustment:', logError);
    // Don't throw - the update succeeded
  }

  console.log('✅ Quick update successful:', current.quantity, '->', newQuantity);
  return true;
};
