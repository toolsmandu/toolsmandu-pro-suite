ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'manual';

-- Backfill existing orders: if payment_pidx exists, mark as khalti
UPDATE public.orders
SET payment_method = 'khalti'
WHERE payment_pidx IS NOT NULL AND payment_method = 'manual';