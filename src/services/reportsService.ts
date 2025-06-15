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

  // Build query without complex joins to avoid relationship conflicts
  let transactionQuery = supabase
    .from('transactions')
    .select(`
      id,
      branch_id,
      cashier_id,
      transaction_date,
      total_amount,
      payment_method,
      profiles:cashier_id(id, name)
    `);

  // Apply role-based filtering with improved logic
  switch (userRole) {
    case 'kasir_cabang':
      // Kasir cabang hanya bisa melihat data cabang mereka sendiri
      transactionQuery = transactionQuery.eq('branch_id', userBranchId!);
      console.log('📊 Filtering for kasir branch only:', userBranchId);
      break;
      
    case 'owner':
    case 'admin_pusat':
      // Owner dan admin pusat bisa melihat semua cabang atau cabang tertentu
      if (selectedBranch && selectedBranch !== 'all') {
        transactionQuery = transactionQuery.eq('branch_id', selectedBranch);
        console.log('📊 Filtering for selected branch:', selectedBranch);
      } else {
        console.log('📊 Showing all branches for:', userRole);
      }
      break;
      
    case 'kepala_produksi':
      // Kepala produksi bisa melihat semua untuk planning purposes
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

  console.log('🚀 Executing transaction query...');
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

  // Now fetch branches and transaction items separately to avoid relationship conflicts
  const branchIds = [...new Set(transactionData.map(t => t.branch_id))];
  const transactionIds = transactionData.map(t => t.id);

  // Fetch branch data
  const { data: branchData, error: branchError } = await supabase
    .from('branches')
    .select('id, name')
    .in('id', branchIds);

  if (branchError) {
    console.error('❌ Branch query error:', branchError);
    throw new Error(`Gagal memuat data cabang: ${branchError.message}`);
  }

  // Fetch transaction items with products
  const { data: transactionItemsData, error: itemsError } = await supabase
    .from('transaction_items')
    .select(`
      id,
      transaction_id,
      product_id,
      quantity,
      price_per_item,
      subtotal,
      products!inner(name)
    `)
    .in('transaction_id', transactionIds);

  if (itemsError) {
    console.error('❌ Transaction items query error:', itemsError);
    // Don't throw error for transaction items, just log it
    console.warn('Transaction items could not be loaded, continuing without them');
  }

  // Create lookup maps
  const branchMap = new Map(branchData?.map(b => [b.id, b]) || []);
  const itemsMap = new Map<string, any[]>();
  
  if (transactionItemsData) {
    transactionItemsData.forEach(item => {
      if (!itemsMap.has(item.transaction_id)) {
        itemsMap.set(item.transaction_id, []);
      }
      itemsMap.get(item.transaction_id)!.push(item);
    });
  }

  // Combine the data
  const enrichedTransactions = transactionData.map(transaction => ({
    ...transaction,
    branches: branchMap.get(transaction.branch_id) || { id: transaction.branch_id, name: 'Unknown Branch' },
    transaction_items: itemsMap.get(transaction.id) || [],
    cashier_name: transaction.profiles?.name || 'Kasir'
  }));

  console.log('✅ Transaction data enriched successfully:', enrichedTransactions.length, 'records');
  
  // Log sample data for debugging (only first record)
  if (enrichedTransactions.length > 0) {
    console.log('📋 Sample transaction data:', {
      id: enrichedTransactions[0].id,
      branch: enrichedTransactions[0].branches?.name,
      items: enrichedTransactions[0].transaction_items?.length || 0
    });
  }

  return enrichedTransactions;
};
