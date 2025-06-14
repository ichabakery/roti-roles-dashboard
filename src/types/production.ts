
export interface ProductionRequest {
  id: string;
  product_id: string;
  productName?: string;
  branch_id: string;
  branchName?: string;
  quantity_requested: number;
  quantity_produced: number | null;
  production_date: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  notes: string | null;
  requested_by: string;
  requesterName?: string;
  produced_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface NewProductionRequest {
  product_id: string;
  branch_id: string;
  quantity_requested: number;
  production_date: string;
  notes?: string;
}
