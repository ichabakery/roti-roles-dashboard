-- Add pre-order support to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS is_preorder boolean DEFAULT false;

-- Add order_id reference to production_requests table for better tracking
ALTER TABLE public.production_requests ADD COLUMN IF NOT EXISTS order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE;

-- Add columns to track stock split in order_items 
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS from_stock integer DEFAULT 0;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS to_produce integer DEFAULT 0;

-- Update production_requests status values to match new requirements
-- First update existing status values to match new enum
UPDATE public.production_requests 
SET status = CASE 
    WHEN status = 'pending' THEN 'menunggu'
    WHEN status = 'in_progress' THEN 'diproses'
    WHEN status = 'completed' THEN 'selesai'
    WHEN status = 'cancelled' THEN 'menunggu'
    ELSE 'menunggu'
END;

-- Create enhanced function to handle pre-order logic
CREATE OR REPLACE FUNCTION public.process_preorder_items()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    item_record RECORD;
    available_stock integer;
    from_stock_val integer;
    to_produce_val integer;
    has_preorder boolean := false;
BEGIN
    -- Process each item in the order
    FOR item_record IN 
        SELECT 
            (value->>'productId')::uuid as product_id,
            (value->>'productName') as product_name,
            (value->>'quantity')::integer as quantity,
            (value->>'unitPrice')::numeric as unit_price,
            COALESCE((value->>'availableStock')::integer, 0) as available_stock
        FROM jsonb_array_elements(NEW.items::jsonb) 
    LOOP
        -- Get current stock from inventory
        SELECT COALESCE(SUM(quantity), 0) INTO available_stock
        FROM inventory 
        WHERE product_id = item_record.product_id 
          AND branch_id = NEW.branch_id;
        
        -- Calculate stock split
        from_stock_val := LEAST(item_record.quantity, available_stock);
        to_produce_val := GREATEST(0, item_record.quantity - available_stock);
        
        -- Update order_items with stock split
        UPDATE order_items 
        SET 
            from_stock = from_stock_val,
            to_produce = to_produce_val,
            production_needed = (to_produce_val > 0)
        WHERE order_id = NEW.id 
          AND product_id = item_record.product_id;
        
        -- Create production request if needed
        IF to_produce_val > 0 THEN
            has_preorder := true;
            
            INSERT INTO production_requests (
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
                NEW.pickup_branch_id,
                to_produce_val,
                NEW.delivery_date,
                format('Pre-order dari pesanan %s - %s', NEW.order_number, item_record.product_name),
                NEW.created_by,
                'menunggu'
            );
            
            RAISE LOG 'Production request created for pre-order %: product_id=%, quantity=%', 
                NEW.order_number, item_record.product_id, to_produce_val;
        END IF;
    END LOOP;
    
    -- Update order preorder status
    IF has_preorder THEN
        UPDATE orders 
        SET is_preorder = true 
        WHERE id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Create trigger for pre-order processing
DROP TRIGGER IF EXISTS trigger_process_preorder_items ON public.orders;
CREATE TRIGGER trigger_process_preorder_items
    AFTER INSERT ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.process_preorder_items();