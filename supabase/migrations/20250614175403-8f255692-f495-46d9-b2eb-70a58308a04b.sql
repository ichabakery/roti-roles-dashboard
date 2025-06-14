
-- Fix the database trigger function to use SECURITY DEFINER
-- This allows the trigger to bypass RLS and run with owner privileges
DROP FUNCTION IF EXISTS public.update_inventory_on_transaction() CASCADE;

CREATE OR REPLACE FUNCTION public.update_inventory_on_transaction()
RETURNS TRIGGER 
SECURITY DEFINER  -- This is the key fix - allows bypass of RLS
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  -- Update inventory by reducing stock
  UPDATE public.inventory 
  SET 
    quantity = quantity - NEW.quantity,
    last_updated = now()
  WHERE 
    product_id = NEW.product_id 
    AND branch_id = (
      SELECT branch_id 
      FROM public.transactions 
      WHERE id = NEW.transaction_id
    );
  
  -- Check if inventory record exists, if not create one with negative quantity
  IF NOT FOUND THEN
    INSERT INTO public.inventory (product_id, branch_id, quantity, last_updated)
    SELECT 
      NEW.product_id,
      t.branch_id,
      -NEW.quantity,
      now()
    FROM public.transactions t
    WHERE t.id = NEW.transaction_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS trigger_update_inventory_on_transaction ON public.transaction_items;
CREATE TRIGGER trigger_update_inventory_on_transaction
  AFTER INSERT ON public.transaction_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_inventory_on_transaction();

-- Add RLS policies for inventory table if they don't exist
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

-- Policy for owners to do everything
CREATE POLICY "Owner full access to inventory" 
  ON public.inventory 
  FOR ALL 
  USING (public.get_current_user_role() = 'owner')
  WITH CHECK (public.get_current_user_role() = 'owner');

-- Policy for admin_pusat to manage inventory
CREATE POLICY "Admin pusat can manage inventory" 
  ON public.inventory 
  FOR ALL 
  USING (public.get_current_user_role() = 'admin_pusat')
  WITH CHECK (public.get_current_user_role() = 'admin_pusat');

-- Policy for kasir_cabang to view their branch inventory
CREATE POLICY "Kasir can view their branch inventory" 
  ON public.inventory 
  FOR SELECT 
  USING (
    public.get_current_user_role() = 'kasir_cabang' 
    AND branch_id IN (
      SELECT ub.branch_id 
      FROM public.user_branches ub 
      WHERE ub.user_id = auth.uid()
    )
  );

-- Policy for kepala_produksi to view inventory
CREATE POLICY "Kepala produksi can view inventory" 
  ON public.inventory 
  FOR SELECT 
  USING (public.get_current_user_role() = 'kepala_produksi');

-- Add audit logging function for inventory changes
CREATE OR REPLACE FUNCTION public.log_inventory_changes()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  -- This could be extended to log to an audit table
  -- For now, we'll just use pg_stat_statements or logs
  
  IF TG_OP = 'UPDATE' THEN
    -- Log significant inventory changes
    IF ABS(NEW.quantity - OLD.quantity) > 0 THEN
      RAISE LOG 'Inventory updated: product_id=%, branch_id=%, old_qty=%, new_qty=%, user=%',
        NEW.product_id, NEW.branch_id, OLD.quantity, NEW.quantity, auth.uid();
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    RAISE LOG 'Inventory created: product_id=%, branch_id=%, qty=%, user=%',
      NEW.product_id, NEW.branch_id, NEW.quantity, auth.uid();
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$;

-- Create audit trigger for inventory changes
DROP TRIGGER IF EXISTS trigger_audit_inventory_changes ON public.inventory;
CREATE TRIGGER trigger_audit_inventory_changes
  AFTER INSERT OR UPDATE ON public.inventory
  FOR EACH ROW
  EXECUTE FUNCTION public.log_inventory_changes();
