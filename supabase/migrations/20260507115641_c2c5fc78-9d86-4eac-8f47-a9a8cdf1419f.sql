
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS nps_process_id TEXT,
  ADD COLUMN IF NOT EXISTS nps_gateway_ref TEXT,
  ADD COLUMN IF NOT EXISTS nps_merchant_txn_id TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_nps_merchant_txn_id ON public.orders(nps_merchant_txn_id);

INSERT INTO public.site_settings (key, value)
VALUES ('nps_enabled', 'true')
ON CONFLICT (key) DO NOTHING;
