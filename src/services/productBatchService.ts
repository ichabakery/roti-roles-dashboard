
import { supabase } from '@/integrations/supabase/client';
import { ProductBatch } from '@/types/products';

export const createProductBatch = async (batchData: {
  productId: string;
  branchId: string;
  batchNumber: string;
  quantity: number;
  productionDate: string;
  expiryDate: string;
}) => {
  console.log('Creating product batch:', batchData);

  const { data, error } = await supabase
    .from('product_batches')
    .insert({
      product_id: batchData.productId,
      branch_id: batchData.branchId,
      batch_number: batchData.batchNumber,
      quantity: batchData.quantity,
      production_date: batchData.productionDate,
      expiry_date: batchData.expiryDate,
      status: 'active'
    })
    .select()
    .single();

  if (error) throw error;

  // Also update inventory with batch info
  await supabase.rpc('upsert_inventory_with_batch', {
    p_product_id: batchData.productId,
    p_branch_id: batchData.branchId,
    p_batch_id: data.id,
    p_quantity: batchData.quantity
  });

  return data;
};

export const fetchProductBatches = async (
  branchId?: string,
  productId?: string
): Promise<ProductBatch[]> => {
  let query = supabase
    .from('product_batches')
    .select(`
      id,
      product_id,
      branch_id,
      batch_number,
      quantity,
      production_date,
      expiry_date,
      status,
      created_at,
      updated_at,
      product:products!product_id(id, name),
      branch:branches!branch_id(id, name)
    `)
    .order('expiry_date', { ascending: true });

  if (branchId) {
    query = query.eq('branch_id', branchId);
  }

  if (productId) {
    query = query.eq('product_id', productId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

export const fetchExpiringProducts = async (daysAhead: number = 3) => {
  console.log('Fetching expiring products for next', daysAhead, 'days');

  const { data, error } = await supabase
    .rpc('get_expiring_products', { days_ahead: daysAhead });

  if (error) throw error;
  return data || [];
};

export const updateBatchStatus = async (batchId: string, status: 'active' | 'expired' | 'sold_out') => {
  const { data, error } = await supabase
    .from('product_batches')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', batchId);

  if (error) throw error;
  return data;
};

export const adjustBatchQuantity = async (batchId: string, newQuantity: number) => {
  const { data, error } = await supabase
    .from('product_batches')
    .update({ 
      quantity: newQuantity,
      updated_at: new Date().toISOString(),
      status: newQuantity <= 0 ? 'sold_out' : 'active'
    })
    .eq('id', batchId);

  if (error) throw error;
  return data;
};
