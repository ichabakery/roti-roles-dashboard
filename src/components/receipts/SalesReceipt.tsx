
import React from "react";

interface ReceiptProduct {
  name: string;
  quantity: number;
  price: number;
}

interface SalesReceiptProps {
  branchName: string;
  cashierName: string;
  transactionDate: string;
  products: ReceiptProduct[];
  total: number;
  received?: number;
  change?: number;
  transactionId?: string;
}

export const SalesReceipt: React.FC<SalesReceiptProps> = ({
  branchName,
  cashierName,
  transactionDate,
  products,
  total,
  received,
  change,
  transactionId
}) => {
  return (
    <div className="w-[320px] p-4 bg-white rounded shadow text-xs text-gray-900 font-mono mx-auto">
      <div className="text-center font-bold text-base mb-2">Toko Roti Makmur</div>
      <div className="text-center text-xs mb-1">{branchName}</div>
      <div className="flex justify-between text-xs">
        <span>Kasir: {cashierName}</span>
        <span>{new Date(transactionDate).toLocaleString("id-ID")}</span>
      </div>
      <div className="mb-2 text-xs">ID: {(transactionId || "").substring(0, 8)}</div>
      <hr className="my-2 border-gray-300" />
      <table className="w-full mb-2">
        <thead>
          <tr>
            <th className="text-left">Item</th>
            <th className="text-center">Qty</th>
            <th className="text-right">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p, i) => (
            <tr key={i} className="align-top">
              <td>{p.name}</td>
              <td className="text-center">{p.quantity}</td>
              <td className="text-right">Rp {p.price.toLocaleString("id-ID")}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <hr className="my-2 border-gray-300" />
      <div className="flex justify-between font-bold">
        <span>Total</span>
        <span>Rp {total.toLocaleString("id-ID")}</span>
      </div>
      {received !== undefined && change !== undefined && (
        <>
          <div className="flex justify-between">
            <span>Bayar</span>
            <span>Rp {received.toLocaleString("id-ID")}</span>
          </div>
          <div className="flex justify-between">
            <span>Kembalian</span>
            <span>Rp {change.toLocaleString("id-ID")}</span>
          </div>
        </>
      )}
      <div className="text-center mt-4 text-xs">Terima kasih telah berbelanja! 🙏</div>
    </div>
  );
};
