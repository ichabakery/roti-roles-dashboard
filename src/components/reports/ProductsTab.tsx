
import React from 'react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';

interface ProductSummary {
  product_id: string;
  product_name: string;
  total_quantity: number;
  total_revenue: number;
}

interface ProductsTabProps {
  productSummary: ProductSummary[];
  loading: boolean;
}

export const ProductsTab: React.FC<ProductsTabProps> = ({ productSummary, loading }) => {
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
          <TableHead>Kuantitas Terjual</TableHead>
          <TableHead className="text-right">Total Pendapatan</TableHead>
          <TableHead className="text-right">Rata-rata Harga</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {productSummary.map((item) => (
          <TableRow key={item.product_id}>
            <TableCell className="font-medium">{item.product_name}</TableCell>
            <TableCell>{item.total_quantity}</TableCell>
            <TableCell className="text-right">Rp {item.total_revenue.toLocaleString('id-ID')}</TableCell>
            <TableCell className="text-right">
              Rp {Math.round(item.total_revenue / item.total_quantity).toLocaleString('id-ID')}
            </TableCell>
          </TableRow>
        ))}
        {productSummary.length === 0 && (
          <TableRow>
            <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
              Tidak ada data produk dalam periode yang dipilih
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};
