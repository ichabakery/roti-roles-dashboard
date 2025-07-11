-- Create orders management system tables
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  branch_id UUID NOT NULL REFERENCES public.branches(id),
  pickup_branch_id UUID REFERENCES public.branches(id),
  delivery_address TEXT,
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  delivery_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_type TEXT NOT NULL DEFAULT 'cash_on_delivery',
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  dp_amount DECIMAL(10,2) DEFAULT 0,
  remaining_amount DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for orders
CREATE POLICY "Users can view orders for their branch" 
ON public.orders 
FOR SELECT 
USING (
  CASE 
    WHEN get_current_user_role() = 'owner' THEN true
    WHEN get_current_user_role() = 'admin_pusat' THEN true
    WHEN get_current_user_role() = 'kasir_cabang' THEN branch_id IN (
      SELECT ub.branch_id FROM user_branches ub WHERE ub.user_id = auth.uid()
    )
    ELSE false
  END
);

CREATE POLICY "Users can create orders for their branch"
ON public.orders
FOR INSERT
WITH CHECK (
  CASE 
    WHEN get_current_user_role() = 'owner' THEN true
    WHEN get_current_user_role() = 'admin_pusat' THEN true
    WHEN get_current_user_role() = 'kasir_cabang' THEN branch_id IN (
      SELECT ub.branch_id FROM user_branches ub WHERE ub.user_id = auth.uid()
    )
    ELSE false
  END AND created_by = auth.uid()
);

CREATE POLICY "Users can update orders for their branch"
ON public.orders
FOR UPDATE
USING (
  CASE 
    WHEN get_current_user_role() = 'owner' THEN true
    WHEN get_current_user_role() = 'admin_pusat' THEN true
    WHEN get_current_user_role() = 'kasir_cabang' THEN branch_id IN (
      SELECT ub.branch_id FROM user_branches ub WHERE ub.user_id = auth.uid()
    )
    ELSE false
  END
);

-- Create RLS policies for order_items
CREATE POLICY "Users can view order items for accessible orders"
ON public.order_items
FOR SELECT
USING (
  order_id IN (
    SELECT id FROM public.orders WHERE
    CASE 
      WHEN get_current_user_role() = 'owner' THEN true
      WHEN get_current_user_role() = 'admin_pusat' THEN true
      WHEN get_current_user_role() = 'kasir_cabang' THEN branch_id IN (
        SELECT ub.branch_id FROM user_branches ub WHERE ub.user_id = auth.uid()
      )
      ELSE false
    END
  )
);

CREATE POLICY "Users can manage order items for accessible orders"
ON public.order_items
FOR ALL
USING (
  order_id IN (
    SELECT id FROM public.orders WHERE
    CASE 
      WHEN get_current_user_role() = 'owner' THEN true
      WHEN get_current_user_role() = 'admin_pusat' THEN true
      WHEN get_current_user_role() = 'kasir_cabang' THEN branch_id IN (
        SELECT ub.branch_id FROM user_branches ub WHERE ub.user_id = auth.uid()
      )
      ELSE false
    END
  )
)
WITH CHECK (
  order_id IN (
    SELECT id FROM public.orders WHERE
    CASE 
      WHEN get_current_user_role() = 'owner' THEN true
      WHEN get_current_user_role() = 'admin_pusat' THEN true
      WHEN get_current_user_role() = 'kasir_cabang' THEN branch_id IN (
        SELECT ub.branch_id FROM user_branches ub WHERE ub.user_id = auth.uid()
      )
      ELSE false
    END
  )
);

-- Create function to generate order number
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  year_part TEXT;
  sequence_num INTEGER;
  order_number TEXT;
BEGIN
  year_part := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  
  -- Get next sequence number for this year
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(order_number FROM 'ORD-' || year_part || '-(\d+)') AS INTEGER)
  ), 0) + 1
  INTO sequence_num
  FROM public.orders
  WHERE order_number LIKE 'ORD-' || year_part || '-%';
  
  order_number := 'ORD-' || year_part || '-' || LPAD(sequence_num::TEXT, 3, '0');
  
  RETURN order_number;
END;
$$;

-- Create trigger to auto-generate order number
CREATE OR REPLACE FUNCTION public.set_order_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := public.generate_order_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_set_order_number
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.set_order_number();

-- Create trigger for updated_at
CREATE TRIGGER trigger_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_orders_branch_id ON public.orders(branch_id);
CREATE INDEX idx_orders_delivery_date ON public.orders(delivery_date);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_order_number ON public.orders(order_number);
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX idx_order_items_product_id ON public.order_items(product_id);