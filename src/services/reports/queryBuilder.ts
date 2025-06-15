
import { supabase } from '@/integrations/supabase/client';

export const buildTransactionQuery = () => {
  return supabase
    .from('transactions')
    .select(`
      id,
      branch_id,
      cashier_id,
      transaction_date,
      total_amount,
      payment_method,
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
};

export const applyRoleBasedFiltering = (
  query: any,
  userRole: string,
  userBranchId?: string,
  selectedBranch?: string
) => {
  switch (userRole) {
    case 'kasir_cabang':
      if (!userBranchId) {
        throw new Error('Kasir cabang belum dikaitkan dengan cabang manapun. Silakan hubungi administrator untuk mengatur assignment cabang.');
      }
      query = query.eq('branch_id', userBranchId);
      console.log('📊 Filtering for kasir branch only:', userBranchId);
      break;
      
    case 'owner':
    case 'admin_pusat':
      if (selectedBranch && selectedBranch !== 'all') {
        query = query.eq('branch_id', selectedBranch);
        console.log('📊 Filtering for selected branch:', selectedBranch);
      } else {
        console.log('📊 Showing all branches for:', userRole);
      }
      break;
      
    case 'kepala_produksi':
      if (selectedBranch && selectedBranch !== 'all') {
        query = query.eq('branch_id', selectedBranch);
        console.log('📊 Filtering for selected branch (kepala_produksi):', selectedBranch);
      } else {
        console.log('📊 Showing all branches for kepala_produksi');
      }
      break;
      
    default:
      console.error('❌ Unauthorized role for reports:', userRole);
      throw new Error(`Role '${userRole}' tidak memiliki akses untuk melihat laporan.`);
  }

  return query;
};

export const applyDateRangeFilter = (
  query: any,
  dateRange?: { start: string; end: string }
) => {
  if (dateRange) {
    query = query
      .gte('transaction_date', dateRange.start + 'T00:00:00')
      .lte('transaction_date', dateRange.end + 'T23:59:59');
    
    console.log('📅 Date range filter applied:', dateRange);
  }

  return query.order('transaction_date', { ascending: false });
};
