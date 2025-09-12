-- Enable essential triggers for orders and production flow without affecting existing transaction logic

-- 1) Generate order number on insert
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'orders_set_order_number'
  ) THEN
    CREATE TRIGGER orders_set_order_number
    BEFORE INSERT ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.set_order_number();
  END IF;
END $$;

-- 2) Auto-update updated_at on orders update
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'orders_update_timestamp'
  ) THEN
    CREATE TRIGGER orders_update_timestamp
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- 3) Log order status changes
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'orders_log_status_change'
  ) THEN
    CREATE TRIGGER orders_log_status_change
    AFTER UPDATE ON public.orders
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION public.log_order_status_change();
  END IF;
END $$;

-- 4) Auto-create production requests based on JSON items at order insert
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'orders_auto_create_production'
  ) THEN
    CREATE TRIGGER orders_auto_create_production
    AFTER INSERT ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_create_production_requests();
  END IF;
END $$;

-- 5) Convert completed orders to transactions automatically
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'orders_convert_to_transaction'
  ) THEN
    CREATE TRIGGER orders_convert_to_transaction
    AFTER UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.convert_order_to_transaction();
  END IF;
END $$;

-- 6) Notify relevant users on production request create/update
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'production_requests_notify'
  ) THEN
    CREATE TRIGGER production_requests_notify
    AFTER INSERT OR UPDATE ON public.production_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.create_production_notification();
  END IF;
END $$;