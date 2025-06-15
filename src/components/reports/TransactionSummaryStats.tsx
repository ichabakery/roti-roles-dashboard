
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, ShoppingCart, DollarSign } from 'lucide-react';
import type { Transaction } from '@/types/reports';

interface TransactionSummaryStatsProps {
  transactions: Transaction[];
}

export const TransactionSummaryStats: React.FC<TransactionSummaryStatsProps> = ({
  transactions
}) => {
  const totalTransactions = transactions.length;
  const totalRevenue = transactions.reduce((sum, t) => sum + t.total_amount, 0);
  const averageTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
  );
};
