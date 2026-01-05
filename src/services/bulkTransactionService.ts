
import { supabase } from '@/integrations/supabase/client';

export interface BulkVoidResult {
  voided: string[];
  stockReturned: number;
  failed: Array<{ id: string; error: string }>;
}

export interface TransactionVoidItem {
  id: string;
  transaction_date: string;
  total_amount: number;
  status: string;
  branch_name?: string;
  cashier_name?: string;
}

/**
 * Bulk void transactions with stock return
 */
export const bulkVoidTransactions = async (
  transactionIds: string[],
  reason: string,
  performedBy: string
): Promise<BulkVoidResult> => {
  const result: BulkVoidResult = {
    voided: [],
    stockReturned: 0,
    failed: []
  };

  for (const txId of transactionIds) {
    try {
      // Get transaction to check current status
      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .select('id, status, branch_id, total_amount')
        .eq('id', txId)
        .single();

      if (txError || !transaction) {
        throw new Error(txError?.message || 'Transaksi tidak ditemukan');
      }

      // Skip if already cancelled
      if (transaction.status === 'cancelled') {
        result.failed.push({ id: txId, error: 'Transaksi sudah dibatalkan sebelumnya' });
        continue;
      }

      // Update transaction status to cancelled
      const { error: updateError } = await supabase
        .from('transactions')
        .update({
          status: 'cancelled',
          payment_status: 'cancelled',
          notes: `VOID: ${reason}. Dibatalkan oleh user pada ${new Date().toLocaleString('id-ID')}`
        })
        .eq('id', txId);

      if (updateError) throw updateError;

      // Get transaction items to return stock
      const { data: items, error: itemsError } = await supabase
        .from('transaction_items')
        .select('product_id, quantity')
        .eq('transaction_id', txId);

      if (itemsError) throw itemsError;

      // Return stock for each item
      for (const item of items || []) {
        // Update inventory - add back the quantity
        const { data: existingInventory } = await supabase
          .from('inventory')
          .select('id, quantity')
          .eq('product_id', item.product_id)
          .eq('branch_id', transaction.branch_id)
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
          // Create inventory record if doesn't exist
          await supabase
            .from('inventory')
            .insert({
              product_id: item.product_id,
              branch_id: transaction.branch_id,
              quantity: item.quantity
            });
        }

        // Log stock movement for void/return
        await supabase.from('stock_movements').insert({
          product_id: item.product_id,
          branch_id: transaction.branch_id,
          quantity_change: item.quantity,
          movement_type: 'in',
          reference_id: txId,
          reference_type: 'transaction_void',
          performed_by: performedBy,
          reason: `Void transaksi: ${reason}`,
          movement_date: new Date().toISOString()
        });

        result.stockReturned += item.quantity;
      }

      result.voided.push(txId);
      console.log(`✅ Transaction ${txId} voided, ${items?.length || 0} items returned to stock`);

    } catch (error: any) {
      console.error(`❌ Failed to void transaction ${txId}:`, error);
      result.failed.push({ id: txId, error: error.message });
    }
  }

  console.log('📊 Bulk void result:', {
    voided: result.voided.length,
    stockReturned: result.stockReturned,
    failed: result.failed.length
  });

  return result;
};

/**
 * Get transactions by IDs for preview
 */
export const getTransactionsByIds = async (transactionIds: string[]): Promise<TransactionVoidItem[]> => {
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      id, 
      transaction_date, 
      total_amount, 
      status,
      branches!fk_transactions_branch_id (name),
      profiles!fk_transactions_cashier_id (name)
    `)
    .in('id', transactionIds);

  if (error) throw error;

  return (data || []).map(tx => ({
    id: tx.id,
    transaction_date: tx.transaction_date,
    total_amount: tx.total_amount,
    status: tx.status,
    branch_name: (tx.branches as any)?.name || 'Unknown',
    cashier_name: (tx.profiles as any)?.name || 'Unknown'
  }));
};
