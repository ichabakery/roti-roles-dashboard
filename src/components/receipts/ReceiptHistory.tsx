
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ReceiptPreviewDialog } from "./ReceiptPreviewDialog";
import { Download } from "lucide-react";
import { generateSalesReceiptPDF } from "@/utils/pdfService";
import { toast } from "@/hooks/use-toast";

// Transaction type, simplified for the table display
interface ReceiptHistoryItem {
  id: string;
  date: string;
  branch: string;
  cashier: string;
  total: number;
  products: { name: string; quantity: number; price: number }[];
  received?: number;
  change?: number;
}

interface ReceiptHistoryProps {
  transactions: {
    id: string;
    transaction_date: string;
    branches: { id: string; name: string };
    cashier_name: string;
    total_amount: number;
    transaction_items: { products: { name: string }; quantity: number; price_per_item: number; subtotal: number }[];
    received?: number; // If available
    change?: number;   // If available
  }[];
}

export const ReceiptHistory: React.FC<ReceiptHistoryProps> = ({ transactions }) => {
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptHistoryItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Transform props for preview/download
  const handleViewReceipt = (txn: ReceiptHistoryProps["transactions"][0]) => {
    setSelectedReceipt({
      id: txn.id,
      date: txn.transaction_date,
      branch: txn.branches?.name || "-",
      cashier: txn.cashier_name || "-",
      total: txn.total_amount,
      products: txn.transaction_items.map(item => ({
        name: item.products?.name || "",
        quantity: item.quantity,
        price: item.subtotal
      })),
      received: txn.received,
      change: txn.change,
    });
    setDialogOpen(true);
  };

  const handleDownloadReceipt = async (txn: ReceiptHistoryProps["transactions"][0]) => {
    try {
      const branding = {
        logoUrl: "", // Add logic for logo if needed
        storeName: "Toko Roti Makmur",
        address: "",
        phone: ""
      };
      await generateSalesReceiptPDF({
        branchName: txn.branches?.name || "",
        cashierName: txn.cashier_name || "",
        transactionDate: txn.transaction_date,
        products: txn.transaction_items.map(item => ({
          name: item.products?.name || "",
          quantity: item.quantity,
          price: item.subtotal,
        })),
        total: txn.total_amount,
        received: txn.received,
        change: txn.change,
        transactionId: txn.id,
        branding
      }).then(doc => {
        doc.save(`Nota_${txn.id.substring(0, 8)}.pdf`);
        toast({
          title: "Download berhasil",
          description: "Nota transaksi berhasil diunduh."
        });
      });
    } catch (e: any) {
      toast({
        title: "Gagal unduh nota",
        description: e?.message || "Terjadi kesalahan saat mengunduh PDF",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">Riwayat Nota Transaksi</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-2 py-1">Tgl/Waktu</th>
              <th className="px-2 py-1">ID Nota</th>
              <th className="px-2 py-1">Cabang</th>
              <th className="px-2 py-1">Kasir</th>
              <th className="px-2 py-1 text-right">Total</th>
              <th className="px-2 py-1 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-4 text-muted-foreground">Tidak ada data transaksi.</td>
              </tr>
            )}
            {transactions.map(row => (
              <tr key={row.id} className="border-t">
                <td className="px-2 py-1">{new Date(row.transaction_date).toLocaleString("id-ID")}</td>
                <td className="px-2 py-1">{row.id.substring(0, 8)}</td>
                <td className="px-2 py-1">{row.branches?.name}</td>
                <td className="px-2 py-1">{row.cashier_name}</td>
                <td className="px-2 py-1 text-right">Rp {row.total_amount.toLocaleString("id-ID")}</td>
                <td className="px-2 py-1 text-center flex gap-2 justify-center">
                  <Button size="sm" variant="outline" onClick={() => handleViewReceipt(row)}>Lihat</Button>
                  <Button size="sm" variant="outline" onClick={() => handleDownloadReceipt(row)}>
                    <Download className="w-4 h-4 mr-1" /> PDF
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selectedReceipt &&
        <ReceiptPreviewDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          receipt={selectedReceipt}
        />
      }
    </div>
  );
}
