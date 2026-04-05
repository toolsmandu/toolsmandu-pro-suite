
CREATE TABLE public.product_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.product_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view product types"
ON public.product_types FOR SELECT USING (true);

CREATE POLICY "Admins editors manage product types"
ON public.product_types FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor'));
