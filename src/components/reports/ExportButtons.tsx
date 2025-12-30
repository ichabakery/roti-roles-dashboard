
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
  payment_status: string;
  branches?: { name: string };
  transaction_items?: TransactionItem[];
  cashier_name?: string;
}

interface ExportButtonsProps {
  transactions: Transaction[];
}

export const ExportButtons: React.FC<ExportButtonsProps> = ({ transactions }) => {
  const { toast } = useToast();

  const exportToCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Tidak ada data untuk diekspor",
      });
      return;
    }

    try {
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
            return value || '';
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
        URL.revokeObjectURL(url);
      }

      toast({
        title: "Export Berhasil",
        description: `File ${filename}.csv telah diunduh`,
      });
    } catch (error) {
      console.error('Export CSV error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Gagal mengekspor data ke CSV",
      });
    }
  };

  const exportTransactionSummary = () => {
    const exportData = transactions.map(transaction => ({
      'ID Transaksi': transaction.id.substring(0, 8) + '...',
      'Tanggal': new Date(transaction.transaction_date).toLocaleDateString('id-ID'),
      'Cabang': transaction.branches?.name || 'Unknown',
      'Kasir': transaction.cashier_name || 'Unknown',
      'Metode Pembayaran': transaction.payment_method,
      'Status Pembayaran': transaction.payment_status,
      'Total Item': transaction.transaction_items?.reduce((sum, item) => sum + item.quantity, 0) || 0,
      'Total Amount': transaction.total_amount
    }));

    exportToCSV(exportData, `ringkasan_transaksi_${new Date().toISOString().split('T')[0]}`);
  };

  const exportDetailedTransactions = () => {
    const allItems = transactions.flatMap(transaction =>
      (transaction.transaction_items || []).map(item => ({
        'ID Transaksi': transaction.id.substring(0, 8) + '...',
        'Tanggal': new Date(transaction.transaction_date).toLocaleDateString('id-ID'),
        'Cabang': transaction.branches?.name || 'Unknown',
        'Kasir': transaction.cashier_name || 'Unknown',
        'Nama Produk': item.products?.name || 'Unknown Product',
        'Jumlah': item.quantity,
        'Harga Satuan': item.price_per_item,
        'Subtotal': item.subtotal,
        'Metode Pembayaran': transaction.payment_method,
        'Status Pembayaran': transaction.payment_status
      }))
    );

    exportToCSV(allItems, `detail_transaksi_${new Date().toISOString().split('T')[0]}`);
  };

  const exportProductAnalysis = () => {
    const productMap = new Map();
    
    transactions.forEach(transaction => {
      transaction.transaction_items?.forEach(item => {
        if (!item.products?.name) return; // Skip items without product name
        
        const productName = item.products.name;
        
        if (!productMap.has(productName)) {
          productMap.set(productName, {
            'Nama Produk': productName,
            'Total Kuantitas': 0,
            'Total Pendapatan': 0,
            'Frekuensi Transaksi': new Set()
          });
        }
        
        const product = productMap.get(productName);
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
    <div className="flex flex-col gap-2 w-full sm:flex-row sm:flex-wrap sm:w-auto">
      <Button variant="outline" size="sm" className="w-full sm:w-auto justify-center" onClick={exportTransactionSummary}>
        <FileText className="mr-2 h-4 w-4" />
        <span className="text-xs sm:text-sm">Ringkasan</span>
      </Button>

      <Button variant="outline" size="sm" className="w-full sm:w-auto justify-center" onClick={exportDetailedTransactions}>
        <DownloadIcon className="mr-2 h-4 w-4" />
        <span className="text-xs sm:text-sm">Detail Item</span>
      </Button>

      <Button variant="outline" size="sm" className="w-full sm:w-auto justify-center" onClick={exportProductAnalysis}>
        <FileSpreadsheet className="mr-2 h-4 w-4" />
        <span className="text-xs sm:text-sm">Analisis</span>
      </Button>
    </div>
  );
};
