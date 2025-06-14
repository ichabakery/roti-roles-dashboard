
import { supabase } from '@/integrations/supabase/client';
import type { Transaction } from '@/types/reports';

export const fetchBranchesFromDB = async () => {
  const { data, error } = await supabase
    .from('branches')
    .select('id, name')
    .order('name');

  if (error) throw error;
  return data || [];
};

export const fetchTransactionsFromDB = async (
  userRole: string,
  userBranchId?: string,
  selectedBranch?: string,
  dateRange?: { start: string; end: string }
) => {
  console.log('Fetching reports data for user:', userRole, 'userBranchId:', userBranchId, 'selectedBranch:', selectedBranch);

  // Validate kasir_cabang has branch assignment
  if (userRole === 'kasir_cabang' && !userBranchId) {
    throw new Error('Kasir cabang belum dikaitkan dengan cabang manapun. Silakan hubungi administrator.');
  }

  // Build query based on user role and selected branch
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

  // Apply role-based filtering
  if (userRole === 'kasir_cabang') {
    // Kasir cabang hanya bisa melihat data cabang mereka sendiri
    transactionQuery = transactionQuery.eq('branch_id', userBranchId!);
    console.log('Filtering for kasir branch only:', userBranchId);
  } else if (userRole === 'owner' || userRole === 'admin_pusat') {
    // Owner dan admin pusat bisa melihat semua cabang atau cabang tertentu
    if (selectedBranch && selectedBranch !== 'all') {
      transactionQuery = transactionQuery.eq('branch_id', selectedBranch);
      console.log('Filtering for selected branch:', selectedBranch);
    } else {
      console.log('Showing all branches for:', userRole);
    }
  } else {
    // Role lain tidak diizinkan akses
    throw new Error('Anda tidak memiliki akses untuk melihat laporan.');
  }

  // Apply date range filter
  if (dateRange) {
    transactionQuery = transactionQuery
      .gte('transaction_date', dateRange.start + 'T00:00:00')
      .lte('transaction_date', dateRange.end + 'T23:59:59');
  }

  transactionQuery = transactionQuery.order('transaction_date', { ascending: false });

  console.log('Executing transaction query...');
  const { data: transactionData, error } = await transactionQuery;

  if (error) {
    console.error('Transaction query error:', error);
    throw error;
  }

  console.log('Transaction data received:', transactionData?.length, 'records');
  return transactionData || [];
};
