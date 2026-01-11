-- =============================================
-- 1. TAMBAH ROLE KURIR KE PROFILES
-- =============================================
-- Tidak ada check constraint di profiles.role, jadi langsung bisa digunakan

-- =============================================
-- 2. TRIGGER NOTIFIKASI OTOMATIS SAAT TRACKING BERUBAH
-- =============================================

-- Buat function untuk notifikasi tracking change
CREATE OR REPLACE FUNCTION public.notify_tracking_change()
RETURNS TRIGGER AS $$
DECLARE
  order_record RECORD;
  target_user_id UUID;
  notification_title TEXT;
  notification_message TEXT;
  branch_cashiers UUID[];
BEGIN
  -- Skip jika tracking_status tidak berubah
  IF OLD.tracking_status IS NOT DISTINCT FROM NEW.tracking_status THEN
    RETURN NEW;
  END IF;

  -- Ambil data pesanan dengan nama cabang
  SELECT o.*, b.name as branch_name 
  INTO order_record 
  FROM orders o
  LEFT JOIN branches b ON o.branch_id = b.id
  WHERE o.id = NEW.id;

  -- Tentukan notifikasi berdasarkan tracking status baru
  CASE NEW.tracking_status
    WHEN 'ready_to_ship' THEN
      notification_title := '📦 Pesanan Siap Kirim';
      notification_message := format('Pesanan %s siap dikirim ke %s', order_record.order_number, COALESCE(order_record.branch_name, 'Cabang'));
      
      -- Notifikasi ke kurir
      FOR target_user_id IN SELECT id FROM profiles WHERE role = 'kurir' LOOP
        INSERT INTO notifications (user_id, title, message, type, related_id, related_type)
        VALUES (target_user_id, notification_title, notification_message, 'info', NEW.id, 'order_tracking');
      END LOOP;
      
    WHEN 'in_transit' THEN
      notification_title := '🚚 Pesanan Dalam Perjalanan';
      notification_message := format('Pesanan %s sedang dalam perjalanan ke %s', order_record.order_number, COALESCE(order_record.branch_name, 'Cabang'));
      
      -- Notifikasi ke kasir cabang tujuan
      FOR target_user_id IN SELECT ub.user_id FROM user_branches ub WHERE ub.branch_id = order_record.branch_id LOOP
        INSERT INTO notifications (user_id, title, message, type, related_id, related_type)
        VALUES (target_user_id, notification_title, notification_message, 'info', NEW.id, 'order_tracking');
      END LOOP;
      
    WHEN 'arrived_at_store' THEN
      notification_title := '🏪 Pesanan Tiba di Toko';
      notification_message := format('Pesanan %s telah tiba di %s, siap diserahkan', order_record.order_number, COALESCE(order_record.branch_name, 'Cabang'));
      
      -- Notifikasi ke kasir cabang
      FOR target_user_id IN SELECT ub.user_id FROM user_branches ub WHERE ub.branch_id = order_record.branch_id LOOP
        INSERT INTO notifications (user_id, title, message, type, related_id, related_type)
        VALUES (target_user_id, notification_title, notification_message, 'success', NEW.id, 'order_tracking');
      END LOOP;
      
    WHEN 'delivered' THEN
      notification_title := '✅ Pesanan Selesai Dikirim';
      notification_message := format('Pesanan %s telah diserahkan kepada %s', order_record.order_number, order_record.customer_name);
      
      -- Notifikasi ke owner dan admin
      FOR target_user_id IN SELECT id FROM profiles WHERE role IN ('owner', 'admin_pusat') LOOP
        INSERT INTO notifications (user_id, title, message, type, related_id, related_type)
        VALUES (target_user_id, notification_title, notification_message, 'success', NEW.id, 'order_tracking');
      END LOOP;
      
    ELSE
      -- Untuk status lain, tidak ada notifikasi otomatis
      NULL;
  END CASE;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop trigger lama jika ada
DROP TRIGGER IF EXISTS on_order_tracking_notification ON orders;

-- Buat trigger saat tracking_status berubah
CREATE TRIGGER on_order_tracking_notification
  AFTER UPDATE OF tracking_status ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_tracking_change();

-- =============================================
-- 3. INDEX UNTUK QUERY KURIR
-- =============================================

-- Index untuk filter pesanan berdasarkan tracking status
CREATE INDEX IF NOT EXISTS idx_orders_tracking_status_delivery 
ON orders(tracking_status) 
WHERE tracking_status IN ('in_production', 'ready_to_ship', 'in_transit', 'arrived_at_store');

-- Index untuk filter kurir aktif
CREATE INDEX IF NOT EXISTS idx_profiles_kurir 
ON profiles(role) 
WHERE role = 'kurir';