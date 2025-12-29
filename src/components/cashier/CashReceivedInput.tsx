import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Banknote, ArrowRight } from 'lucide-react';

interface CashReceivedInputProps {
  totalAmount: number;
  onCashReceivedChange: (received: number, change: number) => void;
  disabled?: boolean;
}

export const CashReceivedInput: React.FC<CashReceivedInputProps> = ({
  totalAmount,
  onCashReceivedChange,
  disabled = false
}) => {
  const [inputValue, setInputValue] = useState('');
  const [cashReceived, setCashReceived] = useState(0);

  // Calculate change
  const change = cashReceived >= totalAmount ? cashReceived - totalAmount : 0;
  const isInsufficient = cashReceived > 0 && cashReceived < totalAmount;

  // Notify parent of changes
  useEffect(() => {
    onCashReceivedChange(cashReceived, change);
  }, [cashReceived, change, onCashReceivedChange]);

  // Format number to Rupiah string
  const formatToRupiah = (num: number): string => {
    if (num === 0) return '';
    return num.toLocaleString('id-ID');
  };

  // Parse Rupiah string to number
  const parseFromRupiah = (str: string): number => {
    // Remove all non-digit characters
    const digitsOnly = str.replace(/\D/g, '');
    return parseInt(digitsOnly, 10) || 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const numericValue = parseFromRupiah(rawValue);
    
    setCashReceived(numericValue);
    setInputValue(formatToRupiah(numericValue));
  };

  // Quick amount buttons
  const quickAmounts = [
    { label: 'Pas', value: totalAmount },
    { label: '50rb', value: 50000 },
    { label: '100rb', value: 100000 },
    { label: '200rb', value: 200000 },
  ];

  const handleQuickAmount = (amount: number) => {
    setCashReceived(amount);
    setInputValue(formatToRupiah(amount));
  };

  return (
    <div className="space-y-3 p-4 bg-muted/50 rounded-lg border">
      {/* Input Uang Diterima */}
      <div className="space-y-2">
        <Label htmlFor="cash-received" className="flex items-center gap-2 text-sm font-medium">
          <Banknote className="h-4 w-4" />
          Uang Diterima
        </Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
            Rp
          </span>
          <Input
            id="cash-received"
            type="text"
            inputMode="numeric"
            placeholder="0"
            value={inputValue}
            onChange={handleInputChange}
            disabled={disabled}
            className={`pl-10 text-lg font-semibold ${
              isInsufficient ? 'border-destructive focus-visible:ring-destructive' : ''
            }`}
          />
        </div>
        
        {/* Quick amount buttons */}
        <div className="flex gap-2 flex-wrap">
          {quickAmounts.map((qa) => (
            <button
              key={qa.label}
              type="button"
              onClick={() => handleQuickAmount(qa.value)}
              disabled={disabled}
              className="px-3 py-1 text-xs font-medium rounded-full bg-background border hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-50"
            >
              {qa.label}
            </button>
          ))}
        </div>
      </div>

      {/* Kembalian Display */}
      <div className={`p-3 rounded-lg ${
        cashReceived >= totalAmount && cashReceived > 0
          ? 'bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800'
          : isInsufficient
          ? 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800'
          : 'bg-muted border'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowRight className="h-4 w-4" />
            <span className="text-sm font-medium">Kembalian</span>
          </div>
          <span className={`text-lg font-bold ${
            cashReceived >= totalAmount && cashReceived > 0
              ? 'text-green-600 dark:text-green-400'
              : isInsufficient
              ? 'text-destructive'
              : 'text-muted-foreground'
          }`}>
            {isInsufficient 
              ? `Kurang Rp ${(totalAmount - cashReceived).toLocaleString('id-ID')}`
              : `Rp ${change.toLocaleString('id-ID')}`
            }
          </span>
        </div>
      </div>

      {/* Warning for insufficient amount */}
      {isInsufficient && (
        <p className="text-xs text-destructive">
          Uang yang diterima kurang dari total belanja
        </p>
      )}
    </div>
  );
};
