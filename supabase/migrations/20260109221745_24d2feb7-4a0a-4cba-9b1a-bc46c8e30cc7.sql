-- STEP 1: First update the trigger function to allow NULL changed_by
-- This MUST happen before any UPDATE to orders table
CREATE OR REPLACE FUNCTION public.log_order_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    -- Allow NULL changed_by for migration scenarios
    INSERT INTO public.order_status_history (
      order_id, old_status, new_status, changed_by
    ) VALUES (
      NEW.id, OLD.status, NEW.status, auth.uid()
    )
    ON CONFLICT DO NOTHING; -- Ignore if insert fails
  END IF;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Don't fail the update if logging fails
    RETURN NEW;
END;
$$;