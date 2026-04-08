ALTER TABLE public.order_items ADD COLUMN variation_id uuid REFERENCES public.product_variations(id) ON DELETE SET NULL;
ALTER TABLE public.order_items ADD COLUMN variation_name text;