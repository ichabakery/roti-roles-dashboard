
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
  console.log('🔍 Role-based filtering input:', {
    userRole,
    userBranchId,
    selectedBranch,
    filteringDecision: 'determining...'
  });

  switch (userRole) {
    case 'kasir_cabang':
      // Kasir cabang harus memiliki branch assignment untuk akses data
      if (!userBranchId) {
        console.error('❌ Kasir cabang tidak memiliki branch assignment');
        // Return empty query instead of throwing error to allow graceful handling
        query = query.eq('id', 'never-match-any-id');
        console.log('📊 Kasir filtering applied - no access due to missing branch assignment');
        return query;
      }
      query = query.eq('branch_id', userBranchId);
      console.log('📊 Kasir filtering applied - branch_id:', userBranchId);
      break;
      
    case 'owner':
    case 'admin_pusat':
    case 'kepala_produksi':
      // Role ini bisa akses semua cabang atau filter berdasarkan pilihan
      if (selectedBranch && selectedBranch !== 'all') {
        query = query.eq('branch_id', selectedBranch);
        console.log('📊 Admin/Owner/KepProd filtering by selected branch:', selectedBranch);
      } else {
        console.log('📊 Admin/Owner/KepProd showing all branches');
      }
      break;
      
    default:
      console.error('❌ Unauthorized role for reports:', userRole);
      // Return empty query instead of throwing error
      query = query.eq('id', 'never-match-any-id');
      break;
  }

  return query;
};

export const applyDateRangeFilter = (
  query: any,
  dateRange?: { start: string; end: string }
) => {
  if (dateRange) {
    const startDateTime = dateRange.start + 'T00:00:00';
    const endDateTime = dateRange.end + 'T23:59:59';
    
    query = query
      .gte('transaction_date', startDateTime)
      .lte('transaction_date', endDateTime);
    
    console.log('📅 Date range filter applied:', {
      start: startDateTime,
      end: endDateTime,
      originalRange: dateRange
    });
  } else {
    console.log('📅 No date range filter applied');
  }

  return query.order('transaction_date', { ascending: false });
};
