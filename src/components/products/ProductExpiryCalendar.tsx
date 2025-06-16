
import React from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ProductExpiryCalendarProps {
  hasExpiry: boolean;
  expiryDate?: Date;
  onExpiryDateChange: (date: Date | undefined) => void;
  label?: string;
  disabled?: boolean;
}

export const ProductExpiryCalendar: React.FC<ProductExpiryCalendarProps> = ({
  hasExpiry,
  expiryDate,
  onExpiryDateChange,
  label = "Tanggal Kadaluarsa",
  disabled = false
}) => {
  if (!hasExpiry) {
    return null;
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !expiryDate && "text-muted-foreground"
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {expiryDate ? format(expiryDate, "dd/MM/yyyy") : "Pilih tanggal kadaluarsa"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={expiryDate}
            onSelect={onExpiryDateChange}
            disabled={(date) => date < new Date()}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>
      {!expiryDate && hasExpiry && (
        <p className="text-sm text-muted-foreground">
          Pilih tanggal kadaluarsa untuk produk ini
        </p>
      )}
    </div>
  );
};
