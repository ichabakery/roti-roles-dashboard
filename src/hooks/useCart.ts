
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
}

interface CartItem {
  product: Product;
  quantity: number;
}

export const useCart = () => {
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.product.id === product.id);
    
    if (existingItem) {
      setCart(cart.map(item => 
        item.product.id === product.id 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      ));
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }

    toast({
      title: "Produk ditambahkan",
      description: `${product.name} ditambahkan ke keranjang`,
    });
  };
  
  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };
  
  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(productId);
      return;
    }
    
    setCart(cart.map(item => 
      item.product.id === productId 
        ? { ...item, quantity } 
        : item
    ));
  };
  
  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  };

  const clearCart = () => {
    setCart([]);
  };

  return {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    calculateTotal,
    clearCart
  };
};
