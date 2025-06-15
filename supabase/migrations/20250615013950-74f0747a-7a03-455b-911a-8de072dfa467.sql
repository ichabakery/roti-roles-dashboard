
-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  related_id UUID NULL,
  related_type TEXT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT valid_notification_type CHECK (type IN ('info', 'success', 'warning', 'error', 'production'))
);

-- Add indexes for better performance
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_type ON public.notifications(type);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications" 
  ON public.notifications 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" 
  ON public.notifications 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Users can update their own notifications" 
  ON public.notifications 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Enable realtime for notifications
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Create function to create notifications for production requests
CREATE OR REPLACE FUNCTION public.create_production_notification()
RETURNS TRIGGER AS $$
DECLARE
  kepala_produksi_ids UUID[];
  user_id UUID;
  branch_name TEXT;
  product_name TEXT;
BEGIN
  -- Get branch and product names
  SELECT b.name INTO branch_name 
  FROM branches b WHERE b.id = NEW.branch_id;
  
  SELECT p.name INTO product_name 
  FROM products p WHERE p.id = NEW.product_id;

  IF TG_OP = 'INSERT' THEN
    -- Notify all kepala_produksi when new production request is created
    SELECT ARRAY_AGG(id) INTO kepala_produksi_ids
    FROM profiles 
    WHERE role = 'kepala_produksi';
    
    -- Also notify owner
    SELECT ARRAY_AGG(id) INTO kepala_produksi_ids
    FROM profiles 
    WHERE role IN ('kepala_produksi', 'owner');
    
    -- Create notification for each kepala_produksi and owner
    IF kepala_produksi_ids IS NOT NULL THEN
      FOREACH user_id IN ARRAY kepala_produksi_ids
      LOOP
        INSERT INTO public.notifications (
          user_id, title, message, type, related_id, related_type
        ) VALUES (
          user_id,
          'Permintaan Produksi Baru',
          format('Permintaan produksi %s sebanyak %s unit untuk cabang %s', 
                 product_name, NEW.quantity_requested, branch_name),
          'production',
          NEW.id,
          'production_request'
        );
      END LOOP;
    END IF;
    
  ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    -- Notify requester when status changes
    INSERT INTO public.notifications (
      user_id, title, message, type, related_id, related_type
    ) VALUES (
      NEW.requested_by,
      'Status Produksi Berubah',
      format('Status produksi %s untuk cabang %s berubah menjadi %s', 
             product_name, branch_name,
             CASE NEW.status 
               WHEN 'in_progress' THEN 'Sedang Diproses'
               WHEN 'completed' THEN 'Selesai'
               WHEN 'cancelled' THEN 'Dibatalkan'
               ELSE NEW.status
             END),
      CASE NEW.status 
        WHEN 'completed' THEN 'success'
        WHEN 'cancelled' THEN 'error'
        ELSE 'info'
      END,
      NEW.id,
      'production_request'
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for production request notifications
CREATE TRIGGER trigger_production_notification
  AFTER INSERT OR UPDATE ON public.production_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.create_production_notification();
