import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { calculateStockStatus } from '@/services/inventoryV1Service';
import { InventoryItem } from '@/types/inventory';
import { INVENTORY_DEFAULTS } from '@/utils/featureFlags';

interface EnhancedInventoryTableProps {
  inventory: (InventoryItem & {
    product: {
      id: string;
      name: string;
      sku?: string;
      uom?: string;
      reorder_point?: number;
      shelf_life_days?: number;
    };
    branch: {
      id: string;
      name: string;
    };
  })[];
  loading: boolean;
  searchQuery: string;
  // Selection props
  isSelected?: (id: string) => boolean;
  toggleSelection?: (id: string) => void;
  isAllSelected?: boolean;
  isPartiallySelected?: boolean;
  toggleSelectAll?: () => void;
  enableSelection?: boolean;
}

const getStatusColor = (status: 'high' | 'medium' | 'low') => {
  switch (status) {
    case 'high':
      return 'bg-green-500';
    case 'medium':
      return 'bg-yellow-500';
    case 'low':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
};

const getStatusText = (status: 'high' | 'medium' | 'low') => {
  switch (status) {
    case 'high':
      return 'Tinggi';
    case 'medium':
      return 'Menipis';
    case 'low':
      return 'Rendah';
    default:
      return 'Unknown';
  }
};

export const EnhancedInventoryTable: React.FC<EnhancedInventoryTableProps> = ({
  inventory,
  loading,
  searchQuery,
  isSelected,
  toggleSelection,
  isAllSelected = false,
  isPartiallySelected = false,
  toggleSelectAll,
  enableSelection = false,
}) => {
  const filteredInventory = inventory.filter((item) =>
    item.product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.product.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.branch.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flex space-x-4">
            <Skeleton className="h-12 w-20" />
            <Skeleton className="h-12 flex-1" />
            <Skeleton className="h-12 w-24" />
            <Skeleton className="h-12 w-20" />
            <Skeleton className="h-12 w-24" />
            <Skeleton className="h-12 w-32" />
          </div>
        ))}
      </div>
    );
  }

  if (filteredInventory.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          {searchQuery ? 'Tidak ada inventori yang sesuai dengan pencarian.' : 'Belum ada data inventori.'}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {enableSelection && (
              <TableHead className="w-12">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Pilih semua"
                />
              </TableHead>
            )}
            <TableHead>SKU</TableHead>
            <TableHead>Produk</TableHead>
            <TableHead>Cabang</TableHead>
            <TableHead>Stok (UoM)</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Exp Terdekat</TableHead>
            <TableHead>Terakhir Diperbarui</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredInventory.map((item) => {
            const stockStatus = calculateStockStatus(
              item.quantity,
              item.product.reorder_point || null
            );
            const uom = item.product.uom || INVENTORY_DEFAULTS.UOM;
            const selected = isSelected?.(item.id) || false;

            return (
              <TableRow 
                key={item.id}
                className={selected ? 'bg-primary/5' : undefined}
              >
                {enableSelection && (
                  <TableCell>
                    <Checkbox
                      checked={selected}
                      onCheckedChange={() => toggleSelection?.(item.id)}
                      aria-label={`Pilih ${item.product.name}`}
                    />
                  </TableCell>
                )}
                <TableCell className="font-medium">
                  {item.product.sku || '—'}
                </TableCell>
                <TableCell>{item.product.name}</TableCell>
                <TableCell>{item.branch.name}</TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{item.quantity}</span>
                    <span className="text-muted-foreground text-sm">{uom}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(stockStatus)}`} />
                    <Badge variant="outline" className="text-xs">
                      {getStatusText(stockStatus)}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  {/* Placeholder for expiry date - would need batch data */}
                  <span className="text-muted-foreground">—</span>
                </TableCell>
                <TableCell>
                  {formatDistanceToNow(new Date(item.last_updated), {
                    addSuffix: true,
                    locale: id,
                  })}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};