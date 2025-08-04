-- Phase 4: Database & System Enhancements

-- Add indexes for better order query performance
CREATE INDEX IF NOT EXISTS idx_orders_branch_id ON public.orders(branch_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_date ON public.orders(delivery_date);
CREATE INDEX IF NOT EXISTS idx_orders_customer_name ON public.orders(customer_name);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);

-- Add indexes for order status history
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON public.order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_changed_at ON public.order_status_history(changed_at);

-- Add index for notifications performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_created_at ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_is_read ON public.notifications(user_id, is_read);

-- Create function for bulk order status updates
CREATE OR REPLACE FUNCTION public.bulk_update_order_status(
  order_ids UUID[],
  new_status TEXT,
  notes TEXT DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count INTEGER := 0;
  order_id UUID;
BEGIN
  -- Validate status
  IF new_status NOT IN ('pending', 'confirmed', 'in_production', 'ready', 'completed', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid status: %', new_status;
  END IF;

  -- Update each order
  FOREACH order_id IN ARRAY order_ids
  LOOP
    -- Check if user has permission for this order
    IF EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id
      AND CASE
        WHEN get_current_user_role() = 'owner' THEN true
        WHEN get_current_user_role() = 'admin_pusat' THEN true  
        WHEN get_current_user_role() = 'kasir_cabang' THEN 
          o.branch_id IN (SELECT ub.branch_id FROM user_branches ub WHERE ub.user_id = auth.uid())
        ELSE false
      END
    ) THEN
      -- Update the order
      UPDATE public.orders 
      SET 
        status = new_status,
        updated_at = now()
      WHERE id = order_id;
      
      updated_count := updated_count + 1;
    END IF;
  END LOOP;
  
  RETURN updated_count;
END;
$$;

-- Create function to get order statistics
CREATE OR REPLACE FUNCTION public.get_order_statistics(
  p_branch_id UUID DEFAULT NULL,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS TABLE(
  total_orders INTEGER,
  pending_orders INTEGER,
  confirmed_orders INTEGER,
  in_production_orders INTEGER,
  ready_orders INTEGER,
  completed_orders INTEGER,
  cancelled_orders INTEGER,
  total_revenue NUMERIC,
  average_order_value NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_orders,
    COUNT(CASE WHEN o.status = 'pending' THEN 1 END)::INTEGER as pending_orders,
    COUNT(CASE WHEN o.status = 'confirmed' THEN 1 END)::INTEGER as confirmed_orders,
    COUNT(CASE WHEN o.status = 'in_production' THEN 1 END)::INTEGER as in_production_orders,
    COUNT(CASE WHEN o.status = 'ready' THEN 1 END)::INTEGER as ready_orders,
    COUNT(CASE WHEN o.status = 'completed' THEN 1 END)::INTEGER as completed_orders,
    COUNT(CASE WHEN o.status = 'cancelled' THEN 1 END)::INTEGER as cancelled_orders,
    COALESCE(SUM(CASE WHEN o.status = 'completed' THEN o.total_amount ELSE 0 END), 0) as total_revenue,
    COALESCE(AVG(CASE WHEN o.status = 'completed' THEN o.total_amount END), 0) as average_order_value
  FROM public.orders o
  WHERE CASE
    WHEN get_current_user_role() = 'owner' THEN true
    WHEN get_current_user_role() = 'admin_pusat' THEN true
    WHEN get_current_user_role() = 'kasir_cabang' THEN 
      o.branch_id IN (SELECT ub.branch_id FROM user_branches ub WHERE ub.user_id = auth.uid())
    ELSE false
  END
  AND (p_branch_id IS NULL OR o.branch_id = p_branch_id)
  AND (p_start_date IS NULL OR o.order_date >= p_start_date)
  AND (p_end_date IS NULL OR o.order_date <= p_end_date);
END;
$$;

-- Create function for order calendar data
CREATE OR REPLACE FUNCTION public.get_order_calendar_data(
  p_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  p_month INTEGER DEFAULT EXTRACT(MONTH FROM CURRENT_DATE),
  p_branch_id UUID DEFAULT NULL
)
RETURNS TABLE(
  delivery_date DATE,
  order_count INTEGER,
  total_amount NUMERIC,
  status_breakdown JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.delivery_date,
    COUNT(*)::INTEGER as order_count,
    SUM(o.total_amount) as total_amount,
    JSONB_BUILD_OBJECT(
      'pending', COUNT(CASE WHEN o.status = 'pending' THEN 1 END),
      'confirmed', COUNT(CASE WHEN o.status = 'confirmed' THEN 1 END),
      'in_production', COUNT(CASE WHEN o.status = 'in_production' THEN 1 END),
      'ready', COUNT(CASE WHEN o.status = 'ready' THEN 1 END),
      'completed', COUNT(CASE WHEN o.status = 'completed' THEN 1 END),
      'cancelled', COUNT(CASE WHEN o.status = 'cancelled' THEN 1 END)
    ) as status_breakdown
  FROM public.orders o
  WHERE EXTRACT(YEAR FROM o.delivery_date) = p_year
    AND EXTRACT(MONTH FROM o.delivery_date) = p_month
    AND CASE
      WHEN get_current_user_role() = 'owner' THEN true
      WHEN get_current_user_role() = 'admin_pusat' THEN true
      WHEN get_current_user_role() = 'kasir_cabang' THEN 
        o.branch_id IN (SELECT ub.branch_id FROM user_branches ub WHERE ub.user_id = auth.uid())
      ELSE false
    END
    AND (p_branch_id IS NULL OR o.branch_id = p_branch_id)
  GROUP BY o.delivery_date
  ORDER BY o.delivery_date;
END;
$$;