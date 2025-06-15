
import { supabase } from '@/integrations/supabase/client';
import type { Transaction } from '@/types/reports';

export const fetchBranchesFromDB = async () => {
  console.log('Fetching branches from database...');
  
  const { data, error } = await supabase
    .from('branches')
    .select('id, name')
    .order('name');

  if (error) {
    console.error('Branches fetch error:', error);
    throw error;
  }
  
  console.log('Branches fetched successfully:', data?.length, 'branches');
  return data || [];
};

export const fetchTransactionsFromDB = async (
  userRole: string,
  userBranchId?: string,
  selectedBranch?: string,
  dateRange?: { start: string; end: string }
) => {
  console.log('🔍 Fetching reports data for user:', {
    role: userRole,
    userBranchId,
    selectedBranch,
    dateRange
  });

  // Enhanced validation for kasir_cabang
  if (userRole === 'kasir_cabang') {
    if (!userBranchId) {
      console.error('❌ Kasir cabang missing branch assignment');
      throw new Error('Kasir cabang belum dikaitkan dengan cabang manapun. Silakan hubungi administrator untuk mengatur assignment cabang.');
    }
    console.log('✅ Kasir cabang has valid branch assignment:', userBranchId);
  }

  // Build optimized query with proper foreign key hints
  let transactionQuery = supabase
    .from('transactions')
    .select(`
      id,
      branch_id,
      cashier_id,
      transaction_date,
      total_amount,
      payment_method,
      received,
      change,
      profiles:cashier_id(id, name),
      branches:branch_id(id, name),
      transaction_items(
        id,
        product_id,
        quantity,
        price_per_item,
        subtotal,
        products:product_id(
          id,
          name,
          description
        )
      )
    `);

  // Apply role-based filtering with improved logic
  switch (userRole) {
    case 'kasir_cabang':
      transactionQuery = transactionQuery.eq('branch_id', userBranchId!);
      console.log('📊 Filtering for kasir branch only:', userBranchId);
      break;
      
    case 'owner':
    case 'admin_pusat':
      if (selectedBranch && selectedBranch !== 'all') {
        transactionQuery = transactionQuery.eq('branch_id', selectedBranch);
        console.log('📊 Filtering for selected branch:', selectedBranch);
      } else {
        console.log('📊 Showing all branches for:', userRole);
      }
      break;
      
    case 'kepala_produksi':
      if (selectedBranch && selectedBranch !== 'all') {
        transactionQuery = transactionQuery.eq('branch_id', selectedBranch);
        console.log('📊 Filtering for selected branch (kepala_produksi):', selectedBranch);
      } else {
        console.log('📊 Showing all branches for kepala_produksi');
      }
      break;
      
    default:
      console.error('❌ Unauthorized role for reports:', userRole);
      throw new Error(`Role '${userRole}' tidak memiliki akses untuk melihat laporan.`);
  }

  // Apply date range filter if provided
  if (dateRange) {
    transactionQuery = transactionQuery
      .gte('transaction_date', dateRange.start + 'T00:00:00')
      .lte('transaction_date', dateRange.end + 'T23:59:59');
    
    console.log('📅 Date range filter applied:', dateRange);
  }

  // Order by transaction date (newest first)
  transactionQuery = transactionQuery.order('transaction_date', { ascending: false });

  console.log('🚀 Executing optimized transaction query...');
  const { data: transactionData, error } = await transactionQuery;

  if (error) {
    console.error('❌ Transaction query error:', error);
    
    // Enhanced error handling with specific messages
    if (error.code === 'PGRST116') {
      throw new Error('Tabel transaksi tidak ditemukan. Silakan hubungi administrator.');
    } else if (error.code === 'PGRST201') {
      throw new Error('Tidak ada data transaksi ditemukan untuk periode dan filter yang dipilih.');
    } else if (error.message?.includes('violates row-level security')) {
      throw new Error(`Akses ditolak: Anda tidak memiliki izin untuk melihat data transaksi. Role: ${userRole}`);
    } else if (error.message?.includes('foreign key')) {
      throw new Error('Terjadi masalah dengan referensi data. Silakan hubungi administrator.');
    } else {
      throw new Error(`Gagal memuat data transaksi: ${error.message}`);
    }
  }

  console.log('✅ Transaction data received:', transactionData?.length || 0, 'records');

  if (!transactionData || transactionData.length === 0) {
    console.log('📋 No transaction data found');
    return [];
  }

  // Validate and log data quality with proper type checking
  const validTransactions = transactionData.filter(transaction => {
    const hasValidItems = transaction.transaction_items && 
                         Array.isArray(transaction.transaction_items) && 
                         transaction.transaction_items.length > 0;
    
    if (!hasValidItems) {
      console.warn('⚠️ Transaction without valid items:', transaction.id);
      return false;
    }

    // Validate each transaction item with proper type checking
    const validItems = transaction.transaction_items.every(item => {
      // Check if products exists and is not an error object
      const hasValidProduct = item.products && 
                             typeof item.products === 'object' && 
                             !('error' in item.products) &&
                             'name' in item.products;
      
      const hasValidNumbers = typeof item.quantity === 'number' && 
                             typeof item.price_per_item === 'number' && 
                             typeof item.subtotal === 'number';
      
      if (!hasValidProduct || !hasValidNumbers) {
        console.warn('⚠️ Invalid transaction item:', item);
      }
      
      return hasValidProduct && hasValidNumbers;
    });

    return validItems;
  });

  console.log(`✅ ${validTransactions.length} valid transactions out of ${transactionData.length} total`);

  // Transform and enrich the data with proper type safety
  const enrichedTransactions = validTransactions.map(transaction => {
    const cashier_name = (transaction.profiles && typeof transaction.profiles === 'object' && 'name' in transaction.profiles) 
      ? transaction.profiles.name 
      : 'Kasir';
    
    const branch_name = (transaction.branches && typeof transaction.branches === 'object' && 'name' in transaction.branches)
      ? transaction.branches.name
      : 'Unknown Branch';
    
    return {
      ...transaction,
      cashier_name,
      branches: {
        id: transaction.branch_id,
        name: branch_name
      },
      // Ensure transaction_items is always an array with valid data
      transaction_items: transaction.transaction_items.map(item => {
        // Type guard to ensure products is valid
        const products = (item.products && typeof item.products === 'object' && 'name' in item.products)
          ? item.products as { id: string; name: string; description?: string }
          : { id: '', name: 'Produk Tidak Dikenal', description: '' };

        return {
          id: item.id,
          product_id: item.product_id,
          quantity: item.quantity,
          price_per_item: item.price_per_item,
          subtotal: item.subtotal,
          products
        };
      })
    };
  });

  console.log('✅ Transaction data enriched successfully:', enrichedTransactions.length, 'records');
  
  // Log sample data for debugging (only first record)
  if (enrichedTransactions.length > 0) {
    const sample = enrichedTransactions[0];
    console.log('📋 Sample transaction data:', {
      id: sample.id,
      branch: sample.branches?.name,
      items: sample.transaction_items?.length || 0,
      firstItem: sample.transaction_items?.[0] ? {
        product: sample.transaction_items[0].products?.name,
        quantity: sample.transaction_items[0].quantity,
        price: sample.transaction_items[0].price_per_item,
        subtotal: sample.transaction_items[0].subtotal
      } : null
    });
  }

  return enrichedTransactions;
};
