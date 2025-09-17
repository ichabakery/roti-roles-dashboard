import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Package, AlertCircle, CheckCircle, Search } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { useInventory } from '@/hooks/useInventory';

interface ProductSelectorProps {
  branchId: string;
  onAddItem: (item: {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    availableStock: number;
  }) => void;
}

export const ProductSelector: React.FC<ProductSelectorProps> = ({
  branchId,
  onAddItem
}) => {
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [stockInfo, setStockInfo] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState('');

  const { products, loading: productsLoading } = useProducts();
  const { inventory, loading: inventoryLoading } = useInventory();

  // Build stock info map
  useEffect(() => {
    if (inventory) {
      const stockMap: Record<string, number> = {};
      inventory.forEach(item => {
        stockMap[item.product_id] = item.quantity || 0;
      });
      setStockInfo(stockMap);
    }
  }, [inventory]);

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedProduct = products.find(p => p.id === selectedProductId);
  const availableStock = selectedProduct ? (stockInfo[selectedProduct.id] || 0) : 0;
  const isStockSufficient = quantity <= availableStock;

  const handleAddItem = () => {
    if (!selectedProduct || quantity <= 0) return;

    // Always allow adding items regardless of stock - let the backend handle production requests
    onAddItem({
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      quantity,
      unitPrice: selectedProduct.price,
      availableStock
    });

    // Reset form
    setSelectedProductId('');
    setQuantity(1);
  };

  const getStockBadge = (stock: number) => {
    if (stock === 0) {
      return <Badge variant="destructive" className="ml-2">Habis</Badge>;
    }
    if (stock < 10) {
      return <Badge variant="outline" className="ml-2 text-orange-600">Sisa {stock}</Badge>;
    }
    return <Badge variant="secondary" className="ml-2">Stok {stock}</Badge>;
  };

  if (productsLoading || inventoryLoading) {
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
                    <div className="flex items-center justify-between w-full">
                      <span>{product.name}</span>
                      {getStockBadge(stockInfo[product.id] || 0)}
                    </div>
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
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            min="1"
            placeholder="Qty"
          />
        </div>

        <div className="flex items-end">
          <Button 
            onClick={handleAddItem}
            disabled={!selectedProduct || quantity <= 0}
            className="w-full"
            title={selectedProduct && availableStock === 0 ? "Tambah ke pesanan (akan membuat permintaan produksi)" : "Tambah ke pesanan"}
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
              {availableStock === 0 && (
                <div className="mt-2 text-sm text-orange-600">
                  ⚠️ Stok habis - akan otomatis dibuatkan permintaan produksi
                </div>
              )}
              {availableStock > 0 && !isStockSufficient && (
                <div className="mt-2 text-sm text-orange-600">
                  ⚠️ Stok kurang ({availableStock} tersedia) - sisanya akan dibuatkan permintaan produksi
                </div>
              )}
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
};