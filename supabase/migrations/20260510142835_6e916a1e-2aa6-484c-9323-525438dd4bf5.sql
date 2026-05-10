
-- Add use_custom_layout to products
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS use_custom_layout boolean NOT NULL DEFAULT false;

-- Master custom templates table
CREATE TABLE IF NOT EXISTS public.custom_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  template_type text NOT NULL DEFAULT 'adobe_style',
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.custom_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view custom templates"
ON public.custom_templates FOR SELECT
USING (true);

CREATE POLICY "Admins editors manage custom templates"
ON public.custom_templates FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE TRIGGER update_custom_templates_updated_at
BEFORE UPDATE ON public.custom_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
