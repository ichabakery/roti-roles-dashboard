
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
    // Fetch transaction items with product details
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
      // Log sample item for debugging
      if (items && items.length > 0) {
        console.log('📋 Sample transaction item:', items[0]);
      }
    }

    // Fetch profiles (cashiers)
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name');

    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError);
    } else {
      console.log('✅ Profiles fetched:', profiles?.length || 0);
    }

    // Fetch branches
    const { data: branches, error: branchesError } = await supabase
      .from('branches')
      .select('id, name');

    if (branchesError) {
      console.error('❌ Error fetching branches:', branchesError);
    } else {
      console.log('✅ Branches fetched:', branches?.length || 0);
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
  console.log('🔍 Role-based filtering:', {
    userRole,
    userBranchId,
    selectedBranch,
    paymentStatusFilter
  });

  if (!query) {
    console.error('❌ Query object is null or undefined');
    return query;
  }

  switch (userRole) {
    case 'kasir_cabang':
      if (!userBranchId) {
        console.error('❌ Kasir cabang tidak memiliki branch assignment');
        // Return query yang tidak akan match data apapun
        return query.eq('id', '00000000-0000-0000-0000-000000000000');
      }
      query = query.eq('branch_id', userBranchId);
      console.log('📊 Kasir filtering applied - branch_id:', userBranchId);
      break;
      
    case 'owner':
    case 'admin_pusat':
    case 'kepala_produksi':
      if (selectedBranch && selectedBranch !== 'all') {
        query = query.eq('branch_id', selectedBranch);
        console.log('📊 Admin/Owner/KepProd filtering by selected branch:', selectedBranch);
      } else {
        console.log('📊 Admin/Owner/KepProd showing all branches');
      }
      break;
      
    default:
      console.error('❌ Unauthorized role for reports:', userRole);
      return query.eq('id', '00000000-0000-0000-0000-000000000000');
  }

  // Apply payment status filter
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
    // Validasi format tanggal terlebih dahulu
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      console.error('❌ Invalid date format:', dateRange);
      return query.order('transaction_date', { ascending: false });
    }
    
    // Set time untuk awal dan akhir hari dalam timezone lokal
    const startDateTime = `${dateRange.start}T00:00:00`;
    const endDateTime = `${dateRange.end}T23:59:59`;
    
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
