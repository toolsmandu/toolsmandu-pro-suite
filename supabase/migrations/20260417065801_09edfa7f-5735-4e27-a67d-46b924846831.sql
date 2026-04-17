CREATE TABLE public.order_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  changed_by uuid NOT NULL,
  action text NOT NULL,
  details text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_order_audit_log_order_id ON public.order_audit_log(order_id);

ALTER TABLE public.order_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins editors view audit log"
ON public.order_audit_log FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Admins editors insert audit log"
ON public.order_audit_log FOR INSERT
WITH CHECK ((has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role)) AND auth.uid() = changed_by);