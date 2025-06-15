
import React, { useState } from 'react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ChevronDown, ChevronRight } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface TransactionItem {
  id: string;
  product_id: string;
  quantity: number;
  price_per_item: number;
  subtotal: number;
  products?: {
    name: string;
  };
}

interface Transaction {
  id: string;
  transaction_date: string;
  branch?: { name: string };
  payment_method: string;
  total_amount: number;
  transaction_items?: TransactionItem[];
}

interface TransactionsTabProps {
  transactions: Transaction[];
  loading: boolean;
}

export const TransactionsTab: React.FC<TransactionsTabProps> = ({ transactions, loading }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTransactions, setExpandedTransactions] = useState<Set<string>>(new Set());

  const filteredTransactions = transactions.filter(transaction => 
    transaction.branch?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    transaction.payment_method?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    transaction.id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const toggleExpanded = (transactionId: string) => {
    const newExpanded = new Set(expandedTransactions);
    if (newExpanded.has(transactionId)) {
      newExpanded.delete(transactionId);
    } else {
      newExpanded.add(transactionId);
    }
    setExpandedTransactions(newExpanded);
  };

  const getTotalItems = (items?: TransactionItem[]) => {
    return items?.reduce((total, item) => total + item.quantity, 0) || 0;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center">
        <Search className="mr-2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cari transaksi..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Detail</TableHead>
              <TableHead>ID Transaksi</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead>Cabang</TableHead>
              <TableHead>Total Item</TableHead>
              <TableHead>Metode Pembayaran</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransactions.map((transaction) => (
              <React.Fragment key={transaction.id}>
                <TableRow>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpanded(transaction.id)}
                      className="p-0 h-auto"
                    >
                      {expandedTransactions.has(transaction.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell className="font-medium">{transaction.id.substring(0, 8)}...</TableCell>
                  <TableCell>{formatDate(transaction.transaction_date)}</TableCell>
                  <TableCell>{transaction.branch?.name}</TableCell>
                  <TableCell>{getTotalItems(transaction.transaction_items)} item</TableCell>
                  <TableCell>
                    <span className="capitalize">{transaction.payment_method}</span>
                  </TableCell>
                  <TableCell className="text-right">Rp {transaction.total_amount.toLocaleString('id-ID')}</TableCell>
                </TableRow>
                
                {expandedTransactions.has(transaction.id) && transaction.transaction_items && (
                  <TableRow>
                    <TableCell colSpan={7} className="p-0">
                      <div className="bg-gray-50 p-4">
                        <h4 className="font-medium mb-3">Detail Item Transaksi:</h4>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Produk</TableHead>
                              <TableHead>Jumlah</TableHead>
                              <TableHead>Harga Satuan</TableHead>
                              <TableHead className="text-right">Subtotal</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {transaction.transaction_items.map((item) => (
                              <TableRow key={item.id}>
                                <TableCell>{item.products?.name || 'Unknown Product'}</TableCell>
                                <TableCell>{item.quantity}</TableCell>
                                <TableCell>Rp {item.price_per_item.toLocaleString('id-ID')}</TableCell>
                                <TableCell className="text-right">Rp {item.subtotal.toLocaleString('id-ID')}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
            {filteredTransactions.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                  {searchQuery ? 'Tidak ada transaksi yang sesuai dengan pencarian' : 'Tidak ada data transaksi dalam periode yang dipilih'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </div>
  );
};
