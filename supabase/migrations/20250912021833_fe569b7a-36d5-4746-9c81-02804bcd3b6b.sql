-- Fix ambiguous column reference and regex in generate_order_number
-- Use qualified column name and POSIX regex class for digits
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS text
LANGUAGE plpgsql
AS $function$
DECLARE
  v_year_part TEXT;
  v_sequence_num INTEGER;
  v_order_number TEXT;
BEGIN
  v_year_part := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  
  -- Get next sequence number for this year using qualified column and POSIX regex
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

-- Ensure trigger for setting order number is present (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'orders_set_order_number') THEN
    CREATE TRIGGER orders_set_order_number
    BEFORE INSERT ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.set_order_number();
  END IF;
END $$;
