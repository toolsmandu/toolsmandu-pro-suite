-- License keys table
CREATE TABLE public.license_keys (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL,
  variation_id uuid,
  key_value text NOT NULL,
  view_limit integer NOT NULL DEFAULT 1,
  view_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'fresh',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.license_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins editors manage license keys"
ON public.license_keys FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE TRIGGER update_license_keys_updated_at
BEFORE UPDATE ON public.license_keys
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- License key views (audit of each view action)
CREATE TABLE public.license_key_views (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  license_key_id uuid NOT NULL,
  viewed_by uuid NOT NULL,
  viewed_by_email text,
  remarks text,
  viewed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.license_key_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins editors manage license key views"
ON public.license_key_views FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE INDEX idx_license_keys_status ON public.license_keys(status);
CREATE INDEX idx_license_key_views_key ON public.license_key_views(license_key_id);