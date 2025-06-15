
import { supabase } from '@/integrations/supabase/client';

export const fetchBranchesFromDB = async () => {
  console.log('Fetching branches from database...');
  
  const { data, error } = await supabase
    .from('branches')
    .select('id, name')
    .order('name');

  if (error) {
    console.error('Branches fetch error:', error);
    throw error;
  }
  
  console.log('Branches fetched successfully:', data?.length, 'branches');
  return data || [];
};
