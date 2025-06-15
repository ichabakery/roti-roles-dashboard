
import type { Transaction, TransactionSummary, ProductSummary, PaymentMethodSummary } from '@/types/reports';

export const transformTransactionData = (rawData: any[]): Transaction[] => {
  console.log('🔄 Transforming transaction data:', rawData.length, 'records');
  
  return rawData.map(item => {
    // Enhanced validation and transformation
    const cashier_name = item.cashier_name ?? 
      (item.profiles?.name ?? "Kasir");

    // Ensure transaction_items is always an array with valid data
    const transaction_items = (item.transaction_items || [])
      .filter((ti: any) => ti && ti.products) // Only include items with valid products
      .map((ti: any) => {
        // Validate required fields
        const quantity = typeof ti.quantity === 'number' ? ti.quantity : 0;
        const price_per_item = typeof ti.price_per_item === 'number' ? ti.price_per_item : 0;
        const subtotal = typeof ti.subtotal === 'number' ? ti.subtotal : 0;
        
        return {
          id: ti.id,
          product_id: ti.product_id,
          quantity,
          price_per_item,
          subtotal,
          products: {
            id: ti.products.id,
            name: ti.products.name || "Produk Tidak Dikenal",
            description: ti.products.description
          }
        };
      });

    // Log validation results
    if (transaction_items.length === 0) {
      console.warn('⚠️ Transaction without valid items:', item.id);
    }

    const transformed = {
      id: item.id,
      branch_id: item.branch_id,
      cashier_id: item.cashier_id,
      transaction_date: item.transaction_date,
      total_amount: typeof item.total_amount === 'number' ? item.total_amount : 0,
      payment_method: item.payment_method || 'cash',
      branches: item.branches || { id: item.branch_id, name: 'Unknown Branch' },
      transaction_items,
      cashier_name,
      received: item.received,
      change: item.change,
    };

    console.log('✅ Transformed transaction:', {
      id: transformed.id,
      branch: transformed.branches.name,
      items: transformed.transaction_items.length,
      totalAmount: transformed.total_amount
    });
    
    return transformed;
  });
};

export const generateSummaries = (data: Transaction[]) => {
  console.log('📊 Generating summaries from', data.length, 'transactions');
  
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

    // Product summary - enhanced validation
    transaction.transaction_items?.forEach(item => {
      if (!item.products || !item.product_id) {
        console.warn('⚠️ Invalid item in product summary:', item);
        return;
      }

      const productId = item.product_id;
      const productName = item.products.name || 'Unknown Product';

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

  const summaryStats = {
    branches: branchSummaryArray.length,
    products: productSummaryMap.size,
    payments: paymentSummaryMap.size
  };

  console.log('✅ Generated summaries:', summaryStats);

  return {
    branchSummary: branchSummaryArray,
    productSummary: Array.from(productSummaryMap.values()).sort((a, b) => b.total_revenue - a.total_revenue),
    paymentSummary: Array.from(paymentSummaryMap.values()).sort((a, b) => b.total_amount - a.total_amount)
  };
};
