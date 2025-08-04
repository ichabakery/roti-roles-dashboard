import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, FileText, Table } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Order } from '@/services/orderService';

interface OrderExportProps {
  orders: Order[];
}

export const OrderExport: React.FC<OrderExportProps> = ({ orders }) => {
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf'>('csv');
  const [exportStatus, setExportStatus] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getFilteredOrders = () => {
    return orders.filter(order => {
      const matchesStatus = exportStatus === 'all' || order.status === exportStatus;
      const orderDate = new Date(order.order_date);
      const matchesDateFrom = !dateFrom || orderDate >= new Date(dateFrom);
      const matchesDateTo = !dateTo || orderDate <= new Date(dateTo);
      
      return matchesStatus && matchesDateFrom && matchesDateTo;
    });
  };

  const exportToCSV = () => {
    const filteredOrders = getFilteredOrders();
    
    if (filteredOrders.length === 0) {
      toast({
        title: "Tidak ada data",
        description: "Tidak ada pesanan yang sesuai dengan filter",
        variant: "destructive"
      });
      return;
    }

    const headers = [
      'Nomor Pesanan',
      'Pelanggan',
      'Telepon',
      'Cabang',
      'Tanggal Pesan',
      'Tanggal Kirim',
      'Status',
      'Total Pembayaran',
      'Item Pesanan',
      'Catatan'
    ];

    const csvContent = [
      headers.join(','),
      ...filteredOrders.map(order => [
        order.order_number,
        `"${order.customer_name}"`,
        order.customer_phone || '',
        `"${order.branch_name || ''}"`,
        order.order_date,
        order.delivery_date,
        order.status,
        order.total_amount,
        `"${order.items?.map(item => `${item.quantity}x ${item.productName}`).join('; ') || ''}"`,
        `"${order.notes || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `laporan-pesanan-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Berhasil",
      description: `Data ${filteredOrders.length} pesanan berhasil diekspor`
    });
  };

  const exportToPDF = async () => {
    const filteredOrders = getFilteredOrders();
    
    if (filteredOrders.length === 0) {
      toast({
        title: "Tidak ada data",
        description: "Tidak ada pesanan yang sesuai dengan filter",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      // Import jsPDF dynamically
      const { jsPDF } = await import('jspdf');
      await import('jspdf-autotable');
      
      const doc = new jsPDF();
      
      // Title
      doc.setFontSize(16);
      doc.text('Laporan Pesanan', 14, 20);
      
      // Date range
      const today = new Date().toLocaleDateString('id-ID');
      doc.setFontSize(10);
      doc.text(`Tanggal: ${today}`, 14, 30);
      
      if (dateFrom || dateTo) {
        const range = `Periode: ${dateFrom || 'Awal'} - ${dateTo || 'Akhir'}`;
        doc.text(range, 14, 36);
      }

      // Table data
      const tableData = filteredOrders.map(order => [
        order.order_number,
        order.customer_name,
        order.customer_phone || '-',
        order.branch_name || '-',
        new Date(order.order_date).toLocaleDateString('id-ID'),
        new Date(order.delivery_date).toLocaleDateString('id-ID'),
        order.status,
        formatCurrency(order.total_amount)
      ]);

      // @ts-ignore - jsPDF autoTable types
      doc.autoTable({
        head: [['No. Pesanan', 'Pelanggan', 'Telepon', 'Cabang', 'Tgl Pesan', 'Tgl Kirim', 'Status', 'Total']],
        body: tableData,
        startY: dateFrom || dateTo ? 42 : 36,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [79, 70, 229] },
        alternateRowStyles: { fillColor: [245, 245, 245] }
      });

      doc.save(`laporan-pesanan-${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast({
        title: "Berhasil",
        description: `Laporan PDF ${filteredOrders.length} pesanan berhasil dibuat`
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Gagal membuat PDF",
        description: "Terjadi kesalahan saat membuat laporan PDF",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (exportFormat === 'csv') {
      exportToCSV();
    } else {
      exportToPDF();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Ekspor Data Pesanan
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Format Export</Label>
            <Select value={exportFormat} onValueChange={(value: 'csv' | 'pdf') => setExportFormat(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">
                  <div className="flex items-center gap-2">
                    <Table className="h-4 w-4" />
                    CSV (Excel)
                  </div>
                </SelectItem>
                <SelectItem value="pdf">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    PDF
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Filter Status</Label>
            <Select value={exportStatus} onValueChange={setExportStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="pending">Menunggu</SelectItem>
                <SelectItem value="confirmed">Dikonfirmasi</SelectItem>
                <SelectItem value="in_production">Produksi</SelectItem>
                <SelectItem value="ready">Siap</SelectItem>
                <SelectItem value="completed">Selesai</SelectItem>
                <SelectItem value="cancelled">Dibatalkan</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Tanggal Dari</Label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Tanggal Sampai</Label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
        </div>

        <div className="pt-4">
          <Button 
            onClick={handleExport}
            disabled={loading}
            className="w-full"
          >
            <Download className="mr-2 h-4 w-4" />
            {loading ? 'Membuat Laporan...' : `Export ${exportFormat.toUpperCase()}`}
          </Button>
        </div>

        <div className="text-sm text-muted-foreground">
          Total data yang akan diekspor: {getFilteredOrders().length} pesanan
        </div>
      </CardContent>
    </Card>
  );
};