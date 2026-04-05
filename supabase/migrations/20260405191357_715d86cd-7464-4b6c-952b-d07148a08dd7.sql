
CREATE TABLE public.product_variations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  original_price NUMERIC,
  expiry_days INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.product_variations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view variations"
ON public.product_variations FOR SELECT USING (true);

CREATE POLICY "Admins editors manage variations"
ON public.product_variations FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor'));

CREATE INDEX idx_product_variations_product_id ON public.product_variations(product_id);
