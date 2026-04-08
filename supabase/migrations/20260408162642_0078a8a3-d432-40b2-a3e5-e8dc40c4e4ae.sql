
ALTER TABLE public.family_sharing_products
  ADD CONSTRAINT family_sharing_products_product_id_fkey
  FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
