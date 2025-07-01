
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
      payment_status,
      amount_paid,
      amount_remaining,
      notes,
      status
    `);
};

export const fetchTransactionDetails = async (transactionIds: string[]) => {
  if (!Array.isArray(transactionIds) || transactionIds.length === 0) {
    console.log('📋 No transaction IDs provided for details fetch');
    return {
      items: [],
      profiles: [],
      branches: []
    };
  }
  
  console.log('🔍 Fetching transaction items for IDs:', transactionIds.length, 'transactions');
  
  try {
    // Fetch transaction items with products data using !inner join to ensure products exist
    const { data: items, error: itemsError } = await supabase
      .from('transaction_items')
      .select(`
        id,
        transaction_id,
        product_id,
        quantity,
        price_per_item,
        subtotal,
        products!inner(
          id,
          name,
          description
        )
      `)
      .in('transaction_id', transactionIds);

    if (itemsError) {
      console.error('❌ Error fetching transaction items:', itemsError);
    } else {
      console.log('✅ Transaction items fetched:', items?.length || 0);
      console.log('📋 Sample item with product:', items?.[0]);
    }

    // Fetch profiles separately
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name');

    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError);
    }

    // Fetch branches separately
    const { data: branches, error: branchesError } = await supabase
      .from('branches')
      .select('id, name');

    if (branchesError) {
      console.error('❌ Error fetching branches:', branchesError);
    }

    return {
      items: Array.isArray(items) ? items : [],
      profiles: Array.isArray(profiles) ? profiles : [],
      branches: Array.isArray(branches) ? branches : []
    };
  } catch (error) {
    console.error('❌ Error in fetchTransactionDetails:', error);
    return {
      items: [],
      profiles: [],
      branches: []
    };
  }
};

export const applyRoleBasedFiltering = (
  query: any,
  userRole: string,
  userBranchId?: string,
  selectedBranch?: string,
  paymentStatusFilter?: string
) => {
  console.log('🔍 Role-based filtering input:', {
    userRole,
    userBranchId,
    selectedBranch,
    paymentStatusFilter,
    filteringDecision: 'determining...'
  });

  if (!query) {
    console.error('❌ Query object is null or undefined');
    return query;
  }

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

  // Apply payment status filter if provided
  if (paymentStatusFilter && paymentStatusFilter !== 'all') {
    query = query.eq('payment_status', paymentStatusFilter);
    console.log('💳 Payment status filter applied:', paymentStatusFilter);
  }

  return query;
};

export const applyDateRangeFilter = (
  query: any,
  dateRange?: { start: string; end: string }
) => {
  if (!query) {
    console.error('❌ Query object is null or undefined in date filter');
    return query;
  }

  if (dateRange && dateRange.start && dateRange.end) {
    // Format tanggal yang benar untuk PostgreSQL
    const startDate = new Date(dateRange.start + 'T00:00:00.000Z');
    const endDate = new Date(dateRange.end + 'T23:59:59.999Z');
    
    // Pastikan format ISO string yang valid
    const startDateTime = startDate.toISOString();
    const endDateTime = endDate.toISOString();
    
    query = query
      .gte('transaction_date', startDateTime)
      .lte('transaction_date', endDateTime);
    
    console.log('📅 Date range filter applied:', {
      start: startDateTime,
      end: endDateTime,
      originalRange: dateRange
    });
  } else {
    console.log('📅 No date range filter applied - missing or invalid date range');
  }

  return query.order('transaction_date', { ascending: false });
};
