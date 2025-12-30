-- Add policy for owner/admin to view all payment history
CREATE POLICY "Owner and admin can view all payment history"
ON public.payment_history
FOR SELECT
USING (get_current_user_role() IN ('owner', 'admin_pusat'));

-- Add policy for owner/admin to insert payment history  
CREATE POLICY "Owner and admin can insert payment history"
ON public.payment_history
FOR INSERT
WITH CHECK (get_current_user_role() IN ('owner', 'admin_pusat', 'kasir_cabang'));

-- Add policy for kepala_produksi to view payment history
CREATE POLICY "Kepala produksi can view payment history"
ON public.payment_history
FOR SELECT
USING (get_current_user_role() = 'kepala_produksi');