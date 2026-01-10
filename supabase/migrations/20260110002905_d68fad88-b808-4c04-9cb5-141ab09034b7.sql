-- Drop and recreate get_orders_for_user function with tracking_status
DROP FUNCTION IF EXISTS public.get_orders_for_user(uuid);

CREATE OR REPLACE FUNCTION public.get_orders_for_user(p_branch_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(
   id uuid, 
   order_number text, 
   branch_id uuid, 
   branch_name text, 
   customer_name text, 
   customer_phone text, 
   order_date date, 
   delivery_date date, 
   status text, 
   tracking_status text,
   payment_status text,
   total_amount numeric, 
   notes text, 
   items jsonb, 
   created_at timestamp with time zone, 
   created_by uuid
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.order_number,
    o.branch_id,
    COALESCE(b.name, 'Unknown Branch') as branch_name,
    o.customer_name,
    o.customer_phone,
    o.order_date,
    o.delivery_date,
    o.status,
    o.tracking_status,
    o.payment_status,
    o.total_amount,
    o.notes,
    o.items,
    o.created_at,
    o.created_by
  FROM public.orders o
  LEFT JOIN public.branches b ON o.branch_id = b.id
  WHERE CASE
    WHEN get_current_user_role() = 'owner' THEN true
    WHEN get_current_user_role() = 'admin_pusat' THEN true
    WHEN get_current_user_role() = 'kasir_cabang' THEN 
      o.branch_id IN (SELECT ub.branch_id FROM user_branches ub WHERE ub.user_id = auth.uid())
    ELSE false
  END
  AND (p_branch_id IS NULL OR o.branch_id = p_branch_id)
  ORDER BY o.created_at DESC;
END;
$function$;