import React from 'react';
import { Button } from '@/components/ui/button';
import { Printer, Download, Copy, Share, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import jsPDF from 'jspdf';
import { SalesReceipt } from './SalesReceipt';

interface ReceiptProduct {
  name: string;
  quantity: number;
  price: number; // This is the subtotal (quantity * unit_price)
}

interface ImprovedReceiptData {
  branchName: string;
  cashierName: string;
  transactionDate: string;
  products: ReceiptProduct[];
  total: number;
  received?: number;
  change?: number;
  transactionId?: string;
  paymentStatus?: 'paid' | 'pending' | 'partial' | 'cancelled';
  amountPaid?: number;
  amountRemaining?: number;
  dueDate?: string;
}

interface ImprovedReceiptPrinterProps {
  receiptData: ImprovedReceiptData;
  className?: string;
}

export const ImprovedReceiptPrinter: React.FC<ImprovedReceiptPrinterProps> = ({
  receiptData,
  className = ""
}) => {
  const { toast } = useToast();

  const generateOptimizedThermalPDF = async () => {
    try {
      const pdf = new jsPDF({
        unit: 'mm',
        format: [58, 200], // 58mm thermal paper width
        orientation: 'portrait'
      });

      const pageWidth = 58;
      const margin = 2;
      let y = 3;

      // Optimized font settings for thermal printing
      const addText = (text: string, fontSize: number = 8, align: 'left' | 'center' = 'left', isBold: boolean = false) => {
        pdf.setFontSize(fontSize);
        pdf.setFont("helvetica", isBold ? "bold" : "normal");
        
        // Handle text wrapping for long text
        const maxWidth = pageWidth - (margin * 2);
        const splitText = pdf.splitTextToSize(text, maxWidth);
        
        if (align === 'center') {
          if (Array.isArray(splitText)) {
            splitText.forEach((line: string) => {
              pdf.text(line, pageWidth / 2, y, { align: 'center' });
              y += 3;
            });
          } else {
            pdf.text(splitText, pageWidth / 2, y, { align: 'center' });
            y += 3;
          }
        } else {
          if (Array.isArray(splitText)) {
            splitText.forEach((line: string) => {
              pdf.text(line, margin, y);
              y += 3;
            });
          } else {
            pdf.text(splitText, margin, y);
            y += 3;
          }
        }
      };

      const addLine = () => {
        pdf.setLineWidth(0.1);
        pdf.line(margin, y, pageWidth - margin, y);
        y += 2;
      };

      // Header - Store Info
      addText('ICHA BAKERY', 10, 'center', true);
      addText('Jl. Raya Bakery No. 123', 7, 'center');
      addText('Jakarta', 7, 'center');  
      addText('Telp: 021-12345678', 7, 'center');
      addText(receiptData.branchName, 8, 'center');
      y += 1;
      addLine();

      // Transaction Info
      addText('NOTA PENJUALAN', 9, 'center', true);
      y += 1;
      
      addText(`Kasir: ${receiptData.cashierName}`, 7);
      addText(new Date(receiptData.transactionDate).toLocaleString('id-ID'), 7);
      if (receiptData.transactionId) {
        addText(`ID: ${receiptData.transactionId.substring(0, 8)}`, 7);
      }
      y += 1;
      addLine();

      // Items
      addText('DETAIL PEMBELIAN:', 8, 'left', true);
      
      receiptData.products.forEach((product, index) => {
        // Product name with numbering
        addText(`${index + 1}. ${product.name}`, 8);
        
        // Calculate unit price from subtotal
        const unitPrice = product.price / product.quantity;
        addText(`   ${product.quantity} x Rp ${unitPrice.toLocaleString('id-ID')}`, 7);
        addText(`   = Rp ${product.price.toLocaleString('id-ID')}`, 7);
        y += 1;
      });

      y += 1;
      addLine();

      // Payment Summary
      addText(`TOTAL: Rp ${receiptData.total.toLocaleString('id-ID')}`, 9, 'center', true);
      
      if (receiptData.paymentStatus === 'partial' || receiptData.paymentStatus === 'pending') {
        // Partial payment info
        if (receiptData.amountPaid && receiptData.amountPaid > 0) {
          addText(`DP: Rp ${receiptData.amountPaid.toLocaleString('id-ID')}`, 8, 'center');
        }
        addText(`SISA: Rp ${(receiptData.amountRemaining || receiptData.total).toLocaleString('id-ID')}`, 8, 'center');
        if (receiptData.dueDate) {
          addText(`Jatuh Tempo: ${new Date(receiptData.dueDate).toLocaleDateString('id-ID')}`, 7, 'center');
        }
        y += 1;
        addText('*** BELUM LUNAS ***', 8, 'center', true);
      } else if (receiptData.received !== undefined && receiptData.change !== undefined) {
        // Full payment info
        addText(`Bayar: Rp ${receiptData.received.toLocaleString('id-ID')}`, 8, 'center');
        addText(`Kembalian: Rp ${receiptData.change.toLocaleString('id-ID')}`, 8, 'center');
      }

      y += 2;
      addLine();

      // Footer
      if (receiptData.paymentStatus === 'partial' || receiptData.paymentStatus === 'pending') {
        addText('Terima kasih!', 8, 'center', true);
        addText('Harap lunasi pembayaran', 7, 'center');
        addText('sesuai jadwal 🙏', 7, 'center');
      } else {
        addText('Terima kasih!', 8, 'center', true);
        addText('Sampai jumpa lagi 🙏', 7, 'center');
      }

      // Adjust PDF height to content
      const finalHeight = y + 8;
      pdf.internal.pageSize.height = finalHeight;

      return pdf;
    } catch (error) {
      console.error('Error generating optimized thermal PDF:', error);
      throw error;
    }
  };

  const handlePrint = async () => {
    try {
      const pdf = await generateOptimizedThermalPDF();
      
      // Open in new window for printing with thermal printer settings
      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      const printWindow = window.open(pdfUrl, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.focus();
          printWindow.print();
        };
      }
      
      toast({
        title: "Berhasil",
        description: "Struk thermal siap dicetak",
      });
    } catch (error) {
      console.error('Print error:', error);
      toast({
        title: "Error",
        description: "Gagal mencetak struk",
        variant: "destructive"
      });
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const pdf = await generateOptimizedThermalPDF();
      pdf.save(`struk-${receiptData.transactionId?.substring(0, 8) || Date.now()}.pdf`);
      
      toast({
        title: "Berhasil",
        description: "PDF struk berhasil diunduh",
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
    const header = `*🍞 ICHA BAKERY - ${receiptData.branchName.toUpperCase()}*\n🧾 *NOTA PENJUALAN*`;
    
    let content = [header];
    
    content.push(`👤 Kasir: ${receiptData.cashierName}`);
    content.push(`📅 ${new Date(receiptData.transactionDate).toLocaleString('id-ID')}`);
    if (receiptData.transactionId) {
      content.push(`🆔 ID: ${receiptData.transactionId.substring(0, 8)}`);
    }

    const items = receiptData.products.map((item, index) => {
      const unitPrice = item.price / item.quantity;
      return `${index + 1}. ${item.name}\n   ${item.quantity} x Rp ${unitPrice.toLocaleString('id-ID')} = Rp ${item.price.toLocaleString('id-ID')}`;
    }).join('\n');

    content.push(`\n🛍️ *DETAIL PEMBELIAN*`);
    content.push(items);
    
    content.push(`\n💰 *TOTAL: Rp ${receiptData.total.toLocaleString('id-ID')}*`);
    
    if (receiptData.paymentStatus === 'partial' || receiptData.paymentStatus === 'pending') {
      if (receiptData.amountPaid && receiptData.amountPaid > 0) {
        content.push(`💳 DP: Rp ${receiptData.amountPaid.toLocaleString('id-ID')}`);
      }
      content.push(`⚠️ Sisa: Rp ${(receiptData.amountRemaining || receiptData.total).toLocaleString('id-ID')}`);
      if (receiptData.dueDate) {
        content.push(`📅 Jatuh Tempo: ${new Date(receiptData.dueDate).toLocaleDateString('id-ID')}`);
      }
      content.push(`\n🔴 *PEMBAYARAN BELUM LUNAS*`);
    } else if (receiptData.received !== undefined && receiptData.change !== undefined) {
      content.push(`💳 Bayar: Rp ${receiptData.received.toLocaleString('id-ID')}`);
      content.push(`💰 Kembalian: Rp ${receiptData.change.toLocaleString('id-ID')}`);
    }
    
    const footer = receiptData.paymentStatus === 'partial' || receiptData.paymentStatus === 'pending'
      ? `\n✅ Terima kasih!\n🙏 Harap lunasi pembayaran sesuai jadwal.`
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
      <div className="flex gap-2">
        <Button
          onClick={handlePrint}
          className="flex-1 bg-primary hover:bg-primary/90"
          size="sm"
        >
          <Printer className="h-4 w-4 mr-2" />
          Cetak Struk
        </Button>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Preview Struk</DialogTitle>
            </DialogHeader>
            <div className="max-h-[500px] overflow-y-auto">
              <SalesReceipt
                branchName={receiptData.branchName}
                cashierName={receiptData.cashierName}
                transactionDate={receiptData.transactionDate}
                products={receiptData.products}
                total={receiptData.total}
                received={receiptData.received}
                change={receiptData.change}
                transactionId={receiptData.transactionId}
                paymentStatus={receiptData.paymentStatus}
                amountPaid={receiptData.amountPaid}
                amountRemaining={receiptData.amountRemaining}
                dueDate={receiptData.dueDate}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="flex gap-2">
        <Button
          onClick={handleDownloadPDF}
          variant="outline"
          size="sm"
          className="flex-1"
        >
          <Download className="h-4 w-4 mr-2" />
          Download PDF
        </Button>
        
        <Button
          onClick={handleSendWhatsApp}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          size="sm"
        >
          <Share className="h-4 w-4 mr-2" />
          WhatsApp
        </Button>
        
        <Button
          onClick={handleCopyWhatsApp}
          variant="outline"
          size="sm"
        >
          <Copy className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};