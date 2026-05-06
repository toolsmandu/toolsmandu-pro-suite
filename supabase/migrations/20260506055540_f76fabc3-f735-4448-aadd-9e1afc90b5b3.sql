ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS show_in_super_saving_deal boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS last_price numeric;