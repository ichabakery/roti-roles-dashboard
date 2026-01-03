
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, ShoppingCart, DollarSign } from 'lucide-react';
import type { Transaction } from '@/types/reports';

interface TransactionSummaryStatsProps {
  transactions: Transaction[];
}

// Format number to compact version (e.g., 1.2jt, 500rb)
const formatCompact = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1).replace('.0', '')}jt`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(0)}rb`;
  }
  return num.toString();
};

export const TransactionSummaryStats: React.FC<TransactionSummaryStatsProps> = ({
  transactions
}) => {
  const totalTransactions = transactions.length;
  const totalRevenue = transactions.reduce((sum, t) => sum + t.total_amount, 0);
  const averageTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

  return (
    <>
      {/* Mobile: Compact single row */}
      <div className="flex sm:hidden items-center justify-between bg-muted/50 rounded-lg p-3 mb-4">
        <div className="flex items-center gap-1.5">
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold">{totalTransactions}</span>
          <span className="text-xs text-muted-foreground">trx</span>
        </div>
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center gap-1.5">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold">Rp {formatCompact(totalRevenue)}</span>
        </div>
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center gap-1.5">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold text-xs">~Rp {formatCompact(averageTransaction)}</span>
        </div>
      </div>

      {/* Desktop: Full cards */}
      <div className="hidden sm:grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transaksi</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTransactions}</div>
            <p className="text-xs text-muted-foreground">transaksi tercatat</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pemasukan</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp {totalRevenue.toLocaleString('id-ID')}</div>
            <p className="text-xs text-muted-foreground">pendapatan kotor</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rata-rata Transaksi</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp {Math.round(averageTransaction).toLocaleString('id-ID')}</div>
            <p className="text-xs text-muted-foreground">per transaksi</p>
          </CardContent>
        </Card>
      </div>
    </>
  );
};
