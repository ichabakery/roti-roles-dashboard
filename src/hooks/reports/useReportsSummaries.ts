
import { useMemo } from 'react';
import { generateSummaries } from '@/utils/reportsUtils';
import type { Transaction } from '@/types/reports';

export const useReportsSummaries = (transactions: Transaction[], searchQuery: string) => {
  const summaries = useMemo(() => {
    const safeTransactions = Array.isArray(transactions) ? transactions : [];
    
    const filtered = safeTransactions.filter(transaction => {
      const matchesSearch = searchQuery === '' || 
        transaction.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transaction.branches?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (transaction.payment_method || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesSearch;
    });
    
    console.log('🔍 Generating summaries with payment status consideration:', filtered.length);
    return generateSummaries(filtered);
  }, [transactions, searchQuery]);

  return summaries;
};
