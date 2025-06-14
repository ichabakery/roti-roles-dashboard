
import { useState } from 'react';

export const useCashierState = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');

  return {
    searchQuery,
    setSearchQuery,
    paymentMethod,
    setPaymentMethod
  };
};
