
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types/inventory';

export const fetchActiveProducts = async (): Promise<Product[]> => {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, has_expiry, default_expiry_days')
    .eq('active', true)
    .order('name');

  if (error) throw error;
  return data || [];
};

export const createProductWithExpiry = async (productData: {
  name: string;
  description?: string;
  price: number;
  has_expiry: boolean;
  default_expiry_days?: number;
}) => {
  const { data, error } = await supabase
    .from('products')
    .insert({
      ...productData,
      active: true,
      product_type: 'regular'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateProductExpiry = async (
  productId: string, 
  hasExpiry: boolean, 
  defaultExpiryDays?: number
) => {
  const { data, error } = await supabase
    .from('products')
    .update({
      has_expiry: hasExpiry,
      default_expiry_days: hasExpiry ? defaultExpiryDays : null
    })
    .eq('id', productId)
    .select()
    .single();

  if (error) throw error;
  return data;
};
