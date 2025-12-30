
export const PRODUCT_CATEGORIES = [
  { value: 'produk_utama', label: 'Produk Utama' },
  { value: 'minuman', label: 'Minuman' },
  { value: 'titipan', label: 'Titipan' },
  { value: 'peralatan', label: 'Peralatan' },
  { value: 'kue_tart', label: 'Kue Tart' },
  { value: 'es_krim', label: 'AICE' },
] as const;

export type ProductCategory = typeof PRODUCT_CATEGORIES[number]['value'];

export const getCategoryLabel = (value: string): string => {
  const category = PRODUCT_CATEGORIES.find(cat => cat.value === value);
  return category?.label || value;
};

export const DEFAULT_CATEGORY: ProductCategory = 'produk_utama';
