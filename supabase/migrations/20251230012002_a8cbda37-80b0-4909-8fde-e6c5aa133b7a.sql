-- Fix: prevent duplicate order numbers under concurrent inserts
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS text
LANGUAGE plpgsql
VOLATILE
SET search_path TO 'public'
AS $function$
DECLARE
  v_year_part TEXT;
  v_sequence_num INTEGER;
  v_order_number TEXT;
BEGIN
  -- Serialize order number generation to avoid duplicate numbers on concurrent inserts
  PERFORM pg_advisory_xact_lock(724523);

  v_year_part := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;

  SELECT COALESCE(MAX(
    CAST(SUBSTRING(o.order_number FROM 'ORD-' || v_year_part || '-([0-9]+)') AS INTEGER)
  ), 0) + 1
  INTO v_sequence_num
  FROM public.orders o
  WHERE o.order_number LIKE 'ORD-' || v_year_part || '-%';

  v_order_number := 'ORD-' || v_year_part || '-' || LPAD(v_sequence_num::TEXT, 3, '0');

  RETURN v_order_number;
END;
$function$;

-- Fix: create_production_request_for_order was incorrectly marked STABLE, causing INSERT errors
CREATE OR REPLACE FUNCTION public.create_production_request_for_order()
RETURNS trigger
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    item_record RECORD;
    available_stock integer;
    production_needed_qty integer;
    order_has_production boolean := false;
BEGIN
    -- Only process on INSERT for new orders
    IF TG_OP = 'INSERT' THEN
        -- Process each item in the order
        FOR item_record IN 
            SELECT 
                (value->>'productId')::uuid as product_id,
                (value->>'productName') as product_name,
                (value->>'quantity')::integer as quantity,
                COALESCE((value->>'availableStock')::integer, 0) as available_stock
            FROM jsonb_array_elements(NEW.items::jsonb) 
        LOOP
            -- Get current available stock from inventory
            SELECT COALESCE(SUM(quantity), 0) INTO available_stock
            FROM public.inventory 
            WHERE product_id = item_record.product_id 
              AND branch_id = NEW.branch_id;

            -- If requested quantity exceeds available stock, create production request
            IF item_record.quantity > available_stock THEN
                production_needed_qty := item_record.quantity - available_stock;
                order_has_production := true;
                
                -- Create single production request for the deficit
                INSERT INTO public.production_requests (
                    order_id,
                    product_id,
                    branch_id,
                    quantity_requested,
                    production_date,
                    notes,
                    requested_by,
                    status
                ) VALUES (
                    NEW.id,
                    item_record.product_id,
                    NEW.branch_id,
                    production_needed_qty,
                    NEW.delivery_date,
                    format('Produksi untuk pesanan %s - %s (%s unit)', 
                           NEW.order_number, item_record.product_name, production_needed_qty),
                    NEW.created_by,
                    'pending'
                );
                
                RAISE LOG 'Production request created for order %: product=%, quantity=%', 
                    NEW.order_number, item_record.product_name, production_needed_qty;
            END IF;
        END LOOP;
        
        -- Update order status to in_production if needed
        IF order_has_production THEN
            UPDATE public.orders 
            SET status = 'in_production', is_preorder = true
            WHERE id = NEW.id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Fix: remove duplicate/unsafe production triggers so kasir can create orders reliably
DROP TRIGGER IF EXISTS create_production_request_trigger ON public.orders;
DROP TRIGGER IF EXISTS orders_create_production_request_trigger ON public.orders;
DROP TRIGGER IF EXISTS create_production_trigger_safe ON public.orders;