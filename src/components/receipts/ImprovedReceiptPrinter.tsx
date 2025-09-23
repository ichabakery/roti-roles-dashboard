import React from 'react';
import { Button } from '@/components/ui/button';
import { Printer, Download, Copy, Share, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import jsPDF from 'jspdf';
import { SalesReceipt } from './SalesReceipt';
import { ThermalReceiptGenerator } from './ThermalReceiptGenerator';

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

  // Debug logging
  console.log('🧾 ImprovedReceiptPrinter received data:', {
    hasReceiptData: !!receiptData,
    productsCount: receiptData?.products?.length || 0,
    products: receiptData?.products,
    total: receiptData?.total,
    branchName: receiptData?.branchName,
    cashierName: receiptData?.cashierName,
    transactionId: receiptData?.transactionId,
    paymentStatus: receiptData?.paymentStatus
  });

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

  const generateHTMLReceipt = () => {
    console.log('🖨️ Generating HTML receipt with data:', receiptData);
    
    const formatCurrency = (amount: number) => {
      return `Rp ${amount.toLocaleString('id-ID')}`;
    };

    const items = receiptData.products.map((product, index) => {
      const unitPrice = product.price / product.quantity;
      return `
        <div class="item">
          <div class="item-name">${index + 1}. ${product.name}</div>
          <div class="item-detail">${product.quantity} x ${formatCurrency(unitPrice)} = ${formatCurrency(product.price)}</div>
        </div>
      `;
    }).join('');

    let paymentInfo = '';
    if (receiptData.paymentStatus === 'partial' || receiptData.paymentStatus === 'pending') {
      if (receiptData.amountPaid && receiptData.amountPaid > 0) {
        paymentInfo += `<div class="payment-line">DP: ${formatCurrency(receiptData.amountPaid)}</div>`;
      }
      paymentInfo += `<div class="payment-line">SISA: ${formatCurrency(receiptData.amountRemaining || receiptData.total)}</div>`;
      if (receiptData.dueDate) {
        paymentInfo += `<div class="payment-line">Jatuh Tempo: ${new Date(receiptData.dueDate).toLocaleDateString('id-ID')}</div>`;
      }
      paymentInfo += `<div class="status-warning">*** BELUM LUNAS ***</div>`;
    } else if (receiptData.received !== undefined && receiptData.change !== undefined) {
      paymentInfo += `<div class="payment-line">Bayar: ${formatCurrency(receiptData.received)}</div>`;
      paymentInfo += `<div class="payment-line">Kembalian: ${formatCurrency(receiptData.change)}</div>`;
    }

    const footerText = receiptData.paymentStatus === 'partial' || receiptData.paymentStatus === 'pending'
      ? 'Terima kasih!<br>Harap lunasi pembayaran sesuai jadwal 🙏'
      : 'Terima kasih!<br>Sampai jumpa lagi 🙏';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Struk - ${receiptData.transactionId?.substring(0, 8)}</title>
        <style>
          @page {
            size: 58mm auto;
            margin: 2mm;
          }
          
          body {
            font-family: 'Courier New', monospace;
            font-size: 10px;
            line-height: 1.2;
            margin: 0;
            padding: 0;
            width: 54mm;
            color: #000;
            background: #fff;
          }
          
          .receipt {
            width: 100%;
            text-align: center;
          }
          
          .header {
            border-bottom: 1px dashed #000;
            padding-bottom: 5px;
            margin-bottom: 5px;
          }
          
          .store-name {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 2px;
          }
          
          .store-info {
            font-size: 8px;
            margin-bottom: 1px;
          }
          
          .branch-name {
            font-size: 10px;
            font-weight: bold;
            margin-top: 3px;
          }
          
          .transaction-info {
            text-align: left;
            font-size: 8px;
            margin: 5px 0;
            border-bottom: 1px dashed #000;
            padding-bottom: 5px;
          }
          
          .receipt-title {
            font-size: 12px;
            font-weight: bold;
            margin: 5px 0;
          }
          
          .items {
            text-align: left;
            margin: 5px 0;
            border-bottom: 1px dashed #000;
            padding-bottom: 5px;
          }
          
          .items-title {
            font-weight: bold;
            font-size: 9px;
            margin-bottom: 3px;
          }
          
          .item {
            margin-bottom: 2px;
          }
          
          .item-name {
            font-size: 9px;
            font-weight: bold;
          }
          
          .item-detail {
            font-size: 8px;
            margin-left: 5px;
            color: #333;
          }
          
          .total {
            font-size: 12px;
            font-weight: bold;
            margin: 5px 0;
            text-align: center;
          }
          
          .payment-info {
            font-size: 9px;
            text-align: center;
            margin: 3px 0;
          }
          
          .payment-line {
            margin: 2px 0;
          }
          
          .status-warning {
            font-weight: bold;
            margin: 3px 0;
          }
          
          .footer {
            text-align: center;
            font-size: 9px;
            font-weight: bold;
            margin-top: 8px;
            border-top: 1px dashed #000;
            padding-top: 5px;
          }
          
          @media print {
            body { 
              -webkit-print-color-adjust: exact;
              color-adjust: exact;
            }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <div class="store-name">ICHA BAKERY</div>
            <div class="store-info">Jl. Raya Bakery No. 123</div>
            <div class="store-info">Jakarta</div>
            <div class="store-info">Telp: 021-12345678</div>
            <div class="branch-name">${receiptData.branchName}</div>
          </div>
          
          <div class="receipt-title">NOTA PENJUALAN</div>
          
          <div class="transaction-info">
            <div>Kasir: ${receiptData.cashierName}</div>
            <div>${new Date(receiptData.transactionDate).toLocaleString('id-ID')}</div>
            ${receiptData.transactionId ? `<div>ID: ${receiptData.transactionId.substring(0, 8)}</div>` : ''}
          </div>
          
          <div class="items">
            <div class="items-title">DETAIL PEMBELIAN:</div>
            ${items}
          </div>
          
          <div class="total">TOTAL: ${formatCurrency(receiptData.total)}</div>
          
          <div class="payment-info">
            ${paymentInfo}
          </div>
          
          <div class="footer">
            ${footerText}
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const handlePrint = async () => {
    try {
      console.log('🖨️ Starting print process with data:', receiptData);
      
      // Validate receipt data
      if (!receiptData || !receiptData.products || receiptData.products.length === 0) {
        console.error('❌ Invalid receipt data:', receiptData);
        toast({
          title: "Error",
          description: "Data struk tidak lengkap",
          variant: "destructive"
        });
        return;
      }

      const htmlContent = generateHTMLReceipt();
      console.log('📄 Generated HTML content length:', htmlContent.length);
      
      // Create print window
      const printWindow = window.open('', '_blank', 'width=300,height=600');
      
      if (!printWindow) {
        console.error('❌ Could not open print window - popup blocked?');
        toast({
          title: "Error", 
          description: "Popup diblokir browser. Mohon izinkan popup untuk mencetak.",
          variant: "destructive"
        });
        return;
      }

      // Write content to print window
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Wait for content to load then print
      printWindow.onload = () => {
        console.log('🖨️ Print window loaded, starting print...');
        setTimeout(() => {
          printWindow.focus();
          printWindow.print();
          
          // Close window after printing (optional)
          printWindow.onafterprint = () => {
            printWindow.close();
          };
        }, 500);
      };
      
      toast({
        title: "Berhasil",
        description: "Struk siap dicetak",
      });
      
    } catch (error) {
      console.error('❌ Print error:', error);
      toast({
        title: "Error",
        description: `Gagal mencetak struk: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
  };

  const handleDownloadPDF = async () => {
    try {
      console.log('📥 Downloading PDF with data:', receiptData);
      
      // Validate receipt data
      if (!receiptData || !receiptData.products || receiptData.products.length === 0) {
        console.error('❌ Invalid receipt data for PDF:', receiptData);
        toast({
          title: "Error",
          description: "Data struk tidak lengkap untuk PDF",
          variant: "destructive"
        });
        return;
      }

      const pdf = await generateOptimizedThermalPDF();
      const filename = `struk-${receiptData.transactionId?.substring(0, 8) || Date.now()}.pdf`;
      pdf.save(filename);
      
      console.log('📄 PDF saved:', filename);
      toast({
        title: "Berhasil",
        description: "PDF struk berhasil diunduh",
      });
    } catch (error) {
      console.error('❌ PDF download error:', error);
      toast({
        title: "Error", 
        description: `Gagal mengunduh PDF: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
    <div className={`flex flex-col gap-3 ${className}`}>
      {/* Thermal Print Section */}
      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
        <div className="text-sm font-medium text-blue-900 mb-2">🖨️ Printer Thermal 58mm</div>
        <ThermalReceiptGenerator 
          receiptData={receiptData}
          className="w-full"
        />
      </div>

      {/* Regular Print Options */}
      <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
        <div className="text-sm font-medium text-gray-900 mb-2">📄 Opsi Lainnya</div>
        <div className="flex flex-col gap-2">
          {/* Regular Print Button */}
          <Button 
            onClick={handlePrint}
            size="sm"
            variant="outline"
            className="flex items-center gap-2"
          >
            <Printer className="h-4 w-4" />
            Cetak Biasa
          </Button>

          {/* Preview Dialog */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Preview Struk
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

          {/* Download PDF */}
          <Button 
            onClick={handleDownloadPDF}
            variant="outline" 
            size="sm"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* WhatsApp Share Section */}
      <div className="bg-green-50 p-3 rounded-lg border border-green-200">
        <div className="text-sm font-medium text-green-900 mb-2">💬 Bagikan WhatsApp</div>
        <div className="flex gap-2">
          <Button 
            onClick={handleCopyWhatsApp}
            variant="outline" 
            size="sm"
            className="flex items-center gap-2 flex-1"
          >
            <Copy className="h-4 w-4" />
            Copy WA
          </Button>
          
          <Button 
            onClick={handleSendWhatsApp}
            variant="outline" 
            size="sm"
            className="flex items-center gap-2 flex-1"
          >
            <Share className="h-4 w-4" />
            Kirim WA
          </Button>
        </div>
      </div>
    </div>
  );
};