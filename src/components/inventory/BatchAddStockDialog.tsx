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
import { Progress } from '@/components/ui/progress';
import { Search, Package, Save, X, Layers, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { BatchStockTable } from './BatchStockTable';
import { BranchFilterPopover } from './BranchFilterPopover';
import { batchAddStock, fetchProductsWithStock, BatchStockItem, BatchProgress } from '@/services/batchInventoryService';

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
  const isMobile = useIsMobile();
  const [products, setProducts] = useState<ProductWithStock[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState<BatchProgress | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockInputs, setStockInputs] = useState<StockInputs>({});
  const [uniformStock, setUniformStock] = useState(false);
  const [uniformValue, setUniformValue] = useState<number>(0);
  
  // Branch filter state - default all branches selected
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);

  // Initialize selected branches when branches prop changes
  useEffect(() => {
    if (branches.length > 0 && selectedBranches.length === 0) {
      setSelectedBranches(branches.map(b => b.id));
    }
  }, [branches]);

  // Filter branches based on selection
  const filteredBranches = useMemo(() => {
    return branches.filter(b => selectedBranches.includes(b.id));
  }, [branches, selectedBranches]);

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

  // Apply uniform stock to all visible products and selected branches
  const applyUniformStock = () => {
    if (uniformValue <= 0) return;

    const newInputs: StockInputs = { ...stockInputs };
    filteredProducts.forEach((product) => {
      if (!newInputs[product.id]) {
        newInputs[product.id] = {};
      }
      filteredBranches.forEach((branch) => {
        newInputs[product.id][branch.id] = uniformValue;
      });
    });
    setStockInputs(newInputs);
    
    toast({
      title: 'Stok diterapkan',
      description: `${uniformValue} unit diterapkan ke ${filteredProducts.length} produk di ${filteredBranches.length} cabang`,
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
    setSaveProgress(null);
    
    try {
      const result = await batchAddStock(items, userId, (progress) => {
        setSaveProgress(progress);
      });
      
      if (result.success) {
        toast({
          title: 'Berhasil',
          description: `${result.totalUpdated + result.totalInserted} stok berhasil ditambahkan`,
        });
        
        // Refresh data untuk update label "Stok: X" dengan nilai terbaru
        await loadProducts();
        
        // Reset inputs setelah refresh
        setStockInputs({});
        setUniformValue(0);
        onSuccess();
        // Jangan tutup dialog agar user bisa lihat hasil update
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
      setSaveProgress(null);
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
    setSelectedBranches(branches.map(b => b.id));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[98vw] md:max-w-[95vw] w-full max-h-[95vh] md:max-h-[90vh] flex flex-col p-4 md:p-6">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2 text-base md:text-lg">
            <Layers className="h-4 w-4 md:h-5 md:w-5" />
            Batch Tambah Stok
          </DialogTitle>
          <DialogDescription className="text-xs md:text-sm">
            Tambah stok banyak produk ke banyak cabang sekaligus.
          </DialogDescription>
        </DialogHeader>

        {/* Filters - Responsive layout */}
        <div className="flex flex-col gap-3 py-3 border-b">
          {/* Row 1: Search (full width on mobile) */}
          <div className="w-full">
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

          {/* Row 2: Category, Branch Filter, Stats */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Category Filter */}
            <div className="w-full sm:w-auto sm:min-w-[160px]">
              <Label htmlFor="category" className="sr-only">Kategori</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full">
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

            {/* Branch Filter */}
            <BranchFilterPopover
              branches={branches}
              selectedBranches={selectedBranches}
              onSelectionChange={setSelectedBranches}
            />

            {/* Stats + Refresh Button */}
            <div className="flex items-center gap-2 ml-auto">
              <Button
                variant="ghost"
                size="sm"
                onClick={loadProducts}
                disabled={loading}
                className="h-8 w-8 p-0"
                title="Refresh data"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <Badge variant="outline" className="gap-1 text-xs">
                <Package className="h-3 w-3" />
                {filteredProducts.length}
              </Badge>
              {totalChanges > 0 && (
                <Badge variant="default" className="gap-1 text-xs">
                  {totalChanges}
                </Badge>
              )}
            </div>
          </div>

          {/* Row 3: Uniform Stock (optional) */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
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
                  disabled={uniformValue <= 0 || filteredBranches.length === 0}
                >
                  Terapkan
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Table - takes remaining space with overflow handling */}
        <div className="flex-1 min-h-0 py-2 flex flex-col overflow-hidden">
          {selectedBranches.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              Pilih minimal satu cabang untuk menampilkan tabel
            </div>
          ) : (
            <div className="flex-1 min-h-0">
              <BatchStockTable
                products={filteredProducts}
                branches={filteredBranches}
                stockInputs={stockInputs}
                onStockChange={handleStockChange}
                loading={loading}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="gap-2 border-t pt-3 flex-col sm:flex-row">
          {/* Progress indicator during save */}
          {saving && saveProgress && (
            <div className="w-full flex flex-col gap-1 mr-auto">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Menyimpan batch {saveProgress.current}/{saveProgress.total}</span>
                <span>{saveProgress.percentage}%</span>
              </div>
              <Progress value={saveProgress.percentage} className="h-2" />
            </div>
          )}
          
          <div className="flex gap-2 w-full sm:w-auto flex-col-reverse sm:flex-row">
            <Button variant="outline" onClick={handleClose} disabled={saving} className="w-full sm:w-auto">
              <X className="h-4 w-4 mr-2" />
              Batal
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={saving || totalChanges === 0}
              className="w-full sm:w-auto"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Menyimpan...' : `Simpan (${totalChanges})`}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
