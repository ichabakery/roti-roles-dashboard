
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Search } from 'lucide-react';
import { ReturnCondition } from '@/types/products';

interface ReturnItem {
  productId: string;
  quantity: number;
  reason: string;
  condition: ReturnCondition;
}

interface ReturnItemFormProps {
  item: ReturnItem;
  index: number;
  products: Array<{ id: string; name: string; active: boolean; }>;
  onUpdate: (index: number, field: keyof ReturnItem, value: any) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
}

const conditionOptions = [
  { value: 'resaleable', label: 'Bisa Dijual Ulang' },
  { value: 'damaged', label: 'Rusak' },
  { value: 'expired', label: 'Kadaluarsa' },
  { value: 'sample', label: 'Icipan' },
  { value: 'bonus', label: 'Imbohan' }
];

// Simple fuzzy search function
const fuzzyMatch = (text: string, query: string): { match: boolean; score: number } => {
  const textLower = text.toLowerCase();
  const queryLower = query.toLowerCase();
  
  // Exact match
  if (textLower === queryLower) return { match: true, score: 100 };
  
  // Starts with query
  if (textLower.startsWith(queryLower)) return { match: true, score: 90 };
  
  // Contains query as substring
  if (textLower.includes(queryLower)) return { match: true, score: 80 };
  
  // Check if all characters of query exist in order in text (fuzzy)
  let queryIndex = 0;
  let matchedChars = 0;
  for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
    if (textLower[i] === queryLower[queryIndex]) {
      matchedChars++;
      queryIndex++;
    }
  }
  
  if (queryIndex === queryLower.length) {
    // All query chars found in order
    const score = 50 + (matchedChars / text.length) * 30;
    return { match: true, score };
  }
  
  // Partial match - at least 60% of chars match
  if (matchedChars >= queryLower.length * 0.6) {
    return { match: true, score: 30 + (matchedChars / queryLower.length) * 20 };
  }
  
  return { match: false, score: 0 };
};

export const ReturnItemForm: React.FC<ReturnItemFormProps> = ({
  item,
  index,
  products,
  onUpdate,
  onRemove,
  canRemove
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Get selected product name
  const selectedProduct = products.find(p => p.id === item.productId);

  // Fuzzy search and sort by relevance
  const suggestions = useMemo(() => {
    if (!searchQuery || searchQuery.length < 1) return [];
    
    const results = products
      .filter(p => p.active)
      .map(product => {
        const result = fuzzyMatch(product.name, searchQuery);
        return { ...product, ...result };
      })
      .filter(p => p.match)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8); // Limit to 8 suggestions
    
    return results;
  }, [products, searchQuery]);

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
    onUpdate(index, 'productId', productId);
    setSearchQuery('');
    setShowSuggestions(false);
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
    <div className="border rounded-lg p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="font-medium">Produk #{index + 1}</h4>
        {canRemove && (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => onRemove(index)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="relative">
          <Label>Produk *</Label>
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={inputRef}
                placeholder="Ketik untuk mencari produk..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                className="pl-10"
              />
            </div>
            
            {/* Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div 
                ref={suggestionsRef}
                className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-48 overflow-y-auto"
              >
                <div className="p-1">
                  <p className="px-2 py-1 text-xs text-muted-foreground font-medium">Saran Produk:</p>
                  {suggestions.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground rounded-sm cursor-pointer transition-colors"
                      onClick={() => handleSelectProduct(product.id)}
                    >
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

            {/* Selected product display */}
            {selectedProduct && (
              <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                <span className="text-sm font-medium">Dipilih:</span>
                <span className="text-sm">{selectedProduct.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="ml-auto h-6 w-6 p-0"
                  onClick={() => onUpdate(index, 'productId', '')}
                >
                  ×
                </Button>
              </div>
            )}

            {!selectedProduct && !showSuggestions && (
              <p className="text-xs text-muted-foreground">
                Ketik nama produk untuk melihat saran
              </p>
            )}
          </div>
        </div>

        <div>
          <Label>Jumlah *</Label>
          <Input
            type="number"
            min="1"
            value={item.quantity}
            onChange={(e) => onUpdate(index, 'quantity', parseInt(e.target.value) || 1)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Alasan Spesifik</Label>
          <Input
            value={item.reason}
            onChange={(e) => onUpdate(index, 'reason', e.target.value)}
            placeholder="Alasan detail untuk produk ini"
          />
        </div>

        <div>
          <Label>Kondisi Produk *</Label>
          <Select 
            value={item.condition} 
            onValueChange={(value) => onUpdate(index, 'condition', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {conditionOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
