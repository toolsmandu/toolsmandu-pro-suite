
CREATE TABLE public.flash_sale_labels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  label TEXT NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.flash_sale_labels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins editors manage flash sale labels"
ON public.flash_sale_labels
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Anyone can view flash sale labels"
ON public.flash_sale_labels
FOR SELECT
USING (true);
