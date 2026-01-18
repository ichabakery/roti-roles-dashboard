import React from 'react';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import type { Order } from '@/services/orderService';

interface OrderReceiptPrinterProps {
  order: Order;
}

export const OrderReceiptPrinter: React.FC<OrderReceiptPrinterProps> = ({ order }) => {
  const { toast } = useToast();

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Menunggu Konfirmasi';
      case 'confirmed': return 'Dikonfirmasi';
      case 'in_production': return 'Sedang Diproduksi';
      case 'ready': return 'Siap Diambil';
      case 'completed': return 'Selesai';
      case 'cancelled': return 'Dibatalkan';
      default: return status;
    }
  };

  const getPaymentTypeLabel = (paymentType: string) => {
    switch (paymentType) {
      case 'cash_on_delivery': return 'Bayar saat ambil';
      case 'dp': return 'DP (Uang Muka)';
      case 'full_payment': return 'Lunas';
      default: return paymentType;
    }
  };

  const handlePrint = async () => {
    try {
      // Create new PDF optimized for 58mm thermal paper
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [58, 200] // 58mm width, dynamic height
      });

      const pageWidth = 58;
      const margin = 2;
      const lineHeight = 3;
      let currentY = 5;

      // Set font
      pdf.setFont('helvetica');

      // Helper function to add text and update Y position
      const addText = (text: string, fontSize: number = 8, align: 'left' | 'center' = 'left', isBold: boolean = false) => {
        pdf.setFontSize(fontSize);
        if (isBold) {
          pdf.setFont('helvetica', 'bold');
        } else {
          pdf.setFont('helvetica', 'normal');
        }

        if (align === 'center') {
          pdf.text(text, pageWidth / 2, currentY, { align: 'center' });
        } else {
          pdf.text(text, margin, currentY);
        }
        currentY += lineHeight;
      };

      const addLine = () => {
        pdf.line(margin, currentY, pageWidth - margin, currentY);
        currentY += lineHeight;
      };

      // Header
      addText('ICHA BAKERY', 10, 'center', true);
      addText(order.branch_address || 'Alamat cabang', 8, 'center');
      addText(`Telp: ${order.branch_phone || '-'}`, 7, 'center');
      addText(order.branch_name || '', 8, 'center');
      addText(new Date().toLocaleString('id-ID'), 7, 'center');
      currentY += 2;

      addLine();

      // Order Info
      addText('BUKTI PEMESANAN', 9, 'center', true);
      currentY += 1;
      
      addText(`No: ${order.order_number}`, 8);
      addText(`Status: ${getStatusLabel(order.status)}`, 8);
      addText(`Tgl Pesan: ${new Date(order.order_date).toLocaleDateString('id-ID')}`, 8);
      addText(`Tgl Ambil: ${new Date(order.delivery_date).toLocaleDateString('id-ID')}`, 8);
      
      currentY += 2;
      addLine();

      // Customer Info
      addText('PELANGGAN:', 8, 'left', true);
      addText(`${order.customer_name}`, 8);
      if (order.customer_phone) {
        addText(`${order.customer_phone}`, 8);
      }
      
      currentY += 2;
      addLine();

      // Items
      addText('DETAIL PESANAN:', 8, 'left', true);
      currentY += 1;

      order.items?.forEach((item: any) => {
        addText(`${item.productName}`, 8);
        addText(`${item.quantity} x Rp ${item.unitPrice.toLocaleString('id-ID')}`, 7);
        addText(`= Rp ${(item.quantity * item.unitPrice).toLocaleString('id-ID')}`, 7);
        currentY += 1;
      });

      currentY += 1;
      addLine();

      // Payment
      addText(`TOTAL: Rp ${order.total_amount.toLocaleString('id-ID')}`, 9, 'center', true);
      addText(`Bayar: ${getPaymentTypeLabel(order.payment_type || 'cash_on_delivery')}`, 8, 'center');

      if (order.notes) {
        currentY += 2;
        addLine();
        addText('CATATAN:', 8, 'left', true);
        addText(order.notes, 7);
      }

      currentY += 3;
      addLine();

      // Footer
      addText('Terima kasih!', 8, 'center', true);
      addText('Simpan bukti ini untuk', 7, 'center');
      addText('pengambilan pesanan', 7, 'center');

      // Adjust PDF height to content
      const finalHeight = currentY + 10;
      pdf.internal.pageSize.height = finalHeight;

      // Open print dialog
      window.open(pdf.output('bloburl'), '_blank');

      toast({
        title: "Berhasil",
        description: "Bukti pemesanan siap dicetak",
      });
    } catch (error) {
      console.error('Error generating order receipt:', error);
      toast({
        title: "Error",
        description: "Gagal membuat bukti pemesanan",
        variant: "destructive"
      });
    }
  };

  return (
    <Button
      onClick={handlePrint}
      variant="outline"
      size="sm"
      className="w-full"
    >
      <Printer className="h-4 w-4 mr-2" />
      Cetak Bukti
    </Button>
  );
};