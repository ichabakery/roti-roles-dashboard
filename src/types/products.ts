
export type ProductType = 'regular' | 'package' | 'bundle';

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  active: boolean;
  image_url: string | null;
  created_at: string;
  product_type: ProductType;
  has_expiry: boolean;
  default_expiry_days: number | null;
  // Simple Inventory V1 fields (nullable, additive)
  sku?: string | null;
  uom?: string | null;
  reorder_point?: number | null;
  lead_time_days?: number | null;
  shelf_life_days?: number | null;
  cost_per_unit?: number | null;
}

export interface ProductPackage {
  id: string;
  parent_product_id: string;
  component_product_id: string;
  quantity: number;
  created_at: string;
  component_product?: Product;
}

export interface ProductBatch {
  id: string;
  product_id: string;
  branch_id: string;
  batch_number: string;
  quantity: number;
  production_date: string;
  expiry_date: string;
  status: 'active' | 'expired' | 'sold_out';
  created_at: string;
  updated_at: string;
  product?: Product;
  branch?: { id: string; name: string };
}

export interface StockMovement {
  id: string;
  product_id: string;
  branch_id: string;
  batch_id: string | null;
  movement_type: 'in' | 'out' | 'adjustment' | 'transfer' | 'return';
  quantity_change: number;
  reference_type: 'transaction' | 'production' | 'return' | 'adjustment' | 'transfer' | null;
  reference_id: string | null;
  reason: string | null;
  performed_by: string | null;
  movement_date: string;
  created_at: string;
}

// Simple Inventory V1 Types
export type StockAdjustmentType = 
  | 'init' 
  | 'adjust_in' 
  | 'adjust_out' 
  | 'production' 
  | 'return' 
  | 'transfer_in' 
  | 'transfer_out' 
  | 'sale';

export interface StockAdjustment {
  id: string;
  product_id: string;
  branch_id: string;
  adjustment_type: StockAdjustmentType;
  quantity_change: number;
  reason: string | null;
  reference_id: string | null;
  reference_type: string | null;
  performed_by: string | null;
  adjustment_date: string;
  created_at: string;
}

export type StockStatus = 'high' | 'medium' | 'low';

export interface InventoryKPI {
  activeSKUs: number;
  totalUnits: number;
  lowStockSKUs: number;
  expiringItems: number;
}

export interface ProductWithInventoryInfo extends Product {
  current_stock?: number;
  stock_status?: StockStatus;
  expiry_date_nearest?: string | null;
  days_until_expiry?: number | null;
}

export type ReturnCondition = 'resaleable' | 'damaged' | 'expired' | 'sample' | 'bonus';

export interface Return {
  id: string;
  transaction_id: string | null;
  branch_id: string;
  processed_by: string;
  return_date: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  notes: string | null;
  created_at: string;
}

export interface ReturnItem {
  id: string;
  return_id: string;
  product_id: string;
  batch_id: string | null;
  quantity: number;
  reason: string;
  condition: ReturnCondition;
  created_at: string;
  product?: Product;
  batch?: ProductBatch;
}
