
import { supabase } from '@/integrations/supabase/client';
import { Return, ReturnItem, ReturnCondition } from '@/types/products';

export const createReturn = async (returnData: {
  transactionId?: string;
  branchId: string;
  reason: string;
  notes?: string;
  autoApprove?: boolean;
  items: {
    productId: string;
    batchId?: string;
    quantity: number;
    reason: string;
    condition: ReturnCondition;
  }[];
}) => {
  console.log('Creating return:', returnData);

  const userId = (await supabase.auth.getUser()).data.user?.id;

  const { data: returnRecord, error: returnError } = await supabase
    .from('returns')
    .insert({
      transaction_id: returnData.transactionId,
      branch_id: returnData.branchId,
      processed_by: userId,
      reason: returnData.reason,
      notes: returnData.notes,
      status: returnData.autoApprove ? 'approved' : 'pending'
    })
    .select()
    .single();

  if (returnError) throw returnError;

  // Create return items
  const returnItems = returnData.items.map(item => ({
    return_id: returnRecord.id,
    product_id: item.productId,
    batch_id: item.batchId,
    quantity: item.quantity,
    reason: item.reason,
    condition: item.condition
  }));

  const { data: itemsData, error: itemsError } = await supabase
    .from('return_items')
    .insert(returnItems)
    .select();

  if (itemsError) throw itemsError;

  // If auto-approve, process inventory adjustments immediately
  if (returnData.autoApprove) {
    for (const item of returnData.items) {
      if (item.condition === 'resaleable') {
        // Add back to inventory if resaleable
        const { data: existingInventory } = await supabase
          .from('inventory')
          .select('id, quantity')
          .eq('product_id', item.productId)
          .eq('branch_id', returnData.branchId)
          .maybeSingle();

        if (existingInventory) {
          await supabase
            .from('inventory')
            .update({ 
              quantity: existingInventory.quantity + item.quantity,
              last_updated: new Date().toISOString()
            })
            .eq('id', existingInventory.id);
        } else {
          await supabase
            .from('inventory')
            .insert({
              product_id: item.productId,
              branch_id: returnData.branchId,
              batch_id: item.batchId,
              quantity: item.quantity
            });
        }
      }

      // Log stock movement
      await supabase
        .from('stock_movements')
        .insert({
          product_id: item.productId,
          branch_id: returnData.branchId,
          batch_id: item.batchId,
          movement_type: 'return',
          quantity_change: item.condition === 'resaleable' ? item.quantity : 0,
          reference_type: 'return',
          reference_id: returnRecord.id,
          reason: `Return: ${item.reason} - Condition: ${item.condition}`,
          performed_by: userId
        });
    }
  }

  return { return: returnRecord, items: itemsData };
};

export const fetchReturns = async (branchId?: string): Promise<Return[]> => {
  console.log('Fetching returns with branchId:', branchId);
  
  let query = supabase
    .from('returns')
    .select(`
      id,
      transaction_id,
      branch_id,
      processed_by,
      return_date,
      reason,
      status,
      notes,
      created_at,
      branches (
        id,
        name
      )
    `)
    .order('created_at', { ascending: false });

  if (branchId) {
    query = query.eq('branch_id', branchId);
  }

  const { data, error } = await query;
  console.log('Returns query result:', { data, error });
  
  if (error) {
    console.error('Error fetching returns:', error);
    throw error;
  }
  
  // Transform data properly
  return (data || []).map(returnItem => ({
    ...returnItem,
    status: returnItem.status as 'pending' | 'approved' | 'rejected',
    branches: returnItem.branches // Keep the foreign key relation properly
  })) as Return[];
};

export const fetchReturnItems = async (returnId: string): Promise<ReturnItem[]> => {
  const { data, error } = await supabase
    .from('return_items')
    .select(`
      id,
      return_id,
      product_id,
      batch_id,
      quantity,
      reason,
      condition,
      created_at,
      product:products!product_id(id, name, price),
      batch:product_batches!batch_id(id, batch_number, expiry_date)
    `)
    .eq('return_id', returnId);

  if (error) throw error;
  
  // Type assertion to ensure correct typing
  return (data || []).map(item => ({
    ...item,
    condition: item.condition as ReturnCondition
  })) as ReturnItem[];
};

export const processReturn = async (
  returnId: string,
  action: 'approve' | 'reject',
  notes?: string
) => {
  console.log('Processing return:', { returnId, action, notes });

  if (action === 'approve') {
    // Get return items
    const returnItems = await fetchReturnItems(returnId);
    const returnData = await supabase
      .from('returns')
      .select('branch_id')
      .eq('id', returnId)
      .single();

    if (returnData.error) throw returnData.error;

    // Process each return item
    for (const item of returnItems) {
      if (item.condition === 'resaleable') {
        // Add back to inventory if resaleable
        const { data: existingInventory } = await supabase
          .from('inventory')
          .select('id, quantity')
          .eq('product_id', item.product_id)
          .eq('branch_id', returnData.data.branch_id)
          .maybeSingle();

        if (existingInventory) {
          await supabase
            .from('inventory')
            .update({ 
              quantity: existingInventory.quantity + item.quantity,
              last_updated: new Date().toISOString()
            })
            .eq('id', existingInventory.id);
        } else {
          await supabase
            .from('inventory')
            .insert({
              product_id: item.product_id,
              branch_id: returnData.data.branch_id,
              batch_id: item.batch_id,
              quantity: item.quantity
            });
        }
      }

      // Log stock movement
      await supabase
        .from('stock_movements')
        .insert({
          product_id: item.product_id,
          branch_id: returnData.data.branch_id,
          batch_id: item.batch_id,
          movement_type: 'return',
          quantity_change: item.condition === 'resaleable' ? item.quantity : 0,
          reference_type: 'return',
          reference_id: returnId,
          reason: `Return: ${item.reason} - Condition: ${item.condition}`,
          performed_by: (await supabase.auth.getUser()).data.user?.id
        });
    }
  }

  // Update return status
  const { data, error } = await supabase
    .from('returns')
    .update({
      status: action === 'approve' ? 'approved' : 'rejected',
      notes: notes
    })
    .eq('id', returnId);

  if (error) throw error;
  return data;
};
