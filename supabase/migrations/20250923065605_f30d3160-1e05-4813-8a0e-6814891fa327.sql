-- Create function to handle production completion
CREATE OR REPLACE FUNCTION public.handle_production_completion()
RETURNS TRIGGER AS $$
DECLARE
  order_record RECORD;
BEGIN
  -- Only process when status changes to 'completed'
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    
    -- Update inventory with produced quantity
    INSERT INTO public.inventory (product_id, branch_id, quantity, last_updated)
    VALUES (NEW.product_id, NEW.branch_id, NEW.quantity_produced, now())
    ON CONFLICT (product_id, branch_id) 
    DO UPDATE SET 
      quantity = inventory.quantity + NEW.quantity_produced,
      last_updated = now();
    
    -- Log stock movement
    INSERT INTO public.stock_movements (
      product_id, branch_id, quantity_change, movement_type,
      reference_id, reference_type, performed_by, movement_date
    ) VALUES (
      NEW.product_id, NEW.branch_id, NEW.quantity_produced, 'in',
      NEW.id, 'production_completed', NEW.produced_by, now()
    );
    
    -- Update related order status to 'ready' if exists
    IF NEW.order_id IS NOT NULL THEN
      UPDATE public.orders 
      SET status = 'ready', updated_at = now()
      WHERE id = NEW.order_id AND status = 'in_production';
      
      -- Get order details for notification
      SELECT * INTO order_record FROM public.orders WHERE id = NEW.order_id;
      
      -- Create notification for cashier about ready order
      INSERT INTO public.notifications (
        user_id, title, message, type, related_id, related_type
      )
      SELECT 
        ub.user_id,
        'Pesanan Siap Diambil',
        format('Pesanan %s untuk %s sudah siap diambil di cabang %s', 
               order_record.order_number, order_record.customer_name, 
               (SELECT name FROM branches WHERE id = order_record.branch_id)),
        'success',
        order_record.id,
        'order_ready'
      FROM user_branches ub
      JOIN profiles p ON ub.user_id = p.id
      WHERE ub.branch_id = NEW.branch_id AND p.role = 'kasir_cabang';
    END IF;
    
    RAISE LOG 'Production completed: product_id=%, quantity=%, branch_id=%', 
      NEW.product_id, NEW.quantity_produced, NEW.branch_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for production completion
DROP TRIGGER IF EXISTS on_production_completed ON public.production_requests;
CREATE TRIGGER on_production_completed
  AFTER UPDATE ON public.production_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_production_completion();

-- Create function to handle order pickup and conversion to transaction
CREATE OR REPLACE FUNCTION public.handle_order_pickup()
RETURNS TRIGGER AS $$
DECLARE
  transaction_id uuid;
  item_record RECORD;
BEGIN
  -- Only process when order status changes to 'completed' from 'ready'
  IF NEW.status = 'completed' AND OLD.status = 'ready' AND NEW.linked_transaction_id IS NULL THEN
    
    -- Create transaction record
    INSERT INTO public.transactions (
      branch_id, cashier_id, transaction_date, total_amount,
      payment_status, payment_method, notes, status
    ) VALUES (
      NEW.branch_id, NEW.created_by, now(), NEW.total_amount,
      'paid', 'cash', 
      format('Pickup pesanan %s - %s', NEW.order_number, NEW.customer_name),
      'completed'
    ) RETURNING id INTO transaction_id;
    
    -- Create transaction items from order items
    FOR item_record IN 
      SELECT 
        (value->>'productId')::uuid as product_id,
        (value->>'quantity')::integer as quantity,
        (value->>'unitPrice')::numeric as unit_price
      FROM jsonb_array_elements(NEW.items::jsonb) 
    LOOP
      INSERT INTO public.transaction_items (
        transaction_id, product_id, quantity, 
        price_per_item, subtotal
      ) VALUES (
        transaction_id, item_record.product_id, item_record.quantity,
        item_record.unit_price, item_record.quantity * item_record.unit_price
      );
      
      -- Reduce inventory
      UPDATE public.inventory 
      SET quantity = quantity - item_record.quantity, last_updated = now()
      WHERE product_id = item_record.product_id AND branch_id = NEW.branch_id;
      
      -- Log stock movement
      INSERT INTO public.stock_movements (
        product_id, branch_id, quantity_change, movement_type,
        reference_id, reference_type, performed_by, movement_date
      ) VALUES (
        item_record.product_id, NEW.branch_id, -item_record.quantity, 'out',
        transaction_id, 'order_pickup', auth.uid(), now()
      );
    END LOOP;
    
    -- Link transaction to order
    UPDATE public.orders 
    SET linked_transaction_id = transaction_id, updated_at = now()
    WHERE id = NEW.id;
    
    RAISE LOG 'Order pickup completed: order=%, transaction=%', NEW.order_number, transaction_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for order pickup
DROP TRIGGER IF EXISTS on_order_pickup ON public.orders;
CREATE TRIGGER on_order_pickup
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_order_pickup();

-- Add custom product support by extending products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS is_custom boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS created_from_order uuid DEFAULT NULL;

-- Create function to handle custom products in orders
CREATE OR REPLACE FUNCTION public.create_custom_product(
  p_name text,
  p_price numeric,
  p_description text DEFAULT NULL,
  p_order_id uuid DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  product_id uuid;
BEGIN
  -- Create temporary custom product
  INSERT INTO public.products (
    name, price, description, active, is_custom, 
    created_from_order, product_type, has_expiry
  ) VALUES (
    p_name, p_price, p_description, true, true,
    p_order_id, 'regular', false
  ) RETURNING id INTO product_id;
  
  RETURN product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;