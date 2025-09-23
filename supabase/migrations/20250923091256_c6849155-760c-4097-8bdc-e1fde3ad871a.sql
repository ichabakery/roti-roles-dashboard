-- Create function for initial stock creation
CREATE OR REPLACE FUNCTION public.create_initial_stock(
    p_product_id uuid,
    p_branch_id uuid,
    p_initial_stock integer
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Only create if initial stock > 0
    IF p_initial_stock > 0 THEN
        -- Create stock adjustment record
        INSERT INTO public.stock_adjustments (
            product_id,
            branch_id,
            adjustment_type,
            quantity_change,
            reason,
            performed_by
        ) VALUES (
            p_product_id,
            p_branch_id,
            'init',
            p_initial_stock,
            'Inisialisasi stok produk',
            auth.uid()
        );
        
        -- Update inventory table
        INSERT INTO public.inventory (product_id, branch_id, quantity, last_updated)
        VALUES (p_product_id, p_branch_id, p_initial_stock, now())
        ON CONFLICT (product_id, branch_id)
        DO UPDATE SET 
            quantity = inventory.quantity + p_initial_stock,
            last_updated = now();
    END IF;
END;
$$;