
CREATE TABLE public.nav_menu_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  icon TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.nav_menu_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view nav menu items"
ON public.nav_menu_items
FOR SELECT
USING (true);

CREATE POLICY "Admins manage nav menu items"
ON public.nav_menu_items
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));
