
import type { TransactionSummary } from '@/types/reports';

export const useReportsCalculations = (summary: TransactionSummary[]) => {
  const getTotalRevenue = () => summary.reduce((total, item) => total + item.total_revenue, 0);
  const getTotalTransactions = () => summary.reduce((total, item) => total + item.total_transactions, 0);
  const getAverageTransaction = () => {
    const total = getTotalRevenue();
    const count = getTotalTransactions();
    return count > 0 ? total / count : 0;
  };

  return {
    getTotalRevenue,
    getTotalTransactions,
    getAverageTransaction
  };
};
