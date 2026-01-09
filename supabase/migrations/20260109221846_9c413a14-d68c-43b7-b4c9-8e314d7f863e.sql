-- STEP 3: Create tracking history table and triggers

-- Create order_tracking_history table
CREATE TABLE IF NOT EXISTS public.order_tracking_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  old_tracking_status TEXT,
  new_tracking_status TEXT NOT NULL,
  notes TEXT,
  updated_by UUID,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on order_tracking_history
ALTER TABLE public.order_tracking_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for order_tracking_history
DROP POLICY IF EXISTS "Users can view tracking history based on role" ON public.order_tracking_history;
CREATE POLICY "Users can view tracking history based on role"
ON public.order_tracking_history
FOR SELECT
USING (
  CASE
    WHEN get_current_user_role() IN ('owner', 'admin_pusat') THEN true
    WHEN get_current_user_role() = 'kasir_cabang' THEN 
      order_id IN (
        SELECT o.id FROM public.orders o 
        WHERE o.branch_id IN (SELECT ub.branch_id FROM user_branches ub WHERE ub.user_id = auth.uid())
      )
    ELSE false
  END
);

DROP POLICY IF EXISTS "Users can insert tracking history based on role" ON public.order_tracking_history;
CREATE POLICY "Users can insert tracking history based on role"
ON public.order_tracking_history
FOR INSERT
WITH CHECK (
  CASE
    WHEN get_current_user_role() IN ('owner', 'admin_pusat') THEN true
    WHEN get_current_user_role() = 'kasir_cabang' THEN 
      order_id IN (
        SELECT o.id FROM public.orders o 
        WHERE o.branch_id IN (SELECT ub.branch_id FROM user_branches ub WHERE ub.user_id = auth.uid())
      )
    ELSE false
  END
);

-- Create function to log tracking status changes
CREATE OR REPLACE FUNCTION public.log_tracking_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.tracking_status IS DISTINCT FROM NEW.tracking_status THEN
    INSERT INTO public.order_tracking_history (
      order_id, old_tracking_status, new_tracking_status, updated_by
    ) VALUES (
      NEW.id, OLD.tracking_status, NEW.tracking_status, auth.uid()
    );
  END IF;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NEW;
END;
$$;

-- Create trigger for tracking status changes
DROP TRIGGER IF EXISTS log_order_tracking_change ON public.orders;
CREATE TRIGGER log_order_tracking_change
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.log_tracking_status_change();

-- Create function to auto-complete order when delivered and paid
CREATE OR REPLACE FUNCTION public.auto_complete_order_on_delivery()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- When tracking_status becomes 'delivered' and payment is fully paid, auto-complete the order
  IF NEW.tracking_status = 'delivered' AND NEW.payment_status = 'paid' AND NEW.status != 'completed' THEN
    NEW.status := 'completed';
    RAISE LOG 'Order % auto-completed: tracking=delivered, payment=paid', NEW.order_number;
  END IF;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NEW;
END;
$$;

-- Create trigger for auto-completion
DROP TRIGGER IF EXISTS auto_complete_order ON public.orders;
CREATE TRIGGER auto_complete_order
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.auto_complete_order_on_delivery();

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_tracking_status ON public.orders(tracking_status);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_date ON public.orders(delivery_date);
CREATE INDEX IF NOT EXISTS idx_order_tracking_history_order_id ON public.order_tracking_history(order_id);