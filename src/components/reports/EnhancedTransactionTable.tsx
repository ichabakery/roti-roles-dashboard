
import React, { useState } from 'react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, Eye, Download, Receipt } from 'lucide-react';
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

  const getPaymentMethodColor = (method: string) => {
    switch (method.toLowerCase()) {
      case 'cash': return 'bg-green-100 text-green-800';
      case 'card': return 'bg-blue-100 text-blue-800';
      case 'qris': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="w-8"></TableHead>
            <TableHead>ID Transaksi</TableHead>
            <TableHead>Tanggal & Waktu</TableHead>
            <TableHead>Cabang</TableHead>
            <TableHead>Kasir</TableHead>
            <TableHead>Metode Bayar</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="text-right">Item</TableHead>
            <TableHead className="w-24">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => {
            const isExpanded = expandedRows.has(transaction.id);
            const itemCount = transaction.transaction_items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
            
            return (
              <React.Fragment key={transaction.id}>
                {/* Main Row */}
                <TableRow className="hover:bg-gray-50">
                  <TableCell>
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
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {transaction.id.substring(0, 8)}...
                  </TableCell>
                  <TableCell>{formatDate(transaction.transaction_date)}</TableCell>
                  <TableCell>
                    <span className="font-medium">{transaction.branches?.name}</span>
                  </TableCell>
                  <TableCell>{transaction.cashier_name}</TableCell>
                  <TableCell>
                    <Badge className={getPaymentMethodColor(transaction.payment_method)}>
                      {transaction.payment_method.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    Rp {transaction.total_amount.toLocaleString('id-ID')}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="secondary">{itemCount} item</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="p-1">
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="p-1">
                        <Receipt className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                
                {/* Expanded Row Details */}
                {isExpanded && (
                  <TableRow>
                    <TableCell colSpan={9} className="bg-gray-50 p-0">
                      <div className="p-4 border-t">
                        <h4 className="font-medium mb-3 text-sm">Detail Item Transaksi</h4>
                        <div className="bg-white rounded border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="text-xs">Produk</TableHead>
                                <TableHead className="text-xs text-center">Qty</TableHead>
                                <TableHead className="text-xs text-right">Harga Satuan</TableHead>
                                <TableHead className="text-xs text-right">Subtotal</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {transaction.transaction_items?.map((item) => (
                                <TableRow key={item.id} className="text-sm">
                                  <TableCell className="font-medium">
                                    {item.products?.name || 'Unknown Product'}
                                  </TableCell>
                                  <TableCell className="text-center">{item.quantity}</TableCell>
                                  <TableCell className="text-right">
                                    Rp {item.price_per_item.toLocaleString('id-ID')}
                                  </TableCell>
                                  <TableCell className="text-right font-medium">
                                    Rp {item.subtotal.toLocaleString('id-ID')}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                        
                        {/* Transaction Summary */}
                        <div className="mt-3 flex justify-between items-center text-sm">
                          <div className="text-gray-600">
                            Total {transaction.transaction_items?.length || 0} jenis produk, {itemCount} item
                          </div>
                          <div className="font-bold">
                            Total: Rp {transaction.total_amount.toLocaleString('id-ID')}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            );
          })}
          
          {transactions.length === 0 && (
            <TableRow>
              <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                Tidak ada transaksi ditemukan untuk periode yang dipilih
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
