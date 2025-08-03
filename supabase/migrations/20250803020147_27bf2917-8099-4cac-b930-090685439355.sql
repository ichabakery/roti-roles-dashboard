-- Fix RLS policies for orders table to allow owner access
DROP POLICY IF EXISTS "Users can view orders for their branch" ON public.orders;
DROP POLICY IF EXISTS "Users can view orders from their branch" ON public.orders;

-- Create comprehensive RLS policies for orders
CREATE POLICY "Owner can access all orders"
ON public.orders
FOR ALL
USING (get_current_user_role() = 'owner')
WITH CHECK (get_current_user_role() = 'owner');

CREATE POLICY "Admin pusat can access all orders"
ON public.orders
FOR ALL
USING (get_current_user_role() = 'admin_pusat')
WITH CHECK (get_current_user_role() = 'admin_pusat');

CREATE POLICY "Kasir can access their branch orders"
ON public.orders
FOR ALL
USING (
  get_current_user_role() = 'kasir_cabang' AND 
  branch_id IN (
    SELECT ub.branch_id 
    FROM user_branches ub 
    WHERE ub.user_id = auth.uid()
  )
)
WITH CHECK (
  get_current_user_role() = 'kasir_cabang' AND 
  branch_id IN (
    SELECT ub.branch_id 
    FROM user_branches ub 
    WHERE ub.user_id = auth.uid()
  )
);

-- Create order status history table for audit trail
CREATE TABLE IF NOT EXISTS public.order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  notes TEXT
);

-- Enable RLS on order status history
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for order status history
CREATE POLICY "Users can view order status history for accessible orders"
ON public.order_status_history
FOR SELECT
USING (
  order_id IN (
    SELECT id FROM public.orders
    WHERE CASE
      WHEN get_current_user_role() = 'owner' THEN true
      WHEN get_current_user_role() = 'admin_pusat' THEN true
      WHEN get_current_user_role() = 'kasir_cabang' THEN branch_id IN (
        SELECT ub.branch_id FROM user_branches ub WHERE ub.user_id = auth.uid()
      )
      ELSE false
    END
  )
);

CREATE POLICY "System can create order status history"
ON public.order_status_history
FOR INSERT
WITH CHECK (true);

-- Create trigger for automatic order status history logging
CREATE OR REPLACE FUNCTION public.log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.order_status_history (
      order_id, old_status, new_status, changed_by
    ) VALUES (
      NEW.id, OLD.status, NEW.status, auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER order_status_change_trigger
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.log_order_status_change();

-- Create function to get orders with enhanced data for owner role
CREATE OR REPLACE FUNCTION public.get_orders_for_user(p_branch_id UUID DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  order_number TEXT,
  branch_id UUID,
  branch_name TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  order_date DATE,
  delivery_date DATE,
  status TEXT,
  total_amount NUMERIC,
  notes TEXT,
  items JSONB,
  created_at TIMESTAMP WITH TIME ZONE,
  created_by UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.order_number,
    o.branch_id,
    COALESCE(b.name, 'Unknown Branch') as branch_name,
    o.customer_name,
    o.customer_phone,
    o.order_date,
    o.delivery_date,
    o.status,
    o.total_amount,
    o.notes,
    o.items,
    o.created_at,
    o.created_by
  FROM public.orders o
  LEFT JOIN public.branches b ON o.branch_id = b.id
  WHERE CASE
    WHEN get_current_user_role() = 'owner' THEN true
    WHEN get_current_user_role() = 'admin_pusat' THEN true
    WHEN get_current_user_role() = 'kasir_cabang' THEN 
      o.branch_id IN (SELECT ub.branch_id FROM user_branches ub WHERE ub.user_id = auth.uid())
    ELSE false
  END
  AND (p_branch_id IS NULL OR o.branch_id = p_branch_id)
  ORDER BY o.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;