
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ReportsStatsProps {
  totalTransactions: number;
  totalRevenue: number;
  averageTransaction: number;
}

export const ReportsStats: React.FC<ReportsStatsProps> = ({
  totalTransactions,
  totalRevenue,
  averageTransaction
}) => {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Transaksi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalTransactions}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Pendapatan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">Rp {totalRevenue.toLocaleString('id-ID')}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Rata-Rata per Transaksi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            Rp {Math.round(averageTransaction).toLocaleString('id-ID')}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
