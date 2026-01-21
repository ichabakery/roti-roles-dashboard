
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Search, X } from 'lucide-react';
import { ReturnCondition } from '@/types/products';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface ReturnItem {
  productId: string;
  quantity: number;
  condition: ReturnCondition;
}

interface BulkReturnTableProps {
  returnItems: ReturnItem[];
  setReturnItems: React.Dispatch<React.SetStateAction<ReturnItem[]>>;
  products: Array<{ id: string; name: string; active: boolean; }>;
  defaultCondition: ReturnCondition;
}

// Simple fuzzy search function
const fuzzyMatch = (text: string, query: string): { match: boolean; score: number } => {
  const textLower = text.toLowerCase();
  const queryLower = query.toLowerCase();
  
  if (textLower === queryLower) return { match: true, score: 100 };
  if (textLower.startsWith(queryLower)) return { match: true, score: 90 };
  if (textLower.includes(queryLower)) return { match: true, score: 80 };
  
  let queryIndex = 0;
  let matchedChars = 0;
  for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
    if (textLower[i] === queryLower[queryIndex]) {
      matchedChars++;
      queryIndex++;
    }
  }
  
  if (queryIndex === queryLower.length) {
    const score = 50 + (matchedChars / text.length) * 30;
    return { match: true, score };
  }
  
  if (matchedChars >= queryLower.length * 0.6) {
    return { match: true, score: 30 + (matchedChars / queryLower.length) * 20 };
  }
  
  return { match: false, score: 0 };
};

export const BulkReturnTable: React.FC<BulkReturnTableProps> = ({
  returnItems,
  setReturnItems,
  products,
  defaultCondition
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Fuzzy search and sort by relevance
  const suggestions = useMemo(() => {
    if (!searchQuery || searchQuery.length < 1) return [];
    
    const selectedIds = new Set(returnItems.map(item => item.productId));
    
    const results = products
      .filter(p => p.active && !selectedIds.has(p.id))
      .map(product => {
        const result = fuzzyMatch(product.name, searchQuery);
        return { ...product, ...result };
      })
      .filter(p => p.match)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
    
    return results;
  }, [products, searchQuery, returnItems]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectProduct = (productId: string) => {
    // Add product with default values
    setReturnItems(prev => [...prev, {
      productId,
      quantity: 1,
      condition: defaultCondition
    }]);
    setSearchQuery('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const removeItem = (index: number) => {
    setReturnItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateQuantity = (index: number, quantity: number) => {
    setReturnItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], quantity: Math.max(1, quantity) };
      return updated;
    });
  };

  const getProductName = (productId: string) => {
    return products.find(p => p.id === productId)?.name || 'Unknown';
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() 
        ? <span key={i} className="bg-primary/20 text-primary font-medium">{part}</span>
        : part
    );
  };

  return (
    <div className="space-y-4">
      {/* Product Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          placeholder="Ketik nama produk untuk menambahkan..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          className="pl-10"
        />
        
        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div 
            ref={suggestionsRef}
            className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-48 overflow-y-auto"
          >
            <div className="p-1">
              <p className="px-2 py-1 text-xs text-muted-foreground font-medium">Klik untuk menambahkan:</p>
              {suggestions.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground rounded-sm cursor-pointer transition-colors flex items-center gap-2"
                  onClick={() => handleSelectProduct(product.id)}
                >
                  <Plus className="h-4 w-4 text-primary" />
                  {highlightMatch(product.name, searchQuery)}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {showSuggestions && searchQuery && suggestions.length === 0 && (
          <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg p-3">
            <p className="text-sm text-muted-foreground text-center">
              Tidak ada produk yang mirip dengan "{searchQuery}"
            </p>
          </div>
        )}
      </div>

      {/* Products Table - Simplified: only Product + Quantity */}
      {returnItems.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[60%]">Produk</TableHead>
                <TableHead className="w-[30%] text-center">Jumlah</TableHead>
                <TableHead className="w-[10%]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {returnItems.map((item, index) => (
                <TableRow key={`${item.productId}-${index}`}>
                  <TableCell className="font-medium">
                    {getProductName(item.productId)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => updateQuantity(index, item.quantity - 1)}
                      >
                        -
                      </Button>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(index, parseInt(e.target.value) || 1)}
                        className="w-16 h-8 text-center"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => updateQuantity(index, item.quantity + 1)}
                      >
                        +
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      onClick={() => removeItem(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Summary */}
      {returnItems.length > 0 && (
        <div className="flex justify-between items-center text-sm text-muted-foreground bg-muted/50 rounded-lg px-4 py-2">
          <span>Total: {returnItems.length} produk</span>
          <span>{returnItems.reduce((sum, item) => sum + item.quantity, 0)} item</span>
        </div>
      )}

      {returnItems.length === 0 && (
        <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
          <p>Belum ada produk ditambahkan</p>
          <p className="text-sm">Ketik nama produk di atas untuk menambahkan</p>
        </div>
      )}
    </div>
  );
};
