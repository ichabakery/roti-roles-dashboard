
export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Transaction {
  id: string;
  branch_id: string;
  cashier_id: string;
  transaction_date: string;
  total_amount: number;
  payment_method: string;
  payment_status: 'paid' | 'pending' | 'partial' | 'cancelled';
  amount_paid: number | null;
  amount_remaining: number | null;
  due_date: string | null;
  notes: string | null;
  status: string;
}
