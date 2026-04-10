
ALTER TABLE public.orders
ADD COLUMN payment_status text NOT NULL DEFAULT 'pending',
ADD COLUMN payment_pidx text;
