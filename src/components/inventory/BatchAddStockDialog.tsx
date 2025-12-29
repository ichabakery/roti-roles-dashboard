import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Search, Package, Save, X, Layers } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { BatchStockTable } from './BatchStockTable';
import { batchAddStock, fetchProductsWithStock, BatchStockItem } from '@/services/batchInventoryService';

interface Branch {
  id: string;
  name: string;
}

interface ProductWithStock {
  id: string;
  name: string;
  price: number;
  category: string | null;
  sku: string | null;
  stockByBranch: Map<string, number>;
}

interface StockInputs {
  [productId: string]: {
    [branchId: string]: number;
  };
}

interface BatchAddStockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branches: Branch[];
  userId: string;
  onSuccess: () => void;
}

const CATEGORIES = [
  { value: 'all', label: 'Semua Kategori' },
  { value: 'produk_utama', label: 'Produk Utama' },
  { value: 'minuman', label: 'Minuman' },
  { value: 'titipan', label: 'Titipan' },
  { value: 'peralatan_ultah', label: 'Peralatan Ultah' },
  { value: 'tart', label: 'Tart' },
  { value: 'es_krim', label: 'Es Krim' },
];

export const BatchAddStockDialog: React.FC<BatchAddStockDialogProps> = ({
  open,
  onOpenChange,
  branches,
  userId,
  onSuccess,
}) => {
  const { toast } = useToast();
  const [products, setProducts] = useState<ProductWithStock[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockInputs, setStockInputs] = useState<StockInputs>({});
  const [uniformStock, setUniformStock] = useState(false);
  const [uniformValue, setUniformValue] = useState<number>(0);

  // Load products when dialog opens
  useEffect(() => {
    if (open && branches.length > 0) {
      loadProducts();
    }
  }, [open, branches]);

  const loadProducts = async () => {
    if (branches.length === 0) return;
    
    setLoading(true);
    try {
      const branchIds = branches.map(b => b.id);
      const data = await fetchProductsWithStock(branchIds);
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Gagal memuat data produk',
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter products by search and category
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
      const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, categoryFilter]);

  // Count total changes
  const totalChanges = useMemo(() => {
    let count = 0;
    Object.values(stockInputs).forEach((branchInputs) => {
      Object.values(branchInputs).forEach((qty) => {
        if (qty > 0) count++;
      });
    });
    return count;
  }, [stockInputs]);

  const handleStockChange = (productId: string, branchId: string, quantity: number) => {
    setStockInputs((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [branchId]: quantity,
      },
    }));
  };

  // Apply uniform stock to all visible products and branches
  const applyUniformStock = () => {
    if (uniformValue <= 0) return;

    const newInputs: StockInputs = { ...stockInputs };
    filteredProducts.forEach((product) => {
      if (!newInputs[product.id]) {
        newInputs[product.id] = {};
      }
      branches.forEach((branch) => {
        newInputs[product.id][branch.id] = uniformValue;
      });
    });
    setStockInputs(newInputs);
    
    toast({
      title: 'Stok diterapkan',
      description: `${uniformValue} unit diterapkan ke ${filteredProducts.length} produk di ${branches.length} cabang`,
    });
  };

  const handleSave = async () => {
    // Collect all items to save
    const items: BatchStockItem[] = [];
    Object.entries(stockInputs).forEach(([productId, branchInputs]) => {
      Object.entries(branchInputs).forEach(([branchId, quantity]) => {
        if (quantity > 0) {
          items.push({ productId, branchId, quantity });
        }
      });
    });

    if (items.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Tidak ada stok yang diisi',
      });
      return;
    }

    setSaving(true);
    try {
      const result = await batchAddStock(items, userId);
      
      if (result.success) {
        toast({
          title: 'Berhasil',
          description: `${result.totalUpdated + result.totalInserted} stok berhasil ditambahkan`,
        });
        setStockInputs({});
        setUniformValue(0);
        onSuccess();
        onOpenChange(false);
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.errors.join(', '),
        });
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Gagal menyimpan stok',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (totalChanges > 0) {
      if (!confirm('Ada perubahan yang belum disimpan. Yakin ingin menutup?')) {
        return;
      }
    }
    setStockInputs({});
    setUniformValue(0);
    setSearchQuery('');
    setCategoryFilter('all');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[95vw] w-full max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Batch Tambah Stok
          </DialogTitle>
          <DialogDescription>
            Tambah stok banyak produk ke banyak cabang sekaligus. Input jumlah stok yang akan ditambahkan.
          </DialogDescription>
        </DialogHeader>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 py-4 border-b">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <Label htmlFor="search" className="sr-only">Cari Produk</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Cari produk atau SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="w-48">
            <Label htmlFor="category" className="sr-only">Kategori</Label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih kategori" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Uniform Stock */}
          <div className="flex items-center gap-2 border-l pl-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="uniformStock"
                checked={uniformStock}
                onCheckedChange={(checked) => setUniformStock(checked === true)}
              />
              <Label htmlFor="uniformStock" className="text-sm cursor-pointer">
                Stok seragam
              </Label>
            </div>
            {uniformStock && (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="1"
                  placeholder="Qty"
                  value={uniformValue || ''}
                  onChange={(e) => setUniformValue(parseInt(e.target.value) || 0)}
                  className="w-20 h-8"
                />
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={applyUniformStock}
                  disabled={uniformValue <= 0}
                >
                  Terapkan
                </Button>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Package className="h-3 w-3" />
              {filteredProducts.length} Produk
            </Badge>
            {totalChanges > 0 && (
              <Badge variant="default" className="gap-1">
                {totalChanges} Perubahan
              </Badge>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <BatchStockTable
            products={filteredProducts}
            branches={branches}
            stockInputs={stockInputs}
            onStockChange={handleStockChange}
            loading={loading}
          />
        </div>

        <DialogFooter className="gap-2 border-t pt-4">
          <Button variant="outline" onClick={handleClose} disabled={saving}>
            <X className="h-4 w-4 mr-2" />
            Batal
          </Button>
          <Button onClick={handleSave} disabled={saving || totalChanges === 0}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Menyimpan...' : `Simpan (${totalChanges})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
