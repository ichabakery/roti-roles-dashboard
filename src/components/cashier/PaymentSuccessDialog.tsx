
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, Printer, Download, Copy } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { SalesReceipt } from '../receipts/SalesReceipt';
import { salesReceiptToWhatsapp } from '@/utils/receiptWhatsapp';

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

// For now, PaymentSuccessDialog just expects transaction, but we enhance below
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
  // Invoice data
  const branchName = transaction?.branch_name || "Cabang";
  const cashierName = transaction?.cashier_name || "Kasir";
  const transactionDate = transaction?.transaction_date || "";
  const products = transaction?.products || [];
  const total = transaction?.total_amount || 0;
  const received = transaction?.received;
  const change = transaction?.change;
  const transactionId = transaction?.id || "";

  // Print handler
  const handlePrint = () => {
    const receiptContent = document.getElementById('sales-receipt-print');
    if (!receiptContent) return;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write('<html><head><title>Nota Transaksi</title>');
      printWindow.document.write('<style>body{padding:0;margin:0;} .receipt{font-family:monospace;font-size:10pt;width:320px;}</style>');
      printWindow.document.write('</head><body >');
      printWindow.document.write(receiptContent.innerHTML);
      printWindow.document.write('</body></html>');
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  // Download PDF - placeholder using print (next: jsPDF/@react-pdf)
  const handleDownloadPDF = () => {
    handlePrint();
    toast({
      title: "Download PDF",
      description: "Download PDF nota transaksi (format profesional) dalam pengembangan.",
    });
  };

  // Copy WhatsApp format
  const handleCopyWA = () => {
    const text = salesReceiptToWhatsapp({
      branchName,
      transactionId,
      transactionDate,
      products,
      total
    });
    navigator.clipboard.writeText(text);
    toast({
      title: "Disalin ke clipboard",
      description: "Nota siap ditempel di WhatsApp.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Check className="h-6 w-6 text-green-500 mr-2" />
            Pembayaran Berhasil
          </DialogTitle>
          <DialogDescription>
            Transaksi telah berhasil diproses
          </DialogDescription>
        </DialogHeader>

        {/* Receipt Preview */}
        <div id="sales-receipt-print" className="mb-4">
          <SalesReceipt
            branchName={branchName}
            cashierName={cashierName}
            transactionDate={transactionDate}
            products={products}
            total={total}
            received={received}
            change={change}
            transactionId={transactionId}
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
              Cetak/Thermal
            </Button>
            <Button 
              onClick={handleDownloadPDF}
              className="flex-1"
              variant="outline"
            >
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
            <Button
              onClick={handleCopyWA}
              className="flex-1"
              variant="outline"
            >
              <Copy className="mr-2 h-4 w-4" />
              Salin WhatsApp
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
