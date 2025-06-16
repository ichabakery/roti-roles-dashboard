
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
    console.error('❌ Transaction error:', transactionError);
    throw new Error(`Gagal membuat transaksi: ${transactionError.message}`);
  }

  console.log('✅ Transaction created successfully:', transaction.id);

  // Create transaction items
  const transactionItems = cart.map(item => ({
    transaction_id: transaction.id,
    product_id: item.product.id,
    quantity: item.quantity,
    price_per_item: item.product.price,
    subtotal: item.product.price * item.quantity
  }));

  console.log('📋 Creating transaction items:', transactionItems.length, 'items');

  const { error: itemsError } = await supabase
    .from('transaction_items')
    .insert(transactionItems);

  if (itemsError) {
    console.error('❌ Transaction items error:', itemsError);
    throw new Error(`Gagal menyimpan item transaksi: ${itemsError.message}`);
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
    }
  }

  console.log('✅ Transaction items created successfully');
  return transaction;
};
