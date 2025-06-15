
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2 } from 'lucide-react';

interface ReturnItem {
  productId: string;
  quantity: number;
  reason: string;
  condition: 'resaleable' | 'damaged' | 'expired';
}

interface ReturnItemFormProps {
  item: ReturnItem;
  index: number;
  products: Array<{ id: string; name: string; active: boolean; }>;
  onUpdate: (index: number, field: keyof ReturnItem, value: any) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
}

const conditionOptions = [
  { value: 'resaleable', label: 'Bisa Dijual Ulang' },
  { value: 'damaged', label: 'Rusak' },
  { value: 'expired', label: 'Kadaluarsa' }
];

export const ReturnItemForm: React.FC<ReturnItemFormProps> = ({
  item,
  index,
  products,
  onUpdate,
  onRemove,
  canRemove
}) => {
  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="font-medium">Produk #{index + 1}</h4>
        {canRemove && (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => onRemove(index)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Produk *</Label>
          <Select 
            value={item.productId} 
            onValueChange={(value) => onUpdate(index, 'productId', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih produk" />
            </SelectTrigger>
            <SelectContent>
              {products.filter(p => p.active).map((product) => (
                <SelectItem key={product.id} value={product.id}>
                  {product.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Jumlah *</Label>
          <Input
            type="number"
            min="1"
            value={item.quantity}
            onChange={(e) => onUpdate(index, 'quantity', parseInt(e.target.value) || 1)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Alasan Spesifik</Label>
          <Input
            value={item.reason}
            onChange={(e) => onUpdate(index, 'reason', e.target.value)}
            placeholder="Alasan detail untuk produk ini"
          />
        </div>

        <div>
          <Label>Kondisi Produk *</Label>
          <Select 
            value={item.condition} 
            onValueChange={(value) => onUpdate(index, 'condition', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {conditionOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
