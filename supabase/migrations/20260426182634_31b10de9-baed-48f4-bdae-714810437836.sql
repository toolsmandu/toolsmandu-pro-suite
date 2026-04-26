CREATE TABLE public.single_product_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  label TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.single_product_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view single product tags"
ON public.single_product_tags
FOR SELECT
USING (true);

CREATE POLICY "Admins editors manage single product tags"
ON public.single_product_tags
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));