
import { supabase } from '@/integrations/supabase/client';

export interface DailySalesReportItem {
  no: number;
  product_id: string;
  product_name: string;
  price: number;
  stok_awal: number;
  stock_masuk: number;
  retur: number;
  penjualan: number;
  stok_akhir: number;
  pendapatan: number;
  is_inactive?: boolean; // Flag untuk produk nonaktif
}

export interface DailySalesReportSummary {
  total_pendapatan: number;
  total_penjualan: number;
  total_retur: number;
  total_stock_masuk: number;
}

/**
 * Convert WIB date string to UTC range for database queries
 * WIB = UTC + 7 hours
 * Example: 2026-01-07 WIB -> 2026-01-06T17:00:00Z to 2026-01-07T16:59:59Z
 */
const getWIBDateRangeInUTC = (dateString: string) => {
  const [year, month, day] = dateString.split('-').map(Number);
  
  // Create WIB midnight as UTC (subtract 7 hours)
  // 2026-01-07 00:00:00 WIB = 2026-01-06 17:00:00 UTC
  const startUTC = new Date(Date.UTC(year, month - 1, day, 0, 0, 0) - (7 * 60 * 60 * 1000));
  // 2026-01-07 23:59:59 WIB = 2026-01-07 16:59:59 UTC
  const endUTC = new Date(Date.UTC(year, month - 1, day, 23, 59, 59) - (7 * 60 * 60 * 1000));
  
  return {
    startUTC: startUTC.toISOString(),
    endUTC: endUTC.toISOString()
  };
};

