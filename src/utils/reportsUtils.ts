
import type { Transaction, TransactionSummary, ProductSummary, PaymentMethodSummary } from '@/types/reports';

export const transformTransactionData = (rawData: any[]): Transaction[] => {
  console.log('🔄 Transforming transaction data:', rawData.length, 'records');
  
  return rawData.map(item => {
    // Enhanced payment validation and transformation
    const total_amount = typeof item.total_amount === 'number' ? item.total_amount : 0;
    const amount_paid = typeof item.amount_paid === 'number' ? item.amount_paid : null;
    const amount_remaining = typeof item.amount_remaining === 'number' ? item.amount_remaining : null;
    const payment_status = item.payment_status || 'paid';

    // Validate payment data consistency
    if (payment_status === 'partial' && amount_paid !== null) {
      const calculatedRemaining = total_amount - amount_paid;
      if (amount_remaining !== null && Math.abs(calculatedRemaining - amount_remaining) > 0.01) {
        console.warn(`⚠️ Payment data inconsistency for transaction ${item.id}:`, {
          total: total_amount,
          paid: amount_paid,
          remaining: amount_remaining,
          calculated: calculatedRemaining,
          status: payment_status
        });
      }
    }

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
      total_amount,
      amount_paid,
      amount_remaining,
      payment_status,
      payment_method: item.payment_method || 'cash',
      branches: item.branches || { id: item.branch_id, name: 'Unknown Branch' },
      transaction_items,
      cashier_name,
      received: item.received,
      change: item.change,
    };

    console.log('✅ Transformed transaction with payment validation:', {
      id: transformed.id,
      branch: transformed.branches.name,
      items: transformed.transaction_items.length,
      totalAmount: transformed.total_amount,
      paidAmount: transformed.amount_paid,
      remainingAmount: transformed.amount_remaining,
      paymentStatus: transformed.payment_status
    });
    
    return transformed;
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

    // Calculate actual revenue based on payment status
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
        actualRevenue = transaction.total_amount;
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
    paymentSummary.total_amount += actualRevenue;

    // Product summary - enhanced validation and revenue calculation
    if (transaction.payment_status !== 'pending' && transaction.payment_status !== 'cancelled') {
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
