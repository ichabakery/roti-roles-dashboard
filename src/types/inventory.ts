
export interface Product {
  id: string;
  name: string;
}

export interface Branch {
  id: string;
  name: string;
  location_type?: string;
}

export interface InventoryItem {
  id: string;
  product_id: string;
  branch_id: string;
  quantity: number;
  last_updated: string;
  product: Product;
  branch: Branch;
}
