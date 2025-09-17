
import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Search } from 'lucide-react';

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
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredProducts = products.filter(product => 
    product.active && product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
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
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari produk..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select 
              value={item.productId} 
              onValueChange={(value) => onUpdate(index, 'productId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih produk" />
              </SelectTrigger>
              <SelectContent>
                {filteredProducts.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
                {filteredProducts.length === 0 && searchQuery && (
                  <div className="p-2 text-center text-muted-foreground text-sm">
                    Tidak ada produk yang sesuai
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>
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
