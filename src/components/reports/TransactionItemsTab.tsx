
import React, { useState } from 'react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface TransactionItem {
  id: string;
  product_id: string;
  quantity: number;
  price_per_item: number;
  subtotal: number;
  products?: {
    name: string;
  };
  transaction?: {
    id: string;
    transaction_date: string;
    branch?: { name: string };
  };
}

interface Transaction {
  id: string;
  transaction_date: string;
  branch?: { name: string };
  transaction_items?: Array<{
    id: string;
    product_id: string;
    quantity: number;
    price_per_item: number;
    subtotal: number;
    products?: {
      name: string;
    };
  }>;
}

interface TransactionItemsTabProps {
  transactions: Transaction[];
  loading: boolean;
}

export const TransactionItemsTab: React.FC<TransactionItemsTabProps> = ({ transactions, loading }) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Flatten transaction items with transaction info
  const allItems: TransactionItem[] = transactions.flatMap(transaction =>
    (transaction.transaction_items || []).map(item => ({
      ...item,
      transaction: {
        id: transaction.id,
        transaction_date: transaction.transaction_date,
        branch: transaction.branch
      }
    }))
  );

  const filteredItems = allItems.filter(item =>
    item.products?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.transaction?.branch?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.transaction?.id?.toLowerCase().includes(searchQuery.toLowerCase())
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Search className="mr-2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari berdasarkan produk atau cabang..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <div className="text-sm text-muted-foreground">
          Total: {filteredItems.length} item
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID Transaksi</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead>Cabang</TableHead>
              <TableHead>Nama Produk</TableHead>
              <TableHead>Jumlah</TableHead>
              <TableHead className="text-right">Harga Satuan</TableHead>
              <TableHead className="text-right">Subtotal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.map((item) => (
              <TableRow key={`${item.transaction?.id}-${item.id}`}>
                <TableCell className="font-medium">
                  {item.transaction?.id?.substring(0, 8)}...
                </TableCell>
                <TableCell>{formatDate(item.transaction?.transaction_date || '')}</TableCell>
                <TableCell>{item.transaction?.branch?.name}</TableCell>
                <TableCell className="font-medium">{item.products?.name || 'Unknown Product'}</TableCell>
                <TableCell>{item.quantity}</TableCell>
                <TableCell className="text-right">Rp {item.price_per_item.toLocaleString('id-ID')}</TableCell>
                <TableCell className="text-right">Rp {item.subtotal.toLocaleString('id-ID')}</TableCell>
              </TableRow>
            ))}
            {filteredItems.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                  {searchQuery ? 'Tidak ada item yang sesuai dengan pencarian' : 'Tidak ada data item dalam periode yang dipilih'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </div>
  );
};
