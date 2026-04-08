
CREATE SEQUENCE IF NOT EXISTS public.order_number_seq START WITH 1;

ALTER TABLE public.orders ADD COLUMN order_number TEXT;

-- Backfill existing orders
UPDATE public.orders SET order_number = 'TM' || nextval('public.order_number_seq') WHERE order_number IS NULL;

-- Set default for new orders
ALTER TABLE public.orders ALTER COLUMN order_number SET DEFAULT 'TM' || nextval('public.order_number_seq');

-- Make it unique and not null
ALTER TABLE public.orders ALTER COLUMN order_number SET NOT NULL;
ALTER TABLE public.orders ADD CONSTRAINT orders_order_number_unique UNIQUE (order_number);
