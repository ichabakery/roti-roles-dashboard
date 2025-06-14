
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types/inventory';

export const fetchActiveProducts = async (): Promise<Product[]> => {
  const { data, error } = await supabase
    .from('products')
    .select('id, name')
    .eq('active', true)
    .order('name');

  if (error) throw error;
  return data || [];
};
