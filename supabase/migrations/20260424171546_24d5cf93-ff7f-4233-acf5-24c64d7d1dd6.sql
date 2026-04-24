
-- Waiting list table
CREATE TABLE public.waiting_list (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'waiting', -- 'waiting' | 'notified'
  notified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_waiting_list_product ON public.waiting_list(product_id);
CREATE INDEX idx_waiting_list_status ON public.waiting_list(status);
CREATE UNIQUE INDEX idx_waiting_list_unique ON public.waiting_list(email, product_id);

ALTER TABLE public.waiting_list ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can join waiting list"
  ON public.waiting_list FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins editors manage waiting list"
  ON public.waiting_list FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE TRIGGER update_waiting_list_updated_at
  BEFORE UPDATE ON public.waiting_list
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: when product becomes back in stock, reset waiting entries so they can be auto-notified
CREATE OR REPLACE FUNCTION public.notify_waiting_list_on_restock()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.stock_status = 'out_of_stock' AND NEW.stock_status <> 'out_of_stock' THEN
    -- Mark a flag in updated_at so an edge function / cron can pick them up.
    -- We simply leave them as 'waiting' so the dispatcher edge fn sends emails.
    UPDATE public.waiting_list
    SET updated_at = now()
    WHERE product_id = NEW.id AND status = 'waiting';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_products_restock_notify
  AFTER UPDATE OF stock_status ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.notify_waiting_list_on_restock();

-- Add email template editable entry
INSERT INTO public.email_templates (template_key, display_name, category, fields)
VALUES (
  'stock-available',
  'Stock Available Notification',
  'transactional',
  '{
    "subject": "Good news! {{product}} is back in stock at Toolsmandu",
    "eyebrow": "BACK IN STOCK",
    "heading": "It is available now!",
    "sub_message": "The product you have been waiting for is back. Grab it before it sells out again.",
    "cta_label": "Buy Now",
    "footer_note": "You are receiving this because you joined our waiting list."
  }'::jsonb
)
ON CONFLICT (template_key) DO NOTHING;
