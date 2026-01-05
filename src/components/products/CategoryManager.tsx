import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, GripVertical, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useCategories } from '@/hooks/useCategories';
import { categoryService, ProductCategory } from '@/services/categoryService';
import { Skeleton } from '@/components/ui/skeleton';

export const CategoryManager: React.FC = () => {
  const { categories, loading, addCategory, updateCategory, deleteCategory, refetch } = useCategories();
  
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(null);
  const [newCategoryLabel, setNewCategoryLabel] = useState('');
  const [editLabel, setEditLabel] = useState('');
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);

  // Fetch product counts for each category
  useEffect(() => {
    const fetchProductCounts = async () => {
      const counts: Record<string, number> = {};
      for (const cat of categories) {
        try {
          const count = await categoryService.getProductCountByCategory(cat.value);
          counts[cat.value] = count;
        } catch {
          counts[cat.value] = 0;
        }
      }
      setProductCounts(counts);
    };
    
    if (categories.length > 0) {
      fetchProductCounts();
    }
  }, [categories]);

  const handleAddCategory = async () => {
    if (!newCategoryLabel.trim()) return;
    
    setSaving(true);
    const success = await addCategory(newCategoryLabel.trim());
    setSaving(false);
    
    if (success) {
      setNewCategoryLabel('');
      setAddDialogOpen(false);
    }
  };

  const handleEditCategory = async () => {
    if (!selectedCategory || !editLabel.trim()) return;
    
    setSaving(true);
    const success = await updateCategory(selectedCategory.id, { label: editLabel.trim() });
    setSaving(false);
    
    if (success) {
      setEditDialogOpen(false);
      setSelectedCategory(null);
    }
  };

  const handleDeleteCategory = async () => {
    if (!selectedCategory) return;
    
    setSaving(true);
    const success = await deleteCategory(selectedCategory.id);
    setSaving(false);
    
    if (success) {
      setDeleteDialogOpen(false);
      setSelectedCategory(null);
    }
  };

  const openEditDialog = (category: ProductCategory) => {
    setSelectedCategory(category);
    setEditLabel(category.label);
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (category: ProductCategory) => {
    setSelectedCategory(category);
    setDeleteDialogOpen(true);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Kategori Produk</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Kategori Produk
          </CardTitle>
          <Button onClick={() => setAddDialogOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Tambah Kategori
          </Button>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Belum ada kategori. Klik "Tambah Kategori" untuk membuat yang baru.
            </div>
          ) : (
            <div className="space-y-2">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {category.label}
                        {category.is_default && (
                          <Badge variant="secondary" className="text-xs">Default</Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {productCounts[category.value] || 0} produk
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(category)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openDeleteDialog(category)}
                      disabled={category.is_default}
                      className={category.is_default ? 'opacity-50 cursor-not-allowed' : ''}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Category Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Kategori Baru</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nama Kategori</label>
              <Input
                value={newCategoryLabel}
                onChange={(e) => setNewCategoryLabel(e.target.value)}
                placeholder="Contoh: Snack, Frozen Food, dll"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddDialogOpen(false)}
              disabled={saving}
            >
              Batal
            </Button>
            <Button
              onClick={handleAddCategory}
              disabled={saving || !newCategoryLabel.trim()}
            >
              {saving ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Kategori</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nama Kategori</label>
              <Input
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                placeholder="Nama kategori"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              disabled={saving}
            >
              Batal
            </Button>
            <Button
              onClick={handleEditCategory}
              disabled={saving || !editLabel.trim()}
            >
              {saving ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Kategori?</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedCategory && productCounts[selectedCategory.value] > 0 ? (
                <>
                  Kategori "{selectedCategory.label}" memiliki {productCounts[selectedCategory.value]} produk terkait.
                  Produk-produk tersebut tidak akan terhapus, namun kategorinya akan kosong.
                </>
              ) : (
                <>Apakah Anda yakin ingin menghapus kategori "{selectedCategory?.label}"?</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCategory}
              disabled={saving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {saving ? 'Menghapus...' : 'Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
