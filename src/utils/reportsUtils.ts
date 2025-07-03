
import type { Transaction, TransactionSummary, ProductSummary, PaymentMethodSummary } from '@/types/reports';

export const transformTransactionData = (rawData: any[]): Transaction[] => {
  console.log('🔄 Transforming transaction data:', rawData.length, 'records');
  
  return rawData.map((item: any) => {
    // Convert UTC timestamp to Indonesia timezone for display
    const utcDate = new Date(item.transaction_date);
    const localDate = new Date(utcDate.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
    
    const transformed = {
      id: item.id,
      transaction_date: item.transaction_date, // Keep original UTC for sorting/filtering
      local_transaction_date: localDate.toISOString(), // Add local date for display
      display_date: utcDate.toLocaleDateString('id-ID', { 
        timeZone: 'Asia/Jakarta',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }),
      display_time: utcDate.toLocaleTimeString('id-ID', {
        timeZone: 'Asia/Jakarta',
        hour: '2-digit',
        minute: '2-digit'
      }),
      branch_id: item.branch_id,
      branch_name: item.branches?.name || 'Unknown Branch',
      cashier_id: item.cashier_id,
      cashier_name: item.cashier_name || 'Unknown Cashier',
      total_amount: parseFloat(item.total_amount || 0),
      payment_status: item.payment_status,
      payment_method: item.payment_method,
      amount_paid: item.amount_paid ? parseFloat(item.amount_paid) : null,
      amount_remaining: item.amount_remaining ? parseFloat(item.amount_remaining) : null,
      due_date: item.due_date,
      notes: item.notes,
      status: item.status,
      transaction_items: (item.transaction_items || []).map((transItem: any) => ({
        id: transItem.id,
        product_id: transItem.product_id,
        product_name: transItem.products?.name || 'Unknown Product',
        quantity: transItem.quantity,
        price_per_item: parseFloat(transItem.price_per_item || 0),
        subtotal: parseFloat(transItem.subtotal || 0)
      }))
    };
    
    return transformed;
  });
};

export const generateSummaries = (transactions: Transaction[]) => {
  console.log('📈 Generating summaries from', transactions.length, 'transactions');
  
  // Branch Summary
  const branchMap = new Map<string, {
    branch_id: string;
    branch_name: string;
    total_transactions: number;
    total_revenue: number;
    paid_amount: number;
    pending_amount: number;
  }>();

  // Product Summary
  const productMap = new Map<string, {
    product_id: string;
    product_name: string;
    total_quantity: number;
    total_revenue: number;
    transaction_count: number;
  }>();

  // Payment Method Summary
  const paymentMap = new Map<string, {
    payment_method: string;
    count: number;
    total_amount: number;
  }>();

  transactions.forEach(transaction => {
    const branchKey = transaction.branch_id;
    const existingBranch = branchMap.get(branchKey);
    
    // Branch summary
    branchMap.set(branchKey, {
      branch_id: transaction.branch_id,
      branch_name: transaction.branch_name,
      total_transactions: (existingBranch?.total_transactions || 0) + 1,
      total_revenue: (existingBranch?.total_revenue || 0) + transaction.total_amount,
      paid_amount: (existingBranch?.paid_amount || 0) + (transaction.amount_paid || transaction.total_amount),
      pending_amount: (existingBranch?.pending_amount || 0) + (transaction.amount_remaining || 0)
    });

    // Payment method summary
    const paymentKey = transaction.payment_method;
    const existingPayment = paymentMap.get(paymentKey);
    
    paymentMap.set(paymentKey, {
      payment_method: transaction.payment_method,
      count: (existingPayment?.count || 0) + 1,
      total_amount: (existingPayment?.total_amount || 0) + transaction.total_amount
    });

    // Product summary from transaction items
    transaction.transaction_items?.forEach(item => {
      const productKey = item.product_id;
      const existingProduct = productMap.get(productKey);
      
      productMap.set(productKey, {
        product_id: item.product_id,
        product_name: item.product_name,
        total_quantity: (existingProduct?.total_quantity || 0) + item.quantity,
        total_revenue: (existingProduct?.total_revenue || 0) + item.subtotal,
        transaction_count: (existingProduct?.transaction_count || 0) + 1
      });
    });
  });

  const branchSummary: TransactionSummary[] = Array.from(branchMap.values());
  const productSummary: ProductSummary[] = Array.from(productMap.values())
    .sort((a, b) => b.total_revenue - a.total_revenue);
  const paymentSummary: PaymentMethodSummary[] = Array.from(paymentMap.values())
    .sort((a, b) => b.total_amount - a.total_amount);

  console.log('📊 Summary generated:', {
    branches: branchSummary.length,
    products: productSummary.length,
    paymentMethods: paymentSummary.length
  });

  return {
    branchSummary,
    productSummary,
    paymentSummary
  };
};
