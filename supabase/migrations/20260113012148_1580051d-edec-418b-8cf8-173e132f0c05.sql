-- Tambah kolom courier_id untuk menyimpan kurir yang ditugaskan
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS courier_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Tambah kolom courier_name untuk cache nama kurir (performa)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS courier_name TEXT;

-- Index untuk query pesanan berdasarkan kurir
CREATE INDEX IF NOT EXISTS idx_orders_courier_id ON public.orders(courier_id) 
WHERE courier_id IS NOT NULL;

-- Function untuk auto-update courier_name saat courier_id berubah
CREATE OR REPLACE FUNCTION public.update_courier_name()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.courier_id IS NOT NULL AND (OLD.courier_id IS NULL OR NEW.courier_id IS DISTINCT FROM OLD.courier_id) THEN
    SELECT name INTO NEW.courier_name 
    FROM profiles 
    WHERE id = NEW.courier_id;
  ELSIF NEW.courier_id IS NULL THEN
    NEW.courier_name := NULL;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger untuk auto-update courier_name
DROP TRIGGER IF EXISTS on_courier_assignment ON public.orders;
CREATE TRIGGER on_courier_assignment
  BEFORE UPDATE OF courier_id ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_courier_name();

-- Function untuk notifikasi saat kurir ditugaskan
CREATE OR REPLACE FUNCTION public.notify_courier_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  order_record RECORD;
  branch_name TEXT;
BEGIN
  -- Skip jika courier_id tidak berubah atau NULL
  IF NEW.courier_id IS NULL OR OLD.courier_id IS NOT DISTINCT FROM NEW.courier_id THEN
    RETURN NEW;
  END IF;

  -- Ambil nama cabang
  SELECT name INTO branch_name FROM branches WHERE id = NEW.branch_id;

  -- Notifikasi ke kurir yang ditugaskan
  INSERT INTO notifications (user_id, title, message, type, related_id, related_type)
  VALUES (
    NEW.courier_id,
    '📦 Pesanan Baru Ditugaskan',
    format('Anda ditugaskan untuk mengantar pesanan %s ke %s', NEW.order_number, COALESCE(branch_name, 'Cabang')),
    'info',
    NEW.id,
    'order_courier'
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NEW;
END;
$$;

-- Trigger untuk notifikasi kurir
DROP TRIGGER IF EXISTS on_courier_notification ON public.orders;
CREATE TRIGGER on_courier_notification
  AFTER UPDATE OF courier_id ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_courier_assignment();