
import React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Transaction } from "@/types/reports";

interface TransactionRowProps {
  transaction: Transaction;
  index: number;
  isExpanded: boolean;
  toggleRow: (id: string) => void;
  getPaymentMethodBadge: (method: string) => React.ReactNode;
  getStatusBadge: () => React.ReactNode;
  getTotalQuantity: (items: any[]) => number;
}

export const TransactionRow: React.FC<TransactionRowProps> = ({
  transaction,
  index,
  isExpanded,
  toggleRow,
  getPaymentMethodBadge,
  getStatusBadge,
  getTotalQuantity,
}) => {
  const hasMultipleProducts = transaction.transaction_items && transaction.transaction_items.length > 1;
  const firstItem = transaction.transaction_items?.[0];
  
  console.log('TransactionRow - transaction:', transaction.id, 'items:', transaction.transaction_items);
  
  // Improved product display logic
  const getProductDisplay = () => {
    if (!transaction.transaction_items || transaction.transaction_items.length === 0) {
      return <span className="text-red-500 text-xs">Tidak ada produk</span>;
    }

    if (hasMultipleProducts) {
      return (
        <span className="text-sm text-gray-600">
          {transaction.transaction_items.length} produk - 
          <span className="font-medium ml-1">
            {transaction.transaction_items[0]?.products?.name || "Produk tidak dikenal"}
            {transaction.transaction_items.length > 1 && ` +${transaction.transaction_items.length - 1} lainnya`}
          </span>
        </span>
      );
    }

    return (
      <span className="font-medium">
        {firstItem?.products?.name || "Produk Tidak Dikenal"}
      </span>
    );
  };

  const getQuantityDisplay = () => {
    if (!transaction.transaction_items || transaction.transaction_items.length === 0) return 0;
    
    if (hasMultipleProducts) {
      return getTotalQuantity(transaction.transaction_items);
    }
    
    return firstItem?.quantity || 0;
  };

  const getPriceDisplay = () => {
    if (!firstItem || hasMultipleProducts) return "-";
    return `Rp ${firstItem.price_per_item.toLocaleString("id-ID")}`;
  };

  const getSubtotalDisplay = () => {
    if (!firstItem || hasMultipleProducts) return "-";
    return `Rp ${firstItem.subtotal.toLocaleString("id-ID")}`;
  };

  return (
    <tr className={`hover:bg-gray-50 ${index % 2 === 0 ? "bg-white" : "bg-gray-25"}`}>
      <td className="p-2">
        {hasMultipleProducts && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleRow(transaction.id)}
            className="p-1"
            aria-label={isExpanded ? "Tutup detail" : "Lihat detail"}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        )}
      </td>
      <td className="font-mono text-sm p-2">
        {transaction.id.substring(0, 8)}...
      </td>
      <td className="p-2">
        {new Date(transaction.transaction_date).toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </td>
      <td className="p-2">{getStatusBadge()}</td>
      <td className="p-2">{transaction.cashier_name}</td>
      <td className="p-2">{getPaymentMethodBadge(transaction.payment_method)}</td>
      <td className="p-2">{getProductDisplay()}</td>
      <td className="text-right p-2">{getQuantityDisplay()}</td>
      <td className="text-right p-2">{getPriceDisplay()}</td>
      <td className="text-right p-2">{getSubtotalDisplay()}</td>
      <td className="text-right font-medium p-2">
        Rp {transaction.total_amount.toLocaleString("id-ID")}
      </td>
    </tr>
  );
};
