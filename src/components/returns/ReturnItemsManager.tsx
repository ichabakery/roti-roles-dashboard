
import React from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { ReturnItemForm } from './ReturnItemForm';

interface ReturnItem {
  productId: string;
  quantity: number;
  reason: string;
  condition: 'resaleable' | 'damaged' | 'expired';
}

interface ReturnItemsManagerProps {
  returnItems: ReturnItem[];
  setReturnItems: React.Dispatch<React.SetStateAction<ReturnItem[]>>;
  products: Array<{ id: string; name: string; active: boolean; }>;
}

export const ReturnItemsManager: React.FC<ReturnItemsManagerProps> = ({
  returnItems,
  setReturnItems,
  products
}) => {
  const addReturnItem = () => {
    setReturnItems([...returnItems, {
      productId: '',
      quantity: 1,
      reason: '',
      condition: 'resaleable'
    }]);
  };

  const removeReturnItem = (index: number) => {
    setReturnItems(returnItems.filter((_, i) => i !== index));
  };

  const updateReturnItem = (index: number, field: keyof ReturnItem, value: any) => {
    const updated = [...returnItems];
    updated[index] = { ...updated[index], [field]: value };
    setReturnItems(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Label className="text-base font-semibold">Produk yang Diretur</Label>
        <Button type="button" variant="outline" onClick={addReturnItem}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Produk
        </Button>
      </div>

      {returnItems.map((item, index) => (
        <ReturnItemForm
          key={index}
          item={item}
          index={index}
          products={products}
          onUpdate={updateReturnItem}
          onRemove={removeReturnItem}
          canRemove={returnItems.length > 1}
        />
      ))}
    </div>
  );
};
