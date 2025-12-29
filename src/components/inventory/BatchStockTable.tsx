import React from 'react';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface Branch {
  id: string;
  name: string;
}

interface ProductWithStock {
  id: string;
  name: string;
  price: number;
  category: string | null;
  sku: string | null;
  stockByBranch: Map<string, number>;
}

interface StockInputs {
  [productId: string]: {
    [branchId: string]: number;
  };
}

interface BatchStockTableProps {
  products: ProductWithStock[];
  branches: Branch[];
  stockInputs: StockInputs;
  onStockChange: (productId: string, branchId: string, quantity: number) => void;
  loading?: boolean;
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(price);
};

const getCategoryLabel = (category: string | null): string => {
  const labels: Record<string, string> = {
    'produk_utama': 'Produk Utama',
    'minuman': 'Minuman',
    'titipan': 'Titipan',
    'peralatan_ultah': 'Peralatan Ultah',
    'tart': 'Tart',
    'es_krim': 'Es Krim',
  };
  return labels[category || ''] || category || '-';
};

const getCategoryColor = (category: string | null): string => {
  const colors: Record<string, string> = {
    'produk_utama': 'bg-primary/20 text-primary',
    'minuman': 'bg-blue-100 text-blue-700',
    'titipan': 'bg-purple-100 text-purple-700',
    'peralatan_ultah': 'bg-pink-100 text-pink-700',
    'tart': 'bg-amber-100 text-amber-700',
    'es_krim': 'bg-cyan-100 text-cyan-700',
  };
  return colors[category || ''] || 'bg-muted text-muted-foreground';
};

export const BatchStockTable: React.FC<BatchStockTableProps> = ({
  products,
  branches,
  stockInputs,
  onStockChange,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Tidak ada produk ditemukan
      </div>
    );
  }

  return (
    <ScrollArea className="h-[500px] border rounded-lg">
      <Table>
        <TableHeader className="sticky top-0 bg-background z-10">
          <TableRow>
            <TableHead className="w-12 sticky left-0 bg-background z-20">No</TableHead>
            <TableHead className="min-w-[200px] sticky left-12 bg-background z-20">Produk</TableHead>
            <TableHead className="w-24">Harga</TableHead>
            <TableHead className="w-32">Kategori</TableHead>
            {branches.map((branch) => (
              <TableHead key={branch.id} className="min-w-[120px] text-center">
                {branch.name}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product, index) => (
            <TableRow key={product.id} className="hover:bg-muted/50">
              <TableCell className="font-medium sticky left-0 bg-background">
                {index + 1}
              </TableCell>
              <TableCell className="sticky left-12 bg-background">
                <div className="flex flex-col">
                  <span className="font-medium">{product.name}</span>
                  {product.sku && (
                    <span className="text-xs text-muted-foreground">{product.sku}</span>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-sm">
                {formatPrice(product.price)}
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className={getCategoryColor(product.category)}>
                  {getCategoryLabel(product.category)}
                </Badge>
              </TableCell>
              {branches.map((branch) => {
                const currentStock = product.stockByBranch.get(branch.id) || 0;
                const inputValue = stockInputs[product.id]?.[branch.id] || 0;
                const hasInput = inputValue > 0;
                
                return (
                  <TableCell key={branch.id} className="text-center p-2">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs text-muted-foreground">
                        Stok: {currentStock}
                      </span>
                      <Input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={inputValue || ''}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0;
                          onStockChange(product.id, branch.id, value);
                        }}
                        className={`w-20 h-8 text-center text-sm ${
                          hasInput ? 'border-primary bg-primary/5' : ''
                        }`}
                      />
                    </div>
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
};
