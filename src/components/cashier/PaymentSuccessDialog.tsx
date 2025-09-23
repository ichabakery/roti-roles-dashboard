
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, Printer, Download, Copy } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { SalesReceipt } from '../receipts/SalesReceipt';
import { UnifiedThermalReceipt } from '../receipts/UnifiedThermalReceipt';
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

  const validatedProducts = products.map(product => ({
    name: product.name || 'Produk Tidak Dikenal',
    quantity: product.quantity || 1,
    price: product.price || 0 // This is already the subtotal (quantity * unit_price)
  }));

  if (validatedProducts.length === 0 && total > 0) {
    validatedProducts.push({
      name: 'Item Transaksi',
      quantity: 1,
      price: total
    });
  }

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

  const handleDownloadPDF = async () => {
    try {
      const branding = {
        logoUrl: "",
        storeName: "Icha Bakery", // Updated store name
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
            storeName="Icha Bakery" // Updated store name
            address="Jl. Raya Bakery No. 123, Jakarta"
            phone="021-12345678"
          />
        </div>
        
        <div className="space-y-3">
          <UnifiedThermalReceipt
            receiptData={{
              type: 'transaction',
              branchName,
              cashierName,
              transactionDate,
              products: validatedProducts,
              total,
              received,
              change,
              transactionId
            }}
            showWhatsApp={true}
            showPDF={true}
          />
          
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            Tutup
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
