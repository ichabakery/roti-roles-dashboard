
import React, { useState } from 'react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface Transaction {
  id: string;
  transaction_date: string;
  branch?: { name: string };
  payment_method: string;
  total_amount: number;
}

interface TransactionsTabProps {
  transactions: Transaction[];
  loading: boolean;
}

export const TransactionsTab: React.FC<TransactionsTabProps> = ({ transactions, loading }) => {
  const [searchQuery, setSearchQuery] = useState('');

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
              <TableHead>ID Transaksi</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead>Cabang</TableHead>
              <TableHead>Metode Pembayaran</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell className="font-medium">{transaction.id.substring(0, 8)}...</TableCell>
                <TableCell>{formatDate(transaction.transaction_date)}</TableCell>
                <TableCell>{transaction.branch?.name}</TableCell>
                <TableCell>
                  <span className="capitalize">{transaction.payment_method}</span>
                </TableCell>
                <TableCell className="text-right">Rp {transaction.total_amount.toLocaleString('id-ID')}</TableCell>
              </TableRow>
            ))}
            {filteredTransactions.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
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
