// Default categories as fallback when database is empty or unavailable
export const DEFAULT_CATEGORIES = [
  { value: 'produk_utama', label: 'Produk Utama' },
  { value: 'minuman', label: 'Minuman' },
  { value: 'titipan', label: 'Titipan' },
  { value: 'peralatan', label: 'Peralatan' },
  { value: 'kue_tart', label: 'Kue Tart' },
  { value: 'es_krim', label: 'AICE' },
] as const;

// Keep PRODUCT_CATEGORIES as alias for backward compatibility
export const PRODUCT_CATEGORIES = DEFAULT_CATEGORIES;

export type ProductCategoryValue = typeof DEFAULT_CATEGORIES[number]['value'];

// Helper to get category label with fallback
export const getCategoryLabel = (
  value: string, 
  dynamicCategories?: Array<{ value: string; label: string }>
): string => {
  // First check dynamic categories from database
  if (dynamicCategories) {
    const found = dynamicCategories.find(cat => cat.value === value);
    if (found) return found.label;
  }
  // Fallback to default constants
  const fallback = DEFAULT_CATEGORIES.find(cat => cat.value === value);
  return fallback?.label || value;
};

export const DEFAULT_CATEGORY_VALUE: ProductCategoryValue = 'produk_utama';
