
import { useState } from 'react';

export const useCashierState = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  return {
    searchQuery,
    setSearchQuery,
    paymentMethod,
    setPaymentMethod,
    viewMode,
    setViewMode,
  };
};
