CREATE POLICY "Users can view own order notes"
ON public.order_notes
FOR SELECT
USING (
  is_admin_only = false
  AND EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_notes.order_id
    AND orders.user_id = auth.uid()
  )
);