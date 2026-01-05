import { useState, useEffect, useCallback } from 'react';
import { categoryService, ProductCategory } from '@/services/categoryService';
import { useToast } from '@/hooks/use-toast';
import { DEFAULT_CATEGORIES } from '@/constants/productCategories';

export const useCategories = () => {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await categoryService.getCategories();
      
      // If no categories from DB, use defaults
      if (data.length === 0) {
        setCategories(DEFAULT_CATEGORIES.map((cat, index) => ({
          id: cat.value,
          value: cat.value,
          label: cat.label,
          display_order: index + 1,
          is_default: index === 0,
          active: true
        })));
      } else {
        setCategories(data);
      }
    } catch (err: any) {
      console.error('Error fetching categories:', err);
      setError(err.message);
      // Fallback to defaults on error
      setCategories(DEFAULT_CATEGORIES.map((cat, index) => ({
        id: cat.value,
        value: cat.value,
        label: cat.label,
        display_order: index + 1,
        is_default: index === 0,
        active: true
      })));
    } finally {
      setLoading(false);
    }
  }, []);

  const addCategory = useCallback(async (label: string) => {
    try {
      await categoryService.createCategory(label);
      await fetchCategories();
      toast({ 
        title: "Berhasil", 
        description: `Kategori "${label}" berhasil ditambahkan` 
      });
      return true;
    } catch (err: any) {
      console.error('Error adding category:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || 'Gagal menambahkan kategori',
      });
      return false;
    }
  }, [fetchCategories, toast]);

  const updateCategory = useCallback(async (id: string, updates: Partial<ProductCategory>) => {
    try {
      await categoryService.updateCategory(id, updates);
      await fetchCategories();
      toast({ 
        title: "Berhasil", 
        description: "Kategori berhasil diperbarui" 
      });
      return true;
    } catch (err: any) {
      console.error('Error updating category:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || 'Gagal memperbarui kategori',
      });
      return false;
    }
  }, [fetchCategories, toast]);

  const deleteCategory = useCallback(async (id: string) => {
    try {
      await categoryService.deleteCategory(id);
      await fetchCategories();
      toast({ 
        title: "Berhasil", 
        description: "Kategori berhasil dihapus" 
      });
      return true;
    } catch (err: any) {
      console.error('Error deleting category:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || 'Gagal menghapus kategori',
      });
      return false;
    }
  }, [fetchCategories, toast]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    loading,
    error,
    addCategory,
    updateCategory,
    deleteCategory,
    refetch: fetchCategories
  };
};
