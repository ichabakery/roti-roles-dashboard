
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, Printer, Download, Copy } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { SalesReceipt } from '../receipts/SalesReceipt';
import { salesReceiptToWhatsapp } from '@/utils/receiptWhatsapp';
import { generateSalesReceiptPDF } from '@/utils/pdfService';

interface Transaction {
  id: string;
  branch_id: string;
  cashier_id: string;
  transaction_date: string;
  total_amount: number;
  payment_method: string;
  notes: string | null;
  status: string;
  products?: {
    name: string;
    quantity: number;
    price: number;
  }[];
  cashier_name?: string;
  branch_name?: string;
  received?: number;
  change?: number;
}

interface PaymentSuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction | null;
}

const getPaymentMethodLabel = (method: string) => {
  switch (method) {
    case 'cash': return 'Tunai';
    case 'card': return 'Kartu Kredit/Debit';
    case 'transfer': return 'Transfer Bank';
    case 'qris': return 'QRIS';
    default: return method;
  }
};

export const PaymentSuccessDialog: React.FC<PaymentSuccessDialogProps> = ({
  open,
  onOpenChange,
  transaction
}) => {
  // Enhanced invoice data with proper validation
  const branchName = transaction?.branch_name || "Cabang";
  const cashierName = transaction?.cashier_name || "Kasir";
  const transactionDate = transaction?.transaction_date || new Date().toISOString();
  const products = transaction?.products || [];
  const total = transaction?.total_amount || 0;
  const received = transaction?.received;
  const change = transaction?.change;
  const transactionId = transaction?.id || "";

  console.log('💰 PaymentSuccessDialog - Transaction data:', {
    transactionId,
    productsCount: products.length,
    products,
    total,
    cashierName,
    branchName
  });

  // Validate and ensure products data is properly formatted
  const validatedProducts = products.map(product => ({
    name: product.name || 'Produk Tidak Dikenal',
    quantity: product.quantity || 1,
    price: product.price || 0
  }));

  if (validatedProducts.length === 0 && total > 0) {
    // If no products but there's a total, create a generic item
    validatedProducts.push({
      name: 'Item Transaksi',
      quantity: 1,
      price: total
    });
  }

  // Print handler
  const handlePrint = () => {
    const receiptContent = document.getElementById('sales-receipt-print');
    if (!receiptContent) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Tidak dapat menemukan konten struk untuk dicetak"
      });
      return;
    }
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write('<html><head><title>Nota Transaksi</title>');
      printWindow.document.write('<style>body{padding:0;margin:0;} .receipt{font-family:monospace;font-size:10pt;width:320px;}</style>');
      printWindow.document.write('</head><body>');
      printWindow.document.write(receiptContent.innerHTML);
      printWindow.document.write('</body></html>');
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  // Generate PDF with proper data validation
  const handleDownloadPDF = async () => {
    try {
      const branding = {
        logoUrl: "",
        storeName: "Toko Roti Makmur",
        address: "Jl. Raya Bakery No. 123, Jakarta",
        phone: "021-12345678"
      };
      
      if (!transaction) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Data transaksi tidak tersedia"
        });
        return;
      }

      console.log('📄 Generating PDF with products:', validatedProducts);
      
      const doc = await generateSalesReceiptPDF({
        branchName,
        cashierName,
        transactionDate,
        products: validatedProducts,
        total,
        received,
        change,
        transactionId,
        branding
      });
      
      doc.save(`Nota_${transactionId.substring(0, 8)}.pdf`);
      toast({
        title: "Download PDF berhasil",
        description: "Nota transaksi berhasil diunduh.",
      });
    } catch (error: any) {
      console.error('❌ PDF generation error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Gagal membuat PDF: ${error.message}`
      });
    }
  };

  // Copy WhatsApp format
  const handleCopyWA = () => {
    try {
      const text = salesReceiptToWhatsapp({
        branchName,
        transactionId,
        transactionDate,
        products: validatedProducts,
        total
      });
      navigator.clipboard.writeText(text);
      toast({
        title: "Disalin ke clipboard",
        description: "Nota siap ditempel di WhatsApp.",
      });
    } catch (error: any) {
      console.error('❌ WhatsApp format error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Gagal menyalin format WhatsApp"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Check className="h-6 w-6 text-green-500 mr-2" />
            Pembayaran Berhasil
          </DialogTitle>
          <DialogDescription>
            Transaksi telah berhasil diproses dengan {validatedProducts.length} item
          </DialogDescription>
        </DialogHeader>

        {/* Receipt Preview */}
        <div id="sales-receipt-print" className="mb-4">
          <SalesReceipt
            branchName={branchName}
            cashierName={cashierName}
            transactionDate={transactionDate}
            products={validatedProducts}
            total={total}
            received={received}
            change={change}
            transactionId={transactionId}
            logoUrl=""
            storeName="Toko Roti Makmur"
            address="Jl. Raya Bakery No. 123, Jakarta"
            phone="021-12345678"
          />
        </div>
        
        <DialogFooter className="flex gap-2 flex-col sm:flex-row">
          <div className="flex gap-2 w-full">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Tutup
            </Button>
            <Button 
              onClick={handlePrint}
              className="flex-1"
              variant="outline"
            >
              <Printer className="mr-2 h-4 w-4" />
              Cetak
            </Button>
            <Button 
              onClick={handleDownloadPDF}
              className="flex-1"
              variant="outline"
            >
              <Download className="mr-2 h-4 w-4" />
              PDF
            </Button>
            <Button
              onClick={handleCopyWA}
              className="flex-1"
              variant="outline"
            >
              <Copy className="mr-2 h-4 w-4" />
              WA
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
