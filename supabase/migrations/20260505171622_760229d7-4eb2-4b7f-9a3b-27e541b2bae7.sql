CREATE TABLE public.sheet_variant_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sheet_id UUID NOT NULL,
  variation_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (sheet_id, variation_id)
);

CREATE INDEX idx_sheet_variant_links_sheet ON public.sheet_variant_links(sheet_id);
CREATE INDEX idx_sheet_variant_links_variation ON public.sheet_variant_links(variation_id);

ALTER TABLE public.sheet_variant_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins editors manage sheet variant links"
ON public.sheet_variant_links
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Anyone can view sheet variant links"
ON public.sheet_variant_links
FOR SELECT
USING (true);