export const fetchDailySalesReport = async (
  selectedDate: string,
  branchId: string | null
): Promise<{ items: DailySalesReportItem[]; summary: DailySalesReportSummary }> => {
  try {
    // Get UTC range for WIB date
    const { startUTC, endUTC } = getWIBDateRangeInUTC(selectedDate);
    
    console.log('📊 [DailySalesReport] Fetching data:', {
      selectedDate,
      branchId,
      startUTC,
      endUTC
    });

    // Fetch all active products first
    const { data: activeProducts, error: productsError } = await supabase
      .from('products')
      .select('id, name, price, active')
      .eq('active', true)
      .order('name');

    if (productsError) throw productsError;

    // Fetch current inventory for the branch
    let inventoryQuery = supabase
      .from('inventory')
      .select('product_id, quantity, branch_id');
    
    if (branchId) {
      inventoryQuery = inventoryQuery.eq('branch_id', branchId);
    }

    const { data: inventory, error: inventoryError } = await inventoryQuery;
    if (inventoryError) throw inventoryError;

    // Fetch stock movements for the selected date (using UTC range)
    let stockMovementsQuery = supabase
      .from('stock_movements')
      .select('product_id, quantity_change, movement_type, branch_id')
      .gte('movement_date', startUTC)
      .lte('movement_date', endUTC);

    if (branchId) {
      stockMovementsQuery = stockMovementsQuery.eq('branch_id', branchId);
    }

    const { data: stockMovements, error: stockMovementsError } = await stockMovementsQuery;
    if (stockMovementsError) throw stockMovementsError;

    // Fetch transactions for the selected date
    // IMPORTANT: Use same filters as transaction reports for consistency
    // - status = 'completed'
    // - payment_status = 'paid'
    // - Apply branch filter directly in query
    let transactionsQuery = supabase
      .from('transactions')
      .select('id, branch_id, source_type, notes, total_amount, discount_amount')
      .gte('transaction_date', startUTC)
      .lte('transaction_date', endUTC)
      .eq('status', 'completed')
      .eq('payment_status', 'paid'); // CRITICAL: Only include paid transactions

    // Apply branch filter directly in query for better performance and security
    if (branchId) {
      transactionsQuery = transactionsQuery.eq('branch_id', branchId);
    }

    const { data: transactions, error: transactionsError } = await transactionsQuery;
    if (transactionsError) throw transactionsError;
    
    // Filter to only include cashier transactions (not from orders)
    const cashierTransactions = (transactions || []).filter(t => {
      // Check source_type first (new field)
      if (t.source_type === 'order') return false;
      if (t.source_type === 'cashier') return true;
      // Fallback: check notes for order-related keywords
      const notes = (t.notes || '').toLowerCase();
      if (notes.includes('pesanan') || notes.includes('pickup') || notes.includes('ord-')) {
        return false;
      }
      return true;
    });

    console.log('📊 [DailySalesReport] Transactions found:', {
      totalFetched: transactions?.length || 0,
      cashierOnly: cashierTransactions.length,
      branchId
    });

    const transactionIds = cashierTransactions.map(t => t.id);

    // Fetch transaction items for these transactions
    let transactionItems: any[] = [];
    if (transactionIds.length > 0) {
      const { data: items, error: itemsError } = await supabase
        .from('transaction_items')
        .select('transaction_id, product_id, quantity, price_per_item, subtotal')
        .in('transaction_id', transactionIds);

      if (itemsError) throw itemsError;
      transactionItems = items || [];
    }

    // CRITICAL FIX: Find products that were sold but are not in the active products list
    // This handles cases where inactive products were sold (historical data)
    const soldProductIds = [...new Set(transactionItems.map(ti => ti.product_id))];
    const activeProductIds = new Set((activeProducts || []).map(p => p.id));
    const missingProductIds = soldProductIds.filter(id => !activeProductIds.has(id));

    let allProducts = (activeProducts || []).map(p => ({ ...p, is_inactive: false }));

    if (missingProductIds.length > 0) {
      console.log('📊 [DailySalesReport] Found sold products not in active list:', missingProductIds);
      
      const { data: missingProducts, error: missingError } = await supabase
        .from('products')
        .select('id, name, price, active')
        .in('id', missingProductIds);

      if (!missingError && missingProducts) {
        const inactiveProducts = missingProducts.map(p => ({ ...p, is_inactive: !p.active }));
        allProducts = [...allProducts, ...inactiveProducts];
        console.log('📊 [DailySalesReport] Added inactive products to report:', 
          inactiveProducts.map(p => ({ name: p.name, active: p.active }))
        );
      }
    }

    // Build a map of transaction_id -> total_amount for accurate revenue calculation
    const transactionTotalMap = new Map<string, { total_amount: number; grossSum: number }>();
    cashierTransactions.forEach(t => {
      const transItems = transactionItems.filter(ti => ti.transaction_id === t.id);
      const grossSum = transItems.reduce((sum, ti) => sum + (Number(ti.subtotal) || 0), 0);
      transactionTotalMap.set(t.id, {
        total_amount: Number(t.total_amount) || 0,
        grossSum
      });
    });

    // Fetch return items for the selected date (using UTC range)
    let returnsQuery = supabase
      .from('returns')
      .select('id, branch_id')
      .gte('return_date', startUTC)
      .lte('return_date', endUTC);

    if (branchId) {
      returnsQuery = returnsQuery.eq('branch_id', branchId);
    }

    const { data: returns, error: returnsError } = await returnsQuery;
    if (returnsError) throw returnsError;

    const returnIds = returns?.map(r => r.id) || [];

    let returnItems: any[] = [];
    if (returnIds.length > 0) {
      const { data: items, error: itemsError } = await supabase
        .from('return_items')
        .select('product_id, quantity')
        .in('return_id', returnIds);

      if (itemsError) throw itemsError;
      returnItems = items || [];
    }

    // Process data for each product (now includes inactive products that were sold)
    const reportItems: DailySalesReportItem[] = allProducts.map((product, index) => {
      // Current stock (stok akhir)
      const productInventory = (inventory || [])
        .filter(i => i.product_id === product.id)
        .reduce((sum, i) => sum + (i.quantity || 0), 0);

      // Stock masuk (incoming stock movements)
      const stockMasuk = (stockMovements || [])
        .filter(sm => sm.product_id === product.id && sm.movement_type === 'in')
        .reduce((sum, sm) => sum + Math.abs(sm.quantity_change || 0), 0);

      // Penjualan (sales) - filter transaction items for this product
      const productTransactionItems = transactionItems
        .filter(ti => ti.product_id === product.id);

      const penjualan = productTransactionItems
        .reduce((sum, ti) => sum + (ti.quantity || 0), 0);

      // Calculate pendapatan with discount adjustment per transaction
      // This ensures the sum matches transactions.total_amount exactly
      let pendapatan = 0;
      productTransactionItems.forEach(ti => {
        const transData = transactionTotalMap.get(ti.transaction_id);
        if (transData && transData.grossSum > 0) {
          // Apply proportional discount: item_net = item_subtotal * (total_amount / grossSum)
          const ratio = transData.total_amount / transData.grossSum;
          pendapatan += (Number(ti.subtotal) || 0) * ratio;
        } else {
          // Fallback if no transaction data
          pendapatan += Number(ti.subtotal) || (ti.quantity * product.price);
        }
      });

      // Round to avoid floating point issues
      pendapatan = Math.round(pendapatan);

      // Retur
      const retur = returnItems
        .filter(ri => ri.product_id === product.id)
        .reduce((sum, ri) => sum + (ri.quantity || 0), 0);

      // Calculate stok awal: Stok Akhir - Stock Masuk + Penjualan - Retur
      const stokAwal = productInventory - stockMasuk + penjualan - retur;

      return {
        no: index + 1,
        product_id: product.id,
        product_name: product.name,
        price: product.price,
        stok_awal: Math.max(0, stokAwal),
        stock_masuk: stockMasuk,
        retur: retur,
        penjualan: penjualan,
        stok_akhir: productInventory,
        pendapatan: pendapatan,
        is_inactive: product.is_inactive || false
      };
    });

    // Filter out products with no activity and no stock
    const activeItems = reportItems.filter(
      item => item.stok_awal > 0 || item.stock_masuk > 0 || item.penjualan > 0 || item.retur > 0 || item.stok_akhir > 0
    );

    // Renumber items
    activeItems.forEach((item, index) => {
      item.no = index + 1;
    });

    // Calculate summary
    const summary: DailySalesReportSummary = {
      total_pendapatan: activeItems.reduce((sum, item) => sum + item.pendapatan, 0),
      total_penjualan: activeItems.reduce((sum, item) => sum + item.penjualan, 0),
      total_retur: activeItems.reduce((sum, item) => sum + item.retur, 0),
      total_stock_masuk: activeItems.reduce((sum, item) => sum + item.stock_masuk, 0)
    };

    // Debug: Verify total matches transaction sum
    const transactionTotal = cashierTransactions.reduce((sum, t) => sum + (Number(t.total_amount) || 0), 0);
    console.log('📊 [DailySalesReport] Summary verification:', {
      calculated_pendapatan: summary.total_pendapatan,
      transaction_total: transactionTotal,
      difference: Math.abs(summary.total_pendapatan - transactionTotal),
      total_penjualan: summary.total_penjualan,
      total_retur: summary.total_retur
    });

    return { items: activeItems, summary };
  } catch (error) {
    console.error('Error fetching daily sales report:', error);
    throw error;
  }
};
