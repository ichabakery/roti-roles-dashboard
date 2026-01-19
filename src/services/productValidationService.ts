import { supabase } from '@/integrations/supabase/client';

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  existingProduct?: { id: string; name: string; active: boolean };
  similarProducts: Array<{ id: string; name: string; active: boolean }>;
}

/**
 * Check if a product name already exists (exact match, case-insensitive)
 * @param name Product name to check
 * @param excludeId Optional product ID to exclude (for edit mode)
 */
export const checkDuplicateProductName = async (
  name: string,
  excludeId?: string
): Promise<DuplicateCheckResult> => {
  const trimmedName = name.trim().toLowerCase();
  
  // Check for exact match (case-insensitive)
  let exactQuery = supabase
    .from('products')
    .select('id, name, active')
    .ilike('name', trimmedName);
  
  if (excludeId) {
    exactQuery = exactQuery.neq('id', excludeId);
  }
  
  const { data: exactMatch, error: exactError } = await exactQuery;
  
  if (exactError) {
    console.error('Error checking duplicate name:', exactError);
    throw exactError;
  }
  
  // Check for similar names (contains the search term)
  let similarQuery = supabase
    .from('products')
    .select('id, name, active')
    .or(`name.ilike.%${trimmedName}%,name.ilike.${trimmedName}%,name.ilike.%${trimmedName}`)
    .limit(5);
  
  if (excludeId) {
    similarQuery = similarQuery.neq('id', excludeId);
  }
  
  const { data: similarMatches, error: similarError } = await similarQuery;
  
  if (similarError) {
    console.error('Error checking similar names:', similarError);
    // Don't throw, just return empty similar list
  }
  
  const isDuplicate = exactMatch && exactMatch.length > 0;
  const existingProduct = isDuplicate ? exactMatch[0] : undefined;
  
  // Filter out the exact match from similar products
  const similarProducts = (similarMatches || [])
    .filter(p => p.id !== existingProduct?.id)
    .slice(0, 3);
  
  return {
    isDuplicate,
    existingProduct,
    similarProducts,
  };
};

/**
 * Get all duplicate product names in the database
 */
export const findAllDuplicateProducts = async (): Promise<Array<{
  name: string;
  count: number;
  products: Array<{ id: string; name: string; active: boolean }>;
}>> => {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, active')
    .order('name');
  
  if (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
  
  // Group by lowercase name
  const groupedByName = new Map<string, Array<{ id: string; name: string; active: boolean }>>();
  
  for (const product of data || []) {
    const lowerName = product.name.toLowerCase();
    if (!groupedByName.has(lowerName)) {
      groupedByName.set(lowerName, []);
    }
    groupedByName.get(lowerName)!.push(product);
  }
  
  // Return only groups with duplicates
  const duplicates: Array<{
    name: string;
    count: number;
    products: Array<{ id: string; name: string; active: boolean }>;
  }> = [];
  
  groupedByName.forEach((products, name) => {
    if (products.length > 1) {
      duplicates.push({
        name,
        count: products.length,
        products,
      });
    }
  });
  
  return duplicates;
};
