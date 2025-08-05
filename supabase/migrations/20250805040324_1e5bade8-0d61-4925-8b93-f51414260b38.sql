-- Phase 1: Zero Stock Order Flow Enhancement
-- Add columns to support zero stock orders and production tracking

-- Add column to track if order items need production
ALTER TABLE order_items 
ADD COLUMN production_needed boolean DEFAULT false,
ADD COLUMN stock_status text DEFAULT 'available';

-- Add order-to-transaction relationship
ALTER TABLE orders 
ADD COLUMN linked_transaction_id uuid,
ADD COLUMN payment_status text DEFAULT 'pending';

-- Add foreign key constraint for linked transactions
ALTER TABLE orders 
ADD CONSTRAINT fk_orders_linked_transaction 
FOREIGN KEY (linked_transaction_id) REFERENCES transactions(id);

-- Function to auto-create production requests for zero stock items
CREATE OR REPLACE FUNCTION auto_create_production_requests()
RETURNS TRIGGER AS $$
DECLARE
    item_record RECORD;
    available_stock integer;
    production_needed_qty integer;
BEGIN
    -- Process each item in the order
    FOR item_record IN 
        SELECT 
            (value->>'productId')::uuid as product_id,
            (value->>'productName') as product_name,
            (value->>'quantity')::integer as quantity,
            (value->>'unitPrice')::numeric as unit_price
        FROM jsonb_array_elements(NEW.items::jsonb) 
    LOOP
        -- Check available stock for this product at the branch
        SELECT COALESCE(SUM(quantity), 0) INTO available_stock
        FROM inventory 
        WHERE product_id = item_record.product_id 
          AND branch_id = NEW.branch_id;
        
        -- If stock is insufficient, create production request
        IF available_stock < item_record.quantity THEN
            production_needed_qty := item_record.quantity - available_stock;
            
            -- Create production request for the deficit
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
                production_needed_qty,
                NEW.delivery_date,
                format('Auto-generated dari pesanan %s - %s', NEW.order_number, item_record.product_name),
                NEW.created_by,
                'pending'
            );
            
            -- Log the production request creation
            RAISE LOG 'Production request created for order %: product_id=%, quantity=%', 
                NEW.order_number, item_record.product_id, production_needed_qty;
        END IF;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create production requests on order creation
DROP TRIGGER IF EXISTS trigger_auto_create_production_requests ON orders;
CREATE TRIGGER trigger_auto_create_production_requests
    AFTER INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION auto_create_production_requests();

-- Function to convert completed orders to transactions
CREATE OR REPLACE FUNCTION convert_order_to_transaction()
RETURNS TRIGGER AS $$
DECLARE
    transaction_id uuid;
    item_record RECORD;
BEGIN
    -- Only process when order is marked as completed and payment is made
    IF NEW.status = 'completed' AND OLD.status != 'completed' AND 
       NEW.payment_status IN ('paid', 'full_payment') AND 
       NEW.linked_transaction_id IS NULL THEN
        
        -- Create transaction record
        INSERT INTO transactions (
            branch_id,
            cashier_id,
            transaction_date,
            total_amount,
            payment_status,
            payment_method,
            notes,
            status
        ) VALUES (
            NEW.branch_id,
            NEW.created_by,
            now(),
            NEW.total_amount,
            'paid',
            CASE NEW.payment_type 
                WHEN 'cash_on_delivery' THEN 'cash'
                WHEN 'full_payment' THEN 'cash'
                ELSE 'cash'
            END,
            format('Transaksi dari pesanan %s - %s', NEW.order_number, NEW.customer_name),
            'completed'
        ) RETURNING id INTO transaction_id;
        
        -- Add transaction items
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
        
        RAISE LOG 'Order % converted to transaction %', NEW.order_number, transaction_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to convert completed orders to transactions
DROP TRIGGER IF EXISTS trigger_convert_order_to_transaction ON orders;
CREATE TRIGGER trigger_convert_order_to_transaction
    AFTER UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION convert_order_to_transaction();