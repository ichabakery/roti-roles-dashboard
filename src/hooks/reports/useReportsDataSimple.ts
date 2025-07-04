
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { fetchTransactionsFromDB } from '@/services/reports/transactionService';
import { transformTransactionData } from '@/utils/reportsUtils';
import type { Transaction, DateRange } from '@/types/reports';

export const useReportsData = (
  selectedBranch: string,
  dateRange: DateRange,
  paymentStatusFilter: string
) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [userActualBranchId, setUserActualBranchId] = useState<string | null>(null);
  const [branchAssignmentChecked, setBranchAssignmentChecked] = useState(false);
  
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch user's actual branch untuk kasir_cabang dengan logic yang sama seperti kasir
  useEffect(() => {
    const fetchUserBranch = async () => {
      if (user?.role === 'kasir_cabang' && user.id) {
        try {
          console.log('🔍 [REPORTS] Fetching branch assignment for kasir:', user.id, user.email);
          
          const { data: userBranch, error } = await supabase
            .from('user_branches')
            .select('branch_id')
            .eq('user_id', user.id)
            .maybeSingle();
          
          if (error) {
            console.error('❌ [REPORTS] Error fetching user branch:', error);
            setUserActualBranchId(null);
          } else if (userBranch?.branch_id) {
            console.log('✅ [REPORTS] Found branch assignment:', userBranch.branch_id);
            setUserActualBranchId(userBranch.branch_id);
          } else {
            console.warn('⚠️ [REPORTS] Kasir user without branch assignment');
            setUserActualBranchId(null);
          }
        } catch (error) {
          console.error('❌ [REPORTS] Failed to fetch user branch:', error);
          setUserActualBranchId(null);
        } finally {
          setBranchAssignmentChecked(true);
        }
      } else {
        setBranchAssignmentChecked(true);
      }
    };

    fetchUserBranch();
  }, [user]);

  // FIXED: Fetch transactions dengan timezone validation yang benar
  useEffect(() => {
    // Skip if not ready
    if (!user || !branchAssignmentChecked) {
      console.log('⏳ [REPORTS] Waiting for user or branch assignment check...');
      return;
    }

    if (user.role === 'kasir_cabang') {
      console.log('👤 [REPORTS] Kasir user detected:', {
        userId: user.id,
        email: user.email,
        userActualBranchId,
        branchAssignmentChecked
      });
    }
    
    // FIXED: Enhanced date range validation
    if (!dateRange?.start || !dateRange?.end || dateRange.start === '' || dateRange.end === '') {
      console.warn('⚠️ [REPORTS] Invalid or empty date range, skipping fetch:', dateRange);
      setTransactions([]);
      setLoading(false);
      return;
    }

    // FIXED: Proper date validation with timezone awareness
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      console.warn('⚠️ [REPORTS] Invalid date format, skipping fetch');
      setTransactions([]);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      
      try {
        console.log('📊 [REPORTS] Starting FIXED reports data fetch:', {
          userRole: user.role,
          userActualBranchId,
          selectedBranch,
          dateRange: {
            start: dateRange.start,
            end: dateRange.end,
            startISO: startDate.toISOString(),
            endISO: endDate.toISOString(),
            note: 'Indonesian local dates will be converted to UTC properly in service'
          },
          paymentStatusFilter,
          currentTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        });

        // FIXED: Call service with proper timezone handling
        const rawData = await fetchTransactionsFromDB(
          user.role,
          userActualBranchId,
          selectedBranch,
          dateRange, // Service will handle timezone conversion properly
          paymentStatusFilter
        );

        console.log('📊 [REPORTS] FIXED raw data received:', {
          count: Array.isArray(rawData) ? rawData.length : 0,
          sample: Array.isArray(rawData) && rawData.length > 0 ? {
            id: rawData[0].id,
            utc_date: rawData[0].transaction_date,
            local_date: rawData[0].local_datetime || 'Not available',
            items_count: rawData[0].transaction_items?.length || 0,
            sample_item: rawData[0].transaction_items?.[0] ? {
              product_name: rawData[0].transaction_items[0].products?.name,
              quantity: rawData[0].transaction_items[0].quantity,
              price: rawData[0].transaction_items[0].price_per_item
            } : null
          } : null
        });

        const safeRawData = Array.isArray(rawData) ? rawData : [];
        const transformedTransactions = transformTransactionData(safeRawData);
        
        console.log('📊 [REPORTS] FIXED transformed transactions:', {
          count: transformedTransactions.length,
          sample: transformedTransactions[0] ? {
            id: transformedTransactions[0].id,
            date: transformedTransactions[0].transaction_date,
            items_count: transformedTransactions[0].transaction_items?.length || 0,
            sample_items: transformedTransactions[0].transaction_items?.slice(0, 2).map(item => ({
              product_name: item.products?.name,
              qty: item.quantity,
              price: item.price_per_item,
              subtotal: item.subtotal
            })) || []
          } : null
        });

        setTransactions(transformedTransactions);
        
        if (transformedTransactions.length > 0) {
          const itemsCount = transformedTransactions.reduce((total, t) => total + (t.transaction_items?.length || 0), 0);
          toast({
            title: "Data Berhasil Dimuat",
            description: `${transformedTransactions.length} transaksi dengan ${itemsCount} item produk berhasil dimuat untuk periode ${dateRange.start} - ${dateRange.end}.`,
          });
        } else {
          const periodText = `${dateRange.start} - ${dateRange.end}`;
          toast({
            title: "Tidak Ada Transaksi",
            description: `Tidak ada transaksi ditemukan untuk periode ${periodText}. Pastikan ada transaksi yang sudah LUNAS (completed) pada periode ini.`,
            variant: "default",
          });
        }

      } catch (error: any) {
        console.error('❌ [REPORTS] Error in FIXED fetchData:', error);
        
        const errorMessage = error.message || 'Gagal memuat data laporan';
        
        toast({
          variant: "destructive",
          title: "Error Memuat Laporan",
          description: errorMessage,
        });
        
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };

    // Debounce untuk menghindari multiple calls
    const timeoutId = setTimeout(() => {
      fetchData();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [user, userActualBranchId, branchAssignmentChecked, selectedBranch, dateRange, paymentStatusFilter, toast]);

  return {
    transactions,
    loading,
    userActualBranchId
  };
};
