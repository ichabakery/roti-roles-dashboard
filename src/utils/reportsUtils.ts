
import type { Transaction, TransactionSummary, ProductSummary, PaymentMethodSummary } from '@/types/reports';

export const transformTransactionData = (rawData: any[]): Transaction[] => {
  return rawData.map(item => {
    // Defensive: ensure cashier_name always exists (from backend or fallback)
    const cashier_name = item.cashier_name ??
      (item.profiles?.name ?? "Kasir");

    // Defensive: ensure transaction_items is always non-null, .products always exists
    const transaction_items = (item.transaction_items || []).map((ti: any) => ({
      id: ti.id,
      product_id: ti.product_id,
      quantity: ti.quantity,
      price_per_item: ti.price_per_item,
      subtotal: ti.subtotal,
      // guarantee .products is never undefined - fallback to { name: "Unknown Product" }
      products: ti.products ? ti.products : { name: "Unknown Product" }
    }));

    const transformed = {
      id: item.id,
      branch_id: item.branch_id,
      cashier_id: item.cashier_id,
      transaction_date: item.transaction_date,
      total_amount: item.total_amount,
      payment_method: item.payment_method,
      branches: item.branches || { id: '', name: 'Unknown Branch' },
      transaction_items,
      cashier_name, // required for components
      // Pass through possible extras
      received: item.received,
      change: item.change,
    };

    console.log('Transformed transaction:', transformed.id, 'branch:', transformed.branches.name);
    return transformed;
  });
};

export const generateSummaries = (data: Transaction[]) => {
  console.log('Generating summaries from', data.length, 'transactions');
  
  const branchSummaryMap = new Map<string, TransactionSummary>();
  const productSummaryMap = new Map<string, ProductSummary>();
  const paymentSummaryMap = new Map<string, PaymentMethodSummary>();

  data.forEach(transaction => {
    const branchId = transaction.branch_id;
    const branchName = transaction.branches?.name || 'Unknown Branch';

    // Branch summary
    if (!branchSummaryMap.has(branchId)) {
      branchSummaryMap.set(branchId, {
        branch_id: branchId,
        branch_name: branchName,
        total_transactions: 0,
        total_revenue: 0,
        avg_transaction: 0
      });
    }

    const branchSummary = branchSummaryMap.get(branchId)!;
    branchSummary.total_transactions += 1;
    branchSummary.total_revenue += transaction.total_amount;

    // Payment method summary
    const paymentMethod = transaction.payment_method;
    if (!paymentSummaryMap.has(paymentMethod)) {
      paymentSummaryMap.set(paymentMethod, {
        payment_method: paymentMethod,
        count: 0,
        total_amount: 0
      });
    }

    const paymentSummary = paymentSummaryMap.get(paymentMethod)!;
    paymentSummary.count += 1;
    paymentSummary.total_amount += transaction.total_amount;

    // Product summary
    transaction.transaction_items?.forEach(item => {
      const productId = item.product_id;
      const productName = item.products?.name || 'Unknown Product';

      if (!productSummaryMap.has(productId)) {
        productSummaryMap.set(productId, {
          product_id: productId,
          product_name: productName,
          total_quantity: 0,
          total_revenue: 0
        });
      }

      const productSummary = productSummaryMap.get(productId)!;
      productSummary.total_quantity += item.quantity;
      productSummary.total_revenue += item.subtotal;
    });
  });

  // Calculate average transaction amounts
  const branchSummaryArray = Array.from(branchSummaryMap.values()).map(summary => ({
    ...summary,
    avg_transaction: summary.total_transactions > 0 ? summary.total_revenue / summary.total_transactions : 0
  }));

  console.log('Generated summaries:', {
    branches: branchSummaryArray.length,
    products: productSummaryMap.size,
    payments: paymentSummaryMap.size
  });

  return {
    branchSummary: branchSummaryArray,
    productSummary: Array.from(productSummaryMap.values()).sort((a, b) => b.total_revenue - a.total_revenue),
    paymentSummary: Array.from(paymentSummaryMap.values()).sort((a, b) => b.total_amount - a.total_amount)
  };
};
