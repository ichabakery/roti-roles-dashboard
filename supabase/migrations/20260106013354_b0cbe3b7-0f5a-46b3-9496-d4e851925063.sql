-- Fix: generate_order_number must bypass RLS to see all orders across branches
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS text
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_year_part TEXT;
  v_sequence_num INTEGER;
  v_order_number TEXT;
BEGIN
  -- Serialize order number generation to prevent race conditions
  PERFORM pg_advisory_xact_lock(724523);
  
  v_year_part := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;

  -- Now this query can see ALL orders regardless of RLS
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(o.order_number FROM 'ORD-' || v_year_part || '-([0-9]+)') AS INTEGER)
  ), 0) + 1
  INTO v_sequence_num
  FROM public.orders o
  WHERE o.order_number LIKE 'ORD-' || v_year_part || '-%';

  v_order_number := 'ORD-' || v_year_part || '-' || LPAD(v_sequence_num::TEXT, 3, '0');

  RETURN v_order_number;
END;
$function$;