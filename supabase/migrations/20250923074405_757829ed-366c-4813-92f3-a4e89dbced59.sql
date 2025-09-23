-- Verify and recreate the trigger if needed
DROP TRIGGER IF EXISTS create_production_request_trigger ON public.orders;

-- Recreate the production request trigger  
CREATE TRIGGER create_production_request_trigger
    AFTER INSERT ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.create_production_request_for_order();

-- Test if function exists
SELECT proname, prosrc FROM pg_proc WHERE proname = 'create_production_request_for_order';