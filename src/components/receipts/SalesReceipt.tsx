
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
  logoUrl?: string;
  storeName?: string;
  address?: string;
  phone?: string;
  // New props for payment status
  paymentStatus?: 'paid' | 'pending' | 'partial' | 'cancelled';
  amountPaid?: number;
  amountRemaining?: number;
  dueDate?: string;
  // Discount props
  subtotal?: number;
  discountAmount?: number;
}

export const SalesReceipt: React.FC<SalesReceiptProps> = ({
  branchName,
  cashierName,
  transactionDate,
  products,
  total,
  received,
  change,
  transactionId,
  logoUrl,
  storeName = "Icha Bakery",
  address = "Jl. Raya Bakery No. 123",
  phone = "021-12345678",
  paymentStatus,
  amountPaid,
  amountRemaining,
  dueDate,
  subtotal,
  discountAmount
}) => {
  const isPartialPayment = paymentStatus === 'partial' || paymentStatus === 'pending';
  
  return (
    <div className="w-[220px] p-2 bg-white rounded shadow text-xs text-gray-900 font-mono mx-auto" style={{ maxWidth: '58mm' }}>
      {/* Branding/logo */}
      {logoUrl && (
        <div className="flex justify-center mb-1">
          <img src={logoUrl} alt="Logo Toko" className="h-6 object-contain" />
        </div>
      )}
      <div className="text-center font-bold text-sm mb-1">{storeName}</div>
      {address && (
        <div className="text-center text-xs mb-1">{address}</div>
      )}
      {phone && (
        <div className="text-center text-xs mb-1">Telp: {phone}</div>
      )}
      <div className="text-center text-xs mb-2">{branchName}</div>
      <div className="text-xs mb-1">Kasir: {cashierName}</div>
      <div className="text-xs mb-1">{new Date(transactionDate).toLocaleString("id-ID")}</div>
      {transactionId && (
        <div className="mb-2 text-xs">ID: {transactionId.substring(0, 8)}</div>
      )}
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
      
      {/* Show subtotal and discount if applicable */}
      {discountAmount && discountAmount > 0 && (
        <>
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>Rp {(subtotal || total + discountAmount).toLocaleString("id-ID")}</span>
          </div>
          <div className="flex justify-between text-red-600">
            <span>Diskon</span>
            <span>-Rp {discountAmount.toLocaleString("id-ID")}</span>
          </div>
        </>
      )}
      
      <div className="flex justify-between font-bold">
        <span>Total</span>
        <span>Rp {total.toLocaleString("id-ID")}</span>
      </div>

      {/* Payment Information */}
      {isPartialPayment ? (
        // Show Down Payment / Partial Payment Info
        <>
          <div className="flex justify-between text-red-600 font-medium">
            <span>
              {paymentStatus === 'pending' ? 'Status:' : 'DP Dibayar:'}
            </span>
            <span>
              {paymentStatus === 'pending' 
                ? 'BELUM LUNAS' 
                : `Rp ${(amountPaid || 0).toLocaleString("id-ID")}`
              }
            </span>
          </div>
          <div className="flex justify-between text-red-600 font-medium">
            <span>Sisa Bayar:</span>
            <span>Rp {(amountRemaining || total).toLocaleString("id-ID")}</span>
          </div>
          {dueDate && (
            <div className="flex justify-between text-xs">
              <span>Jatuh Tempo:</span>
              <span>{new Date(dueDate).toLocaleDateString('id-ID')}</span>
            </div>
          )}
          <div className="text-center mt-2 text-xs text-red-600 font-bold">
            *** PEMBAYARAN BELUM LUNAS ***
          </div>
        </>
      ) : (
        // Show Full Payment Info (existing logic)
        received !== undefined && change !== undefined && (
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
        )
      )}
      
      <div className="text-center mt-4 text-xs">
        {isPartialPayment 
          ? "Harap selesaikan pembayaran sesuai jadwal 🙏" 
          : "Terima kasih telah berbelanja! 🙏"
        }
      </div>
    </div>
  );
};
