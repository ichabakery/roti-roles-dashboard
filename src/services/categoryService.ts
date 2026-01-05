import { supabase } from '@/integrations/supabase/client';

export interface ProductCategory {
  id: string;
  value: string;
  label: string;
  display_order: number;
  is_default: boolean;
  active: boolean;
  created_at?: string;
  created_by?: string;
}

export const categoryService = {
  // Fetch all active categories
  async getCategories(): Promise<ProductCategory[]> {
    const { data, error } = await supabase
      .from('product_categories')
      .select('*')
      .eq('active', true)
      .order('display_order', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  // Create new category
  async createCategory(label: string, value?: string): Promise<ProductCategory> {
    // Generate value from label if not provided
    const categoryValue = value || label.toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');
    
    // Get max display_order
    const { data: maxOrder } = await supabase
      .from('product_categories')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1)
      .single();
    
    const nextOrder = (maxOrder?.display_order || 0) + 1;
    
    const { data, error } = await supabase
      .from('product_categories')
      .insert({ 
        label, 
        value: categoryValue,
        display_order: nextOrder
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update category
  async updateCategory(id: string, updates: Partial<Pick<ProductCategory, 'label' | 'value' | 'display_order'>>) {
    const { error } = await supabase
      .from('product_categories')
      .update(updates)
      .eq('id', id);
    
    if (error) throw error;
  },

  // Soft delete (set active = false)
  async deleteCategory(id: string) {
    // Check if category is default
    const { data: category } = await supabase
      .from('product_categories')
      .select('is_default')
      .eq('id', id)
      .single();
    
    if (category?.is_default) {
      throw new Error('Kategori default tidak dapat dihapus');
    }
    
    const { error } = await supabase
      .from('product_categories')
      .update({ active: false })
      .eq('id', id);
    
    if (error) throw error;
  },

  // Get product count per category
  async getProductCountByCategory(categoryValue: string): Promise<number> {
    const { count, error } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('category', categoryValue)
      .eq('active', true);
    
    if (error) throw error;
    return count || 0;
  }
};
