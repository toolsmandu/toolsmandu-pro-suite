-- Global library of reusable input fields
CREATE TABLE public.input_fields (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  field_type TEXT NOT NULL CHECK (field_type IN ('email','text','password','number','checkbox')),
  label TEXT NOT NULL,
  placeholder TEXT,
  is_required BOOLEAN NOT NULL DEFAULT false,
  -- For checkbox type:
  checkbox_mode TEXT CHECK (checkbox_mode IN ('single','multi')),
  question TEXT,
  options JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.input_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view input fields"
  ON public.input_fields FOR SELECT USING (true);

CREATE POLICY "Admins editors manage input fields"
  ON public.input_fields FOR ALL
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'editor'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'editor'::app_role));

CREATE TRIGGER update_input_fields_updated_at
  BEFORE UPDATE ON public.input_fields
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Link table: which input fields are attached to a product
CREATE TABLE public.product_input_fields (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  input_field_id UUID NOT NULL REFERENCES public.input_fields(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(product_id, input_field_id)
);

ALTER TABLE public.product_input_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view product input fields"
  ON public.product_input_fields FOR SELECT USING (true);

CREATE POLICY "Admins editors manage product input fields"
  ON public.product_input_fields FOR ALL
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'editor'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'editor'::app_role));

-- Link table: which input fields are attached to a variation (these REPLACE product-level when present)
CREATE TABLE public.variation_input_fields (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  variation_id UUID NOT NULL REFERENCES public.product_variations(id) ON DELETE CASCADE,
  input_field_id UUID NOT NULL REFERENCES public.input_fields(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(variation_id, input_field_id)
);

ALTER TABLE public.variation_input_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view variation input fields"
  ON public.variation_input_fields FOR SELECT USING (true);

CREATE POLICY "Admins editors manage variation input fields"
  ON public.variation_input_fields FOR ALL
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'editor'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'editor'::app_role));

-- Flag on variation to indicate it has special input fields (overrides product-level)
ALTER TABLE public.product_variations
  ADD COLUMN has_special_input_fields BOOLEAN NOT NULL DEFAULT false;

-- Store user-submitted input field responses with each order item
ALTER TABLE public.order_items
  ADD COLUMN input_field_responses JSONB DEFAULT '[]'::jsonb;