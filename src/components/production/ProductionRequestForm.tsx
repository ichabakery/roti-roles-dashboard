
import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Product } from '@/hooks/useProducts';
import { Branch } from '@/hooks/useBranches';
import { NewProductionRequest } from '@/types/production';

interface ProductionRequestFormProps {
  formData: NewProductionRequest;
  products: Product[];
  branches: Branch[];
  productsLoading: boolean;
  branchesLoading: boolean;
  loading: boolean;
  onFieldChange: (field: keyof NewProductionRequest, value: any) => void;
}

const ProductionRequestForm: React.FC<ProductionRequestFormProps> = ({
  formData,
  products,
  branches,
  productsLoading,
  branchesLoading,
  loading,
  onFieldChange
}) => {
  return (
    <div className="grid gap-4 py-4">
      <div className="grid gap-2">
        <Label htmlFor="product">Produk</Label>
        <Select
          disabled={productsLoading || loading}
          value={formData.product_id}
          onValueChange={(value) => onFieldChange('product_id', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Pilih produk" />
          </SelectTrigger>
          <SelectContent>
            {products.map((product) => (
              <SelectItem key={product.id} value={product.id}>
                {product.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="branch">Cabang</Label>
        <Select
          disabled={branchesLoading || loading}
          value={formData.branch_id}
          onValueChange={(value) => onFieldChange('branch_id', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Pilih cabang" />
          </SelectTrigger>
          <SelectContent>
            {branches.map((branch) => (
              <SelectItem key={branch.id} value={branch.id}>
                {branch.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="quantity">Jumlah</Label>
        <Input
          id="quantity"
          type="number"
          disabled={loading}
          min="1"
          value={formData.quantity_requested || ''}
          onChange={(e) => onFieldChange('quantity_requested', parseInt(e.target.value) || 0)}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="date">Tanggal Produksi</Label>
        <Input
          id="date"
          type="date"
          disabled={loading}
          value={formData.production_date}
          onChange={(e) => onFieldChange('production_date', e.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="notes">Catatan</Label>
        <Textarea
          id="notes"
          disabled={loading}
          value={formData.notes || ''}
          onChange={(e) => onFieldChange('notes', e.target.value)}
          placeholder="Tambahkan catatan jika diperlukan"
        />
      </div>
    </div>
  );
};

export default ProductionRequestForm;
