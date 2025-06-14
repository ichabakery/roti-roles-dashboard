
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProductType } from '@/types/products';

interface ProductTypeSelectorProps {
  selectedType: ProductType;
  onTypeChange: (type: ProductType) => void;
}

export const ProductTypeSelector: React.FC<ProductTypeSelectorProps> = ({
  selectedType,
  onTypeChange
}) => {
  return (
    <Select value={selectedType} onValueChange={onTypeChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Pilih jenis produk" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="regular">Produk Reguler</SelectItem>
        <SelectItem value="package">Produk Paket</SelectItem>
        <SelectItem value="bundle">Produk Bundling</SelectItem>
      </SelectContent>
    </Select>
  );
};
