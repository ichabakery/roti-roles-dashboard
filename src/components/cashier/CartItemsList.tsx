
import React from 'react';
import { Button } from '@/components/ui/button';
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
            <span>{item.quantity}</span>
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
          </div>
        </li>
      ))}
    </ul>
  );
};
