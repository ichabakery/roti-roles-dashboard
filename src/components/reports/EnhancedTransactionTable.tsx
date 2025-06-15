
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
    // Kolom status default always selesai (completed)
    return <span className="bg-green-100 text-green-800 rounded px-2 py-0.5 text-xs">Selesai</span>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTotalQuantity = (items: any[]) => {
    if (!items || items.length === 0) return 0;
    return items.reduce((sum, item) => sum + item.quantity, 0);
  };

  const handleCopy = (transactionId: string) => {
    navigator.clipboard.writeText(transactionId);
  };

  const handleView = (transaction: Transaction) => {
    console.log('View transaction:', transaction);
  };

  const handlePrint = (transaction: Transaction) => {
    console.log('Print transaction:', transaction);
  };

  const handleDelete = (transaction: Transaction) => {
    console.log('Delete transaction:', transaction);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

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
              <TableHead className="text-right">Jumlah</TableHead>
              <TableHead className="text-right">Harga Satuan</TableHead>
              <TableHead className="text-right">Subtotal</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="w-32">Aksi</TableHead>
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
                    handleView={handleView}
                    handleCopy={handleCopy}
                    handlePrint={handlePrint}
                    handleDelete={handleDelete}
                  />
                  {isExpanded && (
                    <ExpandedProductRows transaction={transaction} />
                  )}
                </React.Fragment>
              );
            })}
            {transactions.length === 0 && (
              <TableRow>
                <TableCell colSpan={12} className="text-center py-8 text-gray-500">
                  Tidak ada transaksi ditemukan untuk periode yang dipilih
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-4 p-4">
        {transactions.map((transaction) => (
          <TransactionMobileCard
            key={transaction.id}
            transaction={transaction}
            getStatusBadge={getStatusBadge}
            getPaymentMethodBadge={getPaymentMethodBadge}
            handleView={handleView}
            handleCopy={handleCopy}
            handlePrint={handlePrint}
            formatDate={formatDate}
          />
        ))}
      </div>
    </div>
  );
};
