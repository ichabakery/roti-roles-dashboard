
-- Create function to automatically update inventory when transaction items are inserted
CREATE OR REPLACE FUNCTION public.update_inventory_on_transaction()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update inventory when transaction items are added
CREATE TRIGGER trigger_update_inventory_on_transaction
  AFTER INSERT ON public.transaction_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_inventory_on_transaction();

-- Add constraint to prevent negative inventory (optional - for safety)
-- ALTER TABLE public.inventory ADD CONSTRAINT check_positive_quantity CHECK (quantity >= 0);

-- Enable realtime for inventory table to sync across all clients
ALTER TABLE public.inventory REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory;
