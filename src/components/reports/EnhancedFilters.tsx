
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search, Filter } from 'lucide-react';

interface EnhancedFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCashier: string;
  setSelectedCashier: (cashier: string) => void;
  selectedPaymentMethod: string;
  setSelectedPaymentMethod: (method: string) => void;
  showProductsOnly: boolean;
  setShowProductsOnly: (show: boolean) => void;
  transactions: any[];
}

export const EnhancedFilters: React.FC<EnhancedFiltersProps> = ({
  searchQuery,
  setSearchQuery,
  selectedCashier,
  setSelectedCashier,
  selectedPaymentMethod,
  setSelectedPaymentMethod,
  showProductsOnly,
  setShowProductsOnly,
  transactions
}) => {
  // Get unique cashiers and payment methods from transactions
  const uniqueCashiers = [...new Set(transactions.map(t => t.cashier_name))].filter(Boolean);
  const uniquePaymentMethods = [...new Set(transactions.map(t => t.payment_method))].filter(Boolean);

  return (
    <div className="bg-white border rounded-lg p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Filter className="h-4 w-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">Filter Tambahan</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Cari ID transaksi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Cashier Filter */}
        <Select value={selectedCashier} onValueChange={setSelectedCashier}>
          <SelectTrigger>
            <SelectValue placeholder="Semua Kasir" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kasir</SelectItem>
            {uniqueCashiers.map(cashier => (
              <SelectItem key={cashier} value={cashier}>
                {cashier}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Payment Method Filter */}
        <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
          <SelectTrigger>
            <SelectValue placeholder="Semua Metode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Metode</SelectItem>
            {uniquePaymentMethods.map(method => (
              <SelectItem key={method} value={method}>
                {method.toUpperCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Products Only */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="productsOnly"
            checked={showProductsOnly}
            onChange={(e) => setShowProductsOnly(e.target.checked)}
            className="rounded border-gray-300"
          />
          <label htmlFor="productsOnly" className="text-sm text-gray-700">
            Hanya dengan produk
          </label>
        </div>
      </div>
    </div>
  );
};
