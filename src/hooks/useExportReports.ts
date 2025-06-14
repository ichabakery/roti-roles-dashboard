
import { useToast } from '@/hooks/use-toast';

interface Transaction {
  id: string;
  branch_id: string;
  transaction_date: string;
  total_amount: number;
  payment_method: string;
  branch?: { name: string };
}

interface TransactionSummary {
  branch_name: string;
  total_transactions: number;
  total_revenue: number;
  avg_transaction: number;
}

export const useExportReports = () => {
  const { toast } = useToast();

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Tidak ada data untuk diekspor",
      });
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Handle nested objects
          if (typeof value === 'object' && value !== null) {
            return `"${JSON.stringify(value)}"`;
          }
          // Escape commas and quotes in strings
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    toast({
      title: "Export Berhasil",
      description: `File ${filename}.csv telah diunduh`,
    });
  };

  const exportTransactions = (transactions: Transaction[]) => {
    const exportData = transactions.map(transaction => ({
      'ID Transaksi': transaction.id.substring(0, 8) + '...',
      'Tanggal': new Date(transaction.transaction_date).toLocaleDateString('id-ID'),
      'Cabang': transaction.branch?.name || 'Unknown',
      'Metode Pembayaran': transaction.payment_method,
      'Total': transaction.total_amount
    }));

    exportToCSV(exportData, `transaksi_${new Date().toISOString().split('T')[0]}`);
  };

  const exportSummary = (summary: TransactionSummary[]) => {
    const exportData = summary.map(item => ({
      'Cabang': item.branch_name,
      'Jumlah Transaksi': item.total_transactions,
      'Total Pendapatan': item.total_revenue,
      'Rata-rata Transaksi': Math.round(item.avg_transaction)
    }));

    exportToCSV(exportData, `ringkasan_${new Date().toISOString().split('T')[0]}`);
  };

  const printReport = () => {
    window.print();
  };

  return {
    exportTransactions,
    exportSummary,
    printReport
  };
};
