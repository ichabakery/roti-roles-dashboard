
import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Copy, Receipt, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import type { Transaction } from "@/types/reports";

interface TransactionRowProps {
  transaction: Transaction;
  index: number;
  isExpanded: boolean;
  toggleRow: (id: string) => void;
  getPaymentMethodBadge: (method: string) => React.ReactNode;
  getStatusBadge: () => React.ReactNode;
  getTotalQuantity: (items: any[]) => number;
  handleView: (transaction: Transaction) => void;
  handleCopy: (id: string) => void;
  handlePrint: (transaction: Transaction) => void;
  handleDelete: (transaction: Transaction) => void;
}

export const TransactionRow: React.FC<TransactionRowProps> = ({
  transaction,
  index,
  isExpanded,
  toggleRow,
  getPaymentMethodBadge,
  getStatusBadge,
  getTotalQuantity,
  handleView,
  handleCopy,
  handlePrint,
  handleDelete,
}) => {
  const hasMultipleProducts =
    transaction.transaction_items &&
    transaction.transaction_items.length > 1;
  const firstItem = transaction.transaction_items?.[0];

  return (
    <tr
      className={`hover:bg-gray-50 ${index % 2 === 0 ? "bg-white" : "bg-gray-25"}`}
    >
      <td>
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
      <td className="font-mono text-sm">
        {transaction.id.substring(0, 8)}...
      </td>
      <td>
        {new Date(transaction.transaction_date).toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </td>
      <td>{getStatusBadge()}</td>
      <td>{transaction.cashier_name}</td>
      <td>{getPaymentMethodBadge(transaction.payment_method)}</td>
      <td>
        {transaction.transaction_items &&
        transaction.transaction_items.length > 0 ? (
          hasMultipleProducts ? (
            <span className="text-sm text-gray-600">
              {transaction.transaction_items.map((item, i) => (
                <span key={item.id}>
                  {item.products?.name || "Produk Tidak Dikenal"} x{item.quantity}
                  {i !== transaction.transaction_items.length - 1 ? ", " : ""}
                </span>
              ))}
            </span>
          ) : (
            <>
              {firstItem?.products?.name || "Tidak ada produk"} x
              {firstItem?.quantity || 0}
            </>
          )
        ) : (
          <span className="text-red-500 text-xs">Tidak ada produk</span>
        )}
      </td>
      <td className="text-right">
        {hasMultipleProducts
          ? getTotalQuantity(transaction.transaction_items)
          : firstItem?.quantity || 0}
      </td>
      <td className="text-right">
        {hasMultipleProducts
          ? "-"
          : `Rp ${(firstItem?.price_per_item || 0).toLocaleString("id-ID")}`}
      </td>
      <td className="text-right">
        {hasMultipleProducts
          ? "-"
          : `Rp ${(firstItem?.subtotal || 0).toLocaleString("id-ID")}`}
      </td>
      <td className="text-right font-medium">
        Rp {transaction.total_amount.toLocaleString("id-ID")}
      </td>
      <td>
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
          <Button
            variant="ghost"
            size="sm"
            className="p-1 text-red-600"
            onClick={() => handleDelete(transaction)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </td>
    </tr>
  );
};
