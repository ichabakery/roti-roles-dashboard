
import React, { useState } from 'react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { TransactionRow } from './TransactionRow';
import { ExpandedProductRows } from './ExpandedProductRows';
import { TransactionMobileCard } from './TransactionMobileCard';
import type { Transaction } from '@/types/reports';

interface EnhancedTransactionTableProps {
  transactions: Transaction[];
  loading: boolean;
}

export const EnhancedTransactionTable: React.FC<EnhancedTransactionTableProps> = ({
  transactions,
  loading
}) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (transactionId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(transactionId)) {
      newExpanded.delete(transactionId);
    } else {
      newExpanded.add(transactionId);
    }
    setExpandedRows(newExpanded);
  };

  const getPaymentMethodBadge = (method: string) => {
    const methodUpper = method.toUpperCase();
    switch (methodUpper) {
      case 'CASH':
      case 'TUNAI':
        return <span className="bg-green-100 text-green-800 rounded px-2 py-0.5 text-xs">{methodUpper}</span>;
      case 'TRANSFER':
        return <span className="bg-orange-100 text-orange-800 rounded px-2 py-0.5 text-xs">{methodUpper}</span>;
      case 'QRIS':
        return <span className="bg-blue-100 text-blue-800 rounded px-2 py-0.5 text-xs">{methodUpper}</span>;
      default:
        return <span className="bg-gray-100 text-gray-800 rounded px-2 py-0.5 text-xs">{methodUpper}</span>;
    }
  };

  const getStatusBadge = () => {
    return <span className="bg-green-100 text-green-800 rounded px-2 py-0.5 text-xs">Selesai</span>;
  };

  const getTotalQuantity = (items: any[]) => {
    if (!items || items.length === 0) return 0;
    return items.reduce((sum, item) => sum + item.quantity, 0);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  console.log('EnhancedTransactionTable rendering with transactions:', transactions.length);
  transactions.forEach(t => {
    console.log('Transaction:', t.id, 'Items:', t.transaction_items?.length || 0, 'First item:', t.transaction_items?.[0]);
  });

  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden lg:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-8"></TableHead>
              <TableHead>ID Transaksi</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Kasir</TableHead>
              <TableHead>Metode Bayar</TableHead>
              <TableHead>Produk</TableHead>
              <TableHead className="text-center">Qty</TableHead>
              <TableHead className="text-right">Harga Satuan</TableHead>
              <TableHead className="text-right">Subtotal</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction, idx) => {
              const isExpanded = expandedRows.has(transaction.id);
              return (
                <React.Fragment key={transaction.id}>
                  <TransactionRow
                    transaction={transaction}
                    index={idx}
                    isExpanded={isExpanded}
                    toggleRow={toggleRow}
                    getPaymentMethodBadge={getPaymentMethodBadge}
                    getStatusBadge={getStatusBadge}
                    getTotalQuantity={getTotalQuantity}
                  />
                  {isExpanded && (
                    <ExpandedProductRows transaction={transaction} />
                  )}
                </React.Fragment>
              );
            })}
            {transactions.length === 0 && (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-8 text-gray-500">
                  Tidak ada transaksi ditemukan untuk periode yang dipilih
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards - Remove action buttons */}
      <div className="lg:hidden space-y-4 p-4">
        {transactions.map((transaction) => (
          <div key={transaction.id} className="bg-white border rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-mono text-sm text-gray-600">
                  {transaction.id.substring(0, 8)}...
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(transaction.transaction_date).toLocaleDateString('id-ID', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <div className="text-right">
                {getStatusBadge()}
                <p className="text-lg font-semibold mt-1">
                  Rp {transaction.total_amount.toLocaleString('id-ID')}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-500">Kasir:</span>
                <p className="font-medium">{transaction.cashier_name}</p>
              </div>
              <div>
                <span className="text-gray-500">Metode:</span>
                <div className="mt-1">{getPaymentMethodBadge(transaction.payment_method)}</div>
              </div>
            </div>

            {transaction.transaction_items && transaction.transaction_items.length > 0 && (
              <div className="border-t pt-2">
                <p className="text-sm text-gray-500 mb-2">Produk:</p>
                {transaction.transaction_items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span>{item.products?.name || 'Produk tidak dikenal'}</span>
                    <span>{item.quantity}x</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
