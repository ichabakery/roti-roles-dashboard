-- Harden generate_order_number by setting a fixed search_path
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
  v_year_part TEXT;
  v_sequence_num INTEGER;
  v_order_number TEXT;
BEGIN
  v_year_part := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  
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