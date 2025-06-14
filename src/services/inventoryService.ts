
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
      products!fk_inventory_product_id (id, name), 
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
  
  // Transform the data to match InventoryItem interface
  const transformedData: InventoryItem[] = (data || []).map(item => ({
    id: item.id,
    product_id: item.product_id,
    branch_id: item.branch_id,
    quantity: item.quantity,
    last_updated: item.last_updated,
    product: item.products || { id: '', name: '' },
    branch: item.branches || { id: '', name: '' }
  }));
  
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
