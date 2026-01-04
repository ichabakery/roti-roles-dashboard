import React, { useState, useRef, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Product } from '@/types/products';

interface ProductSearchCommandProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  placeholder?: string;
}

export const ProductSearchCommand: React.FC<ProductSearchCommandProps> = ({
  products,
  onSelectProduct,
  placeholder = "Cari produk..."
}) => {
  const [searchValue, setSearchValue] = useState('');
  const [showResults, setShowResults] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredProducts = useMemo(() => {
    if (!searchValue.trim()) return [];
    return products.filter(product =>
      product.name.toLowerCase().includes(searchValue.toLowerCase())
    ).slice(0, 10);
  }, [products, searchValue]);

  const handleSelect = (product: Product) => {
    onSelectProduct(product);
    setSearchValue('');
    setShowResults(false);
  };

  return (
    <div className="relative w-full sm:w-80">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      <Input
        ref={inputRef}
        placeholder={placeholder}
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        onFocus={() => setShowResults(true)}
        onBlur={() => setTimeout(() => setShowResults(false), 200)}
        className="pl-10"
      />
      
      {showResults && searchValue.trim() && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border rounded-md shadow-lg max-h-64 overflow-y-auto">
          {filteredProducts.length === 0 ? (
            <div className="p-3 text-sm text-muted-foreground text-center">
              Produk tidak ditemukan
            </div>
          ) : (
            <>
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelect(product)}
                  className="p-3 cursor-pointer hover:bg-accent border-b last:border-b-0"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{product.name}</span>
                    <span className="text-sm text-green-600 font-semibold">
                      Rp {product.price.toLocaleString('id-ID')}
                    </span>
                  </div>
                  {product.description && (
                    <span className="text-xs text-muted-foreground line-clamp-1">
                      {product.description}
                    </span>
                  )}
                </div>
              ))}
              {products.filter(p => p.name.toLowerCase().includes(searchValue.toLowerCase())).length > 10 && (
                <div className="px-3 py-2 text-xs text-muted-foreground text-center bg-muted/50">
                  +{products.filter(p => p.name.toLowerCase().includes(searchValue.toLowerCase())).length - 10} produk lainnya
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
