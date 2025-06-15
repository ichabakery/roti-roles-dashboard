
import React, { useState } from 'react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Copy, Receipt, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
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
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">{methodUpper}</Badge>;
      case 'TRANSFER':
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">{methodUpper}</Badge>;
      case 'QRIS':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">{methodUpper}</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">{methodUpper}</Badge>;
    }
  };

  const getStatusBadge = () => {
    // Since transactions don't have status in the type, we'll assume all are completed
    return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Selesai</Badge>;
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

  const formatProducts = (items: any[]) => {
    if (!items || items.length === 0) return 'Tidak ada produk';
    
    return items.map(item => 
      `${item.products?.name || 'Unknown'} x${item.quantity}`
    ).join(', ');
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
              <TableHead>Pembeli</TableHead>
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
            {transactions.map((transaction, index) => {
              const isExpanded = expandedRows.has(transaction.id);
              const hasMultipleProducts = transaction.transaction_items && transaction.transaction_items.length > 1;
              const firstItem = transaction.transaction_items?.[0];
              
              return (
                <React.Fragment key={transaction.id}>
                  {/* Main Row */}
                  <TableRow className={`hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                    <TableCell>
                      {hasMultipleProducts && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleRow(transaction.id)}
                          className="p-1"
                        >
                          {isExpanded ? 
                            <ChevronDown className="h-4 w-4" /> : 
                            <ChevronRight className="h-4 w-4" />
                          }
                        </Button>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {transaction.id.substring(0, 8)}...
                    </TableCell>
                    <TableCell>{formatDate(transaction.transaction_date)}</TableCell>
                    <TableCell>{getStatusBadge()}</TableCell>
                    <TableCell>{transaction.cashier_name}</TableCell>
                    <TableCell>{getPaymentMethodBadge(transaction.payment_method)}</TableCell>
                    <TableCell>
                      {hasMultipleProducts ? (
                        <span className="text-sm text-gray-600">
                          {transaction.transaction_items.length} produk
                        </span>
                      ) : (
                        firstItem?.products?.name || 'Tidak ada produk'
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {hasMultipleProducts ? getTotalQuantity(transaction.transaction_items) : firstItem?.quantity || 0}
                    </TableCell>
                    <TableCell className="text-right">
                      {hasMultipleProducts ? '-' : `Rp ${(firstItem?.price_per_item || 0).toLocaleString('id-ID')}`}
                    </TableCell>
                    <TableCell className="text-right">
                      {hasMultipleProducts ? '-' : `Rp ${(firstItem?.subtotal || 0).toLocaleString('id-ID')}`}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      Rp {transaction.total_amount.toLocaleString('id-ID')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="p-1" onClick={() => handleView(transaction)}>
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" className="p-1" onClick={() => handleCopy(transaction.id)}>
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" className="p-1" onClick={() => handlePrint(transaction)}>
                          <Receipt className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" className="p-1 text-red-600" onClick={() => handleDelete(transaction)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  
                  {/* Expanded Rows for Multiple Products */}
                  {isExpanded && hasMultipleProducts && transaction.transaction_items?.map((item, itemIndex) => (
                    <TableRow key={`${transaction.id}-${item.id}`} className="bg-blue-50/50">
                      <TableCell></TableCell>
                      <TableCell className="text-sm text-gray-500">└─ Item {itemIndex + 1}</TableCell>
                      <TableCell></TableCell>
                      <TableCell></TableCell>
                      <TableCell></TableCell>
                      <TableCell></TableCell>
                      <TableCell className="font-medium">{item.products?.name || 'Unknown Product'}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">Rp {item.price_per_item.toLocaleString('id-ID')}</TableCell>
                      <TableCell className="text-right">Rp {item.subtotal.toLocaleString('id-ID')}</TableCell>
                      <TableCell></TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  ))}
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
          <div key={transaction.id} className="border rounded-lg p-4 bg-white">
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
            
            <div className="text-lg font-bold mb-2">
              Rp {transaction.total_amount.toLocaleString('id-ID')}
            </div>
            
            <div className="text-sm text-gray-600 mb-3">
              {formatProducts(transaction.transaction_items || [])}
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">
                Kasir: {transaction.cashier_name}
              </span>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" className="p-1" onClick={() => handleView(transaction)}>
                  <Eye className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="sm" className="p-1" onClick={() => handleCopy(transaction.id)}>
                  <Copy className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="sm" className="p-1" onClick={() => handlePrint(transaction)}>
                  <Receipt className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
