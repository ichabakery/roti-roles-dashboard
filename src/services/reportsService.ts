
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

  // Build enhanced query with proper joins
  let transactionQuery = supabase
    .from('transactions')
    .select(`
      id,
      branch_id,
      cashier_id,
      transaction_date,
      total_amount,
      payment_method,
      branches!fk_transactions_branch_id (id, name),
      transaction_items (
        id,
        product_id,
        quantity,
        price_per_item,
        subtotal,
        products!fk_transaction_items_product_id (name)
      )
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
  
  // Log sample data for debugging (only first record)
  if (transactionData && transactionData.length > 0) {
    console.log('📋 Sample transaction data:', {
      id: transactionData[0].id,
      branch: transactionData[0].branches?.name,
      items: transactionData[0].transaction_items?.length || 0
    });
  }

  return transactionData || [];
};
