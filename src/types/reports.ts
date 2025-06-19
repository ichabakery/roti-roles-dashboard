
export interface Branch {
  id: string;
  name: string;
}

export interface TransactionItem {
  id: string;
  product_id: string;
  quantity: number;
  price_per_item: number;
  subtotal: number;
  products: {
    name: string;
  };
}

export interface Transaction {
  id: string;
  branch_id: string;
  cashier_id: string;
  transaction_date: string;
  total_amount: number;
  amount_paid?: number | null;
  amount_remaining?: number | null;
  payment_status: string;
  payment_method: string;
  branches: Branch;
  transaction_items: TransactionItem[];
  cashier_name: string;
  received?: number;
  change?: number;
}

export interface TransactionSummary {
  branch_id: string;
  branch_name: string;
  total_transactions: number;
  total_revenue: number;
  avg_transaction: number;
}

export interface ProductSummary {
  product_id: string;
  product_name: string;
  total_quantity: number;
  total_revenue: number;
}

export interface PaymentMethodSummary {
  payment_method: string;
  count: number;
  total_amount: number;
}

export interface DateRange {
  start: string;
  end: string;
}
