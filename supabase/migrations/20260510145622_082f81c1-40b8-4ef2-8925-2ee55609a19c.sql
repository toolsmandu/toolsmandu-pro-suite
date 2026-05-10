ALTER TABLE public.product_layout_items
  ADD CONSTRAINT product_layout_items_template_id_fkey
  FOREIGN KEY (template_id) REFERENCES public.custom_templates(id) ON DELETE CASCADE;

ALTER TABLE public.product_layout_items
  ADD CONSTRAINT product_layout_items_product_id_fkey
  FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;