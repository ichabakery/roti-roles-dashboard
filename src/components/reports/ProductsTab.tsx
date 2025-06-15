
import React, { useState } from 'react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Search, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { ProductSummary, Transaction } from '@/types/reports';

interface ProductsTabProps {
  productSummary: ProductSummary[];
  transactions: Transaction[];
  loading: boolean;
}

interface EnhancedProductSummary extends ProductSummary {
  avg_price: number;
  frequency: number;
  revenue_percentage: number;
}

export const ProductsTab: React.FC<ProductsTabProps> = ({ productSummary, transactions, loading }) => {
  const [searchQuery, setSearchQuery] = useState('');

  console.log('ProductsTab received:', {
    productSummaryCount: productSummary.length,
    transactionsCount: transactions.length
  });

  // Calculate enhanced metrics
  const enhancedSummary: EnhancedProductSummary[] = productSummary.map(product => {
    const frequency = transactions.filter(transaction =>
      transaction.transaction_items?.some(item => item.product_id === product.product_id)
    ).length;

    const totalRevenue = productSummary.reduce((sum, p) => sum + p.total_revenue, 0);
    const revenuePercentage = totalRevenue > 0 ? (product.total_revenue / totalRevenue) * 100 : 0;

    return {
      ...product,
      avg_price: product.total_quantity > 0 ? product.total_revenue / product.total_quantity : 0,
      frequency,
      revenue_percentage: revenuePercentage
    };
  });

  const filteredProducts = enhancedSummary.filter(product =>
    product.product_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort by total revenue (highest first)
  const sortedProducts = filteredProducts.sort((a, b) => b.total_revenue - a.total_revenue);

  const getTrendIcon = (percentage: number) => {
    if (percentage >= 10) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (percentage >= 5) return <Minus className="h-4 w-4 text-yellow-600" />;
    return <TrendingDown className="h-4 w-4 text-red-600" />;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Search className="mr-2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari produk..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <div className="text-sm text-muted-foreground">
          Total: {sortedProducts.length} produk
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ranking</TableHead>
            <TableHead>Produk</TableHead>
            <TableHead>Kuantitas Terjual</TableHead>
            <TableHead>Frekuensi Transaksi</TableHead>
            <TableHead className="text-right">Rata-rata Harga</TableHead>
            <TableHead className="text-right">Total Pendapatan</TableHead>
            <TableHead className="text-right">% Kontribusi</TableHead>
            <TableHead>Performa</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedProducts.map((product, index) => (
            <TableRow key={product.product_id}>
              <TableCell className="font-medium">#{index + 1}</TableCell>
              <TableCell className="font-medium">{product.product_name}</TableCell>
              <TableCell>{product.total_quantity}</TableCell>
              <TableCell>{product.frequency} transaksi</TableCell>
              <TableCell className="text-right">
                Rp {Math.round(product.avg_price).toLocaleString('id-ID')}
              </TableCell>
              <TableCell className="text-right">
                Rp {product.total_revenue.toLocaleString('id-ID')}
              </TableCell>
              <TableCell className="text-right">
                {product.revenue_percentage.toFixed(1)}%
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {getTrendIcon(product.revenue_percentage)}
                  <span className="text-sm">
                    {product.revenue_percentage >= 10 ? 'Tinggi' : 
                     product.revenue_percentage >= 5 ? 'Sedang' : 'Rendah'}
                  </span>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {sortedProducts.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-4 text-muted-foreground">
                {searchQuery ? 'Tidak ada produk yang sesuai dengan pencarian' : 'Tidak ada data produk dalam periode yang dipilih'}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {sortedProducts.length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-medium text-green-800">Produk Terlaris</h4>
            <p className="text-green-600">{sortedProducts[0]?.product_name}</p>
            <p className="text-sm text-green-600">
              {sortedProducts[0]?.total_quantity} unit terjual
            </p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-800">Pendapatan Tertinggi</h4>
            <p className="text-blue-600">{sortedProducts[0]?.product_name}</p>
            <p className="text-sm text-blue-600">
              Rp {sortedProducts[0]?.total_revenue.toLocaleString('id-ID')}
            </p>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <h4 className="font-medium text-orange-800">Rata-rata Harga Tertinggi</h4>
            <p className="text-orange-600">
              {[...sortedProducts].sort((a, b) => b.avg_price - a.avg_price)[0]?.product_name}
            </p>
            <p className="text-sm text-orange-600">
              Rp {Math.round([...sortedProducts].sort((a, b) => b.avg_price - a.avg_price)[0]?.avg_price || 0).toLocaleString('id-ID')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
