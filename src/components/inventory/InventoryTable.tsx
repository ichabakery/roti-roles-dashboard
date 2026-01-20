
import React from 'react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';

interface Product {
  id: string;
  name: string;
  active?: boolean;
}

interface Branch {
  id: string;
  name: string;
}

interface InventoryItem {
  id: string;
  product_id: string;
  branch_id: string;
  quantity: number;
  last_updated: string;
  product: Product;
  branch: Branch;
}

interface InventoryTableProps {
  inventory: InventoryItem[];
  loading: boolean;
  searchQuery: string;
}

export const InventoryTable: React.FC<InventoryTableProps> = ({
  inventory,
  loading,
  searchQuery
}) => {
  // Filter out inactive products as backup, then apply search filter
  const filteredInventory = inventory
    .filter(item => item.product?.active !== false)
    .filter(item => 
      item.product.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Produk</TableHead>
          <TableHead>Cabang</TableHead>
          <TableHead>Stok</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Terakhir Diperbarui</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredInventory.length > 0 ? (
          filteredInventory.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.product.name}</TableCell>
              <TableCell>{item.branch.name}</TableCell>
              <TableCell>{item.quantity}</TableCell>
              <TableCell>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  item.quantity === 0 
                    ? 'bg-red-100 text-red-800' 
                    : item.quantity < 10 
                    ? 'bg-yellow-100 text-yellow-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {item.quantity === 0 ? 'Habis' : item.quantity < 10 ? 'Menipis' : 'Tersedia'}
                </span>
              </TableCell>
              <TableCell>
                {new Date(item.last_updated).toLocaleDateString('id-ID', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
              {searchQuery 
                ? 'Tidak ada produk yang sesuai dengan pencarian' 
                : 'Belum ada data stok tersedia'
              }
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};
