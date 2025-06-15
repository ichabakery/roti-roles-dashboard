
import React from "react";
import { Button } from "@/components/ui/button";
import { Eye, Copy, Receipt } from "lucide-react";
import type { Transaction } from "@/types/reports";

interface TransactionMobileCardProps {
  transaction: Transaction;
  getStatusBadge: () => React.ReactNode;
  getPaymentMethodBadge: (method: string) => React.ReactNode;
  handleView: (transaction: Transaction) => void;
  handleCopy: (id: string) => void;
  handlePrint: (transaction: Transaction) => void;
  formatDate: (dateString: string) => string;
}

export const TransactionMobileCard: React.FC<TransactionMobileCardProps> = ({
  transaction,
  getStatusBadge,
  getPaymentMethodBadge,
  handleView,
  handleCopy,
  handlePrint,
  formatDate,
}) => {
  const getProductsList = () => {
    if (!transaction.transaction_items || transaction.transaction_items.length === 0) {
      return <span className="text-red-500 text-xs">Tidak ada produk</span>;
    }

    return (
      <div className="space-y-1">
        {transaction.transaction_items.map((item, i) => (
          <div key={item.id} className="text-sm">
            <div className="flex justify-between items-center">
              <span className="font-medium">
                {item.products?.name || "Produk Tidak Dikenal"}
              </span>
              <span className="text-gray-500">x{item.quantity}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-600">
              <span>Rp {item.price_per_item.toLocaleString("id-ID")}</span>
              <span>Rp {item.subtotal.toLocaleString("id-ID")}</span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="border rounded-lg p-4 bg-white animate-fade-in">
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="font-mono text-sm text-gray-600">
            {transaction.id.substring(0, 8)}...
          </div>
          <div className="text-sm text-gray-500">
            {formatDate(transaction.transaction_date)}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          {getStatusBadge()}
          {getPaymentMethodBadge(transaction.payment_method)}
        </div>
      </div>

      <div className="text-lg font-bold mb-3">
        Rp {transaction.total_amount.toLocaleString("id-ID")}
      </div>

      <div className="mb-3">
        {getProductsList()}
      </div>

      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-500">
          Kasir: {transaction.cashier_name}
        </span>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="p-1"
            onClick={() => handleView(transaction)}
          >
            <Eye className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="p-1"
            onClick={() => handleCopy(transaction.id)}
          >
            <Copy className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="p-1"
            onClick={() => handlePrint(transaction)}
          >
            <Receipt className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};
