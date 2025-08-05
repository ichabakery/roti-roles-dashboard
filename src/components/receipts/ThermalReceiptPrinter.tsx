import React from 'react';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { generateSalesReceiptPDF, BrandingOptions } from '@/utils/pdfService';

interface ReceiptProduct {
  name: string;
  quantity: number;
  price: number;
}

interface ThermalReceiptData {
  branchName: string;
  cashierName: string;
  transactionDate: string;
  products: ReceiptProduct[];
  total: number;
  received?: number;
  change?: number;
  transactionId?: string;
  branding?: BrandingOptions;
}

interface ThermalReceiptPrinterProps {
  receiptData: ThermalReceiptData;
  className?: string;
}

export const ThermalReceiptPrinter: React.FC<ThermalReceiptPrinterProps> = ({
  receiptData,
  className = ""
}) => {
  const handlePrint = async () => {
    try {
      const pdf = await generateSalesReceiptPDF(receiptData);
      
      // Configure for 58mm thermal paper (approximately 58mm = 2.28 inches = 164 points)
      // Standard thermal receipt dimensions
      const thermalWidth = 58; // mm
      const thermalPaperWidth = thermalWidth * 2.83; // Convert mm to points (1mm ≈ 2.83 points)
      
      // Create a new PDF specifically sized for thermal printing
      const { jsPDF } = await import('jspdf');
      const thermalPdf = new jsPDF({
        unit: 'mm',
        format: [thermalWidth, 200], // Width: 58mm, Height: auto-adjust
        orientation: 'portrait'
      });

      // Add content optimized for 58mm width
      let y = 5;
      
      // Store name/branding
      thermalPdf.setFontSize(12);
      thermalPdf.setFont("helvetica", "bold");
      const storeName = receiptData.branding?.storeName || "Toko Roti Makmur";
      thermalPdf.text(storeName, thermalWidth/2, y, { align: 'center' });
      y += 6;
      
      if (receiptData.branding?.address) {
        thermalPdf.setFontSize(8);
        thermalPdf.setFont("helvetica", "normal");
        thermalPdf.text(receiptData.branding.address, thermalWidth/2, y, { align: 'center' });
        y += 4;
      }
      
      if (receiptData.branding?.phone) {
        thermalPdf.setFontSize(8);
        thermalPdf.text(`Telp: ${receiptData.branding.phone}`, thermalWidth/2, y, { align: 'center' });
        y += 4;
      }
      
      // Separator line
      thermalPdf.setLineWidth(0.1);
      thermalPdf.line(2, y, thermalWidth-2, y);
      y += 4;
      
      // Transaction info
      thermalPdf.setFontSize(8);
      thermalPdf.text(`Cabang: ${receiptData.branchName}`, 2, y);
      y += 3;
      thermalPdf.text(`Kasir: ${receiptData.cashierName}`, 2, y);
      y += 3;
      thermalPdf.text(new Date(receiptData.transactionDate).toLocaleString("id-ID"), 2, y);
      y += 3;
      
      if (receiptData.transactionId) {
        thermalPdf.text(`ID: ${receiptData.transactionId.substring(0,8)}`, 2, y);
        y += 3;
      }
      
      // Separator line
      thermalPdf.line(2, y, thermalWidth-2, y);
      y += 4;
      
      // Products header
      thermalPdf.setFont("helvetica", "bold");
      thermalPdf.text("Item", 2, y);
      thermalPdf.text("Qty", thermalWidth-25, y);
      thermalPdf.text("Total", thermalWidth-2, y, { align: 'right' });
      y += 3;
      
      thermalPdf.line(2, y, thermalWidth-2, y);
      y += 3;
      
      // Products
      thermalPdf.setFont("helvetica", "normal");
      receiptData.products.forEach(product => {
        // Product name (wrap if too long)
        const maxLineLength = 16; // Approximate characters for 58mm
        if (product.name.length > maxLineLength) {
          const line1 = product.name.substring(0, maxLineLength);
          const line2 = product.name.substring(maxLineLength);
          thermalPdf.text(line1, 2, y);
          y += 3;
          thermalPdf.text(line2, 2, y);
        } else {
          thermalPdf.text(product.name, 2, y);
        }
        
        // Quantity and price on same line as product name (or last line if wrapped)
        thermalPdf.text(product.quantity.toString(), thermalWidth-25, y);
        thermalPdf.text(`${product.price.toLocaleString("id-ID")}`, thermalWidth-2, y, { align: 'right' });
        y += 4;
      });
      
      // Separator line
      thermalPdf.line(2, y, thermalWidth-2, y);
      y += 3;
      
      // Total
      thermalPdf.setFont("helvetica", "bold");
      thermalPdf.setFontSize(10);
      thermalPdf.text("TOTAL", 2, y);
      thermalPdf.text(`Rp ${receiptData.total.toLocaleString("id-ID")}`, thermalWidth-2, y, { align: 'right' });
      y += 5;
      
      // Payment info if available
      if (receiptData.received !== undefined && receiptData.change !== undefined) {
        thermalPdf.setFont("helvetica", "normal");
        thermalPdf.setFontSize(8);
        thermalPdf.text("Bayar", 2, y);
        thermalPdf.text(`Rp ${receiptData.received.toLocaleString("id-ID")}`, thermalWidth-2, y, { align: 'right' });
        y += 3;
        thermalPdf.text("Kembalian", 2, y);
        thermalPdf.text(`Rp ${receiptData.change.toLocaleString("id-ID")}`, thermalWidth-2, y, { align: 'right' });
        y += 5;
      }
      
      // Footer
      thermalPdf.setFont("helvetica", "italic");
      thermalPdf.setFontSize(8);
      thermalPdf.text("Terima kasih!", thermalWidth/2, y, { align: 'center' });
      y += 3;
      thermalPdf.text("Sampai jumpa lagi 🙏", thermalWidth/2, y, { align: 'center' });
      
      // Print the thermal receipt
      thermalPdf.autoPrint();
      window.open(thermalPdf.output('bloburl'), '_blank');
      
    } catch (error) {
      console.error('Error printing thermal receipt:', error);
    }
  };

  return (
    <Button 
      onClick={handlePrint}
      variant="outline"
      size="sm"
      className={className}
    >
      <Printer className="h-4 w-4 mr-2" />
      Cetak Struk (58mm)
    </Button>
  );
};