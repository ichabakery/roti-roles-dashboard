
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { SalesReceipt } from "./SalesReceipt";
import { Button } from "@/components/ui/button";

interface ReceiptProduct {
  name: string;
  quantity: number;
  price: number;
}

interface ReceiptPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receipt: {
    id: string;
    date: string;
    branch: string;
    cashier: string;
    total: number;
    products: ReceiptProduct[];
    received?: number;
    change?: number;
  };
}

export const ReceiptPreviewDialog: React.FC<ReceiptPreviewDialogProps> = ({ open, onOpenChange, receipt }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Preview Nota</DialogTitle>
        </DialogHeader>
        <SalesReceipt
          branchName={receipt.branch}
          cashierName={receipt.cashier}
          transactionDate={receipt.date}
          products={receipt.products}
          total={receipt.total}
          received={receipt.received}
          change={receipt.change}
          transactionId={receipt.id}
          storeName="Toko Roti Makmur"
        />
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Tutup</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
