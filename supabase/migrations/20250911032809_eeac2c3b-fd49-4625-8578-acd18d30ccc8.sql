-- Fix RLS policies for order_items to allow insertion during order creation
DROP POLICY IF EXISTS "Users can manage order items for accessible orders" ON order_items;
DROP POLICY IF EXISTS "Users can view order items for accessible orders" ON order_items;

-- Create more permissive policies for order_items
CREATE POLICY "Users can insert order items for their orders"
ON order_items FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM orders o 
    WHERE o.id = order_items.order_id 
    AND o.created_by = auth.uid()
  )
  OR get_current_user_role() IN ('owner', 'admin_pusat')
);

CREATE POLICY "Users can view order items for accessible orders"
ON order_items FOR SELECT
USING (
  order_id IN (
    SELECT orders.id FROM orders
    WHERE CASE
      WHEN get_current_user_role() = 'owner' THEN true
      WHEN get_current_user_role() = 'admin_pusat' THEN true
      WHEN get_current_user_role() = 'kasir_cabang' THEN 
        orders.branch_id IN (
          SELECT ub.branch_id FROM user_branches ub WHERE ub.user_id = auth.uid()
        )
      ELSE orders.created_by = auth.uid()
    END
  )
);

CREATE POLICY "Users can update order items for their orders"
ON order_items FOR UPDATE
USING (
  order_id IN (
    SELECT orders.id FROM orders
    WHERE CASE
      WHEN get_current_user_role() = 'owner' THEN true
      WHEN get_current_user_role() = 'admin_pusat' THEN true
      WHEN get_current_user_role() = 'kasir_cabang' THEN 
        orders.branch_id IN (
          SELECT ub.branch_id FROM user_branches ub WHERE ub.user_id = auth.uid()
        )
      ELSE orders.created_by = auth.uid()
    END
  )
);

CREATE POLICY "Users can delete order items for their orders"
ON order_items FOR DELETE
USING (
  order_id IN (
    SELECT orders.id FROM orders
    WHERE CASE
      WHEN get_current_user_role() = 'owner' THEN true
      WHEN get_current_user_role() = 'admin_pusat' THEN true
      ELSE orders.created_by = auth.uid()
    END
  )
);