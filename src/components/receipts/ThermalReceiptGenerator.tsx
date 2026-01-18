import React from 'react';
import { Button } from '@/components/ui/button';
import { Printer, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface ReceiptProduct {
  name: string;
  quantity: number;
  price: number;
}

interface ThermalReceiptData {
  branchName: string;
  branchAddress?: string;
  branchPhone?: string;
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

interface ThermalReceiptGeneratorProps {
  receiptData: ThermalReceiptData;
  className?: string;
}

export const ThermalReceiptGenerator: React.FC<ThermalReceiptGeneratorProps> = ({
  receiptData,
  className = ""
}) => {
  const { toast } = useToast();

  const generateThermalHTML = () => {
    const formatCurrency = (amount: number) => {
      return `Rp ${amount.toLocaleString('id-ID')}`;
    };

    // Generate items with proper line length (max 32 chars for 58mm)
    const items = receiptData.products.map((product, index) => {
      const unitPrice = product.price / product.quantity;
      const itemLine = `${index + 1}. ${product.name}`;
      const detailLine = `  ${product.quantity}x${formatCurrency(unitPrice)}=${formatCurrency(product.price)}`;
      
      return `
        <div class="item">
          <div class="item-name">${itemLine}</div>
          <div class="item-detail">${detailLine}</div>
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
        paymentInfo += `<div class="payment-line">Tempo: ${new Date(receiptData.dueDate).toLocaleDateString('id-ID')}</div>`;
      }
      paymentInfo += `<div class="status-warning">*** BELUM LUNAS ***</div>`;
    } else if (receiptData.received !== undefined && receiptData.change !== undefined) {
      paymentInfo += `<div class="payment-line">Bayar: ${formatCurrency(receiptData.received)}</div>`;
      paymentInfo += `<div class="payment-line">Kembali: ${formatCurrency(receiptData.change)}</div>`;
    }

    const footerText = receiptData.paymentStatus === 'partial' || receiptData.paymentStatus === 'pending'
      ? 'Terima kasih!<br>Mohon lunasi sesuai jadwal'
      : 'Terima kasih!<br>Sampai jumpa lagi';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Struk Thermal - ${receiptData.transactionId?.substring(0, 8)}</title>
        <style>
          /* Thermal 58mm Print Styles */
          @page {
            size: 58mm auto !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Courier New', 'Consolas', 'Monaco', monospace !important;
            font-size: 11px !important;
            line-height: 1.3 !important;
            width: 58mm !important;
            max-width: 58mm !important;
            margin: 0 !important;
            padding: 2mm 3mm !important;
            background: white !important;
            color: black !important;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          .thermal-receipt {
            width: 100% !important;
            max-width: 52mm !important;
            font-size: 11px !important;
            margin: 0 auto !important;
          }
          
          .center { text-align: center !important; }
          .left { text-align: left !important; }
          .bold { font-weight: bold !important; }
          
          .store-header {
            text-align: center !important;
            margin-bottom: 3mm !important;
            border-bottom: 1px dashed black !important;
            padding-bottom: 2mm !important;
          }
          
          .store-name {
            font-size: 14px !important;
            font-weight: bold !important;
            margin-bottom: 1mm !important;
          }
          
          .store-info {
            font-size: 9px !important;
            line-height: 1.2 !important;
            margin-bottom: 0.5mm !important;
          }
          
          .branch-name {
            font-size: 11px !important;
            font-weight: bold !important;
            margin-top: 2mm !important;
          }
          
          .receipt-title {
            text-align: center !important;
            font-size: 12px !important;
            font-weight: bold !important;
            margin: 2mm 0 !important;
          }
          
          .transaction-info {
            font-size: 9px !important;
            margin: 2mm 0 !important;
            border-bottom: 1px dashed black !important;
            padding-bottom: 2mm !important;
            line-height: 1.3 !important;
          }
          
          .items-section {
            margin: 2mm 0 !important;
            border-bottom: 1px dashed black !important;
            padding-bottom: 2mm !important;
          }
          
          .items-title {
            font-size: 10px !important;
            font-weight: bold !important;
            margin-bottom: 2mm !important;
          }
          
          .item {
            margin-bottom: 1.5mm !important;
          }
          
          .item-name {
            font-size: 10px !important;
            font-weight: bold !important;
            word-wrap: break-word !important;
            margin-bottom: 0.5mm !important;
          }
          
          .item-detail {
            font-size: 9px !important;
            margin-left: 3mm !important;
          }
          
          .total-section {
            text-align: center !important;
            font-size: 12px !important;
            font-weight: bold !important;
            margin: 2mm 0 !important;
          }
          
          .payment-section {
            text-align: center !important;
            font-size: 10px !important;
            margin: 2mm 0 !important;
          }
          
          .payment-line {
            margin: 1mm 0 !important;
          }
          
          .status-warning {
            font-weight: bold !important;
            font-size: 11px !important;
            margin: 2mm 0 !important;
          }
          
          .footer {
            text-align: center !important;
            font-size: 10px !important;
            font-weight: bold !important;
            margin-top: 3mm !important;
            border-top: 1px dashed black !important;
            padding-top: 2mm !important;
            line-height: 1.3 !important;
          }
          
          /* Hide elements for thermal printing */
          @media print {
            body {
              width: 58mm !important;
              font-size: 9px !important;
            }
            
            .no-print {
              display: none !important;
            }
          }
          
          /* Mobile specific adjustments */
          @media screen and (max-width: 480px) {
            body {
              font-size: 8px !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="thermal-receipt">
          <!-- Store Header -->
          <div class="store-header">
            <div class="store-name">ICHA BAKERY</div>
            <div class="store-info">${receiptData.branchAddress || 'Alamat cabang'}</div>
            <div class="store-info">Telp: ${receiptData.branchPhone || '-'}</div>
            <div class="branch-name">${receiptData.branchName}</div>
          </div>
          
          <!-- Receipt Title -->
          <div class="receipt-title">NOTA PENJUALAN</div>
          
          <!-- Transaction Info -->
          <div class="transaction-info">
            <div>Kasir: ${receiptData.cashierName}</div>
            <div>${new Date(receiptData.transactionDate).toLocaleString('id-ID')}</div>
            ${receiptData.transactionId ? `<div>ID: ${receiptData.transactionId.substring(0, 8)}</div>` : ''}
          </div>
          
          <!-- Items -->
          <div class="items-section">
            <div class="items-title">DETAIL PEMBELIAN:</div>
            ${items}
          </div>
          
          <!-- Total -->
          <div class="total-section">
            TOTAL: ${formatCurrency(receiptData.total)}
          </div>
          
          <!-- Payment Info -->
          <div class="payment-section">
            ${paymentInfo}
          </div>
          
          <!-- Footer -->
          <div class="footer">
            ${footerText}
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const handleThermalPrint = async () => {
    try {
      console.log('🖨️ Starting thermal print (58mm) with data:', receiptData);
      
      if (!receiptData || !receiptData.products || receiptData.products.length === 0) {
        toast({
          title: "Error",
          description: "Data struk tidak lengkap",
          variant: "destructive"
        });
        return;
      }

      const htmlContent = generateThermalHTML();
      
      // Open print window with thermal-specific dimensions
      const printWindow = window.open('', '_blank', 'width=250,height=700,scrollbars=yes');
      
      if (!printWindow) {
        toast({
          title: "Error", 
          description: "Mohon izinkan popup untuk mencetak struk thermal",
          variant: "destructive"
        });
        return;
      }

      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.focus();
          printWindow.print();
          
          printWindow.onafterprint = () => {
            printWindow.close();
          };
        }, 1000);
      };
      
      toast({
        title: "Berhasil",
        description: "Struk thermal (58mm) siap dicetak",
      });
      
    } catch (error) {
      console.error('❌ Thermal print error:', error);
      toast({
        title: "Error",
        description: `Gagal mencetak struk thermal: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
  };

  const PreviewContent = () => (
    <div className="max-w-[58mm] mx-auto bg-white font-mono text-[9px] leading-tight border border-gray-300" style={{ padding: '2mm 3mm', width: '58mm' }}>
      {/* Store Header */}
      <div className="text-center mb-2 pb-1" style={{ borderBottom: '1px dashed #000' }}>
        <div className="font-bold text-sm mb-1">ICHA BAKERY</div>
        <div className="text-[7px] leading-tight">{receiptData.branchAddress || 'Alamat cabang'}</div>
        <div className="text-[7px] leading-tight">Telp: {receiptData.branchPhone || '-'}</div>
        <div className="font-bold text-[9px] mt-1">{receiptData.branchName}</div>
      </div>
      
      {/* Receipt Title */}
      <div className="text-center font-bold text-[10px] my-1">NOTA PENJUALAN</div>
      
      {/* Transaction Info */}
      <div className="text-[7px] my-1 pb-1" style={{ borderBottom: '1px dashed #000' }}>
        <div>Kasir: {receiptData.cashierName}</div>
        <div>{new Date(receiptData.transactionDate).toLocaleString('id-ID')}</div>  
        {receiptData.transactionId && <div>ID: {receiptData.transactionId.substring(0, 8)}</div>}
      </div>
      
      {/* Items */}
      <div className="my-1 pb-1" style={{ borderBottom: '1px dashed #000' }}>
        <div className="font-bold text-[8px] mb-1">DETAIL PEMBELIAN:</div>
        {receiptData.products.map((product, index) => {
          const unitPrice = product.price / product.quantity;
          return (
            <div key={index} className="mb-1">
              <div className="font-bold text-[8px]">{index + 1}. {product.name}</div>
              <div className="text-[7px] ml-2">
                  {product.quantity}x{formatCurrency(unitPrice)}={formatCurrency(product.price)}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Total */}
      <div className="text-center font-bold text-[10px] my-1">
        TOTAL: {formatCurrency(receiptData.total)}
      </div>
      
      {/* Payment Info */}
      {(receiptData.paymentStatus === 'partial' || receiptData.paymentStatus === 'pending') ? (
        <div className="text-center text-[8px] my-1">
          {receiptData.amountPaid && receiptData.amountPaid > 0 && (
            <div>DP: {formatCurrency(receiptData.amountPaid)}</div>
          )}
          <div>SISA: {formatCurrency(receiptData.amountRemaining || receiptData.total)}</div>
          {receiptData.dueDate && (
            <div>Tempo: {new Date(receiptData.dueDate).toLocaleDateString('id-ID')}</div>
          )}
          <div className="font-bold text-[9px] my-1">*** BELUM LUNAS ***</div>
        </div>
      ) : receiptData.received !== undefined && receiptData.change !== undefined && (
        <div className="text-center text-[8px] my-1">
          <div>Bayar: {formatCurrency(receiptData.received)}</div>
          <div>Kembali: {formatCurrency(receiptData.change)}</div>
        </div>
      )}
      
      {/* Footer */}
      <div className="text-center text-[8px] font-bold mt-2 pt-1" style={{ borderTop: '1px dashed #000' }}>
        {receiptData.paymentStatus === 'partial' || receiptData.paymentStatus === 'pending' ? (
          <>Terima kasih!<br />Mohon lunasi sesuai jadwal</>
        ) : (
          <>Terima kasih!<br />Sampai jumpa lagi</>
        )}
      </div>
    </div>
  );

  const formatCurrency = (amount: number) => {
    return `Rp ${amount.toLocaleString('id-ID')}`;
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {/* Thermal Print Button */}
      <Button 
        onClick={handleThermalPrint}
        size="sm"
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
      >
        <Printer className="h-4 w-4" />
        Cetak Thermal 58mm
      </Button>

      {/* Preview Dialog */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Preview 58mm
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Preview Struk Thermal 58mm</DialogTitle>
          </DialogHeader>
          <PreviewContent />
          <div className="text-xs text-gray-600 mt-2 p-2 bg-yellow-50 rounded">
            💡 <strong>Tips Thermal Printer:</strong><br />
            • Pastikan printer dalam mode ESC/POS<br />
            • Gunakan kertas thermal 58mm<br />
            • Set printer ke mode "Receipt" di pengaturan browser<br />
            • Untuk hasil terbaik, gunakan Chrome atau Firefox
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};