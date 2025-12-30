-- Add source_type column to transactions table
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'cashier';

-- Update existing transactions that came from orders
UPDATE public.transactions 
SET source_type = 'order' 
WHERE notes ILIKE '%pesanan%' 
   OR notes ILIKE '%pickup%' 
   OR notes ILIKE '%ORD-%';

-- Update the trigger to set source_type = 'order' when converting orders
CREATE OR REPLACE FUNCTION public.convert_order_to_transaction()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    transaction_id uuid;
    item_record RECORD;
    branch_data RECORD;
BEGIN
    -- Only process when order is marked as completed and hasn't been converted yet
    IF NEW.status = 'completed' AND OLD.status != 'completed' AND 
       NEW.payment_status IN ('paid', 'full_payment') AND 
       NEW.linked_transaction_id IS NULL THEN
        
        -- Get branch information
        SELECT * INTO branch_data FROM branches WHERE id = NEW.branch_id;
        
        -- Create transaction record with source_type = 'order'
        INSERT INTO transactions (
            branch_id,
            cashier_id,
            transaction_date,
            total_amount,
            payment_status,
            payment_method,
            notes,
            status,
            source_type
        ) VALUES (
            NEW.branch_id,
            NEW.created_by,
            now(),
            NEW.total_amount,
            'paid',
            CASE NEW.payment_type 
                WHEN 'cash_on_delivery' THEN 'cash'
                WHEN 'full_payment' THEN 'cash'
                WHEN 'dp' THEN 'cash'
                ELSE 'cash'
            END,
            format('Transaksi dari pesanan %s - %s', NEW.order_number, NEW.customer_name),
            'completed',
            'order'
        ) RETURNING id INTO transaction_id;
        
        -- Add transaction items from order items
        FOR item_record IN 
            SELECT 
                (value->>'productId')::uuid as product_id,
                (value->>'quantity')::integer as quantity,
                (value->>'unitPrice')::numeric as unit_price
            FROM jsonb_array_elements(NEW.items::jsonb) 
        LOOP
            INSERT INTO transaction_items (
                transaction_id,
                product_id,
                quantity,
                price_per_item,
                subtotal
            ) VALUES (
                transaction_id,
                item_record.product_id,
                item_record.quantity,
                item_record.unit_price,
                item_record.quantity * item_record.unit_price
            );
        END LOOP;
        
        -- Link the transaction back to the order
        UPDATE orders 
        SET linked_transaction_id = transaction_id
        WHERE id = NEW.id;
        
        RAISE LOG 'Order % converted to transaction % with total %', NEW.order_number, transaction_id, NEW.total_amount;
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Update handle_order_pickup to set source_type = 'order'
CREATE OR REPLACE FUNCTION public.handle_order_pickup()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  transaction_id uuid;
  item_record RECORD;
BEGIN
  -- Only process when order status changes to 'completed' from 'ready'
  IF NEW.status = 'completed' AND OLD.status = 'ready' AND NEW.linked_transaction_id IS NULL THEN
    
    -- Create transaction record with source_type = 'order'
    INSERT INTO public.transactions (
      branch_id, cashier_id, transaction_date, total_amount,
      payment_status, payment_method, notes, status, source_type
    ) VALUES (
      NEW.branch_id, NEW.created_by, now(), NEW.total_amount,
      'paid', 'cash', 
      format('Pickup pesanan %s - %s', NEW.order_number, NEW.customer_name),
      'completed',
      'order'
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
$function$;