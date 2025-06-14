
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO } from 'date-fns';
import { ProductionRequest, NewProductionRequest } from '@/types/production';

export const fetchProductionRequestsFromDB = async (): Promise<ProductionRequest[]> => {
  console.log('Fetching production requests...');
  
  const { data, error } = await supabase
    .from('production_requests')
    .select(`
      *,
      products:fk_production_requests_product_id (name),
      branches:fk_production_requests_branch_id (name)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching production requests:', error);
    throw error;
  }

  // Transform data for UI
  const transformedRequests: ProductionRequest[] = data.map(request => ({
    ...request,
    productName: request.products?.name,
    branchName: request.branches?.name,
    production_date: format(parseISO(request.production_date), 'yyyy-MM-dd'),
    status: request.status as 'pending' | 'in_progress' | 'completed' | 'cancelled'
  }));

  console.log('Production requests fetched:', transformedRequests);
  return transformedRequests;
};

export const createProductionRequestInDB = async (
  newRequest: NewProductionRequest,
  userId: string
) => {
  const requestData = {
    ...newRequest,
    requested_by: userId,
    status: 'pending',
  };

  const { data, error } = await supabase
    .from('production_requests')
    .insert([requestData])
    .select();

  if (error) {
    console.error('Error creating production request:', error);
    throw error;
  }

  return data[0];
};

export const updateProductionRequestStatusInDB = async (
  id: string, 
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled',
  userId: string,
  quantity_produced?: number
) => {
  const updateData: any = { 
    status,
    updated_at: new Date().toISOString()
  };
  
  if (status === 'in_progress') {
    updateData.produced_by = userId;
  }
  
  if (status === 'completed' && quantity_produced) {
    updateData.quantity_produced = quantity_produced;
    updateData.produced_by = userId;
  }

  const { error } = await supabase
    .from('production_requests')
    .update(updateData)
    .eq('id', id);

  if (error) {
    console.error('Error updating production request:', error);
    throw error;
  }
};

export const deleteProductionRequestFromDB = async (id: string) => {
  const { error } = await supabase
    .from('production_requests')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting production request:', error);
    throw error;
  }
};
