import React from 'react';
import { Button } from '@/components/ui/button';
import { Printer, Download, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';

interface ReceiptProduct {
  name: string;
  quantity: number;
  price: number;
}

interface UnifiedReceiptData {
  type: 'transaction' | 'order';
  branchName: string;
  cashierName: string;
  transactionDate: string;
  products: ReceiptProduct[];
  total: number;
  received?: number;
  change?: number;
  transactionId?: string;
  orderNumber?: string;
  customerName?: string;
  customerPhone?: string;
  deliveryDate?: string;
  status?: string;
  paymentType?: string;
  notes?: string;
}

interface UnifiedThermalReceiptProps {
  receiptData: UnifiedReceiptData;
  showWhatsApp?: boolean;
  showPDF?: boolean;
  className?: string;
}

export const UnifiedThermalReceipt: React.FC<UnifiedThermalReceiptProps> = ({
  receiptData,
  showWhatsApp = false,
  showPDF = false,
  className = ""
}) => {
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

  const generateThermalPDF = async () => {
    try {
      const pdf = new jsPDF({
        unit: 'mm',
        format: [58, 200], // 58mm width, auto height
        orientation: 'portrait'
      });

      const pageWidth = 58;
      const margin = 2;
      let y = 5;

      // Helper function to add text
      const addText = (text: string, fontSize: number = 8, align: 'left' | 'center' = 'left', isBold: boolean = false) => {
        pdf.setFontSize(fontSize);
        pdf.setFont("helvetica", isBold ? "bold" : "normal");
        
        if (align === 'center') {
          pdf.text(text, pageWidth / 2, y, { align: 'center' });
        } else {
          pdf.text(text, margin, y);
        }
        y += 3;
      };

      const addLine = () => {
        pdf.setLineWidth(0.1);
        pdf.line(margin, y, pageWidth - margin, y);
        y += 3;
      };

      // Header
      addText('ICHA BAKERY', 10, 'center', true);
      addText('Jl. Raya Bakery No. 123, Jakarta', 8, 'center');
      addText('Telp: 021-12345678', 7, 'center');
      addText(receiptData.branchName, 8, 'center');
      addText(new Date().toLocaleString('id-ID'), 7, 'center');
      y += 2;

      addLine();

      // Document type
      if (receiptData.type === 'order') {
        addText('BUKTI PEMESANAN', 9, 'center', true);
        y += 1;
        
        if (receiptData.orderNumber) {
          addText(`No: ${receiptData.orderNumber}`, 8);
        }
        if (receiptData.status) {
          addText(`Status: ${getStatusLabel(receiptData.status)}`, 8);
        }
        addText(`Tgl Pesan: ${new Date(receiptData.transactionDate).toLocaleDateString('id-ID')}`, 8);
        if (receiptData.deliveryDate) {
          addText(`Tgl Ambil: ${new Date(receiptData.deliveryDate).toLocaleDateString('id-ID')}`, 8);
        }
        
        y += 2;
        addLine();

        // Customer info for orders
        if (receiptData.customerName) {
          addText('PELANGGAN:', 8, 'left', true);
          addText(`${receiptData.customerName}`, 8);
          if (receiptData.customerPhone) {
            addText(`${receiptData.customerPhone}`, 8);
          }
          y += 2;
          addLine();
        }
      } else {
        addText('NOTA PENJUALAN', 9, 'center', true);
        y += 1;
        
        addText(`Kasir: ${receiptData.cashierName}`, 8);
        addText(new Date(receiptData.transactionDate).toLocaleString('id-ID'), 8);
        if (receiptData.transactionId) {
          addText(`ID: ${receiptData.transactionId.substring(0, 8)}`, 8);
        }
        
        y += 2;
        addLine();
      }

      // Items header
      addText('DETAIL ' + (receiptData.type === 'order' ? 'PESANAN' : 'PEMBELIAN') + ':', 8, 'left', true);
      y += 1;

      // Products
      receiptData.products.forEach((product) => {
        // Product name (wrap if too long)
        const maxLineLength = 16;
        if (product.name.length > maxLineLength) {
          const line1 = product.name.substring(0, maxLineLength);
          const line2 = product.name.substring(maxLineLength);
          addText(line1, 8);
          addText(line2, 8);
        } else {
          addText(product.name, 8);
        }
        
        addText(`${product.quantity} x Rp ${product.price.toLocaleString('id-ID')}`, 7);
        addText(`= Rp ${(product.quantity * product.price).toLocaleString('id-ID')}`, 7);
        y += 1;
      });

      y += 1;
      addLine();

      // Total
      addText(`TOTAL: Rp ${receiptData.total.toLocaleString('id-ID')}`, 9, 'center', true);
      
      if (receiptData.type === 'order') {
        addText(`Bayar: ${getPaymentTypeLabel(receiptData.paymentType || 'cash_on_delivery')}`, 8, 'center');
      } else {
        // Payment info for transactions
        if (receiptData.received !== undefined && receiptData.change !== undefined) {
          addText(`Bayar: Rp ${receiptData.received.toLocaleString('id-ID')}`, 8, 'center');
          addText(`Kembalian: Rp ${receiptData.change.toLocaleString('id-ID')}`, 8, 'center');
        }
      }

      if (receiptData.notes) {
        y += 2;
        addLine();
        addText('CATATAN:', 8, 'left', true);
        addText(receiptData.notes, 7);
      }

      y += 3;
      addLine();

      // Footer
      addText('Terima kasih!', 8, 'center', true);
      if (receiptData.type === 'order') {
        addText('Simpan bukti ini untuk', 7, 'center');
        addText('pengambilan pesanan', 7, 'center');
      } else {
        addText('Sampai jumpa lagi 🙏', 7, 'center');
      }

      // Adjust PDF height
      const finalHeight = y + 10;
      pdf.internal.pageSize.height = finalHeight;

      return pdf;
    } catch (error) {
      console.error('Error generating thermal PDF:', error);
      throw error;
    }
  };

  const handlePrint = async () => {
    try {
      const pdf = await generateThermalPDF();
      window.open(pdf.output('bloburl'), '_blank');
      
      toast({
        title: "Berhasil",
        description: "Struk thermal siap dicetak",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal membuat struk thermal",
        variant: "destructive"
      });
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const pdf = await generateThermalPDF();
      pdf.save(`struk-${receiptData.type}-${Date.now()}.pdf`);
      
      toast({
        title: "Berhasil",
        description: "PDF berhasil diunduh",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal mengunduh PDF",
        variant: "destructive"
      });
    }
  };

  const generateWhatsAppMessage = () => {
    const header = `*🍞 ICHA BAKERY - ${receiptData.branchName.toUpperCase()}*`;
    const docType = receiptData.type === 'order' ? '📋 *BUKTI PEMESANAN*' : '🧾 *NOTA PENJUALAN*';
    
    let content = [header, docType];
    
    if (receiptData.type === 'order') {
      if (receiptData.orderNumber) content.push(`🧾 No. Pesanan: *${receiptData.orderNumber}*`);
      if (receiptData.status) content.push(`📊 Status: *${getStatusLabel(receiptData.status)}*`);
      content.push(`📅 Tanggal Pesan: ${new Date(receiptData.transactionDate).toLocaleDateString('id-ID')}`);
      if (receiptData.deliveryDate) {
        content.push(`📦 Tanggal Ambil: *${new Date(receiptData.deliveryDate).toLocaleDateString('id-ID')}*`);
      }
      
      if (receiptData.customerName) {
        content.push(`\n👤 *PELANGGAN*`);
        content.push(`Nama: ${receiptData.customerName}`);
        if (receiptData.customerPhone) {
          content.push(`Telepon: ${receiptData.customerPhone}`);
        }
      }
    } else {
      content.push(`👤 Kasir: ${receiptData.cashierName}`);
      content.push(`📅 ${new Date(receiptData.transactionDate).toLocaleString('id-ID')}`);
      if (receiptData.transactionId) {
        content.push(`🆔 ID: ${receiptData.transactionId.substring(0, 8)}`);
      }
    }

    const items = receiptData.products.map((item, index) => 
      `${index + 1}. ${item.name}\n   ${item.quantity} x Rp ${item.price.toLocaleString('id-ID')} = Rp ${(item.quantity * item.price).toLocaleString('id-ID')}`
    ).join('\n');

    content.push(`\n🛍️ *DETAIL ${receiptData.type === 'order' ? 'PESANAN' : 'PEMBELIAN'}*`);
    content.push(items);
    
    content.push(`\n💰 *TOTAL: Rp ${receiptData.total.toLocaleString('id-ID')}*`);
    
    if (receiptData.type === 'order') {
      content.push(`Metode: ${getPaymentTypeLabel(receiptData.paymentType || 'cash_on_delivery')}`);
    } else if (receiptData.received !== undefined && receiptData.change !== undefined) {
      content.push(`Bayar: Rp ${receiptData.received.toLocaleString('id-ID')}`);
      content.push(`Kembalian: Rp ${receiptData.change.toLocaleString('id-ID')}`);
    }

    if (receiptData.notes) {
      content.push(`\n📝 *CATATAN*\n${receiptData.notes}`);
    }
    
    const footer = receiptData.type === 'order' 
      ? `\n✅ Terima kasih atas pesanan Anda!\n🙏 Mohon simpan bukti ini untuk pengambilan pesanan.`
      : `\n✅ Terima kasih telah berbelanja!\n🙏 Sampai jumpa lagi.`;
    
    content.push(footer);
    
    return content.join('\n');
  };

  const handleCopyWhatsApp = async () => {
    try {
      const message = generateWhatsAppMessage();
      await navigator.clipboard.writeText(message);
      toast({
        title: "Berhasil",
        description: "Pesan WhatsApp telah disalin",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menyalin pesan",
        variant: "destructive"
      });
    }
  };

  const handleSendWhatsApp = () => {
    const message = generateWhatsAppMessage();
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <Button
        onClick={handlePrint}
        variant="outline"
        size="sm"
        className="w-full"
      >
        <Printer className="h-4 w-4 mr-2" />
        Cetak Thermal (58mm)
      </Button>
      
      {showPDF && (
        <Button
          onClick={handleDownloadPDF}
          variant="outline"
          size="sm"
          className="w-full"
        >
          <Download className="h-4 w-4 mr-2" />
          Download PDF
        </Button>
      )}
      
      {showWhatsApp && (
        <div className="flex gap-2">
          <Button
            onClick={handleSendWhatsApp}
            className="flex-1 bg-green-600 hover:bg-green-700"
            size="sm"
          >
            <Copy className="h-4 w-4 mr-2" />
            Kirim WhatsApp
          </Button>
          <Button
            onClick={handleCopyWhatsApp}
            variant="outline"
            size="sm"
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};