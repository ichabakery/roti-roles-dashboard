
import type { Transaction, TransactionSummary, ProductSummary, PaymentMethodSummary } from '@/types/reports';

export const transformTransactionData = (rawData: any[]): Transaction[] => {
  console.log('🔄 Transforming transaction data:', rawData.length, 'records');
  
  return rawData.map(item => {
    // Enhanced payment validation and transformation
    const total_amount = typeof item.total_amount === 'number' ? item.total_amount : 0;
    const amount_paid = typeof item.amount_paid === 'number' ? item.amount_paid : null;
    const amount_remaining = typeof item.amount_remaining === 'number' ? item.amount_remaining : null;
    const payment_status = item.payment_status || 'paid';

    // Validate and fix payment data consistency
    let corrected_amount_paid = amount_paid;
    let corrected_amount_remaining = amount_remaining;
    let corrected_payment_status = payment_status;

    if (payment_status === 'paid') {
      corrected_amount_paid = total_amount;
      corrected_amount_remaining = 0;
    } else if (payment_status === 'pending') {
      corrected_amount_paid = 0;
      corrected_amount_remaining = total_amount;
    } else if (payment_status === 'partial' && amount_paid !== null) {
      corrected_amount_remaining = total_amount - amount_paid;
      // Validate partial payment consistency
      if (corrected_amount_remaining <= 0) {
        corrected_payment_status = 'paid';
        corrected_amount_paid = total_amount;
        corrected_amount_remaining = 0;
      }
    }

    console.log(`💳 Payment validation for ${item.id}:`, {
      original: { total_amount, amount_paid, amount_remaining, payment_status },
      corrected: { 
        amount_paid: corrected_amount_paid, 
        amount_remaining: corrected_amount_remaining, 
        payment_status: corrected_payment_status 
      }
    });

    const cashier_name = item.cashier_name ?? 
      (item.profiles?.name ?? "Kasir");

    // Ensure transaction_items is always an array with valid data
    const transaction_items = (item.transaction_items || [])
      .filter((ti: any) => ti && ti.products)
      .map((ti: any) => ({
        id: ti.id,
        product_id: ti.product_id,
        quantity: typeof ti.quantity === 'number' ? ti.quantity : 0,
        price_per_item: typeof ti.price_per_item === 'number' ? ti.price_per_item : 0,
        subtotal: typeof ti.subtotal === 'number' ? ti.subtotal : 0,
        products: {
          id: ti.products.id,
          name: ti.products.name || "Produk Tidak Dikenal",
          description: ti.products.description
        }
      }));

    return {
      id: item.id,
      branch_id: item.branch_id,
      cashier_id: item.cashier_id,
      transaction_date: item.transaction_date,
      total_amount,
      amount_paid: corrected_amount_paid,
      amount_remaining: corrected_amount_remaining,
      payment_status: corrected_payment_status,
      payment_method: item.payment_method || 'cash',
      branches: item.branches || { id: item.branch_id, name: 'Unknown Branch' },
      transaction_items,
      cashier_name,
      received: item.received,
      change: item.change,
    };
  });
};

export const generateSummaries = (data: Transaction[]) => {
  console.log('📊 Generating payment-aware summaries from', data.length, 'transactions');
  
  const branchSummaryMap = new Map<string, TransactionSummary>();
  const productSummaryMap = new Map<string, ProductSummary>();
  const paymentSummaryMap = new Map<string, PaymentMethodSummary>();

  data.forEach(transaction => {
    const branchId = transaction.branch_id;
    const branchName = transaction.branches?.name || 'Unknown Branch';

    // Calculate actual revenue based on payment status - FIXED LOGIC
    let actualRevenue = 0;
    switch (transaction.payment_status) {
      case 'paid':
        actualRevenue = transaction.total_amount;
        break;
      case 'partial':
        actualRevenue = transaction.amount_paid || 0;
        break;
      case 'pending':
        actualRevenue = 0; // No revenue recognized until payment is made
        break;
      case 'cancelled':
        actualRevenue = 0;
        break;
      default:
        // For unknown status, use amount_paid if available, otherwise total_amount
        actualRevenue = transaction.amount_paid || transaction.total_amount;
    }

    console.log(`💰 Revenue calculation for ${transaction.id}:`, {
      status: transaction.payment_status,
      total: transaction.total_amount,
      paid: transaction.amount_paid,
      actualRevenue
    });

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
    branchSummary.total_revenue += actualRevenue;

    // Payment method summary - only count actual received payments
    if (actualRevenue > 0) {
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
      paymentSummary.total_amount += actualRevenue;
    }

    // Product summary - only for transactions with recognized revenue
    if (actualRevenue > 0 && transaction.payment_status !== 'cancelled') {
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
        
        // Calculate proportional revenue for partial payments
        let itemRevenue = item.subtotal;
        if (transaction.payment_status === 'partial' && transaction.amount_paid && transaction.total_amount > 0) {
          const paymentRatio = transaction.amount_paid / transaction.total_amount;
          itemRevenue = item.subtotal * paymentRatio;
        }
        
        productSummary.total_revenue += itemRevenue;
      });
    }
  });

  // Calculate average transaction amounts
  const branchSummaryArray = Array.from(branchSummaryMap.values()).map(summary => ({
    ...summary,
    avg_transaction: summary.total_transactions > 0 ? summary.total_revenue / summary.total_transactions : 0
  }));

  const summaryStats = {
    branches: branchSummaryArray.length,
    products: productSummaryMap.size,
    payments: paymentSummaryMap.size,
    totalActualRevenue: branchSummaryArray.reduce((sum, branch) => sum + branch.total_revenue, 0)
  };

  console.log('✅ Generated payment-aware summaries:', summaryStats);

  return {
    branchSummary: branchSummaryArray,
    productSummary: Array.from(productSummaryMap.values()).sort((a, b) => b.total_revenue - a.total_revenue),
    paymentSummary: Array.from(paymentSummaryMap.values()).sort((a, b) => b.total_amount - a.total_amount)
  };
};
