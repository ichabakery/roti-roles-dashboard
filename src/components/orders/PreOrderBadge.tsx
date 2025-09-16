import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';

interface PreOrderBadgeProps {
  isPreOrder: boolean;
  className?: string;
}

export function PreOrderBadge({ isPreOrder, className = "" }: PreOrderBadgeProps) {
  if (!isPreOrder) return null;

  return (
    <Badge variant="outline" className={`border-orange-300 text-orange-700 bg-orange-50 ${className}`}>
      <Clock className="h-3 w-3 mr-1" />
      PRE-ORDER
    </Badge>
  );
}