
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS custom_template text NOT NULL DEFAULT 'default';

CREATE TABLE IF NOT EXISTS public.product_custom_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  section_type text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pcs_product ON public.product_custom_sections(product_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_pcs_product_type ON public.product_custom_sections(product_id, section_type);

ALTER TABLE public.product_custom_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view product custom sections"
ON public.product_custom_sections FOR SELECT USING (true);

CREATE POLICY "Admins editors manage product custom sections"
ON public.product_custom_sections FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE TRIGGER update_pcs_updated_at
BEFORE UPDATE ON public.product_custom_sections
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
