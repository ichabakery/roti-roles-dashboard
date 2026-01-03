import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Package, CheckCircle, Search } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';

interface ProductSelectorProps {
  branchId: string;
  onAddItem: (item: {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
  }) => void;
}

export const ProductSelector: React.FC<ProductSelectorProps> = ({
  branchId,
  onAddItem
}) => {
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  const { products, loading: productsLoading } = useProducts();

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedProduct = products.find(p => p.id === selectedProductId);

  const handleAddItem = () => {
    if (!selectedProduct || quantity <= 0) return;

    onAddItem({
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      quantity,
      unitPrice: selectedProduct.price
    });

    // Reset form
    setSelectedProductId('');
    setQuantity(1);
  };

  if (productsLoading) {
    return <div className="text-sm text-muted-foreground">Memuat produk...</div>;
  }

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
      <div className="flex items-center gap-2">
        <Package className="h-4 w-4" />
        <Label className="font-semibold">Tambah Produk</Label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2">
          <Label>Produk</Label>
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
            <Select value={selectedProductId} onValueChange={setSelectedProductId}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih produk..." />
              </SelectTrigger>
              <SelectContent>
                {filteredProducts.map(product => (
                  <SelectItem key={product.id} value={product.id}>
                    <span>{product.name}</span>
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
          <Label>Jumlah</Label>
          <Input
            type="number"
            value={quantity === 0 ? '' : quantity}
            onChange={(e) => {
              const val = e.target.value;
              if (val === '') {
                setQuantity(0);
              } else {
                const num = parseInt(val);
                setQuantity(isNaN(num) ? 0 : Math.max(0, num));
              }
            }}
            onBlur={() => {
              if (quantity <= 0) setQuantity(1);
            }}
            min="1"
            placeholder="Qty"
          />
        </div>

        <div className="flex items-end">
          <Button 
            onClick={handleAddItem}
            disabled={!selectedProduct || quantity <= 0}
            className="w-full"
          >
            Tambah
          </Button>
        </div>
      </div>

      {selectedProduct && (
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span>Harga per unit:</span>
            <span className="font-semibold">Rp {selectedProduct.price.toLocaleString()}</span>
          </div>
          
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Total: Rp {(selectedProduct.price * quantity).toLocaleString()}
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
};
