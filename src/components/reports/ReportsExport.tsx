
import React from 'react';
import { Button } from '@/components/ui/button';
import { DownloadIcon, FileText, FileSpreadsheet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TransactionItem {
  id: string;
  product_id: string;
  quantity: number;
  price_per_item: number;
  subtotal: number;
  products?: {
    name: string;
  };
}

interface Transaction {
  id: string;
  branch_id: string;
  transaction_date: string;
  total_amount: number;
  payment_method: string;
  branch?: { name: string };
  transaction_items?: TransactionItem[];
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
          if (typeof value === 'object' && value !== null) {
            return `"${JSON.stringify(value)}"`;
          }
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

  const exportDetailedTransactions = () => {
    const exportData = transactions.map(transaction => ({
      'ID Transaksi': transaction.id.substring(0, 8) + '...',
      'Tanggal': new Date(transaction.transaction_date).toLocaleDateString('id-ID'),
      'Cabang': transaction.branch?.name || 'Unknown',
      'Metode Pembayaran': transaction.payment_method,
      'Total Item': transaction.transaction_items?.reduce((sum, item) => sum + item.quantity, 0) || 0,
      'Total Amount': transaction.total_amount
    }));

    exportToCSV(exportData, `transaksi_detail_${new Date().toISOString().split('T')[0]}`);
  };

  const exportTransactionItems = () => {
    const allItems = transactions.flatMap(transaction =>
      (transaction.transaction_items || []).map(item => ({
        'ID Transaksi': transaction.id.substring(0, 8) + '...',
        'Tanggal': new Date(transaction.transaction_date).toLocaleDateString('id-ID'),
        'Cabang': transaction.branch?.name || 'Unknown',
        'Nama Produk': item.products?.name || 'Unknown Product',
        'Jumlah': item.quantity,
        'Harga Satuan': item.price_per_item,
        'Subtotal': item.subtotal
      }))
    );

    exportToCSV(allItems, `item_transaksi_${new Date().toISOString().split('T')[0]}`);
  };

  const exportProductAnalysis = () => {
    // Calculate product analysis from transaction items
    const productMap = new Map();
    
    transactions.forEach(transaction => {
      transaction.transaction_items?.forEach(item => {
        const productId = item.product_id;
        const productName = item.products?.name || 'Unknown Product';
        
        if (!productMap.has(productId)) {
          productMap.set(productId, {
            'Nama Produk': productName,
            'Total Kuantitas': 0,
            'Total Pendapatan': 0,
            'Frekuensi Transaksi': new Set()
          });
        }
        
        const product = productMap.get(productId);
        product['Total Kuantitas'] += item.quantity;
        product['Total Pendapatan'] += item.subtotal;
        product['Frekuensi Transaksi'].add(transaction.id);
      });
    });

    const productAnalysis = Array.from(productMap.values()).map(product => ({
      'Nama Produk': product['Nama Produk'],
      'Total Kuantitas': product['Total Kuantitas'],
      'Total Pendapatan': product['Total Pendapatan'],
      'Frekuensi Transaksi': product['Frekuensi Transaksi'].size,
      'Rata-rata Harga': product['Total Kuantitas'] > 0 ? Math.round(product['Total Pendapatan'] / product['Total Kuantitas']) : 0
    })).sort((a, b) => b['Total Pendapatan'] - a['Total Pendapatan']);

    exportToCSV(productAnalysis, `analisis_produk_${new Date().toISOString().split('T')[0]}`);
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" onClick={() => onExportSummary(summary)}>
        <FileText className="mr-2 h-4 w-4" />
        Ringkasan Cabang
      </Button>

      <Button variant="outline" onClick={exportDetailedTransactions}>
        <DownloadIcon className="mr-2 h-4 w-4" />
        Detail Transaksi
      </Button>

      <Button variant="outline" onClick={exportTransactionItems}>
        <FileSpreadsheet className="mr-2 h-4 w-4" />
        Detail Item
      </Button>

      <Button variant="outline" onClick={exportProductAnalysis}>
        <FileSpreadsheet className="mr-2 h-4 w-4" />
        Analisis Produk
      </Button>
    </div>
  );
};
