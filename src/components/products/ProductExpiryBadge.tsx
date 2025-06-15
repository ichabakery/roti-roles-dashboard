
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Clock, CheckCircle } from 'lucide-react';

interface ProductExpiryBadgeProps {
  hasExpiry: boolean;
  defaultExpiryDays: number | null;
}

export const ProductExpiryBadge: React.FC<ProductExpiryBadgeProps> = ({ 
  hasExpiry, 
  defaultExpiryDays 
}) => {
  if (!hasExpiry) {
    return (
      <Badge variant="secondary" className="flex items-center gap-1">
        <CheckCircle className="h-3 w-3" />
        Tidak Kadaluarsa
      </Badge>
    );
  }

  if (!defaultExpiryDays) {
    return (
      <Badge variant="outline" className="flex items-center gap-1">
        <AlertCircle className="h-3 w-3" />
        Expiry Tidak Diset
      </Badge>
    );
  }

  const getExpiryVariant = (days: number) => {
    if (days <= 1) return 'destructive';
    if (days <= 3) return 'secondary';
    if (days <= 7) return 'outline';
    return 'default';
  };

  return (
    <Badge variant={getExpiryVariant(defaultExpiryDays)} className="flex items-center gap-1">
      <Clock className="h-3 w-3" />
      {defaultExpiryDays} Hari
    </Badge>
  );
};
