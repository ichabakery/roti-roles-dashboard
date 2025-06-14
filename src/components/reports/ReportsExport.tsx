
import React from 'react';
import { Button } from '@/components/ui/button';
import { DownloadIcon } from 'lucide-react';

interface Transaction {
  id: string;
  branch_id: string;
  transaction_date: string;
  total_amount: number;
  payment_method: string;
  branch?: { name: string };
}

interface TransactionSummary {
  branch_id: string;
  branch_name: string;
  total_transactions: number;
  total_revenue: number;
  avg_transaction: number;
}

interface ReportsExportProps {
  summary: TransactionSummary[];
  transactions: Transaction[];
  onExportSummary: (summary: TransactionSummary[]) => void;
  onExportTransactions: (transactions: Transaction[]) => void;
}

export const ReportsExport: React.FC<ReportsExportProps> = ({
  summary,
  transactions,
  onExportSummary,
  onExportTransactions
}) => {
  return (
    <div className="flex gap-2">
      <Button variant="outline" onClick={() => onExportSummary(summary)}>
        <DownloadIcon className="mr-2 h-4 w-4" />
        Unduh Ringkasan
      </Button>

      <Button variant="outline" onClick={() => onExportTransactions(transactions)}>
        <DownloadIcon className="mr-2 h-4 w-4" />
        Unduh Transaksi
      </Button>
    </div>
  );
};
