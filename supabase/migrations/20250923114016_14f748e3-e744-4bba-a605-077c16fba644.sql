-- Temporarily disable the automatic production request trigger to isolate the issue
DROP TRIGGER IF EXISTS create_production_trigger ON orders;

-- We'll create a safer version that doesn't block order creation
CREATE OR REPLACE FUNCTION public.create_production_request_for_order_safe()
RETURNS trigger
LANGUAGE plpgsql
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
        BEGIN
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
                    
                    BEGIN
                        -- Create production request but don't fail if it errors
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
                    EXCEPTION
                        WHEN OTHERS THEN
                            -- Log error but don't fail the order creation
                            RAISE LOG 'Failed to create production request for order %: %', NEW.order_number, SQLERRM;
                    END;
                END IF;
            END LOOP;
            
            -- Update order status to in_production if needed
            IF order_has_production THEN
                BEGIN
                    UPDATE public.orders 
                    SET status = 'in_production', is_preorder = true
                    WHERE id = NEW.id;
                EXCEPTION
                    WHEN OTHERS THEN
                        -- Log error but don't fail
                        RAISE LOG 'Failed to update order status for order %: %', NEW.order_number, SQLERRM;
                END;
            END IF;
        EXCEPTION
            WHEN OTHERS THEN
                -- Log any other errors but don't fail the order creation
                RAISE LOG 'Error in production request trigger for order %: %', NEW.order_number, SQLERRM;
        END;
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Create the new safer trigger
CREATE TRIGGER create_production_trigger_safe
    AFTER INSERT ON orders
    FOR EACH ROW 
    EXECUTE FUNCTION create_production_request_for_order_safe();