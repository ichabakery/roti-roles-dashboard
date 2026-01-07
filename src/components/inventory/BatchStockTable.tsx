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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';

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
    'minuman': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'titipan': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    'peralatan_ultah': 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
    'tart': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    'es_krim': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  };
  return colors[category || ''] || 'bg-muted text-muted-foreground';
};

// Mobile Card View Component
const MobileCardView: React.FC<BatchStockTableProps> = ({
  products,
  branches,
  stockInputs,
  onStockChange,
}) => {
  return (
    <ScrollArea className="h-[400px] md:h-[500px]">
      <div className="space-y-3 p-1">
        {products.map((product, index) => (
          <Card key={product.id} className="overflow-hidden">
            <CardHeader className="py-3 px-4 bg-muted/50">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-medium">
                      #{index + 1}
                    </span>
                    <h4 className="font-medium text-sm truncate">{product.name}</h4>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {formatPrice(product.price)}
                    </span>
                    {product.sku && (
                      <span className="text-xs text-muted-foreground">• {product.sku}</span>
                    )}
                  </div>
                </div>
                <Badge variant="secondary" className={`text-xs shrink-0 ${getCategoryColor(product.category)}`}>
                  {getCategoryLabel(product.category)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="py-3 px-4">
              <div className="grid grid-cols-2 gap-3">
                {branches.map((branch) => {
                  const currentStock = product.stockByBranch.get(branch.id) || 0;
                  const inputValue = stockInputs[product.id]?.[branch.id] || 0;
                  const hasInput = inputValue > 0;

                  return (
                    <div key={branch.id} className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium truncate">{branch.name}</span>
                        <span className="text-xs text-muted-foreground">Stok: {currentStock}</span>
                      </div>
                      <Input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={inputValue || ''}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0;
                          onStockChange(product.id, branch.id, value);
                        }}
                        className={`h-9 text-center ${
                          hasInput ? 'border-primary bg-primary/5' : ''
                        }`}
                      />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
};

// Desktop Table View Component
const DesktopTableView: React.FC<BatchStockTableProps> = ({
  products,
  branches,
  stockInputs,
  onStockChange,
}) => {
  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Single scroll container for both horizontal and vertical scrolling */}
      <div className="max-h-[500px] overflow-auto">
        <Table className="min-w-max">
          {/* Sticky header row */}
          <TableHeader className="sticky top-0 z-30 bg-background">
            <TableRow className="hover:bg-transparent border-b-2">
              {/* Frozen columns header - No, Produk, Harga, Kategori */}
              <TableHead className="w-12 sticky left-0 z-40 bg-background border-r font-semibold">
                No
              </TableHead>
              <TableHead className="min-w-[180px] sticky left-12 z-40 bg-background font-semibold">
                Produk
              </TableHead>
              <TableHead className="w-28 sticky left-[228px] z-40 bg-background font-semibold">
                Harga
              </TableHead>
              <TableHead className="w-32 sticky left-[340px] z-40 bg-background shadow-[2px_0_5px_-2px_rgba(0,0,0,0.15)] font-semibold">
                Kategori
              </TableHead>
              {/* Dynamic branch columns - sticky top only */}
              {branches.map((branch) => (
                <TableHead
                  key={branch.id}
                  className="min-w-[140px] text-center bg-background font-semibold"
                >
                  {branch.name}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product, index) => (
              <TableRow key={product.id} className="hover:bg-muted/50">
                {/* Frozen columns - No, Produk, Harga, Kategori */}
                <TableCell className="font-medium sticky left-0 z-20 bg-background border-r">
                  {index + 1}
                </TableCell>
                <TableCell className="sticky left-12 z-20 bg-background">
                  <div className="flex flex-col">
                    <span className="font-medium">{product.name}</span>
                    {product.sku && (
                      <span className="text-xs text-muted-foreground">{product.sku}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-sm sticky left-[228px] z-20 bg-background">
                  {formatPrice(product.price)}
                </TableCell>
                <TableCell className="sticky left-[340px] z-20 bg-background shadow-[2px_0_5px_-2px_rgba(0,0,0,0.15)]">
                  <Badge variant="secondary" className={getCategoryColor(product.category)}>
                    {getCategoryLabel(product.category)}
                  </Badge>
                </TableCell>
                {/* Dynamic branch inputs */}
                {branches.map((branch) => {
                  const currentStock = product.stockByBranch.get(branch.id) || 0;
                  const inputValue = stockInputs[product.id]?.[branch.id] || 0;
                  const hasInput = inputValue > 0;
                  const finalStock = currentStock + inputValue;

                  return (
                    <TableCell key={branch.id} className="text-center p-2">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          Stok: {currentStock}
                          {hasInput && (
                            <span className="text-green-600 dark:text-green-400 font-medium ml-1">
                              → {finalStock}
                            </span>
                          )}
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
      </div>
    </div>
  );
};

export const BatchStockTable: React.FC<BatchStockTableProps> = (props) => {
  const { products, loading } = props;
  const isMobile = useIsMobile();

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

  // Use card view on mobile, table view on desktop
  if (isMobile) {
    return <MobileCardView {...props} />;
  }

  return <DesktopTableView {...props} />;
};
