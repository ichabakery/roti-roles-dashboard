-- Fix stock_movements constraint to allow more reference types
ALTER TABLE public.stock_movements 
DROP CONSTRAINT IF EXISTS stock_movements_reference_type_check;

ALTER TABLE public.stock_movements 
ADD CONSTRAINT stock_movements_reference_type_check 
CHECK (reference_type = ANY (ARRAY[
  'transaction'::text, 
  'production'::text, 
  'production_completed'::text,
  'order_pickup'::text,
  'return'::text, 
  'adjustment'::text, 
  'transfer'::text,
  'order'::text
]));

-- Drop problematic triggers and functions that cause duplicates (with CASCADE)
DROP TRIGGER IF EXISTS trigger_auto_create_production_requests ON public.orders;
DROP TRIGGER IF EXISTS orders_auto_create_production ON public.orders;
DROP TRIGGER IF EXISTS auto_create_production_trigger ON public.orders;
DROP TRIGGER IF EXISTS process_preorder_trigger ON public.orders; 
DROP TRIGGER IF EXISTS create_production_from_items_trigger ON public.orders;

-- Remove auto-production functions that cause duplicates (with CASCADE)
DROP FUNCTION IF EXISTS public.auto_create_production_requests() CASCADE;
DROP FUNCTION IF EXISTS public.process_preorder_items() CASCADE;
DROP FUNCTION IF EXISTS public.create_production_requests_from_order_items() CASCADE;

-- Create a single, clean production request creation function
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
            FROM inventory 
            WHERE product_id = item_record.product_id 
              AND branch_id = NEW.branch_id;

            -- If requested quantity exceeds available stock, create production request
            IF item_record.quantity > available_stock THEN
                production_needed_qty := item_record.quantity - available_stock;
                order_has_production := true;
                
                -- Create single production request for the deficit
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
            UPDATE orders 
            SET status = 'in_production', is_preorder = true
            WHERE id = NEW.id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create the trigger for production request creation
CREATE TRIGGER orders_create_production_request_trigger
    AFTER INSERT ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.create_production_request_for_order();

-- Clean up duplicate production requests from today
DELETE FROM production_requests 
WHERE id IN (
    SELECT id FROM (
        SELECT id, 
               ROW_NUMBER() OVER (
                   PARTITION BY product_id, branch_id, quantity_requested, 
                               DATE_TRUNC('second', created_at), notes
                   ORDER BY created_at
               ) as rn
        FROM production_requests
        WHERE created_at >= '2025-09-23 00:00:00'
    ) t WHERE rn > 1
);