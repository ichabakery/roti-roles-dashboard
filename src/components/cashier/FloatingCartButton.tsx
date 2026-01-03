import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface FloatingCartButtonProps {
  itemCount: number;
  totalAmount: number;
  onClick: () => void;
}

export const FloatingCartButton: React.FC<FloatingCartButtonProps> = ({
  itemCount,
  totalAmount,
  onClick
}) => {
  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `Rp ${(amount / 1000000).toFixed(1)}jt`;
    } else if (amount >= 1000) {
      return `Rp ${(amount / 1000).toFixed(0)}rb`;
    }
    return `Rp ${amount.toLocaleString('id-ID')}`;
  };

  if (itemCount === 0) return null;

  return (
    <Button
      onClick={onClick}
      className="fixed bottom-4 right-4 z-50 lg:hidden shadow-lg rounded-full h-14 px-4 gap-2"
      size="lg"
    >
      <div className="relative">
        <ShoppingCart className="h-5 w-5" />
        <Badge 
          variant="destructive" 
          className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
        >
          {itemCount}
        </Badge>
      </div>
      <span className="font-semibold">{formatCurrency(totalAmount)}</span>
    </Button>
  );
};
