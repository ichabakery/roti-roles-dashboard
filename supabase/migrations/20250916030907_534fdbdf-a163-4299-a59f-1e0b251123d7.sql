-- Add pre-order support to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS is_preorder boolean DEFAULT false;

-- Add order_id reference to production_requests table for better tracking
ALTER TABLE public.production_requests ADD COLUMN IF NOT EXISTS order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE;

-- Add columns to track stock split in order_items 
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS from_stock integer DEFAULT 0;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS to_produce integer DEFAULT 0;

-- Update production_requests status enum to match requirements
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'production_status') THEN
        CREATE TYPE production_status AS ENUM ('menunggu', 'diproses', 'siap', 'dikirim', 'selesai');
        ALTER TABLE public.production_requests ALTER COLUMN status TYPE production_status USING status::production_status;
    END IF;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

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
    from_stock integer;
    to_produce integer;
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
        from_stock := LEAST(item_record.quantity, available_stock);
        to_produce := GREATEST(0, item_record.quantity - available_stock);
        
        -- Update order_items with stock split
        UPDATE order_items 
        SET 
            from_stock = from_stock,
            to_produce = to_produce,
            production_needed = (to_produce > 0)
        WHERE order_id = NEW.id 
          AND product_id = item_record.product_id;
        
        -- Create production request if needed
        IF to_produce > 0 THEN
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
                to_produce,
                NEW.delivery_date,
                format('Pre-order dari pesanan %s - %s', NEW.order_number, item_record.product_name),
                NEW.created_by,
                'menunggu'
            );
            
            RAISE LOG 'Production request created for pre-order %: product_id=%, quantity=%', 
                NEW.order_number, item_record.product_id, to_produce;
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