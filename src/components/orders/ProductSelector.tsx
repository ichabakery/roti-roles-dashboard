import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Package, AlertCircle, CheckCircle } from 'lucide-react';
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

  const selectedProduct = products.find(p => p.id === selectedProductId);
  const availableStock = selectedProduct ? (stockInfo[selectedProduct.id] || 0) : 0;
  const isStockSufficient = quantity <= availableStock;

  const handleAddItem = () => {
    if (!selectedProduct || quantity <= 0) return;

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
          <Select value={selectedProductId} onValueChange={setSelectedProductId}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih produk..." />
            </SelectTrigger>
            <SelectContent>
              {products.map(product => (
                <SelectItem key={product.id} value={product.id}>
                  <div className="flex items-center justify-between w-full">
                    <span>{product.name}</span>
                    {getStockBadge(stockInfo[product.id] || 0)}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
          
          {availableStock === 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Produk ini habis di cabang ini. Anda tetap bisa menambahkannya ke pesanan; sistem akan membuat permintaan produksi otomatis.
              </AlertDescription>
            </Alert>
          )}
          
          {availableStock > 0 && !isStockSufficient && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Stok tidak mencukupi. Tersedia: {availableStock}, diminta: {quantity}. Pesanan tetap bisa dilanjutkan; sistem akan membuat permintaan produksi otomatis.
              </AlertDescription>
            </Alert>
          )}
          
          {isStockSufficient && availableStock > 0 && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Total: Rp {(selectedProduct.price * quantity).toLocaleString()}
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
};