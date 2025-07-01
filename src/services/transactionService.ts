
import { supabase } from '@/integrations/supabase/client';
import { CartItem, Transaction } from '@/types/cashier';
import { PaymentData } from '@/components/cashier/PaymentOptionsDialog';

interface CreateTransactionParams {
  cart: CartItem[];
  selectedBranch: string;
  userId: string;
  totalAmount: number;
  paymentData?: PaymentData;
  paymentMethod: string;
}

export const createTransaction = async ({
  cart,
  selectedBranch,
  userId,
  totalAmount,
  paymentData,
  paymentMethod
}: CreateTransactionParams): Promise<Transaction> => {
  console.log('🔄 Creating transaction with params:', {
    cartItems: cart.length,
    selectedBranch,
    userId,
    totalAmount,
    paymentData,
    paymentMethod
  });

  // Validate cart items
  if (!cart || cart.length === 0) {
    throw new Error('Keranjang belanja kosong');
  }

  // Validate each cart item
  cart.forEach((item, index) => {
    if (!item.product || !item.product.id) {
      throw new Error(`Item ke-${index + 1} tidak memiliki data produk yang valid`);
    }
    if (!item.quantity || item.quantity <= 0) {
      throw new Error(`Jumlah item ke-${index + 1} tidak valid`);
    }
  });

  // Determine payment status and amounts based on payment type
  let payment_status: 'paid' | 'pending' | 'partial' = 'paid';
  let amount_paid = totalAmount;
  let amount_remaining = 0;
  let due_date = null;

  if (paymentData) {
    switch (paymentData.type) {
      case 'deferred':
        payment_status = 'pending';
        amount_paid = 0;
        amount_remaining = totalAmount;
        due_date = paymentData.dueDate || null;
        break;
      case 'down_payment':
        payment_status = 'partial';
        amount_paid = paymentData.amountPaid || 0;
        amount_remaining = totalAmount - amount_paid;
        due_date = paymentData.dueDate || null;
        break;
      case 'full':
      default:
        payment_status = 'paid';
        amount_paid = totalAmount;
        amount_remaining = 0;
        break;
    }
  }

  // Create transaction
  const transactionData = {
    branch_id: selectedBranch,
    cashier_id: userId,
    total_amount: totalAmount,
    payment_method: paymentData?.paymentMethod || paymentMethod,
    payment_status,
    amount_paid: amount_paid > 0 ? amount_paid : null,
    amount_remaining: amount_remaining > 0 ? amount_remaining : null,
    due_date,
    notes: paymentData?.notes || null
  };

  console.log('📝 Creating transaction with data:', transactionData);

  const { data: transaction, error: transactionError } = await supabase
    .from('transactions')
    .insert(transactionData)
    .select()
    .single();

  if (transactionError) {
    console.error('❌ Transaction creation error:', transactionError);
    throw new Error(`Gagal membuat transaksi: ${transactionError.message}`);
  }

  console.log('✅ Transaction created successfully:', transaction.id);

  // Prepare transaction items data
  const transactionItems = cart.map((item, index) => {
    const itemData = {
      transaction_id: transaction.id,
      product_id: item.product.id,
      quantity: item.quantity,
      price_per_item: item.product.price,
      subtotal: item.product.price * item.quantity
    };
    
    console.log(`📋 Preparing item ${index + 1}:`, itemData);
    return itemData;
  });

  console.log('📋 Creating transaction items:', transactionItems.length, 'items');

  const { data: createdItems, error: itemsError } = await supabase
    .from('transaction_items')
    .insert(transactionItems)
    .select();

  if (itemsError) {
    console.error('❌ Transaction items creation error:', itemsError);
    
    // Rollback transaction if items creation fails
    await supabase.from('transactions').delete().eq('id', transaction.id);
    
    throw new Error(`Gagal menyimpan item transaksi: ${itemsError.message}`);
  }

  console.log('✅ Transaction items created successfully:', createdItems?.length || 0, 'items');

  // Update inventory for each item using direct table updates
  for (const item of cart) {
    try {
      console.log(`📦 Updating inventory for product ${item.product.id}, qty: -${item.quantity}`);
      
      // First try to update existing inventory
      const { data: existingInventory, error: fetchError } = await supabase
        .from('inventory')
        .select('id, quantity')
        .eq('product_id', item.product.id)
        .eq('branch_id', selectedBranch)
        .maybeSingle();

      if (fetchError) {
        console.error(`❌ Error fetching inventory for product ${item.product.id}:`, fetchError);
        continue;
      }

      if (existingInventory) {
        // Update existing inventory
        const newQuantity = Math.max(0, existingInventory.quantity - item.quantity);
        const { error: updateError } = await supabase
          .from('inventory')
          .update({ 
            quantity: newQuantity,
            last_updated: new Date().toISOString()
          })
          .eq('id', existingInventory.id);

        if (updateError) {
          console.error(`❌ Error updating inventory for product ${item.product.id}:`, updateError);
        } else {
          console.log(`✅ Inventory updated for product ${item.product.id}: ${existingInventory.quantity} -> ${newQuantity}`);
        }
      } else {
        // Create new inventory record with 0 quantity (since we're selling from non-existing stock)
        const { error: insertError } = await supabase
          .from('inventory')
          .insert({
            product_id: item.product.id,
            branch_id: selectedBranch,
            quantity: 0,
            last_updated: new Date().toISOString()
          });

        if (insertError) {
          console.error(`❌ Error creating inventory for product ${item.product.id}:`, insertError);
        } else {
          console.log(`✅ New inventory record created for product ${item.product.id}`);
        }
      }

      // Log stock movement
      const { error: movementError } = await supabase
        .from('stock_movements')
        .insert({
          product_id: item.product.id,
          branch_id: selectedBranch,
          quantity_change: -item.quantity,
          movement_type: 'out',
          reference_id: transaction.id,
          reference_type: 'transaction',
          performed_by: userId,
          movement_date: new Date().toISOString()
        });

      if (movementError) {
        console.error(`❌ Error logging stock movement for product ${item.product.id}:`, movementError);
      } else {
        console.log(`✅ Stock movement logged for product ${item.product.id}`);
      }

    } catch (error) {
      console.error(`❌ Inventory update failed for product ${item.product.id}:`, error);
      // Continue with other items
    }
  }

  // For paid and partial payments, record the payment history
  if (amount_paid > 0) {
    const { error: paymentHistoryError } = await supabase
      .from('payment_history')
      .insert({
        transaction_id: transaction.id,
        amount_paid: amount_paid,
        payment_method: paymentData?.paymentMethod || paymentMethod,
        cashier_id: userId,
        notes: paymentData?.notes || null
      });

    if (paymentHistoryError) {
      console.error('❌ Payment history error:', paymentHistoryError);
      // Don't throw error here, just log it
    } else {
      console.log('✅ Payment history recorded');
    }
  }

  // Return transaction with enhanced data for receipt
  const enhancedTransaction = {
    ...transaction,
    products: cart.map(item => ({
      name: item.product.name,
      quantity: item.quantity,
      price: item.product.price * item.quantity
    }))
  };

  console.log('🎉 Transaction completed successfully:', enhancedTransaction.id);
  return enhancedTransaction;
};
