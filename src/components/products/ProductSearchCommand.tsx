import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchValue.toLowerCase())
  );

  const handleSelect = (product: Product) => {
    onSelectProduct(product);
    setOpen(false);
    setSearchValue('');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={placeholder}
            value={searchValue}
            onChange={(e) => {
              setSearchValue(e.target.value);
              if (e.target.value.length > 0) {
                setOpen(true);
              }
            }}
            onFocus={() => {
              if (searchValue.length > 0 || products.length > 0) {
                setOpen(true);
              }
            }}
            className="pl-10"
          />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <Command>
          <CommandList>
            <CommandEmpty>Produk tidak ditemukan</CommandEmpty>
            <CommandGroup heading="Hasil Pencarian">
              {filteredProducts.slice(0, 10).map((product) => (
                <CommandItem
                  key={product.id}
                  value={product.name}
                  onSelect={() => handleSelect(product)}
                  className="cursor-pointer"
                >
                  <div className="flex flex-col w-full">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{product.name}</span>
                      <span className="text-sm text-green-600 font-semibold">
                        Rp {product.price.toLocaleString('id-ID')}
                      </span>
                    </div>
                    {product.description && (
                      <span className="text-xs text-muted-foreground">
                        {product.description}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
              {filteredProducts.length > 10 && (
                <div className="px-2 py-1.5 text-xs text-muted-foreground text-center">
                  +{filteredProducts.length - 10} produk lainnya
                </div>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
