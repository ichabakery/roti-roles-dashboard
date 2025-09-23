-- Fix search path for the function to make it secure
CREATE OR REPLACE FUNCTION public.create_production_request_for_order()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;