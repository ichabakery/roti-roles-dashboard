import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Percent, DollarSign, X } from 'lucide-react';

interface DiscountInputProps {
  subtotal: number;
  onDiscountChange: (discountAmount: number) => void;
  disabled?: boolean;
}

export const DiscountInput: React.FC<DiscountInputProps> = ({
  subtotal,
  onDiscountChange,
  disabled = false
}) => {
  const [discountType, setDiscountType] = useState<'percent' | 'nominal'>('nominal');
  const [discountValue, setDiscountValue] = useState<string>('');
  const [discountAmount, setDiscountAmount] = useState<number>(0);

  useEffect(() => {
    calculateDiscount();
  }, [discountValue, discountType, subtotal]);

  const calculateDiscount = () => {
    const value = parseFloat(discountValue) || 0;
    let amount = 0;

    if (discountType === 'percent') {
      // Cap percentage at 100%
      const cappedPercent = Math.min(value, 100);
      amount = (cappedPercent / 100) * subtotal;
    } else {
      // Cap nominal at subtotal
      amount = Math.min(value, subtotal);
    }

    setDiscountAmount(amount);
    onDiscountChange(amount);
  };

  const handleClearDiscount = () => {
    setDiscountValue('');
    setDiscountAmount(0);
    onDiscountChange(0);
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Diskon</Label>
      <div className="flex items-center gap-2">
        {/* Toggle buttons for discount type */}
        <div className="flex border rounded-md overflow-hidden">
          <Button
            type="button"
            variant={discountType === 'nominal' ? 'default' : 'ghost'}
            size="sm"
            className="rounded-none h-9 px-2"
            onClick={() => setDiscountType('nominal')}
            disabled={disabled}
          >
            <DollarSign className="h-4 w-4" />
            <span className="text-xs ml-1">Rp</span>
          </Button>
          <Button
            type="button"
            variant={discountType === 'percent' ? 'default' : 'ghost'}
            size="sm"
            className="rounded-none h-9 px-2"
            onClick={() => setDiscountType('percent')}
            disabled={disabled}
          >
            <Percent className="h-4 w-4" />
          </Button>
        </div>

        {/* Input field */}
        <div className="relative flex-1">
          <Input
            type="number"
            min="0"
            max={discountType === 'percent' ? 100 : subtotal}
            placeholder={discountType === 'percent' ? 'Diskon %' : 'Diskon Rp'}
            value={discountValue}
            onChange={(e) => setDiscountValue(e.target.value)}
            disabled={disabled}
            className="pr-8"
          />
          {discountValue && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
              onClick={handleClearDiscount}
              disabled={disabled}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Show discount amount */}
      {discountAmount > 0 && (
        <div className="text-sm text-red-600 font-medium">
          Diskon: -Rp {discountAmount.toLocaleString('id-ID')}
        </div>
      )}
    </div>
  );
};
