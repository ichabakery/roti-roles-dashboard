
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Delete, ShoppingCart } from 'lucide-react';
import { CartItem } from '@/types/cashier';

interface CartItemsListProps {
  cart: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveFromCart: (productId: string) => void;
}

export const CartItemsList: React.FC<CartItemsListProps> = ({
  cart,
  onUpdateQuantity,
  onRemoveFromCart
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempQuantity, setTempQuantity] = useState<string>('');

  const handleQuantityEdit = (productId: string, currentQuantity: number) => {
    setEditingId(productId);
    setTempQuantity(currentQuantity.toString());
  };

  const handleQuantitySubmit = (productId: string) => {
    const newQuantity = parseInt(tempQuantity);
    if (!isNaN(newQuantity) && newQuantity > 0) {
      onUpdateQuantity(productId, newQuantity);
    }
    setEditingId(null);
    setTempQuantity('');
  };

  const handleQuantityCancel = () => {
    setEditingId(null);
    setTempQuantity('');
  };

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
        <ShoppingCart className="h-12 w-12 mb-2" />
        <p>Keranjang kosong</p>
        <p className="text-sm">Klik produk untuk menambahkan</p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {cart.map(item => (
        <li key={item.product.id} className="flex justify-between items-center py-2 border-b">
          <div className="flex-1">
            <p className="font-medium">{item.product.name}</p>
            <p className="text-sm">Rp {item.product.price.toLocaleString('id-ID')}</p>
          </div>
          <div className="flex items-center gap-2">
            {editingId === item.product.id ? (
              // Mode edit quantity
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  value={tempQuantity}
                  onChange={(e) => setTempQuantity(e.target.value)}
                  className="w-16 h-7 text-center"
                  min="1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleQuantitySubmit(item.product.id);
                    } else if (e.key === 'Escape') {
                      handleQuantityCancel();
                    }
                  }}
                  autoFocus
                />
                <Button 
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 text-green-600"
                  onClick={() => handleQuantitySubmit(item.product.id)}
                >
                  ✓
                </Button>
                <Button 
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 text-red-600"
                  onClick={handleQuantityCancel}
                >
                  ✕
                </Button>
              </div>
            ) : (
              // Mode normal
              <>
                <Button 
                  size="icon"
                  variant="outline"
                  className="h-7 w-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateQuantity(item.product.id, item.quantity - 1);
                  }}
                >
                  -
                </Button>
                <span 
                  className="min-w-8 text-center cursor-pointer hover:bg-gray-100 px-1 rounded"
                  onClick={() => handleQuantityEdit(item.product.id, item.quantity)}
                  title="Klik untuk edit jumlah"
                >
                  {item.quantity}
                </span>
                <Button 
                  size="icon"
                  variant="outline"
                  className="h-7 w-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateQuantity(item.product.id, item.quantity + 1);
                  }}
                >
                  +
                </Button>
                <Button 
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveFromCart(item.product.id);
                  }}
                >
                  <Delete className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
};
