-- Create trigger to automatically create production requests from order items
CREATE OR REPLACE FUNCTION public.create_production_requests_from_order_items()
RETURNS TRIGGER AS $$
DECLARE
    item_record RECORD;
BEGIN
    -- Process order items that need production
    FOR item_record IN 
        SELECT oi.*, p.name as product_name
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = NEW.id 
          AND oi.production_needed = true
    LOOP
        -- Create production request for items that need production
        INSERT INTO production_requests (
            product_id,
            branch_id,
            quantity_requested,
            production_date,
            notes,
            requested_by,
            status
        ) VALUES (
            item_record.product_id,
            NEW.branch_id,
            item_record.quantity - COALESCE((
                SELECT COALESCE(SUM(quantity), 0) 
                FROM inventory 
                WHERE product_id = item_record.product_id 
                  AND branch_id = NEW.branch_id
            ), 0),
            NEW.delivery_date,
            format('Auto-generated dari pesanan %s - %s (Item: %s)', 
                   NEW.order_number, NEW.customer_name, item_record.product_name),
            NEW.created_by,
            'pending'
        );
        
        -- Log the production request creation
        RAISE LOG 'Production request created for order %: product_name=%, quantity=%', 
            NEW.order_number, item_record.product_name, 
            item_record.quantity - COALESCE((
                SELECT COALESCE(SUM(quantity), 0) 
                FROM inventory 
                WHERE product_id = item_record.product_id 
                  AND branch_id = NEW.branch_id
            ), 0);
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on orders table to create production requests after order creation
DROP TRIGGER IF EXISTS create_production_requests_trigger ON orders;
CREATE TRIGGER create_production_requests_trigger
    AFTER INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION create_production_requests_from_order_items();