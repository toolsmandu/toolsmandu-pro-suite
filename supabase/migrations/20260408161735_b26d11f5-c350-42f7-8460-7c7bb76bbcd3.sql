-- Family sharing products (links products to family sharing)
CREATE TABLE public.family_sharing_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL UNIQUE,
  login_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.family_sharing_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins editors manage family sharing products" ON public.family_sharing_products FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Anyone can view family sharing products" ON public.family_sharing_products FOR SELECT USING (true);

-- Family sharing credentials
CREATE TABLE public.family_sharing_credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_product_id UUID NOT NULL REFERENCES public.family_sharing_products(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  password TEXT NOT NULL,
  twofa_link TEXT,
  remarks TEXT,
  expiry_date DATE,
  max_limit INTEGER NOT NULL DEFAULT 1,
  assigned_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.family_sharing_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins editors manage credentials" ON public.family_sharing_credentials FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE TRIGGER update_family_sharing_credentials_updated_at
BEFORE UPDATE ON public.family_sharing_credentials
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Family sharing product variants (links family products to product_variations)
CREATE TABLE public.family_sharing_product_variants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_product_id UUID NOT NULL REFERENCES public.family_sharing_products(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES public.product_variations(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.family_sharing_product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins editors manage family product variants" ON public.family_sharing_product_variants FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Anyone can view family product variants" ON public.family_sharing_product_variants FOR SELECT USING (true);

-- Credential variant links (links credentials to variants with priority)
CREATE TABLE public.credential_variant_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  credential_id UUID NOT NULL REFERENCES public.family_sharing_credentials(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES public.product_variations(id) ON DELETE CASCADE,
  priority TEXT NOT NULL DEFAULT 'primary',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.credential_variant_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins editors manage credential variant links" ON public.credential_variant_links FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

-- Credential assignments (tracks which user/order got which credential)
CREATE TABLE public.credential_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  credential_id UUID NOT NULL REFERENCES public.family_sharing_credentials(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  validity_days INTEGER,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.credential_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins editors manage assignments" ON public.credential_assignments FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Users can view own assignments" ON public.credential_assignments FOR SELECT
USING (auth.uid() = user_id);

-- Allow authenticated users to read credentials they are assigned to
CREATE POLICY "Users can view assigned credentials" ON public.family_sharing_credentials FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.credential_assignments ca WHERE ca.credential_id = id AND ca.user_id = auth.uid()
));