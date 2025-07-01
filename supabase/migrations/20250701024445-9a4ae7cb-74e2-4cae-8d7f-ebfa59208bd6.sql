
-- Create update_inventory function for handling inventory updates during transactions
CREATE OR REPLACE FUNCTION public.update_inventory(
  p_product_id UUID,
  p_branch_id UUID,
  p_quantity_change INTEGER,
  p_movement_type TEXT,
  p_reference_id UUID,
  p_reference_type TEXT,
  p_performed_by UUID
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update inventory quantity
  UPDATE public.inventory 
  SET 
    quantity = quantity + p_quantity_change,
    last_updated = now()
  WHERE 
    product_id = p_product_id 
    AND branch_id = p_branch_id;
    
  -- If no inventory record exists, create one
  IF NOT FOUND THEN
    INSERT INTO public.inventory (product_id, branch_id, quantity, last_updated)
    VALUES (p_product_id, p_branch_id, GREATEST(0, p_quantity_change), now());
  END IF;
  
  -- Log stock movement
  INSERT INTO public.stock_movements (
    product_id,
    branch_id,
    quantity_change,
    movement_type,
    reference_id,
    reference_type,
    performed_by,
    movement_date
  ) VALUES (
    p_product_id,
    p_branch_id,
    p_quantity_change,
    p_movement_type,
    p_reference_id,
    p_reference_type,
    p_performed_by,
    now()
  );
  
  -- Ensure inventory doesn't go negative
  UPDATE public.inventory 
  SET quantity = GREATEST(0, quantity)
  WHERE product_id = p_product_id AND branch_id = p_branch_id;
  
END;
$$;
