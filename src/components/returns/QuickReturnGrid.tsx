
import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, Search, X } from 'lucide-react';
import { ReturnCondition } from '@/types/products';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ReturnItem {
  productId: string;
  quantity: number;
  reason: string;
  condition: ReturnCondition;
}

interface QuickReturnGridProps {
  returnItems: ReturnItem[];
  setReturnItems: React.Dispatch<React.SetStateAction<ReturnItem[]>>;
  products: Array<{ id: string; name: string; active: boolean; }>;
  defaultCondition: ReturnCondition;
  defaultReason: string;
}

export const QuickReturnGrid: React.FC<QuickReturnGridProps> = ({
  returnItems,
  setReturnItems,
  products,
  defaultCondition,
  defaultReason
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter active products and search
  const filteredProducts = useMemo(() => {
    let filtered = products.filter(p => p.active);
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query)
      );
    }
    
    return filtered.slice(0, 20); // Limit to 20 products for performance
  }, [products, searchQuery]);

  // Get quantity for a product
  const getQuantity = (productId: string) => {
    const item = returnItems.find(i => i.productId === productId);
    return item?.quantity || 0;
  };

  // Add or update product quantity
  const updateProductQuantity = (productId: string, delta: number) => {
    const existingIndex = returnItems.findIndex(i => i.productId === productId);
    
    if (existingIndex >= 0) {
      const newQuantity = returnItems[existingIndex].quantity + delta;
      if (newQuantity <= 0) {
        // Remove item
        setReturnItems(prev => prev.filter((_, i) => i !== existingIndex));
      } else {
        // Update quantity
        setReturnItems(prev => {
          const updated = [...prev];
          updated[existingIndex] = { ...updated[existingIndex], quantity: newQuantity };
          return updated;
        });
      }
    } else if (delta > 0) {
      // Add new item
      setReturnItems(prev => [...prev, {
        productId,
        quantity: delta,
        reason: defaultReason,
        condition: defaultCondition
      }]);
    }
  };

  const removeItem = (productId: string) => {
    setReturnItems(prev => prev.filter(i => i.productId !== productId));
  };

  const selectedItems = returnItems.filter(item => item.quantity > 0);

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cari produk..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Product Grid */}
      <ScrollArea className="h-[300px]">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-1">
          {filteredProducts.map((product) => {
            const quantity = getQuantity(product.id);
            const isSelected = quantity > 0;
            
            return (
              <div
                key={product.id}
                className={`
                  relative border rounded-lg p-3 transition-all
                  ${isSelected ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:border-muted-foreground/50'}
                `}
              >
                <p className="text-sm font-medium truncate pr-6 mb-3" title={product.name}>
                  {product.name}
                </p>
                
                {isSelected && (
                  <Badge 
                    className="absolute top-2 right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
                    variant="default"
                  >
                    {quantity}
                  </Badge>
                )}
                
                <div className="flex items-center justify-center gap-1">
                  <Button
                    type="button"
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => updateProductQuantity(product.id, -1)}
                    disabled={!isSelected}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  
                  <span className="w-8 text-center text-sm font-medium">
                    {quantity}
                  </span>
                  
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => updateProductQuantity(product.id, 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Selected Items Summary */}
      {selectedItems.length > 0 && (
        <div className="border rounded-lg p-3 bg-muted/30">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-sm">Produk Dipilih</h4>
            <span className="text-xs text-muted-foreground">
              {selectedItems.length} produk, {selectedItems.reduce((sum, i) => sum + i.quantity, 0)} item
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedItems.map((item) => {
              const product = products.find(p => p.id === item.productId);
              return (
                <Badge 
                  key={item.productId} 
                  variant="secondary" 
                  className="flex items-center gap-1 pr-1"
                >
                  <span className="max-w-[100px] truncate">{product?.name}</span>
                  <span className="font-bold">×{item.quantity}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 ml-1 hover:bg-destructive/20"
                    onClick={() => removeItem(item.productId)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      {filteredProducts.length === 0 && searchQuery && (
        <div className="text-center py-8 text-muted-foreground">
          <p>Tidak ada produk ditemukan untuk "{searchQuery}"</p>
        </div>
      )}
    </div>
  );
};
