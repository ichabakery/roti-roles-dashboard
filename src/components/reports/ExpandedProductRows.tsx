
import React from "react";
import type { Transaction } from "@/types/reports";

interface ExpandedProductRowsProps {
  transaction: Transaction;
}

export const ExpandedProductRows: React.FC<ExpandedProductRowsProps> = ({
  transaction,
}) => {
  if (!transaction.transaction_items || transaction.transaction_items.length <= 1) {
    return null;
  }

  return (
    <>
      {transaction.transaction_items.map((item, itemIndex) => (
        <tr
          key={`${transaction.id}-${item.id}`}
          className="bg-blue-50/50 animate-fade-in"
        >
          <td className="p-2"></td>
          <td className="text-sm text-gray-500 p-2">└─ Item {itemIndex + 1}</td>
          <td className="p-2"></td>
          <td className="p-2"></td>
          <td className="p-2"></td>
          <td className="p-2"></td>
          <td className="font-medium p-2">
            {item.products?.name || "Produk Tidak Dikenal"}
          </td>
          <td className="text-right p-2">{item.quantity}</td>
          <td className="text-right p-2">
            Rp {item.price_per_item.toLocaleString("id-ID")}
          </td>
          <td className="text-right p-2">
            Rp {item.subtotal.toLocaleString("id-ID")}
          </td>
          <td className="p-2"></td>
          <td className="p-2"></td>
        </tr>
      ))}
    </>
  );
};
