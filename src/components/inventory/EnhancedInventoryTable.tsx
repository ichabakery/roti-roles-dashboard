import React, { useState, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { Plus, Minus, Check, X } from 'lucide-react';
import { calculateStockStatus } from '@/services/inventoryV1Service';
import { InventoryItem } from '@/types/inventory';
import { INVENTORY_DEFAULTS } from '@/utils/featureFlags';
import { cn } from '@/lib/utils';

interface EnhancedInventoryTableProps {
  inventory: (InventoryItem & {
    product: {
      id: string;
      name: string;
      active?: boolean;
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
  // Inline edit props
  onQuickUpdate?: (inventoryId: string, newQuantity: number, reason?: string) => Promise<boolean>;
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
  onQuickUpdate,
}) => {
  // Inline editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);

  // Filter out inactive products as backup, then apply search filter
  const filteredInventory = inventory
    .filter((item) => item.product?.active !== false)
    .filter((item) =>
      item.product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.product.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.branch.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

  // Start inline editing
  const handleStartEdit = useCallback((id: string, currentQty: number) => {
    if (!onQuickUpdate) return;
    setEditingId(id);
    setEditValue(currentQty);
  }, [onQuickUpdate]);

  // Save inline edit
  const handleSaveEdit = useCallback(async (id: string) => {
    if (!onQuickUpdate || isSaving) return;
    
    const item = inventory.find(i => i.id === id);
    if (!item || item.quantity === editValue) {
      setEditingId(null);
      return;
    }

    setIsSaving(true);
    try {
      const success = await onQuickUpdate(id, editValue, 'Quick Edit');
      if (success) {
        setEditingId(null);
      }
    } finally {
      setIsSaving(false);
    }
  }, [onQuickUpdate, editValue, inventory, isSaving]);

  // Cancel inline edit
  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
  }, []);

  // Quick +/- adjustment
  const handleQuickAdjust = useCallback(async (id: string, delta: number) => {
    if (!onQuickUpdate || isSaving) return;
    
    const item = inventory.find(i => i.id === id);
    if (!item) return;
    
    const newQty = Math.max(0, item.quantity + delta);
    if (newQty === item.quantity) return;
    
    setIsSaving(true);
    try {
      await onQuickUpdate(id, newQty, delta > 0 ? 'Quick Add' : 'Quick Subtract');
    } finally {
      setIsSaving(false);
    }
  }, [onQuickUpdate, inventory, isSaving]);

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
            <TableHead className="text-center">Stok</TableHead>
            <TableHead>Status</TableHead>
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
            const isEditing = editingId === item.id;

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
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {item.product.sku || '—'}
                </TableCell>
                <TableCell className="font-medium">{item.product.name}</TableCell>
                <TableCell className="text-muted-foreground">{item.branch.name}</TableCell>
                <TableCell>
                  {isEditing ? (
                    // Inline edit mode
                    <div className="flex items-center justify-center gap-1">
                      <Input
                        type="number"
                        min="0"
                        value={editValue}
                        onChange={(e) => setEditValue(parseInt(e.target.value) || 0)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit(item.id);
                          if (e.key === 'Escape') handleCancelEdit();
                        }}
                        autoFocus
                        className="w-16 h-7 text-center text-sm"
                        disabled={isSaving}
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={() => handleSaveEdit(item.id)}
                        disabled={isSaving}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        onClick={handleCancelEdit}
                        disabled={isSaving}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : onQuickUpdate ? (
                    // Quick edit mode with +/- buttons
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-muted-foreground hover:text-foreground"
                        onClick={() => handleQuickAdjust(item.id, -1)}
                        disabled={isSaving || item.quantity === 0}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span 
                        className={cn(
                          "w-12 text-center font-medium cursor-pointer px-2 py-1 rounded transition-colors",
                          "hover:bg-muted"
                        )}
                        onClick={() => handleStartEdit(item.id, item.quantity)}
                        title="Klik untuk edit"
                      >
                        {item.quantity}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-muted-foreground hover:text-foreground"
                        onClick={() => handleQuickAdjust(item.id, 1)}
                        disabled={isSaving}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <span className="text-muted-foreground text-xs ml-1">{uom}</span>
                    </div>
                  ) : (
                    // View only mode
                    <div className="flex items-center justify-center gap-2">
                      <span className="font-medium">{item.quantity}</span>
                      <span className="text-muted-foreground text-sm">{uom}</span>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor(stockStatus)}`} />
                    <Badge variant="outline" className="text-xs">
                      {getStatusText(stockStatus)}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
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