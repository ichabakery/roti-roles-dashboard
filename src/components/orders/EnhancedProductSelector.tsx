import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PackagePlus } from 'lucide-react';
import { ProductSelector } from './ProductSelector';
import CustomProductDialog from './CustomProductDialog';

interface EnhancedOrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  availableStock: number;
}

interface EnhancedProductSelectorProps {
  branchId: string;
  onAddItem: (item: EnhancedOrderItem) => void;
}

export function EnhancedProductSelector({ branchId, onAddItem }: EnhancedProductSelectorProps) {
  const [customDialogOpen, setCustomDialogOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Pilih Produk</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCustomDialogOpen(true)}
        >
          <PackagePlus className="h-4 w-4 mr-2" />
          Produk Custom
        </Button>
      </div>
      
      <ProductSelector 
        branchId={branchId}
        onAddItem={onAddItem}
      />
      
      <CustomProductDialog
        open={customDialogOpen}
        onClose={() => setCustomDialogOpen(false)}
        onAddCustomProduct={onAddItem}
      />
    </div>
  );
}