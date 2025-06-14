
import React from 'react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';

interface TransactionSummary {
  branch_id: string;
  branch_name: string;
  total_transactions: number;
  total_revenue: number;
  avg_transaction: number;
}

interface SummaryTabProps {
  summary: TransactionSummary[];
  loading: boolean;
}

export const SummaryTab: React.FC<SummaryTabProps> = ({ summary, loading }) => {
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Cabang</TableHead>
          <TableHead>Jumlah Transaksi</TableHead>
          <TableHead className="text-right">Total Pendapatan</TableHead>
          <TableHead className="text-right">Rata-rata Transaksi</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {summary.map((item) => (
          <TableRow key={item.branch_id}>
            <TableCell className="font-medium">{item.branch_name}</TableCell>
            <TableCell>{item.total_transactions}</TableCell>
            <TableCell className="text-right">Rp {item.total_revenue.toLocaleString('id-ID')}</TableCell>
            <TableCell className="text-right">Rp {Math.round(item.avg_transaction).toLocaleString('id-ID')}</TableCell>
          </TableRow>
        ))}
        {summary.length === 0 && (
          <TableRow>
            <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
              Tidak ada data transaksi dalam periode yang dipilih
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};
