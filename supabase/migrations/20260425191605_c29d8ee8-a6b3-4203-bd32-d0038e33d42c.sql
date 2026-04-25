-- Enable pg_net for async HTTP calls from triggers
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Internal config table (locked down — only DB / service role reads it)
CREATE TABLE IF NOT EXISTS public._sync_config (
  key text PRIMARY KEY,
  value text NOT NULL
);
ALTER TABLE public._sync_config ENABLE ROW LEVEL SECURITY;
-- No policies = no one can read/write via PostgREST; only SECURITY DEFINER funcs

-- Seed with placeholders the user will set via UPDATE (we do it from edge fn below)
INSERT INTO public._sync_config(key, value) VALUES
  ('push_url', ''),
  ('push_key', '')
ON CONFLICT (key) DO NOTHING;

-- Trigger function: posts row change to push-product-to-b
CREATE OR REPLACE FUNCTION public.notify_project_b_sync()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_url text;
  v_key text;
  v_type text;
  v_op text;
  v_row jsonb;
BEGIN
  SELECT value INTO v_url FROM public._sync_config WHERE key = 'push_url';
  SELECT value INTO v_key FROM public._sync_config WHERE key = 'push_key';
  IF v_url IS NULL OR v_url = '' OR v_key IS NULL OR v_key = '' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Map table -> type
  IF TG_TABLE_NAME = 'products' THEN v_type := 'product';
  ELSIF TG_TABLE_NAME = 'product_variations' THEN v_type := 'variation';
  ELSIF TG_TABLE_NAME = 'categories' THEN v_type := 'category';
  ELSE RETURN COALESCE(NEW, OLD);
  END IF;

  IF TG_OP = 'INSERT' THEN v_op := 'insert'; v_row := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN v_op := 'update'; v_row := to_jsonb(NEW);
  ELSIF TG_OP = 'DELETE' THEN v_op := 'delete'; v_row := to_jsonb(OLD);
  END IF;

  PERFORM extensions.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-push-key', v_key
    ),
    body := jsonb_build_object('type', v_type, 'op', v_op, 'row', v_row)
  );

  RETURN COALESCE(NEW, OLD);
EXCEPTION WHEN OTHERS THEN
  -- Never block the original write because of sync failure
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Triggers on the three tables
DROP TRIGGER IF EXISTS sync_to_b ON public.products;
CREATE TRIGGER sync_to_b
AFTER INSERT OR UPDATE OR DELETE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.notify_project_b_sync();

DROP TRIGGER IF EXISTS sync_to_b ON public.product_variations;
CREATE TRIGGER sync_to_b
AFTER INSERT OR UPDATE OR DELETE ON public.product_variations
FOR EACH ROW EXECUTE FUNCTION public.notify_project_b_sync();

DROP TRIGGER IF EXISTS sync_to_b ON public.categories;
CREATE TRIGGER sync_to_b
AFTER INSERT OR UPDATE OR DELETE ON public.categories
FOR EACH ROW EXECUTE FUNCTION public.notify_project_b_sync();