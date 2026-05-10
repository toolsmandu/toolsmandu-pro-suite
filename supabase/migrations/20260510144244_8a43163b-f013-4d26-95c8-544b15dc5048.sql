CREATE TABLE IF NOT EXISTS public.product_layout_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  template_id uuid NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_layout_items_product ON public.product_layout_items(product_id);

ALTER TABLE public.product_layout_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view product layout items"
  ON public.product_layout_items FOR SELECT USING (true);

CREATE POLICY "Admins editors manage product layout items"
  ON public.product_layout_items FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));